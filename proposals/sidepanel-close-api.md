# New close() Method for the sidePanel API

**Summary**

Proposal to introduce a programmatic close method for the side panel API.

**Document Metadata**

**Author:** [hharshas](https://github.com/hharshas)

**Sponsoring Browser:** Chromium

**Contributors:** [hharshas](https://github.com/hharshas) ([Summer Of
Code](https://summerofcode.withgoogle.com/)), mentor: oliverdunk, solomonkinard

**Created:** 2025-05-27

**Related Issues:** [#521](https://github.com/w3c/webextensions/issues/521),
[#chromium](https://issues.chromium.org/issues/403765214)

## Motivation

### Objective

What does this API enable?
- `sidePanel.close()` method will allow the sidebar to close programmatically.

Why do we need it?
- Currently, extensions cannot directly close their own side panel from the
  background script, developers have to:
  1. Send a message from a background script to the side panel.
  2. Call `window.close()` from the side panel window on message delivery.

This event aims to give developers an easier control.

#### Use Cases

Programmatic Control:
- An extension could automatically close the panel after completing an action or
  when certain conditions are met. For example, an extension that helps users fill
  out a form could close the side panel automatically once the form is submitted.
  This ensures the side panel only stays open while it’s needed,
  streamlining the user experience.

### Known Consumers

[The Chromium bug](https://issues.chromium.org/issues/403765214) has a significant
amount of developer interest and the discussions on the issue shows the same.

## Specification

### Schema

```typescript
namespace sidePanel {
  dictionary CloseOptions {
    // The window in which to close the side panel.
    long? windowId;

    // The tab for which to close the side panel. If specified,
    // only closes tab-specific side panels.
    long? tabId;

    // At least one of these must be provided, otherwise rejects with an error.
  };

  interface Functions {
    // Closes the extension's side panel.
    // `options`: Specifies the context in which to close the side panel.
    // `callback`: Called when the side panel has been closed.
    static void close(
      CloseOptions options,
      optional VoidCallback callback);
  };
};
```

### Return value

- Type: Promise<void>

- Resolves when the panel has been closed. If the panel is
  already closed, still resolves successfully.

### Behavior

- The operation will only close side panels that belong to the
  calling extension.
- If the panel is already closed or does not exist in the given
  context, the method does nothing.
- If neither `windowId` nor `tabId` is provided, rejects with an error.
- If `windowId` or `tabId` is invalid, rejects with an error.
- If both `windowId` and `tabId` are provided, the method will verify
  that the tab belongs to the specified window. If not, it rejects with an error.

### New Permissions
N/A

### Manifest File Changes
N/A

## Security and Privacy

### Exposed Sensitive Data

This API does not expose any sensitive data.

### Abuse Mitigations

The API is limited to closing only the extension's own side panel.

### Additional Security Considerations

N/A

## Alternatives

### Existing Workarounds

* Message passing between background and panel contexts.
* Calling `window.close()` from the panel context.

### Open Web API

Not applicable to the open web as it only complements the existing `open()`
functionality.

## Implementation Notes

N/A

## Future Work

This implementation will align with
[#779](https://github.com/w3c/webextensions/pull/779), to ensure proper event
handling on panel closure (Open for discussion).
