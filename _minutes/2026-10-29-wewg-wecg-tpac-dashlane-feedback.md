This content was presented on 2026-10-29 at TPAC:

* Minutes: "Dashlane Web Extension Platform (mostly Chromium / MV3) feedback" at [2026-10-29-wewg-wecg-tpac.md](https://github.com/w3c/webextensions/blob/main/_minutes/2026-10-29-wewg-wecg-tpac.md)
* [Issue 1144](https://github.com/w3c/webextensions/issues/1144): Dashlane's experience of & feedback on MV3 (mostly Chromium)


# Dashlane's experience & feedback of Web Extensions Platform
## mostly MV3 / Chromium

Timothée "Tim" Pillard — Staff Software Engineer, Web Platform at Dashlane

[github.com/t-pillard](https://github.com/t-pillard) · [@tpillard](https://twitter.com/tpillard) · [timtech.blog](https://timtech.blog)

TPAC 2026, Dublin · [w3c/webextensions#1144](https://github.com/w3c/webextensions/issues/1144)

---

# Who we are

* Password manager, millions of users on Chrome, Chromium, Edge, Firefox and Safari ...
* MV3 preparation since 2021–2022, in production on Chrome since 2024
* Steady investment since 2022, mainly through our Web Platform Team, which owns the extension Framework, architecture, foundations, build infrastructure, etc.
* WECG participants since the beginning
* _One codebase_, shipped to all browsers (on desktop):
  * a persistent background page on Firefox, Safari (macOS) and Edge MV2 (until this week!)
  * a service worker on Chromium MV3 (prev. only Chrome, now Edge too, this week in production)
  * _5+_ extension web applications: Popup, Vault, Team Admin Console, ...
  * content scripts
  * etc.

---

# Problems: what our users see

On Chromium MV3, the customer-facing symptoms since 2024:

* a popup that opens blank or takes many seconds to open
* autofill that does not appear to work or is unreasonably slow
* an extension that looks installed but is non-functional, most often around extension or browser updates
* an extension that is unreasonably slow

---

# Challenges #1: cold-start / wake cost

* roughly _half_ of an extension start is spent reading back state the worker held seconds earlier
* `storage.local` hydration: slow reads, data corruption
* `storage.session` is capped at 10 MB, which is not sufficient in some cases
* most memory allocated during initialization is garbage-collected before it completes: allocation, collection churn, memory pressure
* restarts are frequent: _well over a hundred_ worker starts in one user's working day
* no dynamic `import()` and no `importScripts()` after install: every start loads _all_ JavaScript chunks, none on demand (we now lazy-load WASM binaries)
* `storage.managed` reads are not answered for the first ~2 s of a cold browser launch, a stall we had to design around (Chromium bug to be filed)

---

# Challenges #2: runtime performance

* one background context serves the popup, content scripts and web applications: CPU, memory and IPC pressure
* heavy work (ie: vault, crypto, machine-learning, autofill) competes with every request on that same thread
* messaging: high message volume between contexts, each message serialized and crossing a process boundary
* storage: state is written back to `storage.session` / `storage.local` continuously
* alarms and keep-alives: any periodic work wakes the worker, and pays full initialization cost

---

# Challenges #3: WebKit

* an extension's pages share a single content process, breaking the extension, which we have had to work around
* non-ASCII characters in the bundled JavaScript break extension startup, so we ship ASCII-only output

---

# Challenges: the multipliers

**A Chromium regression.** Aug–Sep 2026, primarily macOS: extension process at background priority whenever no extension page was active, and the popup itself until its `load` event fired. Minimal reproduction: popup opens of 2 to 60 seconds.

For one user, in one day: _1 s → 9 s → 35 s → over 4 minutes_.

**The service worker lifecycle.** A worker restarted many times an hour pays the multiplied cost on every restart: a one-off delay on a persistent background page became a delay repeated throughout the day.

Any similar change in how a background process is scheduled would be amplified the same way, in proportion to each extension's initialization.

---

# Challenges: observability

2024, MV3 enabled on Chrome: store reviews describe an extension that would not open.

* not reproducible on our side or on Chrome team's
* some of the failures happen during initialization, in a worker already terminated or stalled

Two years of instrumentation:

* startup timings
* initialization tracing
* customer-side diagnostic capture
* production monitoring across every extension context
* automated extension size & JavaScript bundle measurements
* DORA metrics
* etc.

---

# Browser bugs vs. API gaps

## Browser bugs

* Chromium: popup and extension process at background priority ([549552319](https://issues.chromium.org/issues/549552319))
* Chromium: `storage.managed` unanswered for ~2 s at cold launch ([#547](https://github.com/w3c/webextensions/issues/547), Chromium bug to be filed)
* Chromium: worker stuck in STARTING ([484218883](https://issues.chromium.org/issues/484218883)); cold start >10 s ([484367312](https://issues.chromium.org/issues/484367312)); stops on sleep/wake ([40273015](https://issues.chromium.org/issues/40273015))
* Chromium: `port.onMessage` does not reset the idle timer ([487746357](https://issues.chromium.org/issues/487746357))
* Chromium: worker broken after update ([40805401](https://issues.chromium.org/issues/40805401)); old worker keeps running ([578562493](https://issues.chromium.org/issues/578562493))
* Chromium: `storage.local` slow reads ([41108170](https://issues.chromium.org/issues/41108170)); LevelDB never compacts ([432503402](https://issues.chromium.org/issues/432503402))
* Firefox: `managed.get` throws without a policy manifest, `onChanged` never fires ([#497](https://github.com/w3c/webextensions/issues/497)) \*
* WebKit: single content process ([281522](https://bugs.webkit.org/show_bug.cgi?id=281522)); background gets no CPU ([276685](https://bugs.webkit.org/show_bug.cgi?id=276685)); non-ASCII JS breaks startup \*

## API gaps

* every wake pays full initialization; no way to hold the worker for one task ([#416](https://github.com/w3c/webextensions/issues/416), [#72](https://github.com/w3c/webextensions/issues/72))
* no code on demand in the worker ([#212](https://github.com/w3c/webextensions/issues/212))
* no Workers from a service worker; no cross-origin isolation ([#1039](https://github.com/w3c/webextensions/issues/1039))
* `storage.session` capped at 10 MB
* no "not loaded yet" vs "no policy" for `storage.managed` ([#547](https://github.com/w3c/webextensions/issues/547), [#497](https://github.com/w3c/webextensions/issues/497)) \*
* adding a permission without re-consent ([#1032](https://github.com/w3c/webextensions/issues/1032), [#1109](https://github.com/w3c/webextensions/pull/1109))
* no way to observe a worker that died during initialization
* no cross-browser background declaration ([#785](https://github.com/w3c/webextensions/issues/785)) \*
* no feature-detection API ([#1151](https://github.com/w3c/webextensions/issues/1151)) \*
* no secure, user-verified key store ([#154](https://github.com/w3c/webextensions/issues/154)) \*


---

# Technical use cases

Chromium / MV3:

* move heavy work off the background's main thread
* load JavaScript modules on demand, i.e: native dynamic ES `import()`
* add a permission (e.g. `notifications`) in an update without alarming the existing user base
* keep the worker alive for the duration of one task, e.g. a sync
* read enterprise policies reliably at browser launch
* run multi-threaded WebAssembly in the background context
* keep a long-lived port open without a heartbeat
* reliably update the extension with no service worker / manifest mismatch
* keep `storage.local` fast & reliable over time
* keep more than 10 MB of state in `storage.session` across restarts

WebKit:

* run extension pages in separate processes on Safari

---

# Progress on our side

A **small** sample from the past two months alone (mostly in production incident mode):

* extension initialization on a cold browser launch: _~1 s → ~6 ms_
* Framework initialization: ~5× faster in our benchmarks
* on one affected customer device: median startup _~8 s → under 1 s_
* JavaScript bundles: machine-learning runtime _−91%_, content script −26%, popup −11%, framework & vendor −4%
* all WebAssembly modules now lazy-loaded; ~1 MB no longer embedded in JavaScript, worker entry chunk −22%
* message volume during login roughly halved, reducing CPU, memory and IPC pressure

---

# Discussion
