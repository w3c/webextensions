# Proposal: `sidebar` API

**Summary**

A single `sidebar` API and manifest key that lets an extension host its own UI
in the browser's sidebar, unifying the existing `sidePanel` (Chromium) and
`sidebar_action` / `sidebarAction` (Firefox, Opera, others) APIs.

**Document Metadata**

**Author:** [kiaraarose](https://github.com/kiaraarose)

**Sponsoring Browser:** Safari

**Contributors:** N/A

**Created:** 2026-10-26

**Related Issues:** [#128](https://github.com/w3c/webextensions/issues/128)
(unified sidebar API), [#387](https://github.com/w3c/webextensions/issues/387),
[#472](https://github.com/w3c/webextensions/issues/472),
[#515](https://github.com/w3c/webextensions/issues/515),
[#517](https://github.com/w3c/webextensions/issues/517),
[#521](https://github.com/w3c/webextensions/issues/521),
[#550](https://github.com/w3c/webextensions/issues/550),
[#588](https://github.com/w3c/webextensions/issues/588),
[#631](https://github.com/w3c/webextensions/issues/631),
[#833](https://github.com/w3c/webextensions/issues/833),
[#1126](https://github.com/w3c/webextensions/issues/1126)

## Motivation

### Objective

Chromium ships `chrome.sidePanel` and the `side_panel` manifest key. Firefox
ships `browser.sidebarAction` and the `sidebar_action` manifest key. The two
APIs cover the same surface but differ in names, permissions, how state is
scoped, and how opening and closing work. Developers who want to support both
have to write two code paths.

At TPAC 2025 the group agreed to unify on a `sidebar` namespace, modeled on the
intersection of the two APIs, and to keep it a separate namespace object from
`sidePanel` and `sidebarAction` (see the
[2025-11-13](../_minutes/2025-11-13-wecg-tpac.md) and
[2025-11-14](../_minutes/2025-11-14-wecg-tpac.md) minutes). At TPAC 2026 the
group also agreed on the `sidebar` manifest key, no permission, the `SIDEBAR`
context type, and setting icons with `setOptions()`. This proposal turns those
decisions into a concrete API.

#### Use Cases

* Show an extension page next to the page the user is viewing, for example an
  assistant, notes, a reader, or a dictionary.
* Show a different panel, or no panel, depending on the tab or the site, and
  keep one panel for everything else.
* Open, close, and toggle the panel from a user action such as a context menu,
  keyboard shortcut, or toolbar click, and know whether it is open.
* Give the sidebar a title and an icon in the browser's sidebar picker (today
  only possible in `sidebarAction`).

### Known Consumers

Both existing APIs have extensions using them; the number has not been
quantified for this proposal.

## Specification

### Schema

```typescript
namespace sidebar {
  // An icon group, as defined in dark_mode_extension_icons.md.
  type IconVariant = { [size: string]: string | ImageData } & {
    colorSchemes?: string[];
  };

  // Where a value is stored. A value can be set at the global level, for a
  // window (windowId), or for a tab (tabId). At most one of tabId/windowId.
  interface SetOptionsDetails {
    tabId?: number;
    windowId?: number;
    // Path of a file in the extension package, relative to the package root.
    // `null` or `""` removes the value at this level.
    path?: string | null;
    // `null` removes the value at this level.
    enabled?: boolean | null;
    // Icon variants for the sidebar. `null` removes the value at this level.
    iconVariants?: IconVariant[] | null;
  }

  interface GetOptionsDetails {
    tabId?: number;
    windowId?: number;
  }

  interface PanelOptions {
    // The full URL of the panel, the extension's base URL followed by the path.
    // Absent if no path is set at any level.
    path?: string;
    // The ID of the tab, present only when the tab has a tab-level panel.
    tabId?: number;
    enabled: boolean;
  }

  // For open(), close(), toggle() and isOpen(). tabId names the tab and
  // windowId names the selected tab of that window. open(), close() and
  // toggle() need at least one of them. With neither, isOpen() uses the
  // selected tab of the current window.
  interface TargetDetails {
    tabId?: number;
    windowId?: number;
  }

  interface SetTitleDetails {
    tabId?: number;
    windowId?: number;
    // `null` removes the value at this level.
    title: string | null;
  }

  interface GetTitleDetails {
    tabId?: number;
    windowId?: number;
  }

  interface PanelBehavior {
    openPanelOnActionClick?: boolean;
  }

  enum Side {
    LEFT = "left",
    RIGHT = "right"
  }

  interface PanelLayout {
    side: Side;
  }

  // Passed to the listeners of onOpened and onClosed.
  interface PanelInfo {
    // The ID of the window that shows the panel.
    windowId: number;
    // The ID of the tab that the panel belongs to. It is present only for a
    // tab-level panel.
    tabId?: number;
    // The full URL of the panel, as returned by getOptions().
    path: string;
  }

  // Methods that change something take a required argument, and
  // `setOptions({})` changes nothing.
  function setOptions(details: SetOptionsDetails): Promise<void>;
  function getOptions(details?: GetOptionsDetails): Promise<PanelOptions>;

  // open() and toggle() require a user gesture.
  function open(details: TargetDetails): Promise<void>;
  function toggle(details: TargetDetails): Promise<void>;

  function close(details: TargetDetails): Promise<void>;

  function isOpen(details?: TargetDetails): Promise<boolean>;

  function setTitle(details: SetTitleDetails): Promise<void>;
  function getTitle(details?: GetTitleDetails): Promise<string>;

  function setBehavior(behavior: PanelBehavior): Promise<void>;
  function getBehavior(): Promise<PanelBehavior>;

  function getLayout(): Promise<PanelLayout>;

  // Fired when a window shows a panel of the extension and the panel has
  // loaded.
  export interface onOpened {
    addListener(callback: (info: PanelInfo) => void): void;
    hasListener(callback: (info: PanelInfo) => void): boolean;
    removeListener(callback: (info: PanelInfo) => void): void;
  }

  // Fired when a window stops showing a panel of the extension, including
  // when another panel replaces it.
  export interface onClosed {
    addListener(callback: (info: PanelInfo) => void): void;
    hasListener(callback: (info: PanelInfo) => void): boolean;
    removeListener(callback: (info: PanelInfo) => void): void;
  }
}
```

The manifest key is:

```json
"sidebar": {
  "default_path": "sidebar.html",
  "default_title": "My sidebar",
  "icon_variants": [
    { "16": "icon16.png", "32": "icon32.png" },
    { "16": "dark16.png", "32": "dark32.png", "color_schemes": ["dark"] }
  ]
}
```

### Behavior

#### Failures

Methods return promises. A method that changes something takes a required
argument, and a method that reads takes an optional one (as decided in
[issue 254](https://github.com/w3c/webextensions/issues/254)). `setOptions`,
`setBehavior`, `setTitle`, `open`, `close` and `toggle` require one, and
`getOptions`, `getTitle` and `isOpen` do not. An absent or `undefined` optional
argument is treated as `{}`, and `setOptions({})` changes nothing. `open`,
`close` and `toggle` also need at least one of `tabId` and `windowId`, so
`open()` throws and `open({})` fails. A call whose required argument is missing,
whose argument is not an object, that lacks a required member, or that has a
member of the wrong type, throws an error synchronously. Every other failure
rejects the returned promise. A member whose value is `undefined` is treated as
absent, and a member whose value is `null` is respected as a value (as decided
in [issue 1124](https://github.com/w3c/webextensions/issues/1124)). A method
fails for a `tabId` or `windowId` that does not identify a tab or window, and
for tabs and windows the extension is not allowed to access. For `setOptions`,
`getOptions`, `setTitle` and `getTitle`, passing both a `tabId` and a `windowId`
fails.

#### Levels and resolution

`path`, `enabled`, the title and the icon can each be set at three levels:
global, window, and tab. At the global level each value starts as the one in the
manifest: `path` from `default_path`, the title from `default_title`, and the
icon from `icon_variants`. `enabled` has no manifest member and starts as
`true`. At the window and tab levels every value starts unset. The effective
value for a tab is the tab-level value if set, otherwise the window-level value
of the tab's window, otherwise the global value, which is the manifest value
until the extension changes it. Each value resolves on its own, so a tab that
only sets `enabled` keeps using the `path` of its window or the global level.
`null` (or, for `path`, the empty string) removes a value at a window or tab
level, so it resolves from the next level. At the global level there is no next
level, so it restores the manifest value, or `true` for `enabled`.

If the manifest has no value and none is set at any level, `path` is unset, so
there is no panel; the title is the extension's name; and the icon is the
extension's own icon (its top-level `icon_variants`, then `icons`), then the
browser's default icon.

The effective options are *usable* if `enabled` is `true` and `path` is a
non-empty string.

A tab has a *tab-level panel* if its `path` is set at the tab level. Every other
tab uses the *window panel* of its window, the panel loaded from the window's
effective options (the window-level value if set, otherwise the global value).

Values are not persisted: they return to their initial values (as defined in the
manifest) when the browser restarts or the extension is updated, disabled, or
reloaded. The exception is the setting from `setBehavior`, which is persisted.
Closing a tab or window removes its values. Moving a tab to another window keeps
its tab-level values and takes the window-level and global values from the new
window. Navigating a tab does not change any value.

#### The sidebar pane

A window has an *open state* for the extension. `open()`, `toggle()` and the
user opening the sidebar turn it on, and `close()`, `toggle()`, the user closing
the sidebar and closing the window turn it off. While it is on, the window shows
one sidebar pane for the extension, and the pane shows the panel that applies to
the window's **selected tab**: the tab's own panel if it has a tab-level panel,
otherwise the window panel, as long as the effective options are usable.

The pane stays open when the user switches tabs, and follows the selected tab.
When the user selects another tab, the pane shows the panel that applies to that
tab, and does not reload if that is the panel it was already showing. Whenever
no panel applies to the selected tab because the options are not usable, the
pane hides and the open state stays on, so the pane returns when a panel applies
again. A `close()`, or the user closing the sidebar in between, turns the open
state off, and the pane does not return. When the user opens the sidebar of an
extension, the panel that opens is the one that applies to the selected tab.

#### Lifetime

A tab-level panel has its own document. The window panel is one document per
window, shared by the tabs of that window that have no tab-level panel. Script
state is not shared between the window panels of different windows, or between a
window panel and a tab-level panel.

The browser creates the document of a panel when the pane first shows the panel.
It may keep the document alive while the pane shows another panel, and it may
discard it, so an extension must not assume that a panel shown again is the same
document. The document of a tab-level panel is discarded when its tab closes,
and the window panel's when its window closes. When the `path` of the panel that
the pane shows changes, the panel navigates to the new path. Like the values
described in Levels and resolution, documents do not survive a restart; the
setting from `setBehavior` is the only part of this proposal that is persisted.

#### Targets

`open`, `close`, `toggle` and `isOpen` act on the panel that applies to a
*target tab*. `tabId` names it, and `windowId` names the selected tab of that
window; `windows.WINDOW_ID_CURRENT` names the current window. `open`, `close`
and `toggle` need at least one of the two, as `sidePanel` does, so that they
depend on the current window only when the extension asks for it. `isOpen` with
neither ID uses the selected tab of the current window. If both IDs are given,
the tab must be in the window. With a `tabId`, `open`, `close` and `toggle` also
require the tab to have a tab-level panel.

#### Methods

* `setOptions(details)` sets the given members at the level chosen by `tabId`,
  `windowId`, or neither (global). A member is changed if it is present with a
  valid value or `null`; absent members are left unchanged. `null` removes a
  value, as described in Levels and resolution. An empty object, or one that
  sets no known member to a valid value or `null`, resolves and changes nothing.
* `getOptions(details)` resolves with the effective `enabled` and, if set,
  `path`, for the tab, the window, or the global level. `path` is the full URL
  of the panel, as `action.getPopup()` returns (issue 1142), not the string that
  was set. It is absent when no path is set at any level. For a tab that has a
  tab-level panel, the result also has its `tabId`, so an extension can tell
  whether a tab has a panel of its own.
* `open(details)` requires a user gesture. It shows the panel that applies to
  the target tab, in that tab's window. It fails if the effective options of the
  target tab are not usable, and if the target tab is not the selected tab of
  its window, because a window shows only the panel of its selected tab. With a
  `tabId` it also fails unless the tab has a tab-level panel, and it does not
  fall back to the window panel, as agreed at TPAC 2025
  ([2025-11-14](../_minutes/2025-11-14-wecg-tpac.md)).
* `close(details)` needs no user gesture. With a `tabId` it fails unless the tab
  has a tab-level panel. It also fails for an invalid ID or a tab that is not in
  the given window. Otherwise it resolves, including when the options are not
  usable: if the target tab is the selected tab of its window, it turns the open
  state of the window off, which hides the pane, and for any other tab it does
  nothing.
* `toggle(details)` requires a user gesture. It hides the pane if it is showing
  the panel that applies to the target tab, and otherwise opens it, as `open`
  does.
* `isOpen(details)` resolves with whether the panel that applies to the target
  tab is showing. For a tab that is not selected, that is true only if the tab
  has no tab-level panel of its own and the window panel is showing.
* `setTitle` / `getTitle` set and read the title at the global, window, or tab
  level. `title: null` removes the value at that level.
* The icon is set with `setOptions({ iconVariants })`, so that it can change
  atomically together with `path` and `enabled`; there is no separate `setIcon`.
  `iconVariants` is as defined in this [proposal](dark_mode_extension_icons.md)
  and in [PR 1134](https://github.com/w3c/webextensions/pull/1134). Unknown
  properties in an icon group are ignored (issue 1119), and a relative path
  resolves against the extension root (issue 1122). `iconVariants: null` removes
  the value at that level. A path that is not a file in the extension package
  fails the call and changes nothing.
* `setBehavior` / `getBehavior`: with `openPanelOnActionClick: true`, activating
  the extension's action toggles the sidebar as `toggle()` does for the
  `windowId` of the tab where the action was activated, instead of showing the
  popup or dispatching the click event. The default is `false`. If the extension
  has no `action` key, the setting applies to the browser's own button for the
  extension, and is ignored in a browser that has none. The setting is persisted
  across restarts, as it is in Chrome.
* `getLayout()` resolves with the side on which the browser shows the sidebar.
  It does not depend on a window and has no setter.

#### Events

`onOpened` fires when a window shows a panel of the extension and the panel has
loaded. It fires again each time the panel is shown, including when the pane
returns after hiding. `isOpen()` can be true before it fires, because it reports
that the panel is showing.

`onClosed` fires when the window stops showing a panel for which `onOpened`
fired:

* the pane is closed;
* another panel replaces it, including the pane swapping to another panel of the
  extension on a tab switch (the pane stays open, but the panel it showed is
  closed);
* the pane hides because no panel applies to the selected tab;
* its tab or window closes.

Neither event fires when the pane stays on the same panel across a tab switch.
The listeners receive a `PanelInfo` object, defined in the schema.

#### Manifest key

* `default_path` is a string, a path in the extension package relative to its
  root. It is the initial value of the global `path`. If it is absent or not a
  string, the browser should report an error and treat the global `path` as
  unset; the key stays in effect and the extension still loads.
* `default_title` is a string. It is the initial value of the global title, and
  the title is the extension's name if it is absent.
* `icon_variants` is an array of icon groups, as defined in this
  [proposal](dark_mode_extension_icons.md) and in
  [PR 1134](https://github.com/w3c/webextensions/pull/1134), with paths in the
  extension package. It is the initial value of the global icon. If it is
  absent, the icon is the extension's own icon.
* A member of the wrong JSON type is ignored, except `default_path` as above.

The `sidebar` key must be an object. Its presence is what exposes the `sidebar`
namespace to the extension. When it is present, it overrides any `side_panel`
and `sidebar_action` declarations in the same manifest, which are ignored.

#### Context type

`runtime.ContextType` gains `SIDEBAR`. `runtime.getContexts()` reports a panel
frame with `SIDEBAR` if and only if the extension's manifest has the `sidebar`
key, and with the existing `SIDE_PANEL` otherwise. Extensions that need to
recognize both values while browsers transition can check for both.

The `windowId`, and for a tab-level panel the `tabId`, that `getContexts()`
reports for a sidebar are being decided in issues
[1076](https://github.com/w3c/webextensions/issues/1076) and
[1081](https://github.com/w3c/webextensions/issues/1081).

### New Permissions

No new permission. There is no developer-facing `sidebar` permission: declaring
the `sidebar` manifest key is what exposes the `sidebar` namespace in the
extension's privileged contexts. This avoids the state, possible in Chromium
today, where an extension has a sidebar UI but no permission to manage it from
JavaScript.

If a capability that needs a user decision is added later, such as managing
another extension's sidebar, it should be gated by its own permission (for
example `sidebar.management`) or a separate API, rather than by attaching a
warning to the manifest key.

In [#631](https://github.com/w3c/webextensions/issues/631), it was suggested
that the permission be required unconditionally if the manifest key is optional,
so that it is clear when a permission is needed. That does not apply here since
the key is the only way to expose the `sidebar` API, so there is no case where
the key is absent and the permission is needed.

### Manifest File Changes

A new optional top-level `sidebar` object with `default_path`, `default_title`
and `icon_variants` (see above). Errors in the key are soft: a bad
`default_path` is reported and treated as unset instead of preventing the
extension from loading. The key is defined for Manifest V3. `open_at_install`
(from `sidebar_action`) is not part of this proposal; see Future Work.

## Security and Privacy

### Exposed Sensitive Data

None. The API exposes the extension's own configuration and the browser's
sidebar side (`getLayout`) and open state.

### Abuse Mitigations

* `open()` and `toggle()` require a user gesture so an extension cannot open UI
  without the user's interaction. `close()` needs none, because it only hides
  UI. `open()` for a tab that is not selected fails, so an extension cannot
  queue UI for a tab the user has not selected.
* `open()` does not change the selected tab.

### Additional Security Considerations

The panel is an extension page in a privileged extension context, with the same
access as other extension pages. `path` is restricted to files in the extension
package (a web site as a panel was proposed in
[#438](https://github.com/w3c/webextensions/issues/438) and was not adopted).
Opening an external page directly as the panel was also requested in
[#128](https://github.com/w3c/webextensions/issues/128) and relates to
[#483](https://github.com/w3c/webextensions/issues/483). It is not part of this
proposal.

## Alternatives

### Existing Workarounds

Developers that want to ship their extension in multiple browsers have to use
`chrome.sidePanel` where it exists or `browser.sidebarAction` otherwise, with
two manifest keys and separate permission handling. The mapping from the
existing APIs:

| `sidePanel` | `sidebarAction` | `sidebar` |
| ----------- | --------------- | --------- |
| `side_panel.default_path` | `sidebar_action.default_panel` | `sidebar.default_path` |
| not available | `default_title` / `default_icon` | `default_title` / `icon_variants` |
| `setOptions({ tabId, path, enabled })` | `setPanel({ tabId, panel })` | `setOptions({ tabId, path, enabled })` |
| (no window level) | `setPanel({ windowId, panel })` | `setOptions({ windowId, path, enabled })` |
| not available | `setTitle` / `getTitle` | same |
| not available | `setIcon` | `setOptions({ iconVariants })` |
| `open({ tabId \| windowId })` | `open()` | `open({ tabId \| windowId })` |
| `close({ tabId \| windowId })` | `close()` | `close({ tabId \| windowId })` |
| not available | `toggle()` | `toggle({ tabId \| windowId })` |
| not available | `isOpen({ windowId })` | `isOpen({ tabId \| windowId })` |
| `setPanelBehavior` / `getPanelBehavior` | not available | `setBehavior` / `getBehavior` |
| `getLayout()` | not available | `getLayout()` |
| `onOpened` / `onClosed` | not available | `onOpened` / `onClosed` |
| `sidePanel` permission | no permission | no permission; the `sidebar` key exposes the API |
| `ContextType.SIDE_PANEL` | `ContextType.SIDE_PANEL` | `ContextType.SIDEBAR` |

Behavior also differs from the existing APIs in these ways:

* `open({ windowId })` opens the panel that applies to the window's selected
  tab. Chrome's `sidePanel` opens the global panel.
* `open({ tabId })` fails for a tab without a tab-level panel, as agreed at TPAC
  2025. Chrome's `sidePanel` opens the global panel.
* `open` and `toggle` fail for a tab that is not selected. Chrome's `sidePanel`
  opens the tab's panel and shows it when the tab is selected.
* `close({ windowId })` resolves when the window panel is not usable. Chrome's
  `sidePanel` rejects, and `sidebarAction` resolves.
* The open state belongs to the window and is remembered while no panel applies.
  Chrome's `sidePanel` keeps it per panel.

### Aliasing

Aliasing `sidebar` to `sidePanel` was discussed at TPAC and the group chose
separate namespace objects (the existing APIs differ too much to alias). Vendors
may still share an implementation underneath.

## Open Questions

* **Title:** whether `setTitle` / `getTitle` should also fold into `setOptions`,
  and how to limit misleading titles (extensions already use `short_name` to
  brand a sidebar as something unrelated).
* **Active Tab:** Does opening the sidebar trigger a user invocation and grant
  `activeTab`?

## Future Work

* `open_at_install`.
* Focus control (#693).
* An `onLayoutChanged` event for changes to the sidebar layout (#948).
* Content scripts in panel frames (#616) and automatic sizing (#692) are tracked
  in their own issues.
