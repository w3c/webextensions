# WECG TPAC Oct 26, 2026


## Agenda

https://github.com/w3c/webextensions/wiki/2026-TPAC-Coordination#monday

(all times UTC)

 * State of the Browsers - 15:30 - 16:00 (30 min)
 * Spec Progress - 16:00 - 16:45 (45 min)


## Attendees

 * Alex Nahas (Independent)
 * George Henderson (Capital One)
 * Benjamin Bruneau (1Password)
 * Jason Kurian (1Password)
 * Carlos Jeurissen (Invited expert)
 * Simeon Vincent (Invited expert)
 * Rob Wu (Mozilla)
 * Ehsan Toreini (Samsung, TAG Associate)
 * Aram Zucker-Scharff (WaPo)
 * Kiara Rose (Apple)
 * Tim Judkins (Google Chrome)
 * Devlin Cronin (Google Chrome)
 * Oliver Dunk (Google Chrome)
 * Patrick Kettner (Google Chrome)
 * Gaurang Tandon
 * Mukul Purohit (Microsoft) [Remote]
 * Mike “sideshowbarker” (W3C) [Remote]
 * Casey Garland (Capital One)
 * Timothy Hatcher (Apple) [Remote]
 * Michael Zaporozhets (Shopify)


## Notes


### State of the Browsers

15:30 - 16:00
Each browser vendor gives a short overview (about 10 minutes each) of what has happened with extensions in their browser over the past year.


