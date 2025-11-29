# Proposal: Rules for User Activation Consumption in WebExtensions

This proposal is related to Issue #920: “Should extension APIs consume user activation?”

## 1. Why this proposal?
Some extension APIs should run only after a user gesture (click, keypress) for safety.  
But other APIs need to run automatically (e.g., background tasks).  
Currently, behavior is inconsistent across browsers.

This proposal aims to define *clear rules*.

## 2. API Categories

### A. Critical / Intrusive APIs (should consume activation)
- Opening new windows or tabs
- Modifying browser UI
- Clipboard read/write
- Download requests

These APIs should *require* and *consume* activation to avoid abuse.

### B. Non-intrusive APIs (should not require activation)
- Logging
- Storage access
- Messaging between extension contexts
- Background listeners

These APIs must continue to work *without activation*.

## 3. Rules for Activation Consumption

### Rule 1 — Only intrusive APIs consume activation
- If an API changes user-visible UI or triggers navigation, it consumes activation.

### Rule 2 — Passive APIs never consume activation
- Background tasks do not consume or require activation.

### Rule 3 — Clear documentation
Browsers should publish:
- Which APIs require activation  
- Which APIs consume activation  
- When activation expires  

## 4. Benefits
- More predictable behavior for users
- Better consistency across Chrome, Firefox, Safari
- Helps extension developers avoid confusion

## 5. Conclusion
This proposal suggests a balanced approach:
- Restrict dangerous APIs  
- Allow background tasks  
- Provide documentation for developers
