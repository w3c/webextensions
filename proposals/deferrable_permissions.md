# Proposal: `deferrable_permissions`

A proposal for two new manifest keys governing permissions that can be
considered to be required at install, but optional on update.

**Author:** Benjamin Bruneau (1Password) -
[@bbruneau](https://github.com/bbruneau), [email](mailto:fbbruneau@proton.me)

**Sponsoring browser:** None

**Created:** 2026-10-07

**Related issues:**

- [w3c/webextensions#1032](https://github.com/w3c/webextensions/issues/1032)
- [PR #798](https://github.com/w3c/webextensions/pull/798)
- [PR #883](https://github.com/w3c/webextensions/pull/883)

## Summary

Add a new manifest pair, `deferrable_permissions` and
`deferrable_host_permissions`.

A deferrable permission behaves like a normal (`permissions`) entry when a user
installs an extension for the first time, and like an optional
(`optional_permissions`) entry when a user with an already-installed extension
receives an update to that extension. That is to say, if the
`deferred_permission` would cause a warning to be displayed to the user at
install time, then it immediately does so, like an entry in `permissions`; but
at update time, that warning is deferred until it is first requested, just as an
entry in `optional_permissions`.

## Motivation

### Objective

If a developer wants to ship a feature that needs a new permission, they have
two choices, which are both problematic:

1. They can add it to `permissions`, and existing users get a sudden and
   unexpected permission warning on update. The extension is disabled until they
   consent to the new permission, and if they don't consent, the extension
   remains disabled with no recourse to the developer, who risks losing their
   entire installed base to ship one feature.
2. They can add it to `optional_permissions`, which defers the warning until the
   permission is first requested, but also requires users who theoretically
   would have consented to the permission on install to be made to re-consent at
   the moment of exercising the permission. There is no future state in which
   the permission can be changed from being "optional" to "required" without
   hitting choice 1.

Essentially, there is no option for a developer to ask permission of new users
at install time without ambushing existing users; that missing middle is what
this document proposes.

### Known consumers

1. Any extension that wishes to add a new permission which would cause a consent
   popup to appear on install or upgrade.

2. Any extension that would like to upgrade an optional permission to be
   required.

## Specification

### Glossary

- _Warning-causing permission_: Any permission which causes the user to have to
  interact with browser-provided UI to consent to a permission's use. Example:
  `declarativeNetRequest`

### Schema

```ts
interface Manifest {
  deferrable_permissions: string[];
  deferrable_host_permissions: string[];
}
```

### Behaviour

A permission listed in `deferrable_permissions`:

- At install, it is treated exactly as if it were in `permissions`, i.e. it must
  be presented at the moment the user is asked for consent to use
  _warning-causing permissions_, and granted when the user accepts the
  extension.
- On update, it is treated exactly as if it were in `optional_permissions`, i.e.
  not granted until the extension programmatically requests the permission from
  the user during runtime via `browser.permissions.request()`.

A deferrable permission is never granted to anyone without either (a) an
interactive install the user chose, or (b) a runtime request the user consented
to.

#### Backwards compatibility

Graceful degradation is possible in older browsers that do not support
deferrable permissions. The developer should list each deferrable permission in
`optional_permissions` (and each deferrable host permission in
`optional_host_permissions`) in addition to `deferrable_permissions`.

This fallback means the same permission can appear in more than one key.
Resolution is by a fixed strength order, i.e. the strongest declaration wins:

```
permissions > deferrable_permissions > optional_permissions
```

- If a permission is in `permissions`, it is required-always, regardless of any
  other listing.
- Else if it is in `deferrable_permissions`, it follows the behaviour listed
  above (required at install, optional on update).
- Else if it is in `optional_permissions`, it is fully optional.

Browsers that support `deferrable_permissions` will follow the behaviour already
described, and ignore the same entry in `optional_permissions`. Browsers that do
not support `deferrable_permissions` will ignore the key, and instead use
`optional_permissions`.

#### Revocability

Any permission in `deferrable_permissions` is always revocable by the user,
exactly like an optional permission, however it was obtained, whether granted at
install or requested at runtime.

Should a developer graduate a permission from `deferrable_permissions` to
`permissions`, then, if it was granted, it becomes a fully-fledged permission,
which is revocable if the browser supports revocability of granted
`permissions`.

#### Non-replacement of existing manifest keys

A deferrable permission does not replace either `permissions` or
`optional_permissions`; the former is easier to use for developers (in that they
don't need to use runtime permission APIs) and the latter is preferable for
preventing unnecessary permission requests, or for permanently allowing certain
permissions to be revocable.

#### User benefits

For users, this prevents jarring warnings that they may not have contextual
clues to correctly understand and judge. For example, a new user who has _just_
installed an extension and consented to several permissions begins to use a
feature that is relatively new to the extension. The new user is not used to the
extension; even if the extension carefully coaches the user that a new
permission window will appear, it seems arbitrary, given the permissions they
just granted, moments ago.

For developers, a deferrable permission is mechanically equal to an optional
permission and must be handled appropriately. Howver, requesting and granting
these permissions install grant is a convenience and a critical pathway to
turning the deferrable permission into a full-fledged `permissions` entry in the
future.

#### Usage example

A developer of an extension with the `tabs` adds a feature that needs
`tabGroups`. Manifest for the version that introduces it:

```jsonc
{
  "manifest_version": 3,
  "name": "Example",
  "version": "4.0.0",
  "permissions": ["tabs"],

	// Added so as to be required for new installs, and optional for existing installs.
	"deferrable_permissions": ["tabGroups"],

	// Fallback so browsers without deferrable permissions support can treat it as optional.
	"optional_permissions": ["tabGroups"]
}
```

This results in four possible situations:

1. On a new install in a browser supporting `deferrable_permissions`, the
   install prompt shows requests for both `tabs` and `tabGroups` permissions.
   Since`deferrable_permissions` outranks `optional_permissions`, when the
   permission is granted, there are no runtime requests for `tabGroups`.
2. On a new install in a browser unaware of `deferrable_permissions`, the
   install prompt shows requests for `tabs` only. When the `tabGroups`
   permission is requested at runtime via
   `browser.permissions.request("tabGroups")`, the extension shows a new warning
   prompt for it.
3. On an existing install on a browser supporting `deferrable_permissions`,
   `tabGroups` is treated as optional, so no new warning is shown at install
   time. When the `tabGroups` permission is requested at runtime via
   `browser.permissions.request("tabGroups")`, the extension shows a new warning
   prompt for it.
4. On an existing install on a browser unaware of `deferrable_permissions`, no
   new warning is shown at install time, and the extension shows a new warning
   prompt for `tabGroups` when it is requested at runtime via
   `browser.permissions.request("tabGroups")`.


### Host permissions

`deferrable_host_permissions` is defined as the exact analogue of
`deferrable_permissions` for host access, and developers fall back via
`optional_host_permissions` the same way.

## Alternatives considered

### Existing workarounds

There is currently no means of adding a net-new _warning-causing permission_
that allows new users to consent to all permissions up-front.

### Other proposals

- PR #798 fixes the update path for new _warning-causing permissions_, but has
  no backwards-compatible path, which would force developers to wait for their
  userbase to all adopt a supporting browser before implementing that solution.
  This proposal keeps #798's "silent on update" behavior but adds an
  install-time grant and a working fallback.
- PR #883 includes a tractable approach to graceful degradation via a similar
  mechanism to this proposal, as well as other design changes. Those changes
  were discussed as being complicated; this proposal narrows focus to just the
  cause of graceful permission updates. This proposal is partly in response to
  what I found to be a somewhat more confusing resolution scheme between
  `initial_permissions`, `permissions`, and `optional_permissions` (see my
  comments in [issue #1032](https://github.com/w3c/webextensions/issues/1032)).

## References

- The issue that initiated this proposal:
  https://github.com/w3c/webextensions/issues/1032
- The first issue to name the problem of a missing permission-upgrade path:
  https://github.com/w3c/webextensions/issues/711
- Proposal: Enable changing the permissions for only new user
  https://github.com/w3c/webextensions/issues/711
- Proposal: `initial_permissions` and `initial_host_permissions`
  https://github.com/w3c/webextensions/pull/883
