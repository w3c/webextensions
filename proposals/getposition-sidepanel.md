# Add API to Query Side Panel Position

**Summary**
Proposal to introduce a programmatic way to query the Side panel position.

**Document Metadata**

**Author:** [hharshas](https://github.com/hharshas)

**Sponsoring Browser:** Chromium

**Contributors:** [hharshas](https://github.com/hharshas) ([Summer Of Code](https://summerofcode.withgoogle.com/)), mentor: oliverdunk, solomonkinard

**Created:** 2025-05-27

**Related Issues:** [#chromium](https://issues.chromium.org/issues/406511291)

## Motivation

### Objective

- At chrome://settings, it is possible to change the "Side panel position" which affects which side of the browser the side panel UI opens on. This can include panels registered by the developer using the sidePanel API.
- We should add a way to query this so the developer can adjust their UI based on the position.

#### Use Cases

Programmatic Control: 
- For example having phrasing or visuals that depend on the relative position of the page.

### Known Consumers

The Chromium bug has some amount of developer interest. This item is under consideration by Chrome among work items for Summer of Code.

## Specification

### Schema

```typescript
namespace sidePanel {
 namespace sidePanel {
  // Possible side panel positions
  enum PanelPosition {
    LEFT = "left",
    RIGHT = "right"
  };

  interface Functions {
    // Returns the current position of the side panel
    // Returns: Promise that resolves with the current position
    static Promise<PanelPosition> getPosition();
    
    ////
    // Alternative approach for future extensibility (open for discussion)
    dictionary PanelSettings {
      PanelPosition position;
      // Future settings could be added here
    };
    
    static Promise<PanelSettings> getSettings();
  };
};
```

### Return value

- Type: Promise<void>

- Resolves when it returns the panel position.

### Behavior
    - Returns the current position as set in browser settings. 
    - No context option is needed as the setting is same for all the context.

### New Permissions
N/A.

### Manifest File Changes
N/A

## Security and Privacy

### Exposed Sensitive Data

This API does not expose any sensitive data.

### Abuse Mitigations

The API is fetching only the side panel position.

### Additional Security Considerations

N/A

## Alternatives

### Existing Workarounds

  - So far, nothing works. The DOM of the side panel and the content script are separate, so even if we detect the resize event when the side panel is opened, we can't determine the panel's position. It will be interesting to see others' approaches in the comments of this PR.

### Open Web API

This API is intended to support panels registered by the developer using the Side Panel API, so it does not belong on the open web.

## Implementation Notes

N/A.

## Future Work

- Additional Settings: Expand getSettings() with more panel configuration options
- Position Change Events: Add event listener for position changes (again open for discussion)

## Basic uses

```typescript
chrome.sidePanel.getPosition().then(position => {
  console.log(`Panel is on the ${position} side`);
  applyPositionSpecificStyles(position);
});
```
