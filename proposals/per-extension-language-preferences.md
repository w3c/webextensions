# Proposal: Per-extension language preferences

**Summary**

This proposal allows developers (users) to set a specific language for their extension (which may be different from the browser or system default language) and create a language selection menu for users.

**Document Metadata**

**Author:** hanguokai

**Sponsoring Browser:** Chromium

**Contributors:** 

**Created:** 2024-06-16

**Related Issues:** [#258](https://github.com/w3c/webextensions/issues/258)

## Motivation

### Objective

Prior to this proposal, browsers automatically selected a `browser.i18n` language for extensions, and developers (users) could not set a specific language.

For multilingual users, sometimes they want to set a specific application (extension) to another language that is different from the system (browser). This need is not uncommon.
[Android 13](https://developer.android.com/guide/topics/resources/app-languages), [iOS 13 and macOS Catalina](https://developer.apple.com/news/?id=u2cfuj88) support a feature
called "Per-app language preferences (settings)". This proposal brings the same function to browser extensions.

#### Use Cases

- Extensions create a language selection menu for users.
- [Optional] Browsers could potentially provide a built-in language selection menu for users, just like Android and iOS.
- [Optional] Extensions could integrate third-party i18n implementations (frameworks) with the browser's built-in language selection menu.

### Known Consumers

This is a generic i18n feature, which means that all types of extensions can use it. Some extensions already provide this functionality via workarounds or non-browser.i18n implementations.

## Specification

### Definitions

In this document:
- **locale** or **language code** or **language tag** is a string that represent a language, defined in [BCP 47](https://www.rfc-editor.org/info/bcp47).
For example, `en-US`, `zh-CN`, `fr`. It is used by `browser.i18n`, `Date`, `Intl` and various other APIs.
- **the user preferred language** is the language set by `i18n.setCurrentLanguage(code)`. The user may not have set it.
- **the extension displayed language** is the language which the extension is displayed in. Note that the extension displayed language may be different from the browser UI language. For example, if the user preferred language is not set, the browser UI language is English, and the extension only supports French (default) and Japanese, then the extension displayed language is French because `i18n.getMessage()` returns French message at this situation.

### Schema

```ts
/**
 * Get the extension displayed language.
 * return the language tag, e.g. en-US.
 */
i18n.getCurrentLanguage() : string

/**
 * Set the user preferred language.
 * if code is null, revert to the unset state.
 * if code is not valid, return a rejected Promise.
 * else return a Promise resolved when the operation is complete.
 */
i18n.setCurrentLanguage(code: string) : Promise<void>

/**
 * Get all languages that supported by this extension.
 * return a Promise resolved with an array of language tags.
 */
i18n.getAllLanguages(): Promise<string[]>

/**
 * After changing to a new language, the browser triggers a language changed event.
 * The callback is function(code: string) : void.
 * The code parameter in the callback is the new language.
 */
i18n.onLanguageChanged.addListener(callback)
```

### Behavior

#### Behavior of `i18n.getCurrentLanguage()`

This method return the language that the extension is displayed in.

- If the extension doesn't use `browser.i18n` (there is no "_locales" directory), return `undefined`.
- If the preferred language is not set by `i18n.setCurrentLanguage()`, returns the current language used by `i18n.getMessage()`, assuming that all languages support all possible keys.
- If the preferred language has been set by `i18n.setCurrentLanguage()`, and the extension supports this language, then return this language.
- If the preferred language has been set by `i18n.setCurrentLanguage()`, but the extension doesn't support this language (no message file for this language), then treat as if the preferred language is not set. This is an edge case, for example, the language was removed when the extension was upgraded.

##### Use Case 1: use the extension displayed language with other locale-related APIs.

For example, if the preferred language is not set, the language of the browser UI is English (en-US), the extension supports French (default) and Japanese, then `i18n.getCurrentLanguage()` return `"fr"` because `i18n.getMessage()` return French message at this situation.

```js
// use current extension displayed language to format date
const locale = browser.i18n.getCurrentLanguage();
const today_date = new Date().toLocaleString(locale); // format date string in 'fr'

// if don't use current extension displayed language, it may be formatted in other locale
const today_date = new Date().toLocaleString(); // format date string in 'en-US'
```

##### Use Case 2: show the current language in the extension language selection menu.

#### Behavior of `i18n.setCurrentLanguage(code)`

This method sets the user preferred language for this extension.

- If the extension doesn't use `browser.i18n` (there is no "_locales" directory), return a rejected Promise.
- If the code is an invalid language tag or an unsupported language by this extension, return a rejected Promise.
- If the code is null, revert to the unset state.
- else do the following:
  1. save the language persistently, and make sure that the language is prioritized for use next time.
  1. return a resolved Promise.
  1. trigger `i18n.onLanguageChanged` event.

In addition, when `i18n.setCurrentLanguage(code)` success:
- Because some values in manifest.json may be changed, like `name`, `short_name`, `description` and `action.default_title`:
  - The browser should update related extension UI, e.g. `action.default_title`.
  - The browser might update related browser UI, but this part is up to the browser to decide.
- Text from `i18n.getMessage()` and css files don't update. These are handled by developers.

##### Persistence of `i18n.setCurrentLanguage(code)`

This setting is persistent when:
- restart or upgrade the browser.
- disable then re-enable the extension.
- upgrade the extension to a new version.

#### Behavior of `i18n.getAllLanguages()`

This method returns an array of language tags that the extension supported, e.g. `["en", "fr", "ja", "zh-CN"]`.
This is a convenient method. Without this method, developers need to hardcode it into their code.

#### Behavior of `i18n.onLanguageChanged` event

When the user preferred language is changed to a new different language by `i18n.setCurrentLanguage(code)`, this event is fired.
Developers use this event to know the language changed, and might do the following:

- Update the content of extension pages in place (without refreshing the page)
- Reload extension pages:
  - If the page is stateless, refresh the page directly.
  - If the page is stateful, save the current state and then refresh the page.
  - Prompts the user that the language setting has changed, and asks the user if they want to refresh the page immediately.
- Re-create the extension context menus, since the title of the context menus shoule be updated.
- Update the action title and badge text if needed.

#### Behavior of `i18n.getMessage()`, manifest and CSS files

When this proposal is implemented, the behavior of these existing functions will change as follows:

- If the preferred language is not set by `i18n.setCurrentLanguage()`, it is consistent with the existing behavior.
- If the preferred language is set by `i18n.setCurrentLanguage()`, and the extension supports this language, then prioritize using that language.
- If the preferred language is set by `i18n.setCurrentLanguage()`, but the extension doesn't support this language, then treat as if the preferred language is not set. This is an edge case, for example, the language was removed when the extension was upgraded.

### Integrate other i18n implementations (frameworks) with browser.i18n

This proposal can also be integrated with third-party i18n frameworks, as these frameworks typically allow developers to specify the language to be used.
For example, developers use `i18n.getCurrentLanguage()` and `i18n.setCurrentLanguage()` for the user preferred language, but don't use `i18n.getMessage()`.

```js
otherI18nFramework.setLanguage(browser.i18n.getCurrentLanguage());

let text = otherI18nFramework.getMessage(key);
```

### New Permissions

N/A

### Manifest File Changes

N/A

## Security and Privacy

### Exposed Sensitive Data

N/A

### Abuse Mitigations

N/A

### Additional Security Considerations

N/A

## Alternatives

### Existing Workarounds

##### Workaround-1: fetch message files

This is not ideal. Developers need to solve many problems on their own, such as saving the preferred language, implementing placeholders, and fallback mechanisms.

##### Workaround-2: use other i18n frameworks or implement one yourself

There are some JavaScript i18n frameworks that provide similar features, which allow developers to specify the language they want to use.
In fact, this workaround is equivalent to asking developers to give up using `browser.i18n`.
In addition, developers need to save the preferred language by themself.

##### Workaround-3: mix browser.i18n and other workarounds.

Because some text can only be localized by `browser.i18n`, such as the extension name and description, developers often mix different implementations.

### Open Web API

The Web provides some related tools, such as `Intl`, but there is no unified framework that provides functionality such as `browser.i18n.getMessage()`.
There are some third-party i18n frameworks, but they use custom mechanisms rather than the `browser.i18n` mechanism.

## Implementation Notes

When the extension is upgraded, if the new version removes the language that was set by `i18n.setCurrentLanguage(code)`, the user preferred language should be reverted to the unset state.

## Future Work

### Browser built-in language selection menu

Based on the capabilities provided by this proposal, browsers could provide a unified built-in language selection menu for extensions, like Android and iOS.
Whether to provide the built-in language selection menu and how to implement it is up to the browser to decide.

The built-in language selection menu has the following benefits:
- Easy for developers: Developers do not need to implement it themselves, they only need to adapt to this proposal.
- Easy for users: A unified UI makes it easier for users to use, otherwise each extension might be set up differently.
- It is convenient for developers to develop and test i18n functions by switching the extension language.

If the browser would like to support the built-in language selection menu for extensions, the manifest file should add a new key for developers to opt-in this feature, like the following:
```
{
  "name": "__MSG_extName__",
  "default_locale": "en",
  "builtin_languages_menu": true | false(default)
}
```
