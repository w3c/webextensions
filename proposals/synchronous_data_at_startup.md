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
* Seemingly related but explicitly out of scope: [Issue 284](https://github.com/w3c/webextensions/issues/284): Main world Content Script shared params
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

Classes of privacy extensions, such as NoScript
([issue 536](https://github.com/w3c/webextensions/issues/536)).

Classes of extensions that modify web pages based on user input,
where latency in state retrieval degrades the user experience.
The Violentmonkey author expressed a desire to use such an API in
[issue 747](https://github.com/w3c/webextensions/issues/747).


## Specification

### Schema

This proposal extends the `browser.storage` namespace with two new storage
areas. Their interface is inspired by the `StorageArea` type, except the
methods to look up stored keys/values are synchronous (`get` and `getKeys`).

The `set` method includes a new optional `options` parameter to configure the
persistence of the specified parameters.

```
// Methods available to extension contexts and content scripts:
               any ConfigStorageArea.get(keyOrKeysOrObjectWithDefaults: string | string[] | null | object)
          string[] ConfigStorageArea.getKeys();
    ExtensionEvent ConfigStorageArea.onChanged;

// Methods available to extension contexts only, not content scripts:
   Promise<number> ConfigStorageArea.getBytesInUse()
Promise<undefined> ConfigStorageArea.set(items: object, options?: ConfigStorageAreaSetOptions)
Promise<undefined> ConfigStorageArea.remove(keyOrKeys: string | string[])
Promise<undefined> ConfigStorageArea.clear()

            number ConfigStorageArea.QUOTA_BYTES;

// In content scripts, the set/remove/clear methods are unavailable:
ConfigStorageArea browser.storage.contentScriptConfig;

// Extension contexts only:
ConfigStorageArea browser.storage.extensionConfig;

dictionary ConfigStorageAreaSetOptions {
  persistent: boolean  // default false
}
```

#### Explicit list of APIs

This section describes the full list of APIs specified by this proposal.

APIs available to content scripts:

- `browser.storage.contentScriptConfig.get`
- `browser.storage.contentScriptConfig.getKeys`
- `browser.storage.contentScriptConfig.onChanged`
- `browser.storage.contentScriptConfig.QUOTA_BYTES`

APIs available to privileged extension contexts:

- `browser.storage.contentScriptConfig.get`
- `browser.storage.contentScriptConfig.getKeys`
- `browser.storage.contentScriptConfig.getBytesInUse`
- `browser.storage.contentScriptConfig.set`
- `browser.storage.contentScriptConfig.remove`
- `browser.storage.contentScriptConfig.clear`
- `browser.storage.contentScriptConfig.onChanged`
- `browser.storage.contentScriptConfig.QUOTA_BYTES`
- `browser.storage.extensionConfig.get`
- `browser.storage.extensionConfig.getKeys`
- `browser.storage.extensionConfig.getBytesInUse`
- `browser.storage.extensionConfig.set`
- `browser.storage.extensionConfig.remove`
- `browser.storage.extensionConfig.clear`
- `browser.storage.extensionConfig.onChanged`
- `browser.storage.extensionConfig.QUOTA_BYTES`

### Behavior

#### ConfigStorageArea

This proposal defines two fully independent `ConfigStorageArea` instances,
`contentScriptConfig` and `extensionConfig`. Privileged extension contexts have
full read and write access to both areas, whereas content scripts can only
read from `contentScriptConfig`.

The `ConfigStorageArea` type is based on the `StorageArea` interface, except
with the `get` and `getKeys` methods returning data synchronously instead of
asynchronously.

Updates to the storage area are propagated to all processes where a context may
exists with a need for synchronous data access. This proposal specifies the
`set`, `remove` and `clear` methods to update data, that eventually flushes.

Once flushed, saved data should immediately be readable. In particular:

- Background scripts / extension service workers should be able to read from
  `extensionConfig` at any stage of their life cycle, including startup.
- Content scripts should be able to read from `contentScriptConfig`, even at
  the earliest execution (`document_start`).

By default, data only lasts for the duration of the browser session. The `set`
method has a `persistent` option that extends the lifetime past browser and
extension restarts. The data may be cleared when an extension is uninstalled.

#### get

The `get()` method has similar semantics as `StorageArea.get`, except it
*synchronously* returns keys and values that are known locally in the process.

#### getKeys

The `getKeys()` method has similar semantics as `StorageArea.getKeys`, except
it *synchronously* returns keys that are known locally in the process.

#### getBytesInUse

The `getBytesInUse()` method returns the amount of bytes in use by the data.

See `QUOTA_BYTES` for remarks about how quota is measured.


#### set

The `set()` method takes a (new) optional options object as a second parameter.

The `persistent` option defaults to false, which means that the data is not
persisted across browser restarts. When `persistent` is set to `true`, the
specified key-value pairs are persisted across browser and extension restarts.

Each key has its own associated `persistent` flag, which affect the behavior of
the latest `set()` call, and any following `remove()` or `clear()` calls.
The `set` method can update multiple keys at once, and the `persistent` option
applies to all specified keys. To have different `persistent` flags for keys,
call the `set()` method again, with a different `persistent` option value.

Persisted data should be stored locally, comparable to `storage.local`.

Updates are asynchronous. The returned `Promise` may await writes to disk when
the persistent flag is set, but does not guarantee the delivery of data to
other processes. This ensures that non-responsive processes cannot delay the
resolution of the `Promise`. The caller resides in the extension process and
is guaranteed to receive the updated value when `get` or `getSync` are called.

#### remove

Removes data associated with the specified keys.

See the `set` method for remarks about this method's asynchronous behavior.

#### clear

Clears all data in this storage area.

See the `set` method for remarks about this method's asynchronous behavior.

#### onChanged

When a storage change is observed, the `browser.storage.onChanged`,
`browser.storage.contentScriptConfig.onChanged` or
`browser.storage.extensionConfig.onChanged` events are dispatched as needed.

The `onChanged` event receives an object with all modified keys.

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

### Domain or Origin specific data

This proposal offers one global storage area for content scripts shared between
all websites. A potential enhancement could be to offer a way to scope storage
to specific domains or origins. While the proposal currently allows extensions
to implement the domain-specific values themselves by including the domain or
origin in the key, the data would still be exposed across all processes, which
makes the mechanism less suited for data that ought to only be shared with
processes from a specific origin.

### onChanged event filter

The `onChanged` event fires for any storage change, which is inefficient if a
content script is only interested in changes to a specific key.

There is a proposal to add filter options to `StorageArea.onChanged` at
[Issue 475](https://github.com/w3c/webextensions/issues/475).

An alternative for extensions is to use `tabs.sendMessage` as a mechanism to
notify specific content scripts of data changes, but that would add overhead.
