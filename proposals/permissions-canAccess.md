# Proposal: `browser.permissions.canAccess()`

**Summary**

`browser.permissions.canAccess()` would allow extensions to determine if it
has access to a given host.

**Document Metadata**

**Author:** carlosjeurissen

**Sponsoring Browser:** Safari

**Contributors:** -

**Created:** 2025-03-27

**Related Issues:** https://github.com/w3c/webextensions/issues/790

## Motivation

### Objective

The API allows an extension to determine access to specific hosts before
calling an extension or web API which could fail as a result of missing
host access.

#### Use Cases

Extensions would like to indicate to the user if some extension functionality
works for a specific host. In addition, extensions may want to check access
before calling a specific API.

Figure out access without having to know the URL of a specific tab. Useful
as without host permissions extension APIs may not expose URLs.

### Known Consumers

Extensions which currently maintain guess work on what hosts are restricted.
For example: https://github.com/fregante/webext-content-scripts#isscriptableurlurl
And extensions which expect `permissions.contains()` to be reliable while it
may not be reliable in all situations.

## Specification

### Schema

### types

```ts
dictionary AccessQuery {
  url: string,
  documentId: string,
  tabId: number,
  frameId: number,
}

dictionary AccessResult {
  // The current extension access state of the given host
  canAccess: boolean,
  // Can inject scripts only
  injectOnly: boolean,
}

```

Either one of `url`, `documentId`, or `tabId` (with optional `frameId`)
should be specified.

#### methods

```ts
Promise<AccessResult[]> browser.permissions.canAccess(
  query: AccessQuery
)
```

### Behavior

The accessOnce can be set by browsers which in case of the `activeTab`
permission grant host access once.

### New Permissions

No new permissions added.

### Manifest File Changes

No new manifest fields.

## Security and Privacy

### Exposed Sensitive Data

Document any sensitive data or personally-identifiable information the API
exposes to the extension.

### Abuse Mitigations

Currently extensions can already determine access by opening a new tab and
attempting to excute a script. See existing workarounds. So no new abuse
abilities are introduced.

### Additional Security Considerations

No new attack vectors are created.

## Alternatives

### Existing Workarounds

Currently extensions can call the `browser.permissions.contains()` API. This
would be insufficient to determine access to potential restricted hosts
as a result of enterprise policies or for security reasons. For example,
some browsers block access to extension store hosts.

Another workaround is actually calling APIs which could throw if the extension
has no access. This is slower and could lead to side-effects. In general it is
better to prevent throwing errors when they can be circumvented.

### Open Web API

Host access generally is unique to extensions. Having such API on the open
web thus does not make sense.

## Implementation Notes

Most browsers currently already have the concept of canAccess internally.
This can be leveraged during implementation.

## Future Work

Ability for extensions to disallow specific host access as proposed in
https://github.com/w3c/webextensions/issues/123
