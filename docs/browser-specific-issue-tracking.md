# Reporting Browser-Specific issues
The W3C WebExtension Community Group and Working Group issue tracker is dedicated to aligning on cross-browser behavior, API proposals and specification changes.

If you encounter a bug or unexpected behavior only occurring in one specific browser, please report it directly to that browser. This document describes the different processes for each browser and what steps to follow. When reporting in multiple locations (like both a forum and issue tracker), make sure to cross-reference them.

---

## Blink / Chromium

If a bug occurs in both Chrome and a Chromium-based browser (for example, Microsoft Edge or Opera), it is best reported to the Chromium bug tracker. If it only appears in a specific Chromium-based browser, report it to the specific browser tracker.

### Google Chrome & Chromium
* **Issue Tracker:** [Chromium Bug Tracker](https://bugs.chromium.org/p/chromium/issues/list)
* **Discussion:** [Chromium Extensions Google Group](https://groups.google.com/a/chromium.org/g/chromium-extensions)

### Microsoft Edge
* **GitHub (Preferred):** [MicrosoftEdge-Extensions Issues](https://github.com/microsoft/MicrosoftEdge-Extensions/issues/)
* **In-Browser Feedback:** Issues can also be tracked at the [Feedback Portal](https://feedbackportal.microsoft.com/feedback/forum/b8da43d5-ef1b-ec11-b6e7-0022481f8472).
* **Contact:** You can share feedback reports with `ext_dev_support@microsoft.com` or on X (Twitter) using the hashtag `#edgeextensions`.
* **Note**: For Edge on iOS, see the [WebKit](#edge-on-ios) section.

### Vivaldi
* An issue is best reported both as bug report and in discussion in the forums. Make sure to cross-reference them.
* **Bug Reports:** [Vivaldi Bug Report Form](https://vivaldi.com/bugreport/?project=VB&type=normal)
* **Discussion:** [Vivaldi Forums](https://forum.vivaldi.net/category/51/extensions)

### Opera
* **Forums:** [Opera Forums](https://forums.opera.com/)

### Naver Whale
* **Forums:** [Naver Whale Forum](https://whale.naver.com/en/)

---

## Gecko

### Mozilla Firefox
* **Issue Tracker:** [Bugzilla](https://bugzilla.mozilla.org/buglist.cgi?f9=component&f11=CP&f4=product&v9=Extensions&f1=OP&o5=equals&v4=Firefox%20for%20Android&f6=CP&query_format=advanced&o8=equals&o2=equals&classification=Client%20Software&classification=Developer%20Infrastructure&classification=Components&classification=Server%20Software&classification=Other&f10=CP&f8=product&v8=GeckoView&f7=OP&v2=Web%20Extensions&f2=team_name&j1=OR&f5=component&o4=equals&o9=equals&f3=OP&v5=WebExtensions&order=Last%20Updated&bug_status=__open__)
* **[Create new issue](https://bugzilla.mozilla.org/enter_bug.cgi?product=WebExtensions)**<br>Note: Make sure to only select the Android component if the issue only appears on Firefox for Android

---

## WebKit

### Apple Safari
* **WebKit Bugzilla:** [WebKit Extensions Bug Tracker](https://bugs.webkit.org/enter_bug.cgi?product=WebKit&component=WebKit%20Extensions) <br>For API-related issues.
* **Feedback Assistant:** [feedbackassistant.apple.com](https://feedbackassistant.apple.com/)<br>For UI-related issues. Issues are private. For public awareness issues can be reported in the forum as well while linking to the Feedback ID.
* **Forums:** [Developer Forums - Safari Extensions](https://developer.apple.com/forums/tags/safari-extensions)

### Edge on iOS
Edge on iOS uses the WebKit extension APIs. Make sure to test if the issue also appears in Safari. If it does, the [Apple Safari](#apple-safari) instructions should be followed in addition to reporting the issue on GitHub as mentioned in the [Microsoft Edge](#microsoft-edge) section.

### Orion
DNR issues in Orion often also appear in Apple Safari. Make sure to first check if the issue also happens in Apple Safari and report it there.
* **Issue Tracker:** [Orion Public Issue Tracker](https://orionfeedback.org/t/extensions)

---

## Document maintenance
This guide was originally authored in https://github.com/w3c/webextensions/issues/155. If you found an issue in this document or want to add details, you can open an issue with https://github.com/w3c/webextensions/issues/new/choose.
