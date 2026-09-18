# Proposal: `initial_permissions` and `initial_host_permissions`

**Summary**

`initial_permissions` and `initial_host_permissions` will allow extension
authors to declare the permissions browsers may prompt extension users
at initial installation time.

**Document Metadata**

**Author:** Carlos Jeurissen

**Sponsoring Browser:** TBD

**Created:** 2025-10-05

**Related Issues:** https://github.com/w3c/webextensions/issues/711, https://github.com/w3c/webextensions/issues/116, https://github.com/w3c/webextensions/issues/700, https://github.com/w3c/webextensions/issues/227

## Motivation

### Objective

`initial_permissions` and `initial_host_permissions` will allow extension
authors to declare the permissions browsers may prompt extension users
at initial installation time.

Existing options like `permissions` and `host_permissions` cause issues
when introducing new permissions to users on update-time.

#### Use Cases

1) Make it easier for extension authors to introduce new permissions. This will
also reduce the amount of extension authors attempting to future-proof their
extension with permissions they do not need yet.

2) Be more semantic. The purpose of `permissions` is ambiguous, which
`initial_permissions` intends to solve.

3) Suppress automatically hoisting of `host_permissions` when declaring
`content_scripts` in the manifest. This reduces the need for registering
content scripts dynamically with all potential bugs associated.

### Known Consumers

1) Any extension author wanting to be more cautious and intentional with their
permission declarations.

2) Extension authors introducing new (host) permissions in updates.

3) Extension developers which want to offer certain content scripts by default
but not request all host permissions on initial installation.

## Specification

### Schema

```ts
interface Manifest {
  initial_permissions: string[];
  initial_host_permissions: string[];
}
```

### Behavior

`initial_permissions` will take over the permission prompt on initial
installation of the existing `permissions` field. In supported browsers,
permissions in `permissions` should be treated as `optional_permissions`
unless they are specified in `initial_permissions`.

Same goes for `initial_host_permissions` and `optional_host_permissions`.

If `initial_host_permissions` is specified in the manifest as empty or non-empty
array of permissions, any `host_permissions` triggered by the `matches`
properties should be treated as `optional_host_permissions` instead of
`host_permissions`.

If new permissions will be added in an update to `initial_permissions`, these
new permissions will be treated as `optional_permissions` for existing users.

### New Permissions

None

## Security and Privacy

### Exposed Sensitive Data

None

### Abuse Mitigations

Reduced abuse risk as extension users may get confused with current
permission update behaviors in existing browsers.

### Additional Security Considerations

None

## Alternatives

### Existing Workarounds

1) Using `optional_permissions` for all new permissions. However this makes the
onboarding experience confusing and not as smooth as it could be.

2) Using `chrome.scripting.registerContentScripts()`. This is dynamic instead of
declarative with the risk of registration and background scripting lifetime bugs.

### Open Web API

This is a concept specific to browser extensions.

## Implementation Notes

An empty permissions declaration of `initial_host_permissions` would be valid
as it would suppress the hoisting of `content_scripts` permissions.

## Future Work

1) Always disable the automatic hoisting of `content_scripts`. This may need a
manifest update.

2) Either remove the non descriptive `permissions` and `host_permissions` OR
remove `optional_permissions` and `optional_host_permissions` and always treat
the permissions declared in `permissions` and `host_permissions` as optional.
