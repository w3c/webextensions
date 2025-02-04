# Proposal: Add tabGroups.tabGroup.shared
**Summary**
Chromium is adding the concept of a shared group. Shared groups allow users of the browser to share a collection of tabs in their tabstrip with other users.
On Chrome this feature will update tabs in realtime across multiple logged in users and across all clients for these users.
In its current state we only plan for extensions to access information about whether the group is shared or not.
**Document Metadata**
**Author:** dpenning@google.com
**Sponsoring Browser:** Chrome
**Contributors:** dljames@google.com
**Created:** 2025-01-15
**Related Issues:**
## Motivation
### Objective
Some browsers may want to restrict access to certain parts of the api as a result of the tabs affiliation with a shared group. Without the extensions knowledge of this shared state, the extension developer will not have an understanding of why querys or commands failed.
#### Use Cases
Extensions that provide heavy interaction/mutation on tab groups may want to exclude access to shared groups through their extensions.
## Specification
### Schema
[chrome.tabGroups.tabGroup](https://developer.chrome.com/docs/extensions/reference/api/tabGroups#type-TabGroup)`.shared`
a boolean field which will denote whether the group is in a shared state or not.
[chrome.tabGroups.query](https://developer.chrome.com/docs/extensions/reference/api/tabGroups#method-query)
the `queryInfo` parameter will accept a new field`shared bool optional` 
When provided the tab groups query will filter based on the shared states of the group.
[chrome.tabGroups.onUpdated](https://developer.chrome.com/docs/extensions/reference/api/tabGroups#event-onUpdated)
a method that is currently fired when a group is udated, will also fire when the group's shared state changes.
### Behavior
New restrictions may be placed on shared groups for security and privacy purposes. This is not limited to the tabGroups API and could extend to chrome.tabs and other related API surfaces. The restriction would result in an error that "the action can not be performed due to the object being in a shared state." or a similar error message.
### New Permissions
no new permissions
### Manifest File Changes
no new manifest fields
## Security and Privacy
### Exposed Sensitive Data, Abuse Mitigations, and Additional Security Considerations
This proposal only exposes existing state for a given group. All exposing of sensitive data, abuse mitigations and additional security considerations should be applied to the "shared" feature itself, and this is something likely to be different per browser vendor.
## Alternatives
### Existing Workarounds
Extensions developers currently need to rely on error handling in order to handle issues that arise from restrictions on "saved and synced" groups. These will also apply, and more restrictions may be put in place for "shared" groups
### Open Web API
the tabGroups functionality is purely a browser feature, which is why we only expose this information through the extensions API
## Implementation Notes
Other browser vendors have similar implementations of groups, however im not currently aware of any implementation of this shared state exposure for extensions.
