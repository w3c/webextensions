# Proposal: Allow extensions to track their own disable/uninstall events

**Summary**

Currently, the only mechanism available for tracking or collecting feedback on uninstall events is `setUninstallURL`, which allows registering a page to collect user feedback or send analytics to internal servers. While useful in some scenarios, this approach lacks consistency and flexibility. Notably, there is no direct way to track or receive feedback when users disable the extension.

Additionally, the `management.onDisabled` and `management.onUninstalled` events require the "management" permission, which grants broad access and is intended for managing all other extensions except self. There is no way to track an extension's own disable/uninstall events.

**A dedicated self-tracking API would enable developers to log disable and uninstall events for analytics and better understand user behavior to improve their extensions. This should be implemented as a synchronous pre-execution handler that triggers before the uninstall process begins, ideally supporting the Beacon API to ensure reliable logging even during shutdown.**

**Document Metadata**

**Author:** [sameerjaiswal](https://github.com/jaissam10)

**Sponsoring Browser:** TBD

**Contributors:**

**Created:** 2025-05-16

**Related Issues:** https://issues.chromium.org/issues/417868528

## Motivation

Extensions often need to track when they are disabled or uninstalled for legitimate purposes such as:
- Analytics and user behavior tracking
- Understanding user retention
- Improving extension quality based on feedback and engagement trends

The current `setUninstallURL` method only partially addresses this need:
- It works only during direct uninstall events
- Cannot silently log analytics without opening a page
- It does not support disable events
- It is not ideal for enterprise/admin-installed extensions, where showing a feedback page can feel intrusive or confusing

Furthermore, existing APIs like `management.onDisabled` and `management.onUninstalled` are not for the self extension and is called after extension uninstall.

These limitations leave important gaps:
1. When the extension is **disabled** (but not uninstalled)
2. When it is **uninstalled after being disabled**
3. When installed by administrators — opening a feedback page during uninstall may be disruptive
4. Cannot silently log analytics without opening a page

**A dedicated self-tracking API would enable developers to log disable and uninstall events for analytics and better understand user behavior to improve their extensions. This should be implemented as a synchronous pre-execution handler that triggers before the uninstall process begins, ideally supporting the Beacon API to ensure reliable logging even during shutdown.**

### Objective
To allow extensions to detect and handle their own disable/uninstall events without any permission.

### Use Cases
1. **Analytics Tracking**
   - Detect when users disable or uninstall the extension
   - Monitor retention and engagement
   - Evaluate the impact of product changes or updates

2. **User Feedback**
   - Trigger surveys or logs during disable/uninstall events
   - Gather reasons and pain points directly from users

3. **State Tracking**
   - We can store _state_ as _disabled_ and after enabling we can track if user enables it by checking its last state.

### Known Consumers
- Adobe Acrobat Extension
- Other privacy-sensitive or enterprise extensions tracking engagement

## Specification

### Schema

### Current Behavior
- `browser.runtime.setUninstallURL()` can register a page to be opened when the extension is uninstalled.

### Proposed Changes

#### Option: New API Methods
Introduce dedicated self-tracking event listeners:
- `browser.management.onSelfDisabled`
- `browser.management.onSelfUninstalled`

These APIs would:
- Be available **without** any permission
- Only apply to the **calling extension**
- Preserve privacy and avoid misuse

**Example:**
```javascript
// New self-tracking methods (no permissions needed)
browser.management.onSelfDisabled.addListener(() => {
  // Handle self disable
});

browser.management.onSelfUninstalled.addListener(() => {
  // Handle self uninstall
});


### Backward Compatibility
- Existing APIs remain unchanged

## Examples

### Proposed Usage
```javascript
// No "management" permission needed
browser.management.onSelfDisabled.addListener(() => {
  // Handle own disable
});
```

### New Permissions
- No new permissions required

### Manifest File Changes
- No changes needed

## Security and Privacy

### Exposed Sensitive Data
- No sensitive or cross-extension data exposed
- Only the extension's own lifecycle events are accessible

### Abuse Mitigations
- Self-events only trigger for the calling extension
- Cannot be used to monitor other extensions
- Aligns with existing permission models and event scoping

### Additional Security Considerations
- These events must be implemented carefully to avoid timing leaks or bypasses

## Alternatives

### Existing Workarounds
- Use `setUninstallURL`, which only applies to uninstall (not disable)

### Open Web API
`browser.runtime.setUninstallURL()` exists and helps track uninstall via a landing page, but has limitations:
1. Does not support disable events
2. Cannot silently log analytics without opening a page
3. Fails if uninstall occurs after a prior disable
4. Not suitable for admin-installed extensions, where mass page loads can be disruptive

## Implementation Notes
- No changes to the permission model
- Requires clear documentation of new API behaviors
- Should aim for cross-browser consistency

## Future Work
1. Add standardized reason codes for disable/uninstall events (e.g., user feedback, inactivity, forced policy)
2. Explore unified `browser.runtime.onLifecycleEvent` API for extensibility
   
