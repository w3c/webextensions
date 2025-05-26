# Proposal: Allow extensions to track their own disable/uninstall events without "management" permission

**Summary**

Currently, extensions cannot track when users disable or uninstall them without requesting the broad "management" permission. This proposal suggests modifying the behavior of `chrome.management.onDisabled` and `chrome.management.onUninstalled` events to allow extensions to track their own state changes without requiring the "management" permission.

**Document Metadata**

**Author:** [sameerjaiswal](https://github.com/jaissam10)

**Sponsoring Browser:** TBD

**Contributors:** 

**Created:** 2025-05-16

**Related Issues:** https://issues.chromium.org/issues/417868528

## Motivation
Extensions need to track when users disable or uninstall them for legitimate purposes like:
- Analytics and user behavior tracking
- Understanding user retention
- Improving extension quality based on user behavior

Currently, this requires the broad "management" permission, which is inconsistent with other self-reference methods like `management.getSelf()` that don't require permissions.
### Objective
To enable extensions to track their own disable/uninstall events without requiring the broad "management" permission, while maintaining the existing permission model for tracking other extensions' events.

### Use Cases
1. **Analytics Tracking**
   - Track when users disable/uninstall the extension
   - Understand user retention patterns
   - Measure impact of updates on user behavior
2. **User Feedback**
   - Trigger feedback surveys when users disable/uninstall
   - Collect reasons and improve extension based on user feedback
3. **State Management**
   - Clean up extension data when disabled/uninstalled
   - Handle graceful shutdown of extension services
   - Manage user preferences and settings

### Known Consumers
- Adobe Acrobat Extension
- Other extensions that need to track user behavior and retention

## Specification

### Schema
### Current Behavior
- `chrome.management.onDisabled` and `chrome.management.onUninstalled` require "management" permission
- This permission is meant for managing other extensions
- Extensions cannot track their own state changes without this broad permission

### Proposed Changes
Two implementation approaches are proposed:

#### Option 1: Single API with Permission-based Behavior
- Keep existing `onDisabled` and `onUninstalled` events
- If "management" permission is present: trigger for all extensions
- If no permission: only trigger for the calling extension
- Maintains backward compatibility

Example:
```javascript
// Without permission - only triggers for self
chrome.management.onDisabled.addListener((info) => {
  if (info.id === chrome.runtime.id) {
    // Handle self disable and this will get called without permission
  }
});

// With permission - triggers for all extensions
chrome.management.onDisabled.addListener((info) => {
  // Handle any extension disable if anything generic needs to be done but that needs permision
});
```

#### Option 2: Separate API Methods
- Add new methods specifically for self-events:
  - `chrome.management.onSelfDisabled`
  - `chrome.management.onSelfUninstalled`
- Keep existing methods for all-extension events (requiring permission)
- Clearer API separation

Example:
```javascript
// New methods for self-events (no permission needed)
chrome.management.onSelfDisabled.addListener(() => {
  // Handle self disable
});

// Existing methods (requires permission)
chrome.management.onDisabled.addListener((info) => {
  // Handle any extension disable
});
```


### Backward Compatibility
- Option 1 maintains full backward compatibility
- Option 2 requires new API methods but doesn't break existing code

## Examples
### Current Usage
```javascript
// Requires "management" permission
chrome.management.onDisabled.addListener((info) => {
  if (info.id === chrome.runtime.id) {
    // Handle self disable
  }
});
```

### Proposed Usage (Option 1)
```javascript
// No permission needed for self-events
chrome.management.onDisabled.addListener((info) => {
  if (info.id === chrome.runtime.id) {
    // Handle self disable
  }
});
```

### Proposed Usage (Option 2)
```javascript
// New dedicated method for self-events
chrome.management.onSelfDisabled.addListener(() => {
  // Handle self disable
});
```

### New Permissions
No new permissions are required.

### Manifest File Changes
No new manifest fields are required.

## Security and Privacy
### Exposed Sensitive Data
- No sensitive data is exposed
- Only the extension's own state changes are tracked
- No access to other extensions' information without permission

### Abuse Mitigations
- Self-events only trigger for the calling extension
- No ability to track other extensions without permission
- Consistent with existing security model


### Additional Security Considerations


## Alternatives
### Existing Workarounds

### Open Web API
No equivalent functionality exists in the Open Web API.

## Implementation Notes

- No changes to existing permission model
- Clear documentation needed for behavior differences
- Implementation should be consistent across browsers

## Future Work
1. Consider adding reason codes for disable/uninstall events
2. Explore adding similar functionality for other self-reference events

