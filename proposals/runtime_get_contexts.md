# New API: runtime.getContexts()

## Background / Summary

Chromium currently has the
[`extension.getViews()`](https://developer.chrome.com/docs/extensions/reference/extension/#method-getViews)
API method that allows an extension to get information about the "views" that
are active for the extension. A "view" in this context is any HTML frame in the
extension's process that commits to the extension origin; this may not be all
the extension owns, such as in the case of incognito-mode frames. The returned
values are a set of HTMLWindow objects, which the extension has permission to
reach directly into (as they are same-origin).

Some common reasons for calling this method are: determining if a toolbar
popup, tab, or options page is open; directly interacting with those pages by
reaching into their HTMLWindow; etc.

Chromium's implementation of Manifest V2 (MV2) allows for
[background scripts (pages)](https://developer.chrome.com/docs/extensions/mv2/background_pages/)
to call this API. This is possible because these scripts are themselves an
extension frame (albeit one that is offscreen) and run on our main thread
which allows them easy access to the JavaScript
[`Window`](http://go/mdn/API/Window#instance_properties) objects provided by
`extension.getViews()`.

## Problem

However, with Chromium's migration to Manifest V3 (MV3), background pages
[no longer exist](https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/);
instead, an extension's background context is
[service worker](https://developer.chrome.com/docs/workbox/service-worker-overview/)-based.
For technical reasons<sup>[1](#footnotes)</sup>, service workers cannot access
the [`Window`](http://go/mdn/API/Window#instance_properties) objects that
`extension.getViews()` provides and it is not feasible to implement that with
our browser design. Due to this we cannot provide access to the JavaScript
context for these views, but we can allow an extension to query for them
(determining if they exist) and target them for messaging purposes.

## Solution

Considering the above situation, we'd like to propose a new extension API
method, `runtime.getContexts()`, to asynchronously provide metadata about the
view that is still useful for an extension. This will allow extension
background scripts to identify the active contexts in the extension. For
example, this can be used to target messages to send using
[`runtime.sendMessage()`](https://developer.chrome.com/docs/extensions/reference/runtime/#method-sendMessage),
etc.). Introducing this API will allow an easier migration from MV2.

This also obviates the need for introducing multiple one-off APIs, such as
separate APIs to query for the extension popup, offscreen documents, etc.

## API Proposal

This method will return an array of matching contexts, represented by a new
`ExtensionContext` type. This will be defined as:

```
runtime.Context = {
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

```
extension.ContextType = {
  // Tabs the extension is running in.
  TAB: 'TAB',
  // Toolbar popups created by the extension.
  POPUP: 'POPUP',
  // The background context for the extension (in Chromium, the extension
  // service worker).
  BACKGROUND: 'BACKGROUND',
  // Offscreen documents for the extension.
  OFFSCREEN_DOCUMENT: 'OFFSCREEN_DOCUMENT',
};
```

The method signature will be defined as:

```
runtime.getContexts(
  filter?: ContextFilter
): Promise<ExtensionContext[]>;
```

The `filter` argument will be used to filter down to a particular type of
context. It will share the same properties as `ExtensionContext`, but will
have all fields be optional. Any omitted field matches all available contexts.

### Additional Considerations

#### Context ID

Each extension context will have a unique context ID, represented by a string.
This is necessary to uniquely identify a context, since other fields may be
non-unique (such as URL) or absent (such as documentId).

Like `documentId`s, the extension `contextId` will update on (non-same-page)
navigation.

#### Incognito mode

[Split-mode](https://developer.chrome.com/docs/extensions/mv3/manifest/incognito/#split)
extensions will _not_ have access to the contexts from their associated profile.
That is, the incognito extension process will not be able to access contexts
from the non-incognito extension process, and vice versa.

#### Sandboxed Pages

Sandboxed pages will not be included in the returned contexts. They are
a separate origin (`"null"`) and do not have access to extension APIs.

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

## Future Work

### Messaging APIs Support `ContextId`s as Target

Many extension messages are meant for a single target, but are broadcast to all
extension contexts. With the ability to uniquely identify a single extension
context, we will modify messaging APIs (such as `runtime.sendMessage()` and
`runtime.connect()`) to allow specifying specific targets that should receive
a message.

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

## Footnotes

<sup>1</sup>: Non-main threads in a
[Renderer](https://developer.chrome.com/blog/inside-browser-part3/) (where
service workers run in Chromium) cannot access DOM concepts directly (they are
only accessible from the main browser thread). Service workers run in these
threads therefore they do not have access to the JavaScript
[`Window`](http://go/mdn/API/Window#instance_properties) objects provided by
`extension.getViews()`. Supporting this access is likely years of software
engineer work to implement.
