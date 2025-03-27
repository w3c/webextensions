# Proposal: Hybrid Permissions for Chrome Extensions

** Proposal Summary**

Introduce a concept of “hybrid_permissions” which will offer existing extensions a simplified new-install experience by prompting users with both (1) install-time (required) and (2) optional permissions and maintain current behavior for “optional_permissions” for users who already have the extension installed.

Extension manifest file example:

```json
{
  "name": "Permissions Extension",
  "hybrid_permissions": [
    "notifications"
  ]
}
```

**Document Metadata**

**Author:** @oleksiilevzhynskyi

**Sponsoring Browser:** N/A

**Contributors:** N/A

**Created:** 2025-02-24

**Related Issues:** 
- [711](https://github.com/w3c/webextensions/issues/711)
- [Feature request "Hybrid Permissions for Chrome Extension"](https://issuetracker.google.com/issues/362675958)

## Motivation

### Objective

Today, developers have two options for adding new permissions that trigger warnings:

1. Add a new permission as install-time permission which will (1) disable the extension for 100% of current users until they take manual steps to grant the new permission. This is not a viable option for extension with large user install bases, as [The UI for reapproval of such permission is very unclear](https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings), and in most cases, it means a loss of most active users.

On the manifest-files level, it's a "permissions" property that represents a list of permissions the user agreed upon installation.

2. Add new permissions as 'optional,' (2) which will limit access to new features until the user grants access to the new permission.  <—  This is not optimal as it creates a confusing experience for new users who reviewed and accepted permissions a few seconds earlier while installing the extension.

On the manifest-files level, it's an "optional_permissions" property that represents a list of permissions that the extension may request at any point, and the user agrees or declines them.

**We are proposing a third option: Hybrid Permission to improve the user experience for new users.**

**For New Installations**: We would like to offer a single permission prompt containing all required and hybrid permission requests.

**For Current users**: No change from current optional behavior.

#### Exceptions from Optional Permissions

Additionally, there is a list of permissions that cannot be optional: debugger, declarativeNetRequest, dev tools, geolocation, DNS, proxy, tts, ttsEngine, and wallpaper.

There is no way to request such permissions during runtime to avoid permission warnings triggered by install-time permissions. In most cases, this means that the developer cannot add them to an already published extension without disabling it for all users.

#### User Benefits

By supporting hybrid permissions, we can offer the best user experience by being open and upfront about the permissions our application will require to function optimally as well as reducing user confusion with a single prompt as opposed to multiple.

Here is an official showcase from the "Chrome for Developers” documentation that illustrates the user experience when permissions trigger a warning. Such behavior that we would like to avoid with the support for hybrid permissions

![image](https://developer.chrome.com/static/docs/extensions/develop/concepts/permission-warnings/image/example-an-extension-is-6772580db51de.gif)

#### Use Cases

According to [to the guidelines](https://developer.chrome.com/docs/extensions/reference/api/permissions#:~:text=only%20those%20that%20are%20necessary), the extension should only request permissions "that are necessary."

It’s not always possible to know the product's future state and predict all use cases in advance.

If the extension is already live, there is no good way to add a new mandatory permission. The install time permission with “warning” will silently “turn off” the extension, but “optional_permission” will lead to a suboptimal experience for new installs. During a fresh install, users must agree on permissions during the installation process and immediately receive a pop-up requesting additional optional permission. 

**It would be great to have a combined approach for existing and new installations to simplify/streamline onboarding of browser extensions for new users by offering upfront notice of permissions required to use new extensions features.**

### Known Consumers

Support for Hybrid Permissions will enable well-established extensions (including Grammarly) to introduce new features to users that require additional permissions without the risk of accidentally disabling the extension, but at the same time, it will help avoid confusing new users with a suboptimal permission request flow immediately after installation.

## Specification

### Schema

[Existing web “permissions” behavior](https://developer.chrome.com/docs/extensions/reference/api/permissions#step_3_request_optional_permissions) is completely compatible with “hybrid” permissions. 

However, there are two differences:

1. Hybrid permissions should behave like permanent permissions and cannot be removed. This means that “permissions.remove” should return “false” and print an exception.

```js
permissions.remove({
  permissions: ['tabs'],
  origins: ['https://www.google.com/']
}, (removed) => {
  // removed is always "false", as the "hybrid" permission cannot be remove
});
```

2. It should be possible to request permission that cannot be optional (like “devtools”). The request should be [performed from inside a user gesture](https://developer.chrome.com/docs/extensions/reference/api/permissions#:~:text=Permissions%20must%20be%20requested%20from%20inside%20a%20user%20gesture). See the example from an official documentation - https://developer.chrome.com/docs/extensions/reference/api/permissions 

### Behavior

Hybrid permissions should be requested alongside install-time “permissions” with the same UI for new installs.

For existing installs (extension update flow), nothing should be requested. However, the extension should be able check and request new permission on runtime.

Overall, the extension should consider the “hybrid” permission “optional”. The only thing that will change is the permissions request flow. Instead of requesting on demand, “Hybrid” provides the ability to permanently request optional permissions in the **installation** flow.

### New Permissions

The proposal does not introduce any new permissions. However, it does introduce a new behavior for requesting existing permissions. 

All existing permissions are qualified to be “hybrid.”. It's all “optional” permission and theses that cannot be optional: debugger, declarativeNetRequest, dev tools, geolocation, DNS, proxy, tts, ttsEngine, wallpaper.

### Manifest File Changes

Introduce “hybrid_permissions” that will be treated as regular permissions for new installs but behave like “optional_permissions” for existing users.

Extension manifest file example:

```json
{
  "name": "Permissions Extension",
  "hybrid_permissions": [
    "notifications"
  ]
}
```

## Security and Privacy

### Exposed Sensitive Data

This proposal doesn't change the existing browser API or expose PII data.

### Abuse Mitigations

The proposal doesn't introduce any additional possibilities for abuse. For already installed extensions, "hybrid" permissions behave like optional ones that should be explicitly requested. Permissions are shown as "permanent" for new installations and are explicitly reviewed by the user upon installation.

### Additional Security Considerations

N/A

## Alternatives

### Existing Workarounds

Additional (new) permissions can be added as install time permission, but this will result in 100% of users having the extension become disabled, which is a catastrophic result. Hence, we are not aware of any viable workarounds for extensions that are deployed to users in production.

This proposal is purely focused on improving user experience when working with Extensions. By nature, extensions extend browser functionality, and they cannot be promoted unless they are graded during the installation phase. The idea is to limit user friction during extension setup and simplify permission granting.
 
There is a way to use option permissions to introduce a new permission. However, it limits visibility as it usually requires direct interaction with Extension, which may be limited due to the nature of available UX.

### Open Web API

N/A

## Implementation Notes

N/A

## Future Work

N/A
