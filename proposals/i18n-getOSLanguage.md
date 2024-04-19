# Proposal: i18n.getOSLanguage

**Summary**

Allows getting the language/locale of your operating system as a [BCP47 language tag](https://www.rfc-editor.org/bcp/bcp47.html)

**Document Metadata**

**Author:** [carlosjeurissen](https://github.com/carlosjeurissen)

**Sponsoring Browser:** TBD

**Created:** 2024-03-18

**Related Issues:**
https://github.com/w3c/webextensions/issues/252
https://bugzilla.mozilla.org/show_bug.cgi?id=1888486

## Motivation

### Objective

Allow extensions to display UI in the user's system language, even when this is distinct from the browser's UI language (which is restricted to languages supported by the browser).

#### Use Cases

Having the original OS language is useful for language-related extensions and for extensions who want to provide translations more true to the OS language. For example, to adapt to a specific sub-language, like Belgium-Dutch (nl-BE). While i18n.getUILanguage would return 'nl'.

### Known Consumers

Language-related extensions and extensions wanting to match the language of the OS more closely independent of the langauge of the browser.

## Specification

### Schema

`i18n.getOSLanguage()` would synchronously return a [BCP47 language tag](https://www.w3.org/International/core/langtags/rfc3066bis.html) like `i18n.getUILanguage()` does right now.

It would follow the following signature for [i18n.json](https://chromium.googlesource.com/chromium/src/+/4299ce68496b32ba309e2f012e0db5b4b8cd478a/extensions/common/api/i18n.json):


```json
{
  "name": "getOSLanguage",
  "type": "function",
  "nocompile": true,
  "description": "Gets the UI language of the Operating System. This is different from $(ref:i18n.getUILanguage) which returns the UI language of the web browser.",
  "parameters": [],
  "returns": {
    "type": "string",
    "description": "A BCP47 language tag such as en-US or pt-BR."
  }
}
```

### New Permissions

As `browser.i18n.getUILanguage()` does not require a permission, browser.i18n.getOSLanguage also should not.

### Manifest File Changes

No new manifest fields

## Security and Privacy

### Exposed Sensitive Data

The language of the OS will be purposely exposed.

## Alternatives

### Existing Workarounds

Currently, if an extension wants to offer languages outside of what the current browser language uses, it must do so by presenting a user-facing options page. However, currently there is no way to reasonably detect a language code outside of the browser's UI language with existing APIs.

### Open Web API

To combat fingerprinting, this should not be an Open Web API, like browser.i18n.getUILanguage is not.
