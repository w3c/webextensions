# Proposal: Asynchronous Listener Registration

**Summary**

An API proposal to allow extensions to explicitly manage their service worker initialization phase via a manifest opt-in field and a `markInitializationComplete()` API, enabling the asynchronous registration of event listeners. 

**Document Metadata**

**Author:** andreaorru@chromium.org

**Sponsoring Browser:** Google Chrome

**Contributors:** rdevlin.cronin@chromium.org

**Created:** 2026-04-22

**Related Issues:** N/A

## Motivation

### Objective

Currently, the extension platform requires event listeners to be registered synchronously during the execution of a service worker script. The browser process manages event routing and relies on the renderer process to report which events an extension is listening to immediately after the initial script evaluation.

If an extension registers a listener asynchronously (e.g., inside a `setTimeout`, after a `fetch()`, or after reading from `browser.storage`), the initial script evaluation finishes before the listener is attached. Consequently, when the relevant event fires later, the service worker wakes up, executes its top-level script synchronously, and the browser dispatches the event to all registered listeners (of which there may be none). Thus, the service worker wakes up but receives no event.

This proposal introduces a mechanism to explicitly delay the finalization of the "initialization phase" of the worker and formalizes how listener state is managed and persisted across service worker restarts.

#### Use Cases

* **Conditional event registration:** An extension may need to read user preferences from local storage to determine whether it should register listeners for high-traffic events (e.g., `tabs.onUpdated` or `webRequest`).
* **Dynamic configuration:** An extension might need to fetch a configuration file to decide which listener options to set up (e.g. `webRequest` URL filters).

### Known Consumers

Extensions which require dynamic or conditionally registered event listeners based on asynchronous state, without resorting to unconditionally waking up the service worker for events they may not care about.

## Specification

### Schema

#### Manifest

```json
{
  "background": {
    "service_worker": "background.js",
    "async_initialization": true
  }
}
```

#### Runtime API

```typescript
namespace runtime {
  /**
   * Signals to the browser that asynchronous initialization is complete.
   * Transitions the service worker out of the initialization phase, replaces 
   * the previous run's persisted listeners with the newly registered ones, 
   * and flushes the event queue.
   */  
  export function markInitializationComplete(): void;
}
```

### Behavior

#### Initialization Lifecycle

* **Manifest opt-in:** Extensions declare `"async_initialization": true` nested inside the `"background"` key in their `manifest.json`.
* **Renderer-side queueing:** During the initialization phase, the browser routes incoming events that match the previously registered listeners to the service worker's renderer process, which queues them instead of immediately attempting to dispatch them to JavaScript callbacks (which might not be attached yet).
* **Event routing (union of old and new):** While in the initialization phase, the browser will route an event to the renderer queue if it matches *either* the old persisted routing state (from the previous run) or any new listeners currently being registered by the executing script.
* **Listener registration:** Developers perform their asynchronous setup (e.g., reading from storage) and call `addListener()` to attach their desired JavaScript callbacks *before* calling the completion API.
* **State commit & completion API:** The extension must call `browser.runtime.markInitializationComplete()` once its async setup is complete. At that moment:
	1. The old persisted routing state is **thrown away**.
	2. The new listeners currently registered are committed to the browser as the new persisted routing state for future wake-ups.
* **Event flush:** Once `markInitializationComplete()` ends the initialization phase, the renderer flushes its queue, dispatching all held events to the newly registered JavaScript callbacks in FIFO order.

#### Example Flow

To illustrate how these lifecycle changes resolve the timing issues of asynchronous setup, consider an extension that conditionally tracks tab updates based on an asynchronous storage read.

```javascript
browser.storage.local.get("shouldListen").then((settings) => {
  // Asynchronously evaluate state.
  if (settings?.shouldListen) {
    // Conditionally register the listener based on the async result.
    browser.tabs.onUpdated.addListener(handleTabUpdate);
  }
  // Signal the end of the initialization phase.
  browser.runtime.markInitializationComplete();
});
```

Assume that during a previous run, `settings.shouldListen` was `true`, the listener was registered, and the browser persisted this routing state. The service worker has since been terminated. 

When a new `tabs.onUpdated` event fires, the browser checks the persisted state and wakes the service worker. Because the manifest includes `"async_initialization": true`, the renderer process queues the waking event rather than attempting to dispatch it immediately. 

