# Proposal: New runtime.onEnabled and runtime.onExtensionLoaded events

**Summary**

Creates two new extension state notification events that will help developers
take action on the full “lifecycle” of their extensions.

**Document Metadata**

**Author:** jlulejian@chromium.org

**Sponsoring Browser:** Google Chrome and Microsoft Edge

**Contributors:** sorajdev@microsoft.com

**Created:** 2024-12-03

**Related Issues:** https://github.com/w3c/webextensions/issues/353

## Motivation

### Objective

Enable two new extension lifecycle events for the developer to add listeners for:

#### chrome.runtime.onEnabled
Enables a developer to listen to when an extension is re-enabled from a disabled
state. There is currently no way for a developer to listen for the extension
being disabled and then enabled.

### chrome.runtime.onExtensionLoaded
Enables a developer to listen to when an extension is added to the set of active
extensions. This can occur from being installed, enabled, or when the browser /
profile first starts. The listener will be given the cause so they can decide to
take different actions based on the reason it was added to the set. There is
currently no generic event that encapsulates all instances of extension install
(and update), startup, and being enabled from a disabled state.

#### Use Cases `chrome.runtime.onEnabled`
A developer wants to run code once in an extension’s "lifecycle", without storing
a flag to keep track of this.

Before this API the developer would need to manually keep track of this state
via a storage flag in persistent storage.

With this new API a single listener can be registered and reduce the extension’s
complexity.

More use cases can be found [here](https://github.com/w3c/webextensions/issues/353#issuecomment-1490078217).

#### Use Cases `chrome.runtime.onExtensionLoaded`
An extension automatically does initial bootstrapping, such as creating an
initial state used throughout the browser session, creating a WebSocket
connection, checking for things you've missed while the browser was closed, and
putting something in chrome.storage.session. 

Before this API the developer would have to create multiple listeners for
`chrome.runtime.onInstalled()`, `onStartup()`, and (above) `onEnabled()`.

With this new API method the developer could write one method that performs the
same action for all three, potentially with small differences based on the
loaded cause.

More use cases can be found [here](https://github.com/w3c/webextensions/issues/353#issuecomment-1582536300).

### Known Consumers

This is a broadly applicable API method that will be helpful to any developer
wanting to execute code as the extension changes running states. But there
appears to be strong interest per the [WECG discussion](https://github.com/w3c/webextensions/issues/353).

## Specification

### Schema
#### `chrome.runtime.onEnabled`
```typescript
namespace runtime {
  // Fired when an extension goes from being in a disabled state to an enabled
  // state.
  export interface onEnabled {
    addListener(callback: () => void): void;
    removeListener(callback: () => void): void;
  }
}
```

#### `chrome.runtime.onExtensionLoaded`
```typescript
namespace runtime {
  // The reason for which the event is being dispatched.
  //
  // 'enabled': The extension was re-enabled from a disabled state.
  //
  // 'installed': The extension was newly installed.
  //
  // 'updated': The extension was reloaded after an update.
  //
  // 'startup': The extension is being loaded during browser startup.
  //
  // 'reload': The extension was reloaded (e.g. via `chrome.runtime.reload() or`
  // the user manually reloaded the extension).
  export type OnLoadedReason = 'enabled' |
                               'installed' |
                               'updated' |
                               'startup' |
                               'reload';

  export interface ExtensionLoadDetails {
    // The reason that this event is being dispatched.
    reason: OnLoadedReason;

    // Indicates the previous version of the extension, which has just been
    // updated. This is present only if 'reason' is 'updated' or ‘enabled’.
    previousVersion?: string;
  }

  // Fired when the extension is added to the set of active extensions. This can
  // occur in multiple scenarios: when an extension is first installed, updated
  // to a new version, and enabled after being disabled.
  export interface onExtensionLoaded {
    addListener(callback: (details: ExtensionLoadDetails) => void): void;
    removeListener(callback: (details: ExtensionLoadDetails) => void): void;
  }
}
```

### Behavior

Described as code comments in schema description.

### New Permissions

No new permissions are needed as extensions can access the `browser.runtime`
API without any permissions.

### Manifest File Changes

No new manifest changes are added.

## Security and Privacy

### Exposed Sensitive Data

The new events expose some information that wasn’t present before. It does
expose that an extension was (explicitly) disabled, which is something we don't
expose today. Today, an extension cannot necessarily distinguish between being
disabled and the user simply not opening the browser for &lt;n> amount of
time.

### Abuse Mitigations

These APIs would be difficult to use in an abusive way since they do not give
information or access to other extensions, and don’t give control into the
extensions lifecycle – only knowledge as it transitions to different states.

### Additional Security Considerations

N/A.

## Alternatives

### Existing Workarounds

There is currently `chrome.runtime.onInstalled`, and `chrome.runtime.onStartup`.
These API have gaps in listening that are addressed by these two events. In
short, `chrome.runtime.onEnabled`, covers the remaining status that developers
care to know, and `chrome.runtime.onExtensionLoaded` encapsulates them all
together with a single listener.

### Open Web API

These API methods are specific to extension lifetime / lifecycle and would not
be appropriate to be in the open web.

## Implementation Notes

N/A.

## Future Work

N/A.
