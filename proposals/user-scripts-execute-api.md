# Extension API Proposal: userScripts.execute()

## Background

### User Scripts and User Scripts Managers

User scripts are (usually relatively small) snippets of code that are injected into web pages in order to modify the page's appearance or behavior. User script managers are a type of extension that is used to manage the collection and injection of these user scripts, determining when and how to inject them on web pages.

### Manifest V3

Manifest Version 3 (MV3) restricts the ability for extensions to use remotely-hosted code since it is a major security risk (stores cannot review or audit code that isn't in the extension package). This is directly at odds with user script managers, which fundamentally require the execution of arbitrary code (the user scripts themselves). This created a feature gap between MV2 and MV3.

### User Scripts API

The User Scripts API was introduced in MV3 to register user scripts with arbitrary code, specifically targeting user script managers' use cases. User scripts are injected based on url matching through match patterns and globs. The API requires a new permission, and allows each browser to implement their own restrictions.
In the User Script API proposal, executing a user script one time was [presented](https://github.com/w3c/webextensions/blob/main/proposals/user-scripts-api.md#execute-user-scripts-one-time) as a potential future enhancement.

## API Overview

### Objective

Allow extensions to inject user scripts programmatically into web content given a target context.

#### Use Cases

The user wants to inject a user script on the page currently loaded in a given tab one time, but does not want to inject the script on that site automatically in the future. That is, the parameter that determines the injection is a tab ID and not based on origin.

### Availability: Public

This API will be public to all extensions (with the appropriate permission).

### Consumers

Any existing user script manager consumers of `chrome.tabs.executeScript()` that inject user scripts programmatically are intended to migrate to this new version in Manifest V3.

## Implementation

### API Schema

#### Types

```
dictionary UserScriptInjection {
  // Whether the injection should be triggered in the target as soon as
  // possible. Note that this is not a guarantee that injection will occur
  // prior to page load, as the page may have already loaded by the time the
  // script reaches the target.
  injectImmediately?: boolean,
  // The script source to inject into the target.
  js: ScriptSource,
  // Details specifying the target into which to inject the script.
  target: InjectionTarget,
  // The JavaScript "world" to run the script in. The default is `USER_SCRIPT`.
  world?: ExecutionWorld,
}

dictionary InjectionTarget {
  // Whether the script should inject into all frames within the tab. Defaults
  // to false. This must not be true if `frameIds` is specified.
  allFrames?: boolean,
  // The IDs of specific documentIds to inject into. This must not be set if
  // frameIds is set.
  documentIds?: string[],
  // The IDs of specific frames to inject into.
  frameIds?: number[],
  // The ID of the tab into which to inject.
  tabId: number,
}

dictionary InjectionResult {
  // The document associated with the injection.
  documentId: string,
  // The frame associated with the injection.
  frameId: number,
  // The result of the script execution.
  result?: any,
  // The error, if any. error and result are mutually exclusive.
  error?: any,
}
```

#### Methods

```
// Injects a script into a target context. The script will be run at
// `document_idle` unless the `injectImmediately` property is set. If the
// script evaluates to a promise, the browser will wait
// for the promise to settle and return the resulting value.
Promise<InjectionResult[]> browser.userScripts.execute(
  // The details of the script which to inject
  injection: UserScriptInjection
)
```

Note: Promises are supported in Manifest V3 and later, but callbacks are provided for backward compatibility. You cannot use both on the same function call. The promise resolves with the same type that is passed to the callback.

### New Permissions

No new permissions will be added; this will be part of the existing `userScripts` permission

### Manifest Changes

N/A

### Custom Bindings

N/A

## User Experience

### UI Elements and User-Visible Effects

There are no new UI elements or user-visible effects (exempting those caused by the script of the extension).

## Security and Privacy

### Exposed Sensitive Data

This API does not directly expose any new sensitive data, as it relies on the host permissions of the extension and the userScripts permission. If the extension already has host permissions to a site, it can access all the data associated with that site (including scraping the DOM, accessing cookies, modifying network requests, and more).

### Abuse Scenarios

With any script injection API, there are significant abuse possibilities - such as injecting malicious JavaScript intended to collect user data maliciously.  Additionally, this allows extensions to inject code that's not contained within the extension's package. However, this is inline with the existing userScripts API, and there are no new abuse mechanisms introduced as a part of this API.

#### Mitigations
The existing mitigations for host permissions - most dominantly, runtime host permissions - apply here.

### Additional Security Considerations

N/A

## Alternatives

### Past Workarounds

In the past, developers leveraged `chrome.tabs.executeScript()`. However, this method was removed in MV3.

### Existing Workarounds

Developers can utilize `userScripts.register()` to inject JavaScript into a known set of hosts, but this doesn't cover the case of programmatic injections to a specific target or one-time injections.

### Open Web API

Since this API exposes the ability to inject JavaScript on sites that are not in the same origin, it does not belong on the web.

## (Potential) Future Enhacements

### Add func to `ScriptSource`

Add `func` and `args` property to `ScriptSource` to specify a JavaScript function to inject. This could be used both by `userScripts.register()` and `userScripts.execute()`.
