# Proposal: browser.runtime.onInvalidated event

**Summary**

`browser.runtime.onInvalidated`

This event notifies extension contexts that remain alive when the extension context gets invalidated.

**Document Metadata**

**Author:** carlosjeurissen

**Sponsoring Browser:** Chrome

**Contributors:** bershanskiy

**Created:** 2025-03-26

**Related Issues:** https://github.com/w3c/webextensions/issues/138

## Motivation

### Objective

This event notifies extension contexts that remain alive when the extension context gets invalidated.

#### Use Cases

When the extension context gets invalidated, this means extension contexts
which stay alive can no longer use the extension APIs or communicate with other
extension contexts.

For extension contexts, knowing when this happens is crucial for moving
forward. Alternatives can be used in this situation, like `window.open` instead
of `browser.tabs.create`. If moving forward is no option, this event can be
used for initiating the cleanup of any side effects caused in the frames
extensions have been operating in.

### Known Consumers

Any extension with a content script which applies certain side effects to the
web page.

## Specification

### Schema

New onInvalidated event:
```json
{
  "name": "onInvalidated",
  "type": "function",
  "description": "Fired when the extension context get invalidated.",
  "parameters": [
    {
      "type": "object",
      "name": "details",
      "properties": {
        "reason": {
          "$ref": "OnInvalidatedReason",
          "description": "The reason that this event is being dispatched."
        }
      }
    }
  ]
}
```

The event should have a reason of type OnInvalidatedReason

OnInvalidatedReason:

```json
{
  "id": "OnInvalidatedReason",
  "type": "string",
  "enum": [
    {"name": "uninstall", "description": "Specifies the event reason as an uninstallation."},
    {"name": "update", "description": "Specifies the event reason as an extension update."},
    {"name": "reload", "description": "Specifies the event reason as an extension reloading."},
    {"name": "disable", "description": "Specifies the event reason as an extension disabling."}
  ],
  "description": "The reason that this event is being dispatched."
}
```

### Behavior

The event will be fired when the extension context get invalidated.
The event comes with a reason which specifies why an extension got invalidated.

### New Permissions

No new permissions introduced.

### Manifest File Changes

No new manifest fields.

## Security and Privacy

### Exposed Sensitive Data

Document any sensitive data or personally-identifiable information the API
exposes to the extension.

### Abuse Mitigations

Currently extensions could try checking if an API gets thrown with an
invalidated error. This would allow an extension to figure out if the extension
is invalidated. No new abuse surface is introduced.

As for the returned reason. The `uninstall` reason can not be abused more than
currently `browser.runtime.setUninstalledURL`.

As for the `update` reason, this can be figured out by attempting to negotiate
between the old content script and the new content script.

The `disable` reason could provide additional information. However this seems
to not be a big abuse surface.

### Additional Security Considerations

Extensions could potentially leak the onInvalidatedReason if they try hard.
This does not seem to introduce any attack surfaces.

## Alternatives

### Existing Workarounds

An extension could attempt to run an API which throws when an extension is
invalidated. This is very expensive as it would require to run this API in a
loop. In addition, the lack of an onInvalidated event leads to many
extension developers to not deal with the situation in which the context is
invalidated. Introducing the onInvalidated encourages developers to handle
these situations.

### Open Web API

There is no viable path to turn this into an Open Web API.

## Implementation Notes

The event should be fired in the situation in which extension APIs would throw
with an context invalidated error.

## Future Work

Not at this moment
