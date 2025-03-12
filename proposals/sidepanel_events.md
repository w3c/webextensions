# Proposal: New OnClosed and OnOpened events for the sidePanel API

**Summary**

Proposal to introduce two new sidePanel lifecycle events that will help developers manage the lifecycle of their extensions

**Document Metadata**

**Author:** [rishikramena-ms](https://github.com/rishikramena-ms)

**Sponsoring Browser:** Microsoft Edge

**Contributors:** 

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

```Typescript
namespace sidePanel {
  // Reason for the side panel open trigger.
  enum onOpenedReason {
      USER_ACTION,
      PROGRAMMATIC
  }
  // Reason for the side panel close trigger.
  enum onClosedReason {
      USER_ACTION,
      PROGRAMMATIC,
      NEW_SIDE_PANEL_OPENED
  }

  interface Events {
    // Fired when a sidePanel hosted by an extension is triggered to open.
    static void onOpened(
      addListener(callback: (reason: onOpenedReason) => void): void;
      removeListener(callback: (reason: onOpenedReason) => void): void;
    )
  
    // Fired when a sidePanel hosted by an extension is triggered to close.
    static void onClosed(
      addListener(callback: (reason: onClosedReason) => void): void;
      removeListener(callback: (reason: onClosedReason) => void): void;
    )
  }
```

### Behavior

Described as code comments in schema.

### New Permissions

No new permissions needed. However, the existing `sidePanel` permission to use the `chrome.sidePanel` API will be needed. 

### Manifest File Changes

No manifest file changes.

## Security and Privacy

No new security or privacy concerns are expected to be introduced.

### Exposed Sensitive Data

No sensitive user data exposed.

### Abuse Mitigations

Since this proposal just adds events to an existing API, we do not see any abusive usage concerns.

### Additional Security Considerations

None.

## Alternatives

### Existing Workarounds
- https://groups.google.com/a/chromium.org/g/chromium-extensions/c/o1_-Su6DkCI
- https://medium.com/@latzikatz/chrome-side-panel-simulate-close-event-c76081f53b97
### Open Web API

Not applicable to the open web.

## Implementation Notes

N/A

## Future Work

N/A
