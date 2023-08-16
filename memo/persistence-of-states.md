# Persistence of API States

## Overview
There are many extension APIs that have some kind of states. The persistence of these states is often discussed in various issues in WECG, some with clear definitions and some without. Here is a summary of these states and their persistence.

## Goals
At present, the persistence of these states depends on browsers' implementation. This document provides a high-level perspective for them. The goal is to make the design and implementation of these states in a consistent manner on the platform, as well as consistent behavior among different browsers.

## Definitions
- A) Session Only Persistence: The state is only saved in memory, and is lost or restored to the default state when encountering the following situations.
- B) Across Browser Sessions Persistence: The state is persistent when exiting and restarting the browser or upgrading the browser (i.e. restarting the browser).
- C) Extension Upgrading Persistence: The state is persistent when upgrading the extension to a new version, also including reload the extension (click the reload button).
- D) Extension Disable and Re-enable Persistence.

## Principles
- Functions declared in manifest.json, like "content_scripts" and "declarative_net_request", will be cleared and the new functions will take effect when upgrading the extension. So they are not extension upgrading persistent.
- If a state is across browser sessions persistent, it should also be persistent when disabling then re-enabling the extension.

## State Management by Developers
If developers want to keep states persistent across B, C or D, but the default persistence doesn't meet their needs, then developers need to maintain the states by themselves through
- `runtime.onStartup()`: when the browser (or a profile in this browser) first starts.
- `runtime.onInstalled()`: when installing or upgrading the extension, and when upgrading the browser.
- `runtime.onEnabled()`: this api is not yet implemented.

## API List

| API  | Chrome | Firefox | Safari |
| ------------- | ------------- | ------------- | ------------- |
| action.set* (e.g. setBadgeText)| A | | |
| [alarms](https://developer.chrome.com/docs/extensions/reference/alarms)  | B + C + D (except [a bug](https://crbug.com/1285798)) | | |
| [contextMenus](https://developer.chrome.com/docs/extensions/reference/contextMenus) | B + D | | |
| [commands](https://developer.chrome.com/docs/extensions/reference/commands) | B + C + D (can't set by api) | | |
| [downloads.setUiOptions()](https://developer.chrome.com/docs/extensions/reference/downloads/#method-setUiOptions) | A | | |
| "declarative_net_request" in manifest | B + D | | |
| [declarativeNetRequest.updateDynamicRules()](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/#method-updateDynamicRules) | B + C + D | | |
| [declarativeNetRequest.updateSessionRules()](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/#method-updateSessionRules) | A | | |
| [power.requestKeepAwake()](https://developer.chrome.com/docs/extensions/reference/power/#method-requestKeepAwake) | A | | |
| storage.session | A | | |
| storage.session.setAccessLevel() | | | |
| storage.local | B + C + D | | |
| "content_scripts"  in manifest | B + D | | |
| [scripting.registerContentScripts()](https://developer.chrome.com/docs/extensions/reference/scripting/#method-registerContentScripts) | B + D: if `persistAcrossSessions` is true <br> A: if `persistAcrossSessions` is false | | |
| proxy.settings.set() | | | |
| [sidePanel.setPanelBehavior()](https://developer.chrome.com/docs/extensions/reference/sidePanel/#method-setPanelBehavior) | B + C + D | | |

\* This table may not be exhaustive, nor may it be adequately tested. Additions and corrections are welcome.
