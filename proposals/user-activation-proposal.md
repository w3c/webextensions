# Proposal: Rules for User Activation Consumption in WebExtensions

## 1. Overview
This proposal defines which WebExtension APIs should consume user activation
and which APIs should not. The goal is to improve security, predictability, and
cross-browser consistency.

## 2. Intrusive APIs (Should Consume User Activation)
These APIs perform actions that directly affect the user interface or execute
privileged actions. They must consume user activation.

Examples:
- Opening new tabs or windows
- Modifying existing tabs
- Clipboard write access
- Triggering downloads
- Launching popups

## 3. Non-Intrusive APIs (Should NOT Consume User Activation)
These APIs do not directly affect the user interface and should continue to work
without requiring user activation.

Examples:
- Reading tab information
- Background script actions
- Messaging between extension contexts
- Sync storage access
- Network requests from extensions
- Injecting CSS/JS using permissions

## 4. Balanced Approach
To maintain consistency and developer flexibility:
- User activation should be consumed only for intrusive actions
- Non-intrusive actions must not consume activation
- Browsers should document which APIs consume activation
- Clearly define when activation expires after use

## 5. Purpose
This proposal supports Issue #920  
It aims to clarify activation rules and reduce confusion for extension developers.