#### Mozilla Firefox

 * APIs
   * splitViewId in Firefox; finalized [API proposal](https://github.com/w3c/webextensions/pull/1019) (to be implemented soon)
   * action.openPopup without user gesture, [request credentials via](https://blog.mozilla.org/addons/2026/04/23/webextensions-api-changes-firefox-149-152/#:~:text=WebAuthn%20RP%20ID%20assertion,-Available) Web Authentication API with host permissions directly from extension.
   * documentId supported and documented as [Work with documentId](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Work_with_documentId) on MDN.
   * publicSuffix API, [thanks](https://blog.mozilla.org/addons/2026/08/06/how-the-publicsuffix-api-was-created/) to [@mckenfra](https://github.com/mckenfra).
   * Container tabs enabled by default in Firefox, expanded contextualIdentities API.
   * File:-access [requires separate permission](https://blog.mozilla.org/addons/2026/07/23/firefox-153-webextensions-api-updates/#:~:text=File%20access%20now%20requires%20a%20dedicated%20permission), instead of “all URLs”.
   * Removed inadvertent script execution in moz-extension with executeScript.
   * manifest sandbox [support](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/154#changes_for_add-on_developers), thanks to [@Robbendebiene](https://github.com/Robbendebiene) (Gesturefy dev).
   * … many other minor API changes/enhancements, many of them in alignment with this group.
 * Most API changes also available in the latest Firefox Extended Support Release (Firefox ESR 153, supported until August 2027). Overviews of above changes:
   * https://blog.mozilla.org/addons/2026/04/23/webextensions-api-changes-firefox-149-152/
   * https://blog.mozilla.org/addons/2026/07/23/firefox-153-webextensions-api-updates/
 * Developer experience
   * [Scripts from localhost](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy#scripts_from_localhost) are supported in temporarily loaded extensions
   * AMO [supports rollback to previous version](https://blog.mozilla.org/addons/2025/09/19/now-you-can-roll-back-to-a-previous-version-of-your-extension/)
   * Automatic validation of build from source code [with build-for-amo npm script](https://discourse.mozilla.org/t/help-our-source-code-review-process-add-a-build-for-amo-script/148822)


#### Apple Safari

 * [kiara] Some of this information will be repeated from our State of the Browsers talk in London.
 * [kiara] 179 (?) commits in webkit. 83 bug fixes. Working hard to fix inconsistencies and get them to developers as quickly as possible.
 * [kiara] Improvements to Declarative Net Request, Web Request have improved support for uBlock Origin Lite and other extensions.
 * [kiara] Document ID, externally_connectable, wildcard matches, specifying execution world for scripting, set access level, improvements to the Alarms API. Seeing improvements using WPT to identify cross-browser bugs, align on common designs where there are incompatibilities.
 * [kiara] Can now use App Store Connect to upload an extension directly, no custom app build required. Load extension temporarily in Safari, and SafariDriver. Using SafariDriver under the hood for WPT tests.
 * [kiara] New API that allows developers to open an extension's settings in Safari. Allows extensions to direct users to settings.
 * [kiara] Can query the state of your extension.
 * [kiara] Better support for converting a Safari app extension to a web extension.
 * [kiara] New in WebKit: Offscreen API support (in response to a CG request), reducing inconsistencies. In progress: sidebar API.
 * [kiara] New feature to let users generate extensions for their specific needs.
 * [kiara] Looking ahead, continuing our involvement in the WECG/WEWG, defining specs. Looking forward to continuing to work with you all!


#### Google Chrome

API Changes

 * Browser namespace
   * Launched global support for the `browser` namespace
   * Included a few different (beneficial) yak shaves
     * Promise support in messaging APIs
     * Promise support for devtools APIs
 * `chrome.publicSuffix` API (WECG [issue 231](https://github.com/w3c/webextensions/issues/231))
 * Split View Tab Management (`tabs.createSplit` & `tabs.unsplit`)
 * Unified Lifecycle: `runtime.onExtensionLoaded`
 * Messaging: Structured Cloning Opt-In (WECG [issue 931](https://github.com/w3c/webextensions/issues/931))
 * Custom Protocol Handlers: navigator.registerProtocolHandler() support
 * Misc
   * Alarms
     * alarms.clearAll() → Promise&lt;undefined> (WECG [issue 1055](https://github.com/w3c/webextensions/issues/1055))
     * 1-second alarm granularity
     * persistAcrossSessions flag
   * Synchronous runtime.getVersion() (WECG [issue 878](https://github.com/w3c/webextensions/issues/878))
   * sidePanel.open() accepts WINDOW_ID_CURRENT

Googlebook OS

 * New laptop offering from Google, based on Android
 * Ported ~all the public extensions platform to work with the new OS
 * Coming soon: native messaging support to communicate with Android apps

Browser changes

 * Built-in On-Device AI (Gemini Nano)
 * New extensions menu
   * Continued rollout
   * chrome.permissions.addHostAccessRequest / removeHostAccessRequest
 * Pinning by default
   * Newly-installed extensions are pinned by default
   * In response to developer feedback from the new extensions menu

Security fixes

 * Many, hundreds in extensions alone; thanks to Mythos and LLM.

Coming soon

 * Async SW Listener Registration — markListenerRegistrationComplete() ([WECG proposal](https://github.com/w3c/webextensions/blob/main/proposals/async-listener-registration.md))
 * Lots of smaller APIs (getFrameId, getDocumentId, etc)


#### Microsoft Edge

 * [mukul] Security: we've been doing more to address campaigns, sharing information with other browser vendors about vulnerabilities we identify. Related to discussions during previous meetings.


### Spec Progress

16:00 - 16:45
We've had some discussions in recent weeks about contributions from a couple of members to the spec. Review the progress on those items and discuss where to go next.
Open pull requests: [PR 1110](https://github.com/w3c/webextensions/pull/1110) (Alarms API IDL), [PR 1123](https://github.com/w3c/webextensions/pull/1123) (background manifest key and background content), [PR 1134](https://github.com/w3c/webextensions/pull/1134) (`icons` and `icon_variants`), and [PR 1137](https://github.com/w3c/webextensions/pull/1137) (Bikeshed conventions for IDs and links).
Related inconsistencies: [issue 1119](https://github.com/w3c/webextensions/issues/1119), [issue 1122](https://github.com/w3c/webextensions/issues/1122), [issue 1127](https://github.com/w3c/webextensions/issues/1127), [issue 1136](https://github.com/w3c/webextensions/issues/1136), [issue 949](https://github.com/w3c/webextensions/issues/949), [issue 785](https://github.com/w3c/webextensions/issues/785).
Open questions on [PR 1134](https://github.com/w3c/webextensions/pull/1134): whether to support non-square size keys such as `16x16`, and whether to follow the [parent `darkmode` member](https://github.com/w3c/manifest/pull/1205) used by the Web Applications WG. See [Carlos's comment](https://github.com/w3c/webextensions/pull/1134#issuecomment-6398386953).

#### [PR 1110](https://github.com/w3c/webextensions/pull/1110): Add Alarms API IDL

 * [oliver] [PR 1110](https://github.com/w3c/webextensions/pull/1110) - only item to discuss here is [a comment raised by Carlos](https://github.com/w3c/webextensions/pull/1110/changes#r4284552376).
 * [oliver] In our spec we have a behavior that isn't implemented consistently. When we add an `Issue: ` in the specification, should we name the browser explicitly or link to a GitHub issue that names the browser?
 * [sideshowbarker] That is reasonable.
 * [oliver] Firefox folks, is that expected behavior? Are you open to change?
 * [rob] I'd have to check the implementation. If there's consensus around a particular behavior, we'd be open to change. We're also considering some alarms API changes that have been discussed in the group; would be a good time to see whether and how to align on cases like this.
 * [oliver] Next steps?
 * [rob] Approved; the spec preview is giving some errors right now, will look into it async.

#### [PR 1123](https://github.com/w3c/webextensions/pull/1123): Specify the background manifest key and background content

 * [timothy] Spec for background manifest keys and semantics; not including lifecycle.
 * [oliver] “If manifest keys that are defined in this specification are specified with a different JSON type than defined in this specification, implementors must ignore those keys.” This seems like something we may want to have a warning for.
 * [devlin] Browsers can differentiate or expand beyond what's in the spec. Saying we should error/warn as blanket language may go against that.
 * [timothy] Good call out.
 * [devlin] In Chrome we're very inconsistent about when we throw a hard error and refuse to load and when we warn. I don't know if anyone else is as inconsistent. Worth including guidance in the spec?
 * [timothy] Makes sense since we're targeting as much cross-browser compatibility as possible.
 * [devlin] Don't know how much we want to lean into specifying exact behavior.
 * [rob] Firefox is inconsistent in manifest key errors/warnings, but we made a cross-browser effort to treat background as warnings. On the PR I commented about SHOULD/MUST/etc to describe more clearly whether something is advisory or a stronger guideline.
 * [timothy] W3C just introduced a beta revision of a style guide.
 * [simeon] Just checked the specification and it includes the line “However, for readability, these words do not appear in all uppercase letters in this specification.”
 * [sideshowbarker] It's up to the individual editors.
 * [rob] No strong preferences.
 * [kiara] Prefer lowercase
 * [simeon] lowercase it is, we've solved it!

#### [PR 1134](https://github.com/w3c/webextensions/pull/1134): Specify `icons` and `icon_variants`

 * [carlos] … Web Applications group has similar problem with `icons` in web manifests. Christian Liebel?
 * [timothy] We need to document what we do today as much as possible. We have dark mode implementation now, we shouldn't try to change it before we write the spec text.
 * [rob] I see the pull request adds Carlos as an editor. That is a more formal role, not necessarily “contributor” of spec: https://www.w3.org/guide/editor/role.html .
 * [kiara] I also added myself before.
 * [simeon] Let's discuss that at a different occasion and fix it up.

#### [PR 1152](https://github.com/w3c/webextensions/pull/1152): Specify the `activeTab` permission

 * [kiara] Attempts to define the concept of a temporary host permission. Behavior is currently inconsistent across browsers. In Chrome and Safari a reload does not clear the temporary host permission, in Firefox it does.
 * [rob] I'd have to discuss this with my team. For context, Firefox grants access to the tab's content only right now, whereas Chrome/Safari translate the activeTab grant to host permission access to the host of the tab, across many APIs.
 * [rob] (after meeting) Firefox is willing to align: https://github.com/w3c/webextensions/pull/1152#issuecomment-6468577315

(other topics moved to Thursday)
