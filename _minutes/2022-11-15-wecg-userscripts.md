# WECG User Scripts API kickoff—Nov 15, 2022

 * Chair: Simeon Vincent
 * Scribes: Rob Wu, Simeon Vincent

Time: 8 AM PST = https://everytimezone.com/?t=6372d680,3c0
Call-in details: [WECG: User Scripts API kickoff, 15th November 2022](https://www.w3.org/events/meetings/ff23204f-3237-4263-92ef-ec0ae850572e)
Zoom issues? Ping `@robwu` (Rob Wu) in [chat](https://github.com/w3c/webextensions/blob/main/CONTRIBUTING.md#joining-chat)


## Agenda: [Issue 279](https://github.com/w3c/webextensions/issues/279): User scripts in Manifest V3

 * [simeon] Introduction
 * [rob] [Background](https://github.com/w3c/webextensions/issues/279#issuecomment-1309614401) on the needs of user script managers
 * [simeon] Review/discuss the goals and scope of [Chrome's proposal](https://docs.google.com/document/d/1ekeZ1hz6B1djnTpAjskd7_WAjWi7DM1TuAjWws1hyG4/edit?usp=sharing) ([shared here](https://github.com/w3c/webextensions/issues/279#issuecomment-1302762663))
   * Unblock starting migration for user scripts managers
   * Multi-phase design and implementation process
   * Initial goal is MV2 parity, additional features & enhancements in later phases
 * Open discussion
   * [Todd] Question: Relation to sandbox API: https://developer.chrome.com/docs/extensions/mv2/sandboxingEval/
     * And related use cases:
       * Text templating/transformation (e.g., Nunjucks, Handlebars, jq-web (WebAssembly) etc.) where you don't need DOM access, but the library may use Function ctor under the hood
       * Validation: JSON Schema validation libraries use Function ctor under hood: https://ajv.js.org/
     * _This question was not covered during the meeting._


## Attendees (sign yourself in)

 1. Rob Wu (Mozilla)
 2. Giorgio Maone (NoScript, Tor)
 3. Todd Schiller (PixieBrix)
 4. Philipp Claßen (Ghostery)
 5. Jan Biniok (Tampermonkey)
 6. Kiara Rose (Apple)
 7. Timothy Hatcher (Apple)
 8. Mukul Purohit (Microsoft)
 9. Simeon Vincent (Google)
 10. Emilia Paz (Google)
 11. Andrey Meshkov (AdGuard)
 12. James Hycner (Keeper)
 13. Jackie Han (myself)


## Meeting notes

Introduction

 * [simeon] This is the first meeting outside of the regular meetings, where we dive into specific topics.
 * [simeon] Chrome's current goal is to reach feature parity with MV2 for user script managers in order to unblock them from migrating to MV3. Currently planning to take an iterative approach where we design and implement a solution to user script managers and later expand user script support to further enhance these capabilities in a backward compatible way.
 * [emilia] Along with parity, we also want to identify what are needed foundations for the API that are necessary for future enhanced capabilities (e.g user script world).
 * [rob] [Background](https://github.com/w3c/webextensions/issues/279#issuecomment-1309614401) on the needs of user script managers
   * Current blocker in MV3 compared to MV2 is the content script CSP that blocks execution of inline script elements. The bare minimum to get user scripts managers using again is to allow them to run strings as code in the page's context (main world).
   * The current proposal from Google introduces the “code” parameter to the scripting API, but that feature is not actually used by user script managers.
   * If we relax CSP, user script managers could operate as they do today. If we relax CSP for a “userscript” world, user script managers could inject a script tag into the host page via that world.
 * [simeon] I think that summary is correct. I'm worried that starting with a minimal approach (just relaxing CSP for user scripts managers) and later trying to introduce isolated worlds for user scripts may make it prohibitively difficult to move user scripts managers to isolated worlds and a safer approach to user script execution.
 * [jan] Whatever is implemented, it would be nice if it is not part of the manifest itself, but part of a runtime API to ease migration and to use feature detection where possible.
 * [rob] do you expect that you would take primary responsibility for deciding when and where to inject, or would the browser handle that?
   * [jan] More flexible if the extension can continue to make that decision. From the performance perspective it is better if the browser implements a declarative API.
   * [rob] Firefox also has a declarative user script API that you've experimented with. How do you find that?
   * [jan] Tampermonkey currently uses that API for the user script world mainly, not for the script injection part, currently as an opt in via the `@sandbox` user script header. Considering making that the default, but still testing.
   * [rob] From the API perspective, do you think that the Firefox userScripts API is complete, or is something missing?
   * [jan] Currently only taking matches, but if it accepts globs or RE2 matches, then the API can be used in the intended way.
   * [todd] On our side, there's a URL pattern that's also relevant for SPAs and hashes as users navigate in order to properly handle hash-routed sites.
   * [rob] What I'm hearing is that it will be a long shot before user scripts managers can fully defer to the browser for user script injection.
   * [todd] Correct. URLs are insufficient due to hash-based routing.
   * [rob] That does imply that user script managers will continue to inject in all pages in order to handle these cases. If it's not a goal for a browser to inject user scripts, we only need to provide the minimal capability for managers to inject scripts. In Chrome this would translate to supporting injection in a world without being blocked by CSP.
   * [simeon] As I think about this more, I'm less convinced about the need to tackle a large, more complex API where the browser takes over more of the responsibilities for user script injection, at least in the short term.

Code execution in the page's context (main world)

 * [rob] The proposed “code” parameter to the scripting API is unnecessary for user script manager use cases. Support for a world without CSP allows extensions to inject inline script elements to run code in the main world.
   * [rob] Doesn't solve the communication issues between the main world and the content script's isolated world. It's possible, but difficult, for user script managers to implement communication safely, but that's already an issue in MV2 and not new.
   * [andrey] Does your proposed way mean that you'd have to use window.postMessage to communicate across worlds?
   * [rob] The problem is that that approach can be intercepted by web pages (again, not a new issue). I sketched out a capability in [a comment on issue 279](https://github.com/w3c/webextensions/issues/279#issuecomment-1309614401) to address this use case more broadly - not just for user script managers.
   * [andrey] does the user script world have any access to the window properties from the main world?
   * [rob] No access to the JS object in the main world. In Firefox “Xrays” offers that capability, but support for that in Chrome is not likely.
   * [andrey] What I'm concerned about is that a lot of user scripts need to have access to the window properties in their script. Only supporting execution in an isolated user script world is insufficient.
   * [rob] No, extensions can develop access. If there's cross-world communication, extensions can safely allow the untrusted main world and trusted isolated world.
   * [andrey] Do you expect that this capability will exist in MV3 before deprecation?
   * [rob] This approach works in MV2 today.
   * [giorgio] Want to make sure that we're supporting both main and isolated world injection. Want to make sure we can still use unsafeWindow (in Firefox parlance)
   * [rob] That's a Firefox-specific capability that we can continue to support. For this meeting, the goal is to agree on a common approach that works across all browsers.
   * [rob] Currently what user script managers do is inject an inline script in the main world. Relaxing CSP allows them to do that again in MV3. Could we consider a new API specifically for the purpose of evaluating code in the main world from inside the isolated world. Reason for suggesting this is that it's a more intentional and specific capability, and extensible with secure cross-world communication in the future.
   * [andrey] For clarity, what you're proposing is to allow injection of user scripts much as they are today, but they would run in an isolated world?
   * [rob] Suggesting that we allow user script managers to run the way they currently do in MV2. Setting up the DOM from the content script (isolated world), running code in the main world, then using the result in the isolated world again. With the scripting API, we can allow scripts to run in the main world, but there's still the missing capability to securely communicate back to the user script isolated world.
   * [andrey] If we had that communication channel, that would allow us to (...)
   * [rob] With the scripting API, the browser would be responsible for injecting the script. With the proposed alternative, it allows the content script to take control of what to do before and after main world injection to create the communication channel they need. If we encourage the use of the &lt;script> element, we still need a different way to introduce a secure communication channel.
   * [andrey] Am I right that Chrome provides a way to define global params?
   * [rob] There's something in development ([globalParams - crbug](https://bugs.chromium.org/p/chromium/issues/detail?id=1054624#c54)), but I also have questions about the utility of this capability. It cannot be relied upon in the main world, because the web page would be able to intercept this trivially.
 * [jan] User script world still needs a way to communicate back to the service worker, right?
   * [rob] Right. Content script injection happens first, user script injection happens second. User script manager could create a communication channel in order for the user script to communicate back to the extension's service worker via the content script.
   * [rob] For clarity, by content script we mean content scripts as they exist today. I.e. an execution environment isolated from the web page, with a shared DOM and access to some privileged extension APIs.
   * [rob] New “userscript” world won't have CSP to allow main world script injection. A few minutes ago, though, I proposed a new API to allow script injection in the main as a replacement for `<script>` injection, which would not require CSP exceptions. User script managers can continue to set up the environment and run the code from the content script.
   * [jan] Yes, it's easier if execution is started from the content script because timing is right. In Tampermonkey for MV3, I'm using the bug where if you append the script tag as an argument and remove the CSP … the problem them is the timing. Only if you inject from a document_start content script can you be sure that the timing is correct.
   * [rob] Right, that's why I noted not merely the ability to execute strings a code as the requirement for user script managers, but also the ability to securely perform cross-world communication.
   * [jan] Also, if you append an iframe to a page, access to the iframe from the creating page happens before content scripts can be injected into the iframe (https://crbug.com/1261964). This is a problem for user scripts because it's not possible to secure references to unmodified prototypes.
   * [rob] What you actually need is safe types. Possibly addressed by [shadow realms](https://github.com/tc39/proposal-shadowrealm)?
 * [alexei] Wanted to make sure that we need this ability to inject scripts into the main world and securely communicate back to the extension pages, this need is not limited to user script managers. It's not even limited to privacy/security extensions. It's just something needed
   * [rob] Are you referring to script injection or cross-world communication?
   * [alexei] Both, I need to inject scripts into the main world and securely communicate between them
   * [rob] There's a difference between them because if you can have a statically defined script, that can be injected, ability to securely communicate is still useful
 * [simeon] Over the course of this conversation my thinking has shifted a bit. I was originally imagining that we'd need to tackle a large set of capabilities in the first revision of this API. Sounds like we may have a good path for the short term and space to iterate over time. Also particularly interested in the suggestion that the return value of a an executeScript-like call could enable new patterns.
 * [rob] I did mention return values at the end of [my comment](https://github.com/w3c/webextensions/issues/279#issuecomment-1309614401). If it were possible to receive/return callables along with primitives and (structured) cloned values, then extensions can build a secure communication channel on top of it. Extensions can still accidentally leak this to the web page, but that would be there issue and not an inherent API design flaw (i.e. today).
 * [rob] By identifying specific needs independent of dynamic code execution, the features can be more broadly used without fairly dangerous permissions. Currently, the design Chrome has described, namely allowing user scripts through the use of a `file://`-like explicit opt-in from the user. Would be great to identify useful and not-dangerous parts of the proposal and break them out so that all extensions can benefit (without users running into scary warnings and/or users having to do some complicated manual opt-in), not just user script manager extensions.

The next meeting will be on [Thursday, November 24th, 8 AM PST (4 PM UTC)](https://everytimezone.com/?t=637eb400,3c0).
