# Proposal: New onClosed and onOpened events for the sidePanel API

**Summary**

Proposal to introduce two new lifecycle events that will help developers manage the lifecycle of the side panel of their extensions

**Document Metadata**

**Author:** [rishikramena-ms](https://github.com/rishikramena-ms)

**Sponsoring Browser:** Microsoft Edge

**Contributors:** 

**Created:** 2025-03-11

**Related Issues:** [#752](https://github.com/w3c/webextensions/issues/752), [#517](https://github.com/w3c/webextensions/issues/517)

## Motivation

### Objective

Create new lifecycle events for the chrome.sidePanel API.

- `chrome.sidePanel.onOpened`
- `chrome.sidePanel.onClosed`

These events aim to provide developers with better control and management of the side panel's lifecycle.

#### Use Cases

- User Experience Enhancement:
   - Objective: Improve user interactions by providing context-specific content or actions.
   - Example: An extension that offers contextual help can display relevant tips or tutorials when the side panel is opened, enhancing the user's experience based on their current activity. Although this can be achived in other ways, but having a dedicated event will make using it simpler.

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

```typescript
namespace sidePanel {

  // An object that represents the side panel open info. This is used for 
  // passing the information of the side panel context to the event listeners.
  dictionary PanelOpenInfo {
    // The window associated with the side panel.
    long windowId;

    // The tab associated with the side panel. This is only set if there is a
    // tab-specific panel.
    long? tabId;

    // The path to the side panel HTML file in use.
    DOMString path;
  };

  // An object that represents the side panel close info. This is used for 
  // passing the information of the side panel context to the event listeners.
  dictionary PanelCloseInfo {
    // The window associated with the side panel.
    long windowId;

    // The tab associated with the side panel. This is only set if there is a
    // tab-specific panel.
    long? tabId;

    // The path to the side panel HTML file in use.
    DOMString path;
  };

  interface Events {
    // Fired when a sidePanel hosted by an extension is triggered to open.
    static void onOpened(
      addListener(callback: (info: PanelOpenInfo) => void): void;
      hasListener(callback: (info: PanelOpenInfo) => void): void;
      removeListener(callback: (info: PanelOpenInfo) => void): void;
    );
  
    // Fired when a sidePanel hosted by an extension is triggered to close.
    static void onClosed(
      addListener(callback: (info: PanelCloseInfo) => void): void;
      hasListener(callback: (info: PanelCloseInfo) => void): void;
      removeListener(callback: (info: PanelCloseInfo) => void): void;
    );
  };
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

Developers are using the `runtime.connect()` method to create a long lived channel from the side panel script and listening to the `onDisconnect` event from the service worker.
References:
- https://groups.google.com/a/chromium.org/g/chromium-extensions/c/o1_-Su6DkCI
- https://medium.com/@latzikatz/chrome-side-panel-simulate-close-event-c76081f53b97
### Open Web API

Not applicable to the open web.

## Implementation Notes

### Open for discussions:
- Should we also have trigger reasons for the onClosed and onOpened events? A sample schema for the reasons is given below.
   ```typescript
   namespace sidePanel {
     // Reason for the side panel open trigger.
     enum onOpenedReason {
         USER_ACTION,
         PROGRAMMATIC,
     }
     // Reason for the side panel close trigger.
     enum onClosedReason {
         USER_ACTION,
         PROGRAMMATIC,
         NEW_SIDE_PANEL_OPENED,
         TAB_CLOSED
     }
   }
   ```
- Would adding onHidden, onShown or onVisibilityChanged events for side panel extensions make sense too?
- Should we provide granular controls for attaching listeners for tab-specific or path-specific side panels.

## Future Work

