# API Conventions

## Introduction

This document outlines our shared stances on API conventions like method naming conventions and type constants
casing style.

While existing APIs may not yet fully comply with these stances, we strive to align with them for all future API
additions and modifications.

## Identifiers

| Kind | Style | Example |
|---|---|---|
| Namespace | camelCase | `declarativeNetRequest` |
| Method | camelCase, verb first | `getRecentlyClosed()` |
| Event | `on` followed by camelCase | `onVisitRemoved` |
| Property and parameter | camelCase | `maxResults` |
| Type | PascalCase | `SearchEngine` |
| Constant | SCREAMING_SNAKE_CASE | `TAB_ID_NONE` |
| Enum value | kebab-case | `"per-origin"` |
| Manifest key | snake_case | `"default_title"` |
| Manifest enum value | snake_case | `"document_idle"` |

A property that is also in the manifest follows
[Properties in the Manifest and an API](#properties-in-the-manifest-and-an-api).

### Acronyms

An acronym is written in capitals, including as the first word of a PascalCase name (`URLTransform`). As the
first word of a camelCase name it is lowercase (`urlFilter`). snake_case and kebab-case names are always
lowercase.

The exception is ID, which is written `Id` to match the prevalent `tabId`, `windowId`, `frameId` and `documentId`.

**Right:**

```js
browser.runtime.getURL()
condition.urlFilter
details.tabId
URLTransform
```

**Wrong:**

```js
browser.runtime.getUrl()
condition.URLFilter
details.tabID
UrlTransform
```

### Redundant Words

A property name leaves out a word that the method name already says.

**Right:**

```js
action.setIcon({ variants })
```

**Wrong:**

```js
action.setIcon({ iconVariants })
```

## Constants and Enum Values

A constant is named in SCREAMING_SNAKE_CASE.

An enum value is a kebab-case string.

**Right:**

```js
browser.tabs.TAB_ID_NONE === -1
browser.scripting.ExecutionWorld.ISOLATED === "isolated"
browser.runtime.ContextType.OFFSCREEN_DOCUMENT === "offscreen-document"
browser.runtime.RequestUpdateCheckStatus.UPDATE_AVAILABLE === "update-available"
```

**Wrong:**

```js
browser.tabs.tabIdNone === -1
browser.scripting.ExecutionWorld.ISOLATED === "ISOLATED"
browser.runtime.ContextType.OFFSCREEN_DOCUMENT === "offscreenDocument"
browser.runtime.RequestUpdateCheckStatus.update_available === "update-available"
```

## Manifest Keys and Values

A manifest key is snake_case, including keys nested inside a manifest object. An enum value in the manifest is
snake_case too.

A property that is also in an API follows
[Properties in the Manifest and an API](#properties-in-the-manifest-and-an-api).

**Right:**

```json
"default_icon": "icon.png"
"run_at": "document_idle"
"preferred_environment": ["service_worker"]
```

**Wrong:**

```json
"default-icon": "icon.png"
"run_at": "document-idle"
"preferredEnvironment": ["service_worker"]
```

## Properties in the Manifest and an API

A property that is in both the manifest and an API takes the style of where it is written. The manifest key
`css_origin` is `cssOrigin` in `scripting.registerContentScripts()`, and `icon_variants` is `iconVariants` in
`menus.create()` and `variants` in `action.setIcon()`, with its `color_schemes` as `colorSchemes`. Likewise an
enum value is kebab-case in an API and snake_case in the manifest.
