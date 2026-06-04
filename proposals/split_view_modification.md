# Proposal: Modifying split views

**Summary**

This proposal describes additions to the `tabs` namespace to support
modification of split views.

**Document Metadata**

**Author:** @Rob--W

**Sponsoring Browser:** Mozilla

**Contributors:** N/A

**Created:** 2026-06-04

**Related Issues:** https://github.com/w3c/webextensions/issues/967

## Motivation

### Objective

The Split View feature was introduced before in
[split_tabs_proposal.md](https://github.com/w3c/webextensions/blob/main/proposals/split_tabs_proposal.md),
and specified `splitViewId` in a read-only fashion in some `tabs` APIs.

This proposal specifies the missing operations that extensions need to properly
interface with split views:

- Creating split views
- Joining tabs in a split view
- Separating tabs in a split view

#### Use Cases

Enabling extensions to offer the built-in functionality as documented at:

- https://support.mozilla.org/en-US/kb/split-view-firefox
- https://support.google.com/chrome/answer/16971124

Specifically:

- Creating a split view from an existing tab, which creates a new split view
  consisting of the specified tab, plus a browser-native UI page where the user
  can choose the tab to adopt in that split.

- Creating a split view from two existing tabs, putting two splits together.

- Separating split views.

- Reversing tabs in a split view.

### Known Consumers

Tab managers, offering tab management functionality through a custom UI, e.g.:

- [Tree Style Tabs](https://addons.mozilla.org/firefox/addon/tree-style-tab/),
  tracked at https://github.com/piroor/treestyletab/issues/3806
- [Sidebery](https://addons.mozilla.org/firefox/addon/sidebery/), tracked
  at https://github.com/mbnuqw/sidebery/issues/2327

Any extension that wants to open to a split view, e.g. requested at
 https://issues.chromium.org/issues/510252106

## Specification

### Schema

```javascript
browser.tabs.create({
  // ... existing properties, including: url, index, active
  splitWithTabId: number,   // Existing tab to pair with
}) : Promise<Tab>           // Returns new tab in split with given tab

browser.tabs.createSplitView(
  tabIds: Array<number>     // Two tabIds.
) : Promise<number>         // Returns splitViewId

browser.tabs.separateSplitView(splitViewId) : Promise<void>
```


### Behavior

#### tabs.create() with splitWithTabId option

First, validate the options and ensure that it would create a tab next to the
tab specified by `splitWithTabId`. The method SHOULD reject if it cannot create
a split view (see createSplitView). If a tab was created, the created tab must
be returned as usual, even if the split view cannot be created.

The returned `Tab.splitViewId` MUST reflect whether the tab successfully joined
the split view.

Tabs in a split view are neighbors of each other, and as such the new tab MUST
be adjacent to the specified `splitWithTabId`. The `index` property affects the
relative positioning:
- `index` unspecified - default behavior, create tab at the right.
- `index` set to index of `splitWithTabId` - create tab at the left.
- `index` set to index of `splitWithTabId` plus one - create tab at the right.
- Generally, if index is set to a position within the same split view, the new
  tab is created at that position. (this clause covers a hypothetical future
  where browsers support more than two tabs in a split view).
- Any other `index` is rejected, because they fail to meet the requirement of
  the tabs being neighbors.

If `url` is not specified, the browser MAY open a custom split view-specific
page instead of the default new tab page.


#### tabs.createSplitView()

Requires a pair of tabIds referring to distinct tabs, rejects otherwise.

If the two tabs are already part of the same split view, the implementation MAY
return the existing split view ID.

If either tab is ineligible for joining the split, reject the call. Tabs can be
ineligible for joining a split view for various reasons, including:
- mismatching "pinned" states
- mismatching "groupId" states
- mismatching "splitViewId" states
- mismatching "windowId" states

At the bare minimum, two eligible tabs, with tabIds specified in order, should
be able to join a split view, reflected in `Tab.splitViewId` and two
`tabs.onUpdated` events.

When tabs are not adjacent, or even in order, the implementation MAY try to
move the tabs to the given order and join them.

Upon returning, either the given tabs are in the same split view, or the method
rejects without having changed the tab state.


#### tabs.separateSplitView()

Separates the tabs in a split view, "unsplitting" the split view.

Rejects if `splitViewId` does not refer to a valid split view, or if the split
view cannot be removed.

Upon separation, the tabs' `splitViewId` changes to `SPLIT_VIEW_ID_NONE`, and
returns successfully.


#### tabs.move

`tabs.move` does not receive new options, but is worth mentioning due to their
potential impact on split views. The defining characteristic of a Split view is
the adjacency and coupling of (two) tabs.

The `tabs.move` method is specified to move one or more tabs, to end at the
position given by `index`. This expectation is not always compatible with the
request of moving a split view.

If the `index` behavior of `tabs.move` weighs more strongly, then the move of
tabs MAY separate tabs automatically.

Browsers that treat split views as one unit MAY move multiple tabs, exposed via
`tabs.onMoved`, `tabs.onDetached`, `tabs.onAttached` as needed. In that case,
the `index` specifies the desired position of the split view after moving.


### New Permissions

No new permissions. This expands the existing `tabs` namespace, which itself
does not have any permission requirements for tab management operations.

### Manifest File Changes

No manifest.json changes.

## Security and Privacy

### Exposed Sensitive Data

Does not expose sensitive data.

### Abuse Mitigations

N/A

### Additional Security Considerations

N/A

## Alternatives

### Existing Workarounds

`tabs.move` with a list of tabIds can be interpreted as a way to intentionally
re-arrange tabs, and separating tabs as a consequence.

There are no existing mechanisms for extensions to create new split views.

### Open Web API

Tab management is outside the scope of the web platform.

## Implementation Notes

If there are any significant notes on implementation that are relevant across
browsers, please indicate them here.  (Feel free to add more sections.)

## Future Work

The `tabs.createSplitView` method could take an additional `options` object to
enable additional behaviors, such as the relative size.

The `tabs.createSplitView` method is forwards-compatible with the possibility
of a split view having more than two tabs.
