# Proposal: Rules for User Activation Consumption in WebExtensions

## 1. Background
Some APIs in WebExtensions currently require user activation (like a click), while others do not consume activation. This causes confusion and inconsistent behavior across browsers.

## 2. Goals
- Improve predictability for users
- Maintain developer flexibility
- Define clear rules on when activation must be consumed

## 3. Proposed Rules

### 3.1 APIs that MUST consume user activation:
- Opening or closing tabs
- Modifying tabs (move, update, reload)
- Opening windows
- Clipboard write access
- Download initiation

These are intrusive actions and should only run with explicit user consent.

### 3.2 APIs that SHOULD NOT require user activation:
- Background scripts
- Scheduled alarms
- Passive listeners
- Sync storage
- Message passing (runtime.sendMessage)

These tasks are non-intrusive and should not break workflows.

### 3.3 Possible Middle Ground
Some APIs may depend on context. For example:
- Popup → background script: may carry gesture for one transaction
- Content script → background: should not carry activation (security risk)

## 4. Documentation Needed
Clear documentation is required for:
- Which APIs consume activation
- Which contexts allow gesture forwarding
- How user activation is consumed per call

## 5. Conclusion
This proposal attempts to clarify activation rules and reduce confusion. Further discussion from the community is welcome.
