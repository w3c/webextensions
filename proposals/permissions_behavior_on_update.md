# Proposal: Allow to change permissions behavior on extension updates

** Proposal Summary**

Add a new property, "permissions_behavior_on_update," to the manifest to alter the newly added "permissions" behavior during the extension's update. When set to "defer," newly added permissions on update won't be granted by default; they will behave like optional permissions and must be explicitly requested by the extension. Also, the default browser behavior will NOT be applied (warning, turn off, stop further updates, etc.).

The new behavior isn't applicable during install time or for permission that doesn't trigger a warning.

Extension manifest file example:

```json
{
  "permissions_behavior_on_update": "defer"
}
```

**Document Metadata**

**Author:** @oleksiilevzhynskyi

**Sponsoring Browser:** Mozilla Firefox

**Contributors:** N/A

**Created:** 2025-02-28

**Related Issues:** 
- [711](https://github.com/w3c/webextensions/issues/711)
- [Feature request "Hybrid Permissions for Chrome Extension"](https://issuetracker.google.com/issues/362675958)
- [Proposal for "Hybrid Permissions"](https://github.com/w3c/webextensions/pull/788)

## Motivation

### Glossary

The phrase "permissions that trigger warnings" refers to permissions that require additional action from the user after the extension's update. The actual UX varies across browsers; some may silently turn off the extension, while others display an extra warning or pause further extension updates until the user explicitly permits the added permission.

### Objective

Today, developers have two options for adding [new permissions that trigger warnings](https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings):

1. Add a new permission as install-time permission which will disable the extension for 100% of current users or stop further updates until they take manual steps to grant the new permission. This is not a viable option for extension with large user install bases, as [The UI for re-approval of such permission is very unclear](https://developer.chrome.com/docs/extensions/develop/concepts/permission-warnings), and in most cases, it means a loss of most active users.

On the manifest-files level, it's a "permissions" property that represents a list of permissions the user agreed upon installation.

1. Add new permissions as 'optional,' which will limit access to new features until the user grants access to the new permission.  <—  This is not optimal as it creates a confusing experience for new users who reviewed and accepted permissions a few seconds earlier while installing the extension.

On the manifest-files level, it's an "optional_permissions" property that represents a list of permissions that the extension may request at any point, and the user agrees or declines them.

**The proposal is to introduce a way to avoid permission's warning during the extension's update and, instead of turning off the extension or stopping further updates for existing users, make it behave optional where the extension has to request permission explicitly.**

**For New Installations**: The existing behavior remains, and all permissions listed in the "permissions" key will be granted. 

**For Current users**: The new permissions that trigger the warning won't be granted, and the permissions warning won't be shown. Instead, the extension has to explicitly request permission within the user gesture.

Important note: such behavior only applies to permissions that trigger "warnings" during extension updates. In the case of a new installation, all "permissions" are granted as part of existing installation flows, and no additional requests should be made.

a) Why fallback to "optional" behavior during the update?

It's hard to imagine a case when the developer wants their extension to be silently turned off. Instead, falling back to behavior similar to "optional" permission gives way to introduce permission to new installs and way to onboard existing users as well. 

b) Why not a new field proposed in ["Hybrid permissions" proposal](https://github.com/w3c/webextensions/pull/788)

The intent is to avoid adding new kinds of permissions as this may lead to ambiguity and make everyone simply avoid existing "permissions" key.

#### User Benefits

By adding "permissions_behavior_on_update", extension developers can offer the best user experience by being open and upfront about the permissions extension will require to function optimally as well as reducing user confusion with a single prompt as opposed to multiple.

Also, by suppressing warnings we will reduce the fear of accidentally "turn off" extensions for the existing user and enable extension developers to actively evolve extensions by adopting new permissions as soon as they make sense.

Here is an official showcase from the "Chrome for Developers” documentation that illustrates the user experience when permissions trigger a warning. Such behavior that we would like to avoid with the proposed changes in this proposal.

![image](https://developer.chrome.com/static/docs/extensions/develop/concepts/permission-warnings/image/example-an-extension-is-6772580db51de.gif)

#### Use Cases

According to [to the guidelines](https://developer.chrome.com/docs/extensions/reference/api/permissions#:~:text=only%20those%20that%20are%20necessary), the extension should only request permissions "that are necessary."

It’s not always possible to know the product's future state and predict all use cases in advance.

If the extension is already live, there is no good way to add a new mandatory permission. The install time permission with “warning” will silently “turn off” the extension, but “optional_permission” will lead to a suboptimal experience for new installs. During a fresh install, users must agree on permissions during the installation process and immediately receive a pop-up requesting additional optional permission. 

**It would be great to have a way to enable developers to use new permissions but avoid unexpected consequences. This will simplify/streamline the onboarding of browser extensions for new users by offering upfront notice of permissions required to use new extension features.**

### Known Consumers

Changes listed in this proposal will enable well-established extensions to introduce new features to users that require additional permissions without the risk of accidentally disabling the extension, but at the same time, it will help avoid confusing new users with a suboptimal permission request flow immediately after installation.

## Specification

### Schema

The permissions' granting behavior only changes when "permissions_behavior_on_update" is set to "defer" and only for new permissions that may trigger a warning during the update. It doesn't change the behavior of permissions that don't trigger a warning or all permissions during install time.

When the "permissions_behavior_on_update" is absent from the manifest, the behavior remains the same as it is right now, and new permissions with a warning will turn off the extension during the update or stop updates until the user explicitly approves it (behavior varies across browsers).

### Suppress permissions warning on update

In case "permissions_behavior_on_update" is set to "defer", then any new permission that triggers a "warning" isn't granted but instead should be explicitly requested within a user gesture using "permissions.request"(https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/permissions/request). Expect that user may decline permission.

```
document.querySelector('#my-button').addEventListener('click', (event) => {
  // Permissions must be requested from inside a user gesture, like a button's
  // click handler.
  browser.permissions.request({
    permissions: ['tabs'],
    origins: ['https://www.google.com/']
  }, (granted) => {
    // The callback argument will be true if the user granted the permissions.
    if (granted) {
      doSomething();
    } else {
      doSomethingElse();
    }
  });
});
```

Once permission is granted, it behaves like a regular non-optional "permission" and cannot be removed with "permissions.remove". Once "permissions.remove" is called, then “false” will be returned, and an exception will be printed.

```js
permissions.remove({
  permissions: ['tabs'],
  origins: ['https://www.google.com/']
}, (removed) => {
  // removed is always "false", as the "hybrid" permission cannot be remove
});
```

Overall the regular [permissions' API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/permissions) should be used to check, request or remove new permissions.

[Existing web “permissions” behavior](https://developer.chrome.com/docs/extensions/reference/api/permissions#step_3_request_optional_permissions) is not changes. 

### What if new version changes removes "permissions_behavior_on_update" after it was set to "defer"

In this case, the new behavior will be only applicable for any new permissions that will be added in this or further versions. Any "deferred" permissions with a warning will remain deferred.

Example:

1. Assuming that user is already on 0.0.1 and extension was just updated to 0.0.2 that adds a new "<permission_that_triggers_a_warning>" with `permissions_behavior_on_update` is set to `defer`. In this case, the extension will be successfully updated; however, "permission_that_triggers_a_warning" won't be granted. Also, assuming that the user hasn't interacted with the extension, so permission was never requested.

```js
{
  name: "Demo extension",
  version: '0.0.2',
  permissions: [
    "<permission_that_triggers_a_warning>"
  ],
  permissions_behavior_on_update: "defer"
}
```

2. The new version 0.0.3 removes `permissions_behavior_on_update`, but adds a new "permission_without_warning". In this case, the extension will be successfully updated, and "permission_without_warning" will be granted, however, "permission_that_triggers_a_warning" remains suppressed and needs an explicit request to be used.

```js
{
  name: "Demo extension",
  version: '0.0.3',
  permissions: [
    "<permission_that_triggers_a_warning>",
    "<permission_without_warning>"
  ]
}
```

### What if extension was already turned off due to the permission "warning", but updates to a new version with "permissions_behavior_on_update" set to "defer"

<TODO>

### Behavior

When "permissions_behavior_on_update" is set to "defer", then for existing installs (extension update flow), nothing should be requested. However, the extension should be able check and request new permission on runtime. Otherwise, permissions granting behavior remains the same.

### New Permissions

The proposal does not introduce any new permissions. However, it does introduce a new behavior for requesting existing permissions. 

### Manifest File Changes

Add a new property, "permissions_behavior_on_update," to the manifest to alter the newly added "permissions" behavior during the extension's update. When set to "defer," newly added permissions on update won't be granted by default; they will behave like optional permissions and must be explicitly requested by the extension. Also, the default browser behavior will NOT be applied (warning, turn off, stop further updates, etc.).

The new behavior isn't applicable during install time or for permission that doesn't trigger a warning.

Extension manifest file example:

```json
{
  "permissions_behavior_on_update": "defer"
}
```

## Security and Privacy

### Exposed Sensitive Data

This proposal doesn't change the existing browser API or expose PII data.

### Abuse Mitigations

The proposal doesn't introduce any additional possibilities for abuse. For already installed extensions, newly added permissions behave like optional ones that should be explicitly requested.

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
