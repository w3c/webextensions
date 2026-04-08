# Proposal: `runtime.getDocumentId()` API

**Summary**

This API can be used to get the `documentId` based on a window object OR a DOM element like `<iframe>`.

**Document Metadata**

**Author:** carlosjeurissen

**Sponsoring Browser:** Safari

**Contributors:** -

**Created:** 2026-01-13

**Related Issues:** https://github.com/w3c/webextensions/issues/800 https://github.com/w3c/webextensions/issues/469 https://github.com/w3c/webextensions/issues/12

## Motivation

### Objective

Provide a way to get the current `documentId` from a content script.

#### Use Cases

The documentIds can be used for more secure messaging and script injection.

### Known Consumers

Password managers (see https://github.com/w3c/webextensions/issues/12)
Privacy extensions
AdFiltering extensions
UI Wrapper extensions

## Specification

### Schema

```typescript
namespace runtime {
  function getDocumentId(
    target: WindowProxy | HTMLIFrameElement | HTMLFrameElement
  ): string;
}
```

### Behavior

If the target has an incorrect type OR if the browser for whatever reason can
not provide the document id, an exception should be thrown. There is no such
concept as a `DOCUMENT_ID_NONE`.

### New Permissions

No new permissions are needed. If an extension author already has access to the
window object or <iframe> element of a frame, knowing the documentId should not
be of any concern.

### Manifest File Changes

No manifest file changes

## Security and Privacy

### Exposed Sensitive Data

None.

### Abuse Mitigations

Extensions already have systems in place for frame access. Knowing the
documentId would not allow you to access the frame without having
host permissions.

### Additional Security Considerations

Exposing the documentId should not result in any additional security issues.

## Alternatives

### Existing Workarounds

A current work around to get the documentId of a document would be to post a
message with the postMessage API to the frame holding the document. This frame
will need to have a content script which picks up on this message and then sends
a web extension message to the extension background script. Which in return
sends an extension message back with the documentId to the tab holding the
context in which you need the documentId. This process wakes up the background
page and is a very fragile workaround with risks of bugs and exposing data
unintentially.

### Open Web API

Document ids are not exposed as open web API. So this is not a viable path.

## Implementation Notes

As mentioned under behaviour, exceptions should always be thrown if for whatever
reason the documentId could not be provided.

## Future Work
- Accept documentId as sole target for executeScript. See https://github.com/w3c/webextensions/issues/91#issuecomment-2010569435
- Accept documentId as sole target to send extension messages to. See https://github.com/w3c/webextensions/issues/902
