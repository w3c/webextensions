# New API: runtime.getContexts()

## Background

Chromium currently has the
[`extension.getViews()`](https://developer.chrome.com/docs/extensions/reference/extension/#method-getViews)
API method that allows an extension to get information about the "views" that
are active for the extension. A "view" in this context is any HTML frame in the
extension's process that commits to the extension origin; this may not be all
the extension owns, such as in the case of incognito-mode frames. The returned
values are a set of `HTMLWindow` objects, which the extension has permission to
reach directly into (as they are same-origin).

Some common reasons for calling this method are: determining if a toolbar
popup, tab, or options page is open; directly interacting with those pages by
reaching into their `HTMLWindow`; etc.

Chromium's implementation of Manifest V2 (MV2) allows for
[background pages](https://developer.chrome.com/docs/extensions/mv2/background_pages/)
to call this API. This is possible because these pages are themselves an
extension frame (albeit one that isn't visibly rendered) and run on the main
thread of the renderer; this allows them easy access to the JavaScript
[`Window`](https://developer.mozilla.org/en-US/docs/Web/API/Window#instance_properties)
objects provided by `extension.getViews()`.

## Problem

With the migration to Manifest V3 (MV3), background pages
[no longer exist](https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/);
instead, an extension's background context is
[service worker](https://developer.chrome.com/docs/workbox/service-worker-overview/)-based.
For technical reasons<sup>[1](#footnotes)</sup>, service workers cannot access
the [`Window`](https://developer.mozilla.org/en-US/docs/Web/API/Window#instance_properties)
objects that `extension.getViews()` provides and it is not feasible to
implement that with our browser design. Due to this, we cannot provide access
to the JavaScript context for these views, but we can allow an extension to
query for them (determining if they exist) and target them for messaging
purposes.

## Solution

Considering the above situation, we'd like to propose a new extension API
method, `runtime.getContexts()`, to asynchronously provide metadata about
associated contexts that is still useful for an extension. A "context" here is
considered an environment running the extension's code; the contexts we will
consider are described in more detail in later sections. This will allow
extension background scripts to identify the active contexts in the extension.
For example, this can be used to target messages to send using
[`runtime.sendMessage()`](https://developer.chrome.com/docs/extensions/reference/runtime/#method-sendMessage),
etc.). Introducing this API will allow an easier migration from MV2.

This also obviates the need for introducing multiple one-off APIs, such as
separate APIs to query for the extension popup, offscreen documents, etc.

## API Proposal

This method will return an array of matching contexts, represented by a new
`ExtensionContext` type. This will be defined as:

```js
runtime.ExtensionContext = {
  // Context type -- tab, popup, etc.
  contextType: ContextType,
  // A unique identifier for this context.
  contextId: string,
  // ID of the tab for this context, or -1 if this context is not hosted in a
  // tab.
  tabId: int,
  // ID of the window for this context, or -1 if this context is not hosted in a
  // window.
  windowId: int,
  // ID of the DOM document for this context, or undefined if this context is
  // not associated with a document.
  documentId?: string,
  // ID of the frame for this context, or -1 if this context is not hosted in a
  // frame.
  frameId: int,
  // The current URL of the document, or undefined if this context is not
  // hosted in a document.
  documentUrl?: string,
  // The current origin of the document, or undefined if this context is not
  // hosted in a document.
  documentOrigin?: string,
  // Whether the context is for an incognito profile.
  incognito: boolean,
}
```

`ContextType` will indicate the type of context retrieved. It is an enum
defined as:

```js
extension.ContextType = {
  // Tabs the extension is running in.
  TAB: 'TAB',
  // Toolbar popups created by the extension.
  // TODO: Should this be `TOOLBAR_POPUP` to avoid ambiguity with web popup
  // windows? Or perhaps `ACTION_POPUP` to avoid tying it to a particular UI
  // surface?
  POPUP: 'POPUP',
  // The background context for the extension (in Chromium, the extension
  // service worker).
  BACKGROUND: 'BACKGROUND',
  // Offscreen documents for the extension.
  OFFSCREEN_DOCUMENT: 'OFFSCREEN_DOCUMENT',
  // A side panel context. Currently under development in Chromium.
  SIDE_PANEL,
};
```

This enum will be expanded in the future as more context types are added.

The method signature will be defined as:

```js
runtime.getContexts(
  filter?: ContextFilter
): Promise<ExtensionContext[]>;
```

A `ContextFilter` will be defined as:

```js
runtime.ContextFilter = {
  contextTypes?: ContextType[],
  contextIds?: string[],
  tabIds?: int[],
  windowIds?: int[],
  documentIds?: string[],
  frameIds?: int[],
  documentUrls?: string[],
  documentOrigins?: string[],
  incognito?: boolean,
}
```

This type will be used to query for specific contexts. For each array property,
a given `ExtensionContext` matches if it matches any properties within the
array. If a property is undefined, all contexts match; thus, a filter of `{}`
matches all available contexts. Note that `incognito`, as a boolean, is not an
array (because to match both `true` and `false`, it is simply omitted).

As examples:
* `{}` matches all available contexts.
* `{incognito: false}` matches all non-incognito contexts.
* `{contextTypes: ['TAB', 'POPUP']}` matches any `ExtensionContext` that is
  either a tab or a popup.
* `{contextTypes: ['TAB'], tabIds: [1, 2, 3]}` matches any `ExtensionContext
  that is a tab where that context is in a tab with the ID `1`, `2`, or `3`.
* `{contextTypes: ['OFFSCREEN_DOCUMENT'], tabIds: [1, 2, 3]}` would inherently
  match no contexts, since no offscreen documents are not hosted in tabs and
  thus cannot match.

### Additional Considerations

#### Context ID

Each extension context will have a unique context ID, represented by a string.
This is necessary to uniquely identify a context, since other fields may be
non-unique (such as URL) or absent (such as documentId).

The `contextId` is unique and persistent for the lifetime of a context.  For
contexts associated with a document, this means `contextId` behaves like
`documentId`. For service worker contexts, the `contextId` is unique for the
duration of the service worker context (but will be different across service
worker restarts).

#### Document Properties

Document-related properties (`documentId`, `documentUrl`, `documentOrigin`)
refer to the document associated with this context. For extension documents
(such as tabs, popups, and offscreen documents), these will point to the
extension (e.g., `chrome-extension://<id>/popup.html`). If/when we add support
for content scripts, this will be the document the script is injected within.
For service workers (which have no document), these are undefined.

#### Frames

`ContextType` refers to the overall embedder for a context; for instance,
`ContextType.TAB` will be used for any context associated with a tab. This
includes subframes and cached frames. Developers can determine the finer
grained state of these via other properties, such as `frameId`.

#### Incognito mode

[Split-mode](https://developer.chrome.com/docs/extensions/mv3/manifest/incognito/#split)
extensions will _not_ have access to the contexts from their corresponding
profile. That is, the incognito extension process will not be able to access
contexts from the non-incognito extension process, and vice versa.

For spanning-mode extensions, most contexts are accessible. Due to differences
in browser architecture, exact details about whether incognito contexts (such as
iframes in incognito pages) for spanning mode extensions are left as an exercise
to the implementor.

#### Sandboxed Pages

Sandboxed pages will not be included in the returned contexts. They are on a
separate origin (`"null"`) and do not have access to extension APIs.

#### TOCTOU

Time-of-Check vs Time-of-Use (TOCTOU) issues are an unavoidable aspect of this
API, given its asynchronous nature. An extension may call `getContexts()` and,
by the time it receives the result, the values (such as available contexts or
URLs of those contexts) may be different.

This is something extension developers already need to worry about with any
asynchronous API. API calls should handle references to non-existent contexts
gracefully, and extension developers can leverage concepts like `documentId`
(which is updated when a frame navigates, allowing extensions to identify if a
given context is the same as when they queried it).

#### Naming

*   *ContextType*: While there already exist more "Context" references in APIs
    (such as `ContextType` on the `contextMenus` API), the namespace (`runtime`)
    helps differentiate these.
*   *`documentUrl` et al*: We use `documentUrl` on contexts (as opposed to
    `url`) to indicate the URL is that of the document associated with the
    context. This is relevant for cases where there may not be a document URL
    (such as service workers) and allows for potential future expansion where
    other URLs (such as script URLs) may exist.

#### Default / Absent Values

There is an inconsistency in how we represent a value for a context that doesn't
have the associated trait, such as a `tabId` or `documentId` for an extension's
background service worker context (which has neither an associated tab nor
document). Some of these values -- `tabId`, `windowId`, and `frameId` -- use
constant values to indicate "no state", such as `-1` for `tabId`. Others --
`documentId`, `documentUrl`, and `documentOrigin` -- use undefined to indicate
this.

This is an artifact of existing APIs and precedence. Since many existing APIs
use the constant integer values, we want to be consistent with those. However,
for newly-introduced fields, we use the more intuitive `undefined` state.

## Future Work

### Messaging APIs Support `ContextId`s as Target

In practice, many extension messages are meant for a single target, but are
broadcast to all extension contexts. With the ability to uniquely identify a
single extension context, we will modify messaging APIs (such as
`runtime.sendMessage()` and `runtime.connect()`) to allow specifying specific
targets that should receive a message.

### Multi Page Architecture Fields (`DocumentLifeCycle`, `FrameType`, and `parentDocumentId`, and `parentFrameId`)

[Multi Page Architecture](https://docs.google.com//1NginQ8k0w3znuwTiJ5qjYmBKgZDekvEPC22q0I4swxQ#heading=h.w1qo2n6sr8wn)
caused
[multiple changes](https://developer.chrome.com/blog/extension-instantnav/) to
Chromium's
[tabs API](https://developer.chrome.com/docs/extensions/reference/tabs/),
[scripting API](https://developer.chrome.com/docs/extensions/reference/scripting/),
and
[web navigation API](https://developer.chrome.com/docs/extensions/reference/webNavigation/).

Among these changes are the additions of `DocumentLifecycle`, `FrameType`, and
`parentDocumentId`. If there is sufficient demand, we can consider adding these
fields to the `ExtensionContext` type.

### runtime.getCurrentContext()

We would like to provide an additional API, `runtime.getCurrentContext()`, to
return the calling context.

### Content Script Contexts

[Content scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
run in a separate
[Renderer](https://developer.chrome.com/blog/inside-browser-part3/) (and
process) from the extension process. In this first version of the API, we will
not include these contexts due to the complexity it entails. However, we would
like to add these contexts in the future.

With the content script additions, we may add new fields to `ExtensionContext`,
such as `scriptUrl` (to indicate the content script's source).

### Dev Tools Contexts

Extensions can use the
[Dev Tools API](https://developer.chrome.com/docs/extensions/mv3/devtools/] to
extend the browser's developer tools. When doing so, these extensions can have
a panel (an extension view) within the developer tools console. These views
are a little different than others, though -- in Chromium, they commit to a
different origin (one with a devtools:-scheme). These are also not currently
returned from `chrome.extension.getViews()`. In the future, we will expand
`runtime.getContexts()` with devtools context types to accommodate these.

## Footnotes

<sup>1</sup>: Non-main threads in a
[Renderer](https://developer.chrome.com/blog/inside-browser-part3/) (where
service workers run in Chromium) cannot access DOM concepts directly (they are
only accessible from the main renderer thread). Service workers thus cannot
synchronously access the JavaScript
[`Window`](http://go/mdn/API/Window#instance_properties) objects provided by
`extension.getViews()`. Supporting this access would take engineering years to
change, and is likely undesirable due to the complexity and considerations it
would introduce (threading and locking, slowing down main thread execution).
