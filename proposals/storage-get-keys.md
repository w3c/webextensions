# Proposal: browser.storage.&lt;area>.getKeys

**Summary**

API to retrieve all keys for a given storage area in the `browser.storage` API.

**Document Metadata**

**Author:** [Oliver Dunk (Google)](https://github.com/oliverdunk)

**Sponsoring Browser:** Chromium

**Contributors:** [polywock](https://github.com/polywock)

**Created:** 2024-06-28

**Related Issues:** [#601](https://github.com/w3c/webextensions/issues/601)

## Motivation

### Objective

This API enables developers to retrieve the keys in storage without needing to
receive all of the data stored alongside those keys. Depending on the
implementation, the impact of this optimization may differ - for example
Chromium has only a limited ability to access data from storage without
fetching the associated data. Regardless, this reduces the amount of data
returned to the caller and allows for further optimizations in the future.

#### Use Cases

There are existing use cases for enumerating the data in extension storage. For
example, extensions for Chrome that add extension storage areas to DevTools.
While these also need a way to show the associated values, they may not want to
load these upfront.

Additionally, in some cases developers may want to access keys with a given
prefix, for example if using a key like `foo:tabid`. This API proposal does not
allow matching by prefix (see "Future Work") but developers would be able to do
this themselves after obtaining the list of keys.

### Known Consumers

There is developer interest for this API in
[#601](https://github.com/w3c/webextensions/issues/601). While we don't expect
significant immediate usage, it is a small, well-scoped API and should not
represent significant engineering effort.

## Specification

### Schema

```ts
interface StorageArea {
    getKeys(): Promise<string[]>;
}
```

The original issue proposed the `getAllKeys()` name, to match IndexedDB. This
proposal suggests the slightly shorter `getKeys()`, since that seems equally
clear and less verbose.

### Behavior

This API will reject with an Error / populate browser.runtime.lastError in the case of
failure, for example if access to the storage area is not allowed in the
given context.

### New Permissions

This API will use the existing `storage` permission.

### Manifest File Changes

There are no changes to the manifest.

## Security and Privacy

### Exposed Sensitive Data

This API does not expose any data which is not already accessible to the
extension.

### Abuse Mitigations

This does not expose any new data so there are no new abuse vectors.

### Additional Security Considerations

N/A

## Alternatives

### Existing Workarounds

Developers can retrieve all data using the `get()` API with `null` as the keys
parameter, which will return everything in storage. This is very similar but
requires all of the data stored for a given key to be returned, which has
performance implications.

### Open Web API

In the future, using web storage APIs in WebExtensions would certainly be
desirable. However, the storage API already has significant adoption.
Therefore, there is value in making it more ergonomic for developers.

## Implementation Notes

N/A

## Future Work

It may be desirable to add a parameter to allow filtering of the keys that are
returned. This is not an optimization we think is necessary in an initial
implementation.
