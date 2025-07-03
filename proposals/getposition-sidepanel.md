# Add API to Query Side Panel Layout

**Summary**

Proposal to introduce a programmatic way to query the Side panel position.

**Document Metadata**

**Author:** [hharshas](https://github.com/hharshas)

**Sponsoring Browser:** Chromium

**Contributors:** [hharshas](https://github.com/hharshas)
([Summer Of Code](https://summerofcode.withgoogle.com/)), mentor: oliverdunk, solomonkinard

**Created:** 2025-05-27

**Related Issues:** https://issues.chromium.org/issues/406511291

## Motivation

### Objective

* Browsers may offer users the ability to change which side of the browser
  the side panel opens on. In Chrome, this is exposed at `chrome://settings`.
  This can include side panels registered by the extensions using the `sidePanel` API.
* We should add a way to query this so the developer can adjust their UI
  based on the position.

#### Use Cases

Programmatic Control: 
* For example, having phrasing or visuals that depend on the relative position of the page.

### Known Consumers

The Chromium bug has some amount of developer interest. This item is under
consideration by Chrome among work items for Summer of Code.

## Specification

### Schema

```typescript
namespace sidePanel {
    // Possible side panel positions
    enum Side {
        LEFT = "left",
        RIGHT = "right"
    };

    interface PanelLayout {
        side: Side;
    };

    // Example function declarations
    function getLayout(): Promise<PanelPosition>;
}
```

### Return value

* Type: Promise<void>
* Resolves when it returns the panel position.

### Behavior

* Returns the current position as set in browser settings.
* No context option is needed as the setting is same for all the context.

### New Permissions

N/A

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

N/A

### Open Web API

This API is intended to support panels registered by
the developer using the Side Panel API, so it does not belong on the open web.

## Implementation Notes

N/A

## Future Work

N/A

## Basic uses

```typescript
chrome.sidePanel.getLayout().then(layout => {
  console.log(`Panel is on the ${layout.side} side`);
  applyPositionSpecificStyles(layout.side);
});
```
