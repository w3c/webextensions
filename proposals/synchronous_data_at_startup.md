# Proposal: Synchronous data at startup

**Summary**

A mechanism for extensions to specify values that are synchronously available when a content script or background script executes.

**Document Metadata**

**Author:** Rob--W

**Sponsoring Browser:** Mozilla

**Contributors:** @oliverdunk

**Created:** 2025-03-26

**Related Issues:**

* [Issue 536 comment](https://github.com/w3c/webextensions/issues/536#issuecomment-2200692043): `scripting.globalParams` in content scripts
* [Issue 703](https://github.com/w3c/webextensions/issues/703): State in background scripts, synchronously available across restarts
* Seemingly related but explicitly out of scope: [Issue 284](https://github.com/w3c/webextensions/issues/284): Main world User Script shared params
* Resolves use case: [Issue 501](https://github.com/w3c/webextensions/issues/501): Proposal: Toggleable event listeners
* Resolves use case: [issue 747](https://github.com/w3c/webextensions/issues/747): API to invalidate BFCache'd webpage with outdated content added by the extension

## Motivation

### Objective

Provide a way for extensions to set and update state that is synchronously
available at the start of script execution. The state can be set from
privileged extension contexts, such as background scripts and options pages.
Once the state has propagated (asynchronously), the state can *synchronously*
be read from content scripts or other privileged contexts.

This state may be session-scoped or persist across browser restarts and
extension updates.

Content scripts have the following additional limitations:
- They can only read this shared state, and not propagate modifications.
- They may not access state specific to privileged contexts.

#### Use Cases

Some use cases depend on state to be synchronously available at the start of
script execution. This applies both to content scripts and background scripts.

In the context of content scripts, initial state may be needed to run logic
at `document_start`, before the web page has had a chance to run. Content
scripts may also want to revalidate their state without latency after returning
from the bfcache ([issue 747](https://github.com/w3c/webextensions/issues/747)).

This concept has also been discussed before as `globalParams` in the context of
dynamic content scripts (see https://crbug.com/1054624).

In the context of background scripts, initial state may be needed for
initialization, for example registering listeners based on user configuration
([issue 501](https://github.com/w3c/webextensions/issues/501)).


### Known Consumers

Classes of privacy extentensions, such as NoScript
([issue 536](https://github.com/w3c/webextensions/issues/536)).

Classes of extensions that modify web pages based on user input,
where latency in state retrieval degrades the user experience.
The Violentmonkey author expressed a desire to use such an API in
[issue 747](https://github.com/w3c/webextensions/issues/747).


## Specification

### Schema

This proposal builds upon the existing `browser.storage` API. The `StorageArea`
type that commonly describes the various areas within `browser.storage` is
extended with new methods to allow synchronous access to the data.

The `set` method includes a new optional `options` parameter to configure the
persistency of the specified parameters.

```
// When execution context is allowed to read synchronously.
               any ConfigStorageArea.getSync(keyOrKeysOrObjectWithDefaults: string | string[] | null | object)
          string[] ConfigStorageArea.getKeysSync();

// These are the same interfaces as storage.StorageArea
   Promise<object> ConfigStorageArea.get(keyOrKeysOrObjectWithDefaults: string | string[] | null | object)
   Promise<number> ConfigStorageArea.getBytesInUse()
 Promise<string[]> ConfigStorageArea.getKeys()
Promise<undefined> ConfigStorageArea.set(items: object, options?: ConfigStorageAreaSetOptions)
Promise<undefined> ConfigStorageArea.remove(keyOrKeys: string | string[])
Promise<undefined> ConfigStorageArea.clear()

    ExtensionEvent ConfigStorageArea.onChanged;
            number ConfigStorageArea.QUOTA_BYTES;

// Read-only to content scripts; no synchronous reading from extension contexts.
ConfigStorageArea browser.storage.contentScriptConfig;
// Extension contexts only; can read synchronously and write.
ConfigStorageArea browser.storage.extensionConfig;

dictionary ConfigStorageAreaSetOptions {
  persistent: boolean  // default false
}
```

### Behavior

#### ConfigStorageArea

The `ConfigStorageArea` type is a composition of the existing `StorageArea`
interface and two new methods, `getSync` and `getKeysSync`. Upon invoking the
methods that update the storage area, the data is propagated to all processes
where a context may exists with a need for synchronous data access.

Content scripts can *synchronously* access a copy of the available data with:

- `browser.storage.contentScriptConfig.getSync(...)`
- `browser.storage.contentScriptConfig.getKeysSync(...)`

These methods are unavailable to privileged extension contexts, to encourage
extensions to use the `extensionConfig` storage area that is hidden from
content scripts and only available to privileged extension contexts:

- `browser.storage.extensionConfig.getSync(...)`
- `browser.storage.extensionConfig.getKeysSync(...)`

The asynchronous methods (inherit from the `StorageArea` interface) are only
available to privileged extension contexts, and allow them to update the data.
Notably, the asynchronous `get`, `getKeys` and `getBytesInUse` methods are not
available to content scripts, despite their read-only capabilities.

#### getSync

The `getSync()` method has similar semantics as the `get()` method, except it
*synchronously* returns keys and values that are known locally in the process.

#### getKeysSync

The `getKeysSync()` method has similar semantics as the `getKeys()` method,
except it *synchronously* returns keys that are known locally in the process.

#### set

The `set()` method takes a (new) optional options object as a second parameter.

The `persistent` option defaults to false, which means that the data is not
persisted across browser restarts. When `persistent` is set to `true`, the
specified key-value pairs are persisted across browser and extension restarts.

Each key has its own associated `persistent` flag, which affect the behavior of
the latest `set()` call, and any following `remove()` or `clear()` calls.

Persisted data should be stored locally, comparable to `storage.local`.

#### onChanged

When a storage change is observed, the `browser.storage.onChanged`,
`browser.storage.contentScriptConfig.onChanged` or
`browser.storage.extensionConfig.onChanged` events are dispatched as needed.

The `onChanged` event receives an object with all modified keys.

TODO: Should the `oldValue` and `newValue` fields be omitted? This would enable
the browser to lazily deserialize values on demand, as an optimization.
The recipient can use `getSync` to look up the actual value if desired.
See also https://github.com/w3c/webextensions/issues/475

#### QUOTA_BYTES

The maximum amount (in bytes) of data that can be stored, as measured by the
key's string length plus the JSON stringification of every value, or the byte
consumption if the agent supports structured cloning.

The value is a balance between utility for extensions and performance impact.

The quota is `102400`.

### New Permissions

This API builds upon the `storage` API, which already requires the `storage`
permission. The `storage` permission does not trigger a warning message.

### Manifest File Changes

This proposal does not specify manifest changes.

## Security and Privacy

### Exposed Sensitive Data

This API does not expose sensitive data.

### Abuse Mitigations

This API specifies data that should be made available across all processes,
which may affect the memory usage and startup cost of all processes.
To limit abuse, a reasonably tight storage quota is chosen.

### Additional Security Considerations

The existing `storage.local` API is sometimes used by extension to store
sensitive information. Due to its default availability in content scripts,
this exposes extensions to data leakage in compromised content processes.

The proposed API design separates content script storage from the storage of
the higher-privileged parts of the extension, to encourage safe defaults.

## Alternatives

### Existing Workarounds

In content scripts, extensions use synchronous XMLHttpRequest to block the main
thread of the web page to fetch dynamic configuration that has been specified
by the extension.

In document-based background contexts, extensions can use the `localStorage`
API from the web platform as a synchronous storage mechanism. A limitation of
`localStorage` is that the data may not persist when the background context
runs in private browsing (incognito) mode, similar to
[issue 534](https://github.com/w3c/webextensions/issues/534).

Service worker-based background contexts do not have alternatives for
synchronous storage.

### Open Web API

`contentScriptConfig` does not make sense on the web, as the concept of content
scripts is non-existent on the regular web platform.

Service workers use asynchronous APIs by design. Synchronously blocking storage
is incompatible with that design.

## Implementation Notes


## Future Work

Highlight any planned or prospective future work.
