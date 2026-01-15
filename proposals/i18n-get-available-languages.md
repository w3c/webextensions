# Proposal: `i18n.getAvailableLanguages()``

**Summary**

An API which allows extensions to get a list of BCP47 language tags containing
the languages the browser can use and the extension provides resource files for.

**Document Metadata**

**Author:** carlosjeurissen

**Sponsoring Browser:** TBD

**Contributors:** hanguokai

**Created:** 2025-01-23

**Related Issues:** https://github.com/w3c/webextensions/issues/258 and https://github.com/w3c/webextensions/issues/274

## Motivation

### Objective

Currently extensions can not easily get a list of supported languages without
hardcoding them first or need to rely on fetch try and error.

#### Use Cases

Allow to list the languages for extension settings language pickers.

Use the list of supported languages to match a specific website when applying
a content script.

Have this list independent of distribution (As some extension stores disallow
certain language tags).

Allow third parties to create polyfills for `i18n.withLanguage()` and
`i18n.setLanguage()`.

### Known Consumers

Extensions who currently have to maintain a manually currated list of supported
languages to offer content script language matching and/or allowing to change
the extension language in the extension settings.

An example of content-script matching is "Category Tabs for Google Keep", which
needs to match it's language with the page in question to properly integrate.

A simple naive implementation would be:
```js
const [pageLanguage, supportedLanguages] = await Promise.all([
  tabs.detectLanguage(),
  i18n.getAvailableLanguages(),
]);
const resourceLanguage = supportedLanguages.includes(pageLanguage);
const resourceFile = chrome.runtime.getURL(`_locales/${resourceLanguage}/messages.json`);
const messages = await fetch(resourceFile);
```

Future consumers of future related APIs like the `i18n.withLanguage()` and
`i18n.setLanguage()` APIs.

## Specification

### Schema

```typescript
namespace i18n {
  function getAvailableLanguages(): Promise<string[]>;
}
```

This API should also be exposed in content scripts.

### Behavior

Given an extension with the following resource files:
`_locales/en/messages.json`, `_locales/es/messages.json` and
`_locales/es_419/messages.json`.

The `i18n.getAvailableLanguages()` method would return a promise which resolves
with the following array: `['en', 'es', 'es-419']`.

If no resource files are specified, and/or `default_locale` in the manifest is
missing, the promise will reject with an error stating extension localisation
is required for this method to work properly.

If a browser is unable to offer a specific language tag in `i18n.withLanguage()`
or `i18n.setLanguage()`, for example, because it does not understand the tag
(think about `_locales/n/messages.json`), or if a directory has no messages.json
file, it should not include said language tag. This does not mean a browser
should only return languages the browser UI itself supports. An extension could
offer additional languages outside the set of languages used for its own browser
UI. In that case browsers can offer support for these languages and preferably
should support and return them.

### New Permissions

No new permissions are needed.

### Manifest File Changes

No manifest file changes are required.

## Security and Privacy

### Exposed Sensitive Data

The returned information could in theory already be known to the extension. This
information is not sensitive.

### Abuse Mitigations

As this does not expose sensitive data, there is no abuse potential.

### Additional Security Considerations

Exposing the list of locales an extension has resource files for is unlikely to
introduce any new security risks.

## Alternatives

### Existing Workarounds

Extensions could hard-code the supported locale tags. This is however error
prone as the list may be outdated. Some extensions may also reduce the list
of included resource files for compatibility with specific extension stores. See
https://forum.whale.naver.com/topic/39749/

### Open Web API

I18n resources are currently extension only. While there are talks about
open web dom localization (See https://github.com/mozilla/explainers/blob/main/dom-localization.md)
They are far from ready and their handling of resources will be different from
current web extensions.

## Implementation Notes

Since this information will not change during the lifecycle of an extension. It
can easily be cached on installation/update.

The locale tags need to be turned into a valid bcp47 tag. For example, for the
resource `_locales/en_US`, the bcp47 tag `en-US` should be returned.

## Future Work

Allow to use `i18n.getMessage` with a different language. See https://github.com/w3c/webextensions/issues/274
Allow to use change the language of extensions. See: https://github.com/w3c/webextensions/issues/258#issue-1344495962 and https://github.com/w3c/webextensions/pull/641
