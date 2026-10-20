# Proposal: uiSettings

**Summary**

An API for extensions to read and control browser UI behaviors that are not
exposed in the browser's settings UI, starting with switching tabs by scrolling
the mouse wheel over the tab strip.

**Document Metadata**

**Author:** [hjanuschka](https://github.com/hjanuschka)

**Sponsoring Browser:** Chrome

**Contributors:**

**Created:** 2026-10-20

**Related Issues:**
[WECG #1132](https://github.com/w3c/webextensions/issues/1132),
[Chromium b/41294683](https://crbug.com/41294683)

## Motivation

### Objective

Some browser UI behaviors are configurable only through browser-specific
preferences or not at all. This API gives extensions a uniform, permission-gated
way to read and change such behaviors, so users can opt into behavior that
previously was either hard-coded or platform-specific.

#### Use Cases

##### Consistent scroll-to-switch-tabs across platforms

Chrome enables "scroll to switch tabs" (a mouse wheel event over the tab strip
activates the adjacent tab) by default on Linux only, a leftover from the
pre-Aura GTK2 days; GTK itself never had the behavior. The plan is to drop the
Linux default so all desktop platforms behave the same. Users who want the
behavior can then turn it back on on any platform through an extension, instead
of losing it when the platform default goes away.

##### Tab-management extensions

Extensions that reorganize or supercharge the tab strip can align the browser's
scroll behavior with their own UI (for example, an extension that adds
horizontal tab scrolling can also enable wheel tab switching).

### Known Consumers

- [chromium-tab-scroller](https://github.com/hjanuschka/chromium-tab-scroller),
  a sample extension that enables scroll-to-switch-tabs on install and offers
  a toolbar toggle.

## Specification

### Schema

```ts
declare namespace uiSettings {
  // If enabled, mouse wheel events over the tab strip activate the adjacent
  // tab. Defaults to disabled on all platforms.
  const scrollEventChangesTab: ChromeSetting<boolean>;
}
```

`ChromeSetting<T>` is the existing prototype from the `types` API, providing
`get()`, `set()`, `clear()`, and `onChange`, with the standard
`levelOfControl` semantics.

### Behavior

- `scrollEventChangesTab` controls whether a mouse wheel event over the tab
  strip activates the adjacent tab (down/right scrolls to the next tab,
  up/left to the previous one).
- The default is disabled on every desktop platform. Note that this proposal
  also changes Chrome's Linux default from enabled to disabled; the API merely
  provides the opt-in path.
- `clear()` reverts the value to the platform default and releases control to
  other extensions or policies, following standard `ChromeSetting` semantics.
- Changes take effect immediately, starting with the next wheel event.
- The value is stored per browser profile.
- The API is available in extension contexts only (not content scripts) and on
  desktop platforms only.

### New Permissions

| Permission Added | Suggested Warning |
| -------------- | ----------------- |
| `uiSettings`   | Can change browser interface behavior |

### Manifest File Changes

None, beyond the new `uiSettings` permission.

## Security and Privacy

### Exposed Sensitive Data

The API exposes only the state of browser UI behaviors. It does not expose
browsing data or personally-identifiable information.

### Abuse Mitigations

A malicious extension could change UI behaviors without the user noticing the
connection to the extension. Mitigations:

- The API requires an explicit permission, declared in the manifest and
  surfaced with a permission warning at install and in the permissions UI.
- The behaviors it controls are immediately user-visible when they take effect,
  and the user can undo the change by disabling or removing the extension.
- `levelOfControl` makes it clear which extension controls a value, and
  `clear()` lets an extension hand control back.

### Additional Security Considerations

Values are simple booleans with no parsing or sanitization surface. The API is
restricted to privileged extension contexts; a compromised renderer with
content script access cannot reach it.

## Alternatives

### Existing Workarounds

None on Windows and macOS, where the behavior does not exist. On Linux the
behavior is always on and cannot be turned off without enterprise policies or
flags, which are not available to regular users and cannot be toggled from an
extension.

### Open Web API

The API controls browser chrome (the tab strip), which has no counterpart on
the open web; a web page has no tab strip to modify. This does not belong on
the open web.

## Implementation Notes

Chrome implementation: [crrev.com/c/8613408](https://crrev.com/c/8613408).
The setting is backed by a per-profile preference and mapped through the
existing preference-mapping machinery used by the `chrome.settingsPrivate`
family, so `ChromeSetting` semantics (including `levelOfControl` and conflict
resolution between extensions) come for free.

## Future Work

Additional UI behaviors can be added as new `ChromeSetting` properties on the
`uiSettings` namespace as browsers identify more behaviors worth exposing.
