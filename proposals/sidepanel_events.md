# Proposal: New OnClosed and OnOpened events for the sidePanel API

** How to Use This Template **

See [Proposal Process](proposal_process.md) for the detailed process on how to
propose new APIs and use this template.  Each section includes instructions on
what to include.  Delete the instructions for a given section once it's filled
out.  Remove this section once the template is filled out.

**Summary**

Proposal to introduce two new sidePanel lifecycle events that will help developers manage the lifecycle of their extensions

**Document Metadata**

**Author:** [rishikramena-ms](https://github.com/rishikramena-ms)

**Sponsoring Browser:** Microsoft Edge

**Contributors:** &lt;other contributors emails or GitHub handles>

**Created:** 2025-03-11
**Related Issues:** [#752](https://github.com/w3c/webextensions/issues/752)

## Motivation

### Objective

Create new lifecycle events for the chrome.sidPanel API.

- `chrome.sidePanel.onOpened`
- `chrome.sidePanel.onClosed`

These events aim to provide developers with better control and management of the side panel's lifecycle, enabling more efficient resource allocation and improved user experience. By implementing these events, developers can:
- **Monitor Side Panel Activity**: Track when the side panel is opened or closed to optimize performance and resource usage.
- **Enhance User Interactions**: Create more responsive and dynamic extensions that react to the side panel's state changes.
- **Improve Extension Functionality**: Allow extensions to perform specific actions when the side panel is opened or closed, such as saving state or cleaning up resources.

#### Use Cases

- Resource Management:
   - Objective: Optimize resource usage by loading heavy resources only when the side panel is opened.
   - Example: An extension that displays real-time data can start fetching data only when the side panel is opened and stop when it is closed, reducing unnecessary network and CPU usage.

- User Experience Enhancement:
   - Objective: Improve user interactions by providing context-specific content or actions.
   - Example: An extension that offers contextual help can display relevant tips or tutorials when the side panel is opened, enhancing the user's experience based on their current activity.

- State Preservation:
   - Objective: Save the state of the side panel to maintain continuity between sessions.
   - Example: An extension that allows users to take notes can save the current note when the side panel is closed and restore it when reopened, ensuring no data is lost.

- Dynamic Content Updates:
   - Objective: Update content dynamically based on the side panel's visibility.
   - Example: An extension that shows notifications can refresh the list of notifications each time the side panel is opened, ensuring the user always sees the most recent updates.

- Security and Privacy:
   - Objective: Enhance security by clearing sensitive information when the side panel is closed.
   - Example: An extension that handles sensitive data, such as passwords or personal information, can clear this data from the side panel when it is closed to prevent unauthorized access.

- Custom Analytics:
   - Objective: Collect usage data to understand how users interact with the side panel.
   - Example: An extension can log events when the side panel is opened or closed to gather insights into user behavior and improve future versions of the extension.

### Known Consumers

The need for lifecycle events have been expressed by many extension developers. The initial discussion was also started by an extension developer ([link](https://github.com/w3c/webextensions/issues/517)).
There have been many workarounds tried by extension developers to get the state change information for the side panel UI for extensions:
A few of them are listed below:
- https://groups.google.com/a/chromium.org/g/chromium-extensions/c/o1_-Su6DkCI
- https://medium.com/@latzikatz/chrome-side-panel-simulate-close-event-c76081f53b97


## Specification

### Schema

```ts
namespace sidePanel {
  interface Events {
    // Fired when a sidePanel hosted by an extension is triggered to open.
    static void onOpened(
      addListener(callback: () => void): void;
      removeListener(callback: () => void): void;
    )
  
    // Fired when a sidePanel hosted by an extension is triggered to close.
    static void onClosed(
      addListener(callback: () => void): void;
      removeListener(callback: () => void): void;
    )
  }

  // Reason for the side panel open trigger
  export type onOpenedReason = 'user-action' |
'
    
```





Include your API schema here (preferably with a TypeScript interface).  If you
are adding new functionality or fields to an existing method, please be sure to
call out explicitly what has changed.

A few notes:

*   Extension APIs are almost always asynchronous.  In most browsers, extensions
    run in a separate child process for security purposes.  Anything that cannot
    be resolved directly in a child process must be asynchronous, and even if
    something can be done in a child process today, it should frequently be
    asynchronous to prevent future breakage if we move something to the parent
    process.
*   Failures should be indicated by either synchronously throwing an error
    (rare) or rejecting the returned promise.  (Note that in legacy versions,
    this will populate
    [chrome.runtime.lastError](https://developer.chrome.com/extensions/runtime#property-lastError).)
    Do not provide another mechanism of indicating failure (e.g., don't accept
    a failure callback).
*   When practical, prefer accepting objects for input parameters.  This allows
    us to expand APIs in the future in a non-breaking change by adding
    additional optional properties.  Even if you currently only accept one
    property, it often makes sense to wrap this in an object.

### Behavior

Describe the behavior of the new API if there is anything that is not
immediately obvious from the schema above. Include descriptions of:

*   Behavior on the newly-introduced types and methods.
*   Impacted behavior on existing API methods and surfaces, if any.

This does not (yet) need to follow strict spec language; however, the more clear
you can be the better. This helps reduce the number of questions that may arise
during the API review as well as ensure browsers are able to align with one
another.

You may add subsections (e.g., `#### Behavior Section 1` and
`#### Behavior Section 2`) as appropriate to aid in readbility.

### New Permissions

| Permission Added | Suggested Warning |
| ---------------- | ----------------- |
| New Permission 1 | Add a proposed warning string for the permission.  If there should be no warning, provide justification as to why. Browser vendors can ultimately choose if there should be a warning and what it should be independently, but this can be useful to define especially if it has implications for the likelihood this proposal will succeed or be useful to developers. |

Document any new permission added by this API.  Permissions are frequently the
same as the API itself, e.g. the `browser.storage` API has the permission
"storage".

If this is a new API, it should add a new permission.  A new permission does
_not_ always require a new permission warning (though it should frequently have
one).  Adding a permission allows us to statically analyze extensions with
greater accuracy, and avoid exposing unnecessary APIs.

If this is a modification to an existing API, it _may_ require a new permission
if the capabilities it adds are significantly different than the existing
functionality in the API, and not already covered by the permission warning.
Note that this is generally an indication that this might be better as a new
API than a modification to an existing API.  If no new permission is needed,
note why this falls within the current bounds of the API's capabilities.

### Manifest File Changes

Document if your API will require additional manifest fields to be added or
modified (other than a new permission), and what they will do.  If non-trivial,
describe the validation and error handling.  When a failure is not critical,
prefer a soft warning over a hard error.  Hard errors will prevent the extension
from loading, which makes it more challenging to change or expand behavior in
the future.

If there are no new manifest fields, indicate so here.

## Security and Privacy

### Exposed Sensitive Data

Document any sensitive data or personally-identifiable information the API
exposes to the extension.

### Abuse Mitigations

Extension APIs are very frequently powerful and scary (which is one of the
primary reasons they cannot be exposed to the open web).  Highlight any ways
this API could be abused by extensions using it.  These should describe ways
that the API could be potentially abused that are _not_ bugs in the browser.
(For instance, stealing PII that is provided through the API is not a bug in
the browser, but is an avenue for abuse.)

Describe how these scenarios will be mitigated.  Examples include restricting
based on user action, increased attribution, visual disclosure to the user,
etc.

### Additional Security Considerations

Highlight any additional security considerations in the design of this API.
Consider process sandboxing, any input that needs to be sanitized, what can
happen in the case of a compromised process, and other potential attack
vectors.

## Alternatives

### Existing Workarounds

Describe any workarounds that exist today.  If this API did not exist, what
approach could developers take to solve the same use cases?

### Open Web API

Extensions are designed to be "The Web + More", not an alternative to the web.
Additionally, an Open Web API is generally preferred when possible, because
they allow the utility to be shared by extensions, websites, Progressive Web
Apps, and more.

Describe why this API does not belong on the open web.

## Implementation Notes

If there are any significant notes on implementation that are relevant across
browsers, please indicate them here.  (Feel free to add more sections.)

## Future Work

Highlight any planned or prospective future work.
