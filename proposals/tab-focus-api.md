# Proposal: Focus management API

**Summary**

Allow extensions to change focus between browser-provided web UI surfaces with a new protected runtime API.

**Document Metadata**

**Author:** @dotproto

**Sponsoring Browser:** TBD

**Contributors:** \<other contributors emails or GitHub handles\>

**Created:** 2025-04-24

**Related Issues:**

* [Issue 693](https://github.com/w3c/webextensions/issues/693): Add API to switch focus from sidePanel to main document to enable accessibility features

## Motivation

### Objective

The **primary objective** of this proposal is to provide extensions with a way to move focus between the main browsing context in a tab and an extension’s sidebar.

A **secondary objective** is to establish an extensible interface to manage focus within a user agent.

#### Use Cases

##### Transitioning between multiple UI surfaces during a workflow

Allow users to trigger an extension feature in a secondary UI surface and immediately have subsequent interactions take place in the main browsing context of a document.

For example, an extension could respond to a user clicking a button in the extension's sidebar by focusing the main document and using web platform APIs to focus an input element within that document. This in turn allows the user’s subsequent keyboard input to occur within the main document as the user expects.

### Known Consumers

Extensions that want to bridge user flows between the sidebar and web page in a given tab. Specific extensions that have indicated they will adopt this capability when available include:

* Tango - [https://tango.ai](https://tango.ai)

## Specification

### Schema

#### TypeScript Definition

```javascript
declare namespace browser.tabs {
  /* METHODS */
  export function focus(options: FocusOptions): Promise<FocusResponseCodeValue>;

  /* PROPERTIES */
  export enum FocusArea {
    main = 'main',
    sidebar = 'sidebar',
  }

  export enum FocusResponseCode {
    success = 'success',
    invalid = 'invalid',
    unsupported = 'unsupported',
    unavailable = 'unavailable',
  }

  /* TYPES */
  export interface FocusOptions {
    windowId?: number;
    tabId?: number;
    area: FocusAreaValue;
  }

  export interface FocusResponse {
    code: FocusResponseCodeValue;
    message?: string;
  }

  // The following types map a given string enum to a union of it's values. This
  // allows us to work around one of the limitations of TypeScript enums:
  // literals that strictly equal an enum's value cannot be used in places that
  // expect the enum. For example:
  //
  //   enum Shape { square = 'square' };
  //   declare function isShape(shape: Shape): void;
  //   isShape('square');
  //   // Error: Argument of type '"square"' is not assignable to parameter of
  //   // type 'Shape'.(2345)
  export type FocusAreaValue = `${FocusArea}`;
  export type FocusResponseCodeValue = `${FocusResponseCode}`;
}
```

#### tabs.focus()

Makes a request to the user agent to focus the area of the user interface specified by the `options` parameter.

At least one of the optional properties must be specified. When multiple properties are specified, all properties must be valid and the combined set of properties must match a focusable surface in the user agent that the extension is allowed to access. If they do not, the promise returned by this method will be reject with an appropriate error.

##### `options`

**Type:** `FocusOptions`

Required. An object that specifies which portion of the agent’s user interface should receive focus.

###### `windowId`

**Type:** `number`

Optional. The ID of the window associated with the UI surface being targeted. If omitted, fall back to the most recently focused window accessible to the extension.

###### `tabId`

**Type:** number

Optional. The ID of the tab associated with the UI surface being targeted. If omitted, fall back to the most recently focused window accessible to the extension.

###### `area`

**Type:** `tabs.FoucsArea`

Optional. The UI surface associated with a given window and tab to focus. If omitted, fall back to `tabs.FocusArea.main`.

##### Return value

**Type**: Promise\<undefined\>

The returned promise rejects in the following scenarios:

If the provided set of ID properties (`windowId`, `tabId`, etc.) do not resolve to a concrete focusable area, the promise MUST be rejected with a `ReferenceError()`. The agent SHOULD set a human readable error message that specifies which reference(s) were invalid.

If the caller provides an `area` value that is not exposed on `tabs.FocusArea`, the promise MUST reject with a `TypeError`. The error’s `message` SHOULD identify the invalid area specified.

#### tabs.FocusArea

**Type:** Enumeration (string)
Defines the set of areas (sub-regions) of an agent’s user interface that can be focused by an extension.

`main` (value: `"main"`) – The content area of a given window and tab combination. This area is used to display the web page tab. In user agents that support multiple documents per tab, this value refers to the primary or first document in the tab.

`sidebar` (value: `"sidebar"`) – The extension’s `sidePanel` or `sidebarAction` page. The extension’s sidebar page for a given window and tab. When focusing this area, the extension's sidebar will be activated if it is open. If not, the focus() call will fail.

#### tabs.FocusResponse

**Type:** Object

### Behavior

If the user agent does not support an area, does not allow the area to be focused, or the area is disabled by the user’s UI settings, \`focus()\` calls targeting the area will fail.

### New Permissions

No permissions changes are in scope for this initial proposal.

Future iterations on focus management capabilities may warrant the introduction of a permission with a warning. See Security and Privacy for details.

### Manifest File Changes

N/A

## Security and Privacy

Focus management presents a moderate risk to end users. While changing the user agent’s current focus does not grant access to any data in itself, it greatly increases the risk that a user will perform an unintended action. When combined with [user activation](https://html.spec.whatwg.org/multipage/interaction.html#tracking-user-activation), this capability can be used to receive escalated permissions or to perform a restricted operation without the user’s express permission.

As such, this proposal intentionally does not entertain the possibility of allowing extensions to focus user agent UI surfaces such as an extension’s action button. When considering future expansion of focus management capabilities, the authors recommend gating the ability to focus dangerous such UI surfaces behind a permission with a warning.

### Exposed Sensitive Data

N/A

### Abuse Mitigations

N/A

### Additional Security Considerations

The current design of this proposal allows extensions to infer stateful information about the user agent that is possible otherwise (I think?). For example, if the sidebar cannot be focused because the user agent is currently prompting the user with an uninterruptable modal, the `focus()` call will reject and the error returned will indicate that the target area is currently unavailable.

## Alternatives

### Existing Workarounds

N/A

### Open Web API

The web has two relevant mechanisms for managing focus on a website: the [HTMLOrSVGElement](https://html.spec.whatwg.org/multipage/dom.html#htmlorsvgelement) [focus()](https://html.spec.whatwg.org/multipage/interaction.html#dom-focus) method and the [Window](https://html.spec.whatwg.org/multipage/nav-history-apis.html#window) [focus()](https://html.spec.whatwg.org/multipage/interaction.html#dom-window-focus) method. The former is used to control focus within a page while the latter is used to move focus between HTML documents. As mentioned [in a note](https://html.spec.whatwg.org/multipage/interaction.html#focus-management-apis:dom-window-focus) under the definition of the Windows interface’s focus() and blur() algorithms:

> Historically, the focus() and blur() methods actually affected the system-level focus of the system widget (e.g., tab or window) that contained the navigable, but hostile sites widely abuse this behavior to the user's detriment.

Today, a web page’s ability to move focus between documents is limited to moving focus from a parent window to a child window in response to a user activation.

### Modify Web APIs

The [HTML specification](https://html.spec.whatwg.org/multipage/interaction.html#dom-window-focus) notes that, “historically, the \[\] `focus()` and `blur()` methods actually affected the system-level focus of the system widget (e.g., tab or window) that contained the [navigable](https://html.spec.whatwg.org/multipage/document-sequences.html#navigable), but hostile sites widely abuse this behavior to the user's detriment.”

An alternative approach would be to restore this historical behavior for `window` instances exposed to extension extension contexts. This could either be granted to all extensions contexts or limited to secure contexts. Both approaches have notable drawbacks.

WRITING NOTES:

Unprivileged contexts - capability would need to be exposed in the page’s process. Primarily enables attacks annoyance, but capability was removed from the open web for a reason.

Only privileged contexts - less consonant developer experience, more difficult to use correctly.

## Implementation Notes

N/A

## Future Work

### Ancillary UI surfaces

THere are other notable UI surfaces that are extensions are not currently able
to focus such as the user agent’s address bar or bookmarks bar. If so desired,
`FocusArea` could be expanded to support these surfaces.

### New UI surfaces

As user agent interfaces and their affordances for extensions evolve, it may become necessary to expand the set of focusable UI surfaces supported by `FocusArea`. For example, if more browsers add support for the concept of a “split view” (displaying multiple web pages in a single tab), we may need to introduce a mechanism of selecting between `”main”`areas in a given tab.

### Additional `FocusOptions` targeting properties

In addition to the current `windowId` and `tabId` properties, it may be desirable to support other common methods of targeting document content, namely `frameId` and  `documentId`. These were omitted from the initial draft in part because it was not immediately clear how to distinguish between a desire to focus a specific sub-frame and simply focusing the page itself.
