# Proposal: Asynchronous Listener Registration

**Summary**

An API proposal to allow extensions to explicitly delay the dispatch of extension API events to their background context during its initialization phase via a manifest opt-in field and a `markListenerRegistrationComplete()` API, enabling the asynchronous registration of event listeners. 

**Document Metadata**

**Author:** @AndreaOrru

**Sponsoring Browser:** Google Chrome

**Contributors:** @rdcronin

**Created:** 2026-04-27

**Related Issues:** N/A

## Motivation

### Objective

Currently, the extension platform requires event listeners to be registered synchronously during the execution of a background context script. The browser process manages event routing and relies on the renderer process to report which events an extension is listening to immediately after the initial script evaluation.

If an extension registers a listener asynchronously (e.g., inside a `setTimeout`, after a `fetch()`, or after reading from `browser.storage`), the initial script evaluation finishes before the listener is attached. Consequently, when the relevant event fires later, the background context wakes up, executes its top-level script synchronously, and the browser dispatches the event to all registered listeners (of which there may be none). Thus, the background context wakes up but receives no event.

This proposal introduces a mechanism to explicitly delay the finalization of the "initialization phase" of the worker and formalizes how listener state is managed and persisted across background context restarts.

#### Use Cases

* **Conditional event registration:** An extension may need to read user preferences from local storage to determine whether it should register listeners for high-traffic events (e.g., `tabs.onUpdated` or `webRequest`).
* **Dynamic configuration:** An extension might need to fetch a configuration file to decide which listener options to set up (e.g. `webRequest` URL filters).
* **Atomic startup completion signal**: An extension that partially failed to register its listeners at its first run can have another chance at the next startup, without being in an inconsistent state (e.g. https://bugzilla.mozilla.org/show_bug.cgi?id=1822735).

### Known Consumers

Extensions which require dynamic or conditionally registered event listeners based on asynchronous state, without resorting to unconditionally waking up the background context for events they may not care about.

### Non-goals / Out of Scope

This proposal is scoped to extension API event listener registration in an extension background context.

* It does not change the lifecycle of standard service worker events.
* It does not affect web platform API events or non-event extension APIs.
* It does not affect behavior in non-background extension contexts.

## Specification

### Schema

#### Manifest

```json
{
  "background": {
    "service_worker": "background.js",
    "async_listener_registration": true
  }
}
```

#### Runtime API

```typescript
namespace runtime {
  /**
   * Signals to the browser that asynchronous initialization is complete.
   * Transitions the background context out of the listener registration phase,
   * replaces the previous run's persisted listeners with the newly registered
   * ones, and flushes the event queue.
   *
   * This method is only available to the background script context.
   */  
  export function markListenerRegistrationComplete(): void;
}
```

### Behavior

#### Listener Registration Lifecycle

When an extension opts into `"async_listener_registration": true`, the browser enters a listener registration phase each time the background context starts.

During this phase:

1. The browser routes extension API events to the initializing background context if the event matches either:
    * the previous persisted routing state; or
    * any new listeners being registered during the current run.

2. Routed events are queued instead of dispatched to JavaScript callbacks until listener registration is completed.

3. The extension registers all listeners that should participate in the next persisted routing state.

4. The extension calls `browser.runtime.markListenerRegistrationComplete();`. This atomically completes the listener registration phase:
    * The previous persisted routing state is replaced with the current listener set.
    * The background context leaves the listener registration phase.
    * Queued events are flushed in FIFO order and dispatched against the current listener set.
    * Queued events that no longer match any registered listener are discarded.

##### Example Flow

To illustrate how these lifecycle changes resolve the timing issues of asynchronous setup, consider an extension that conditionally tracks tab updates based on an asynchronous storage read.

```javascript
browser.storage.local.get("shouldListen").then((settings) => {
  // Asynchronously evaluate state.
  if (settings?.shouldListen) {
    // Conditionally register the listener based on the async result.
    browser.tabs.onUpdated.addListener(handleTabUpdate);
  }
  // Signal the end of the initialization phase.
  browser.runtime.markListenerRegistrationComplete();
});
```

Assume that during a previous run, `settings.shouldListen` was `true`, the listener was registered, and the browser persisted this routing state. The background context has since been terminated. 

When a new `tabs.onUpdated` event fires, the browser checks the persisted state and wakes the background context. Because the manifest includes `"async_listener_registration": true`, the renderer process queues the waking event rather than attempting to dispatch it immediately. 

From here, execution resolves into one of two cases.

###### Case 1: The listener is registered

If the storage promise resolves and `settings.shouldListen` evaluates to `true`:
1. The extension executes the `addListener()` call.
2. The extension calls `browser.runtime.markListenerRegistrationComplete()`.
3. The browser commits the routing state (maintaining the `tabs.onUpdated` registration for future wake-ups). The renderer flushes its holding queue, and the queued `tabs.onUpdated` event is safely dispatched to the newly attached `handleTabUpdate` callback. No events were missed.

###### Case 2: The listener is not registered

If the storage promise resolves but `settings.shouldListen` evaluates to `false`:
1. The extension skips the `addListener()` call.
2. The extension calls `browser.runtime.markListenerRegistrationComplete()`.
3. The browser commits the routing state. Because the listener was omitted during this run, the browser overwrites and **clears** the old persisted routing state. The renderer flushes the queued event, which is harmlessly dropped since no JavaScript callback is attached.
4. Because the routing state is now cleared, future `tabs.onUpdated` events will no longer wake up the background context. This implicitly cleans up the routing state without the developer needing to explicitly call `removeListener()` (see Workaround B) or accept unnecessary wake-ups on future events (see Workaround A).

#### Late Registrations

Once `markListenerRegistrationComplete()` is called, event listener registration resumes its normal behavior for the running background context. By default, listeners added after completion also update the browser's persisted routing state so that the extension can be woken up for those events in the next run.

A listener registered after `markListenerRegistrationComplete()` is a "late listener registration". Late listener registrations are persisted by default. This is intentional: it allows extensions to change runtime configuration after startup. For example, if a feature is enabled after listener registration has already completed, the extension can register the newly needed listener immediately and rely on that listener to wake the background context in the next run.

On the next background context startup, however, `markListenerRegistrationComplete()` again performs a full replacement of the persisted routing state. Therefore, a late listener from a previous run remains persisted only if the extension re-registers it before the next successful call to `markListenerRegistrationComplete()`.

If a late listener was accidentally persisted and is not re-registered during the next successful listener registration phase, it is removed from the persisted routing state at the next completion point. It may still cause an unnecessary wake-up before then.

Listeners intended to be temporary or scoped only to the current background context run must be removed explicitly with `removeListener()`. This proposal does not introduce non-persistent / session-scoped listeners; that is listed as future work.

##### Example Flow of a Late Registration

After listener registration has completed, an extension might change a setting at runtime:

```javascript
async function setShouldListen(shouldListen) {
  await browser.storage.local.set({ shouldListen });

  if (shouldListen) {
    if (!browser.tabs.onUpdated.hasListener(handleTabUpdate)) {
      browser.tabs.onUpdated.addListener(handleTabUpdate);
    }
  } else {
    if (browser.tabs.onUpdated.hasListener(handleTabUpdate)) {
      browser.tabs.onUpdated.removeListener(handleTabUpdate);
    }
  }
}
```

If `shouldListen` changes from `false` to `true` after `markListenerRegistrationComplete()` has already been called, the `tabs.onUpdated` listener is a late listener registration. It updates the persisted routing state and can wake the extension on a future `tabs.onUpdated` event.

On the next startup, the extension is still expected to read `shouldListen` and re-register `handleTabUpdate` before calling `markListenerRegistrationComplete()`. If it does, the listener remains in the persisted routing state. Otherwise, the next successful completion replaces the state and removes the late listener.

If `shouldListen` changes from `true` to `false`, the extension should call `removeListener()` so future `tabs.onUpdated` events do not unnecessarily wake the background context.

#### Edge Cases

* **Initialization failure fallback:** If the initialization phase fails (e.g., the worker crashes or hits a timeout before the completion API is called), the browser will abort the state commit. It will keep the previous persisted routing state to prevent leaving the extension in a broken state.

#### Performance Considerations

Because MV3 background contexts are ephemeral and may wake up frequently, delaying listener registration can add latency to event dispatch on every cold start. If an extension performs slow I/O before calling `markListenerRegistrationComplete()`, that delay applies to events queued during the listener registration phase. Extensions are encouraged to keep listener registration work short and to prefer fast, local state for routine startup decisions. Where possible, extensions should call `markListenerRegistrationComplete()` as soon as the listener set for the current run has been determined.

Delayed dispatch can also increase stale-state and time-of-check to time-of-use (TOCTOU) risks. Handlers for delayed events should revalidate assumptions before acting and should prefer stable identifiers where available.

### New Permissions

| Permission Added | Suggested Warning |
| ---------------- | ----------------- |
| N/A              | N/A               |

This API modifies the initialization lifecycle of the extension's background context but does not grant any new access to user data or privileged browser features. Therefore, no new permissions are required.

### Manifest File Changes

Add an optional (default false) `async_listener_registration` field inside the `background` key.

```json
{
  "background": {
    "service_worker": "background.js",
    "async_listener_registration": true
  }
}
```

## Security and Privacy

### Exposed Sensitive Data

This API does not expose any sensitive data or personally identifiable information.

### Abuse Mitigations

* **Indefinite hangs:** A malicious or poorly coded extension could fail to call `markListenerRegistrationComplete()` in an attempt to consume memory by forcing the browser to queue a massive number of events. This is mitigated by queuing the events in the renderer process, scoping the impact to the renderer only. The browser can also enforce an initialization timeout, falling back to the previous run's routing state if it expires.
* **Queue limits:** Implementations could enforce an upper bound on the event queue size, dropping the oldest events if the limit is exceeded during the wait phase to prevent unbounded memory growth. Again, because the queuing happens renderer-side, in the worst case scenario a misbehaving renderer can be killed.

## Alternatives

### Existing Workarounds

Currently, developers must work around the lack of async initialization using patterns that are suboptimal.

#### Workaround A: Discarding events inside the listener callback

Developers register the listener synchronously, load their configuration asynchronously, and check the state *inside* the callback.

```javascript
let config = null;
browser.storage.local.get("config").then(res => config = res);

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!config || !config.enableTabTracking) return; // Discard event.
  // ... actual logic ...
});
```

This incurs significant performance overhead. It forces the browser to spin up the background context environment and dispatch the event every single time it fires, only for the extension to immediately discard it.

#### Workaround B: The `removeListener` pattern

Developers register the listener unconditionally on startup. Once the asynchronous state resolves, if the feature is disabled, they explicitly unregister the listener.

```javascript
const handleTabUpdate = (tabId, changeInfo, tab) => { /* logic */ };
browser.tabs.onUpdated.addListener(handleTabUpdate);

browser.storage.local.get("config").then(config => {
  if (!config.enableTabTracking) {
    browser.tabs.onUpdated.removeListener(handleTabUpdate);
  }
});
```

While this prevents *future* unnecessary wake-ups (as the browser persists the updated routing table), it still incurs an initial wake-up penalty. It also requires excessive boilerplate to manually map, re-add, and remove listener references as state changes, complicating extension logic. The proposed API avoids both the initial wake-up penalty and the complex teardown boilerplate, as old listeners are automatically replaced upon completion of initialization.

#### Workaround C: Listener substitution hack for dynamic filters

When an extension relies on dynamically configured event filters (e.g., user-defined URLs for `webNavigation`), it cannot register the filtered listener synchronously on a cold start because the filters haven't been loaded from storage yet. To avoid missing the event that triggered the background context's wake-up, the extension must register a broad, unfiltered listener to act as a temporary catch-all, and later substitute it.

```javascript
// 1. Synchronously register an unfiltered catch-all to receive the waking event.
const catchAllListener = (details) => { /* temporarily handle or queue event */ };
browser.webNavigation.onBeforeNavigate.addListener(catchAllListener);

// 2. Asynchronously load the dynamic filters.
browser.storage.local.get("userFilters").then(filters => {
  // 3. Register the actual filtered listener so the browser's persistent 
  // event router knows to wake the SW for these URLs in the future.
  browser.webNavigation.onBeforeNavigate.addListener(
    (details) => { /* handle actual event */ }, 
    { url: filters }
  );
  
  // 4. Remove the temporary catch-all listener.
  browser.webNavigation.onBeforeNavigate.removeListener(catchAllListener);
});
```

This pattern (really just a hack) is very convoluted and brittle: it forces the extension to temporarily over-listen, catching potentially irrelevant events while the async task is pending. Notably, the Chromium codebase contains tests specifically designed to ensure this workaround functions (see https://crrev.com/c/7604661), with comments explicitly noting that this is required *"until we have a better way for extensions to register listeners asynchronously at startup."*

### Open Web API

Service workers on the open web handle initialization via the `install` and `activate` lifecycle events, utilizing `event.waitUntil()` to extend the phase for asynchronous tasks. We considered introducing an extension-specific lifecycle event (e.g., `browser.runtime.onRegisterListeners` with a `waitUntil()` method), but explicitly using a manifest opt-in paired with a completion call is simpler and avoids introducing entirely new lifecycle events just for extensions. Additionally, `onRegisterListeners` would need to be synchronously registered at the top level, which could be confusing.

## Implementation Notes

* The `async_listener_registration` manifest key allows the browser to know before spinning up the background context that it should start queuing events *in the renderer*.
* The browser's event router must compute the union of the old persisted listener configurations and any newly evaluated configurations during startup to determine which events to forward to the initializing renderer.
* Implementations must ensure that enqueued tasks are flushed and dispatched normally upon calling `markListenerRegistrationComplete()`. If the initialization fails before the method is called, the state commit is aborted, and the previous run's listener state is preserved in the browser process.
* When the initialization completion is signaled while the background script is still starting/executing, events are not queued and the usual event dispatch happens as soon as possible.

## Future Work

A future proposal could allow an extension to register a listener that is active only for the current background context run and does not update persisted routing state. For example, this might be represented as an explicit listener option:

```javascript
browser.tabs.onUpdated.addListener(handleTemporaryUpdate, { ...filter, persistent: false });
```

This would address temporary listener use cases without changing the default behavior of late registrations in this proposal.