From here, execution resolves into one of two cases.

##### Case 1: The listener is registered

If the storage promise resolves and `settings.shouldListen` evaluates to `true`:
1. The extension executes the `addListener()` call.
2. The extension calls `browser.runtime.markInitializationComplete()`.
3. The browser commits the routing state (maintaining the `tabs.onUpdated` registration for future wake-ups). The renderer flushes its holding queue, and the queued `tabs.onUpdated` event is safely dispatched to the newly attached `handleTabUpdate` callback. No events were missed.

##### Case 2: The listener is not registered

If the storage promise resolves but `settings.shouldListen` evaluates to `false`:
1. The extension skips the `addListener()` call.
2. The extension calls `browser.runtime.markInitializationComplete()`.
3. The browser commits the routing state. Because the listener was omitted during this run, the browser overwrites and **clears** the old persisted routing state. The renderer flushes the queued event, which is harmlessly dropped since no JavaScript callback is attached.
4. Because the routing state is now cleared, future `tabs.onUpdated` events will no longer wake up the service worker. This implicitly cleans up the routing state without the developer needing to explicitly call `removeListener()` (see Workaround B) or accept unnecessary wake-ups on future events (see Workaround A).

#### Edge Cases

* **Initialization failure fallback:** If the initialization phase fails (e.g., the worker crashes or hits a timeout before the completion API is called), the browser will abort the state commit. It will keep the previous persisted routing state to prevent leaving the extension in a broken state.
* **Late registration:** It is permissible to register new listeners after the `markInitializationComplete()` API call. If an extension does so, developers must understand the following lifecycle:
	* The browser will persist these "late" listeners across service worker terminations to successfully trigger a future wake-up.
	* On the subsequent wake-up, all relevant listeners must be re-registered. Calling `markInitializationComplete()` entirely replaces the routing state from the previous run.
	* Therefore, any late-registered listeners from a previous run will be removed from the registered listeners during the next run's state commit unless the extension explicitly re-registers them before calling the completion API.

#### Performance Considerations

Because MV3 service workers are ephemeral and wake up frequently, developers must be aware that delaying initialization adds latency to event dispatch. If an extension relies on slow I/O before calling `markInitializationComplete()`, that latency penalty applies to every single event that triggers a cold start. Developers are heavily encouraged to use fast, local I/O for conditional listener registration during routine wake-ups.

### New Permissions

| Permission Added | Suggested Warning |
| ---------------- | ----------------- |
| N/A              | N/A               |

This API modifies the initialization lifecycle of the extension's service worker but does not grant any new access to user data or privileged browser features. Therefore, no new permissions are required.

### Manifest File Changes

Add an optional (default false) `async_initialization` field inside the `background` key.

```json
{
  "background": {
    "service_worker": "background.js",
    "async_initialization": true
  }
}
```

## Security and Privacy

### Exposed Sensitive Data

This API does not expose any sensitive data or personally identifiable information.

### Abuse Mitigations

* **Indefinite hangs:** A malicious or poorly coded extension could fail to call `markInitializationComplete()` in an attempt to consume memory by forcing the browser to queue a massive number of events. This is mitigated by queuing the events in the renderer process, scoping the impact to the renderer only. The browser can also enforce an initialization timeout, falling back to the previous run's routing state if it expires.
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

This incurs significant performance overhead. It forces the browser to spin up the service worker environment and dispatch the event every single time it fires, only for the extension to immediately discard it.

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

When an extension relies on dynamically configured event filters (e.g., user-defined URLs for `webNavigation`), it cannot register the filtered listener synchronously on a cold start because the filters haven't been loaded from storage yet. To avoid missing the event that triggered the service worker's wake-up, the extension must register a broad, unfiltered listener to act as a temporary catch-all, and later substitute it.

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

* The `async_initialization` manifest key allows the browser to know before spinning up the service worker that it should start queuing events *in the renderer*.
* The browser's event router must compute the union of the old persisted listener configurations and any newly evaluated configurations during startup to determine which events to forward to the initializing renderer.
* Implementations must ensure that enqueued tasks are flushed and dispatched normally upon calling `markInitializationComplete()`. If the initialization fails before the method is called, the state commit is aborted, and the previous run's listener state is preserved in the browser process.

## Future Work

N/A
