# WECG March 2024 Meetup, Public Notes, Mar 18

Monday, the first day of the three-day in-person meetup of the WECG in San Diego ([#525](https://github.com/w3c/webextensions/issues/525)).


## Agenda

 * 9:00 - 9:30 What should we talk about?
 * 9:30 - 10:00 3p Cookie Deprecation
 * (break; transition from remote to in-person only)
 * 10:40 - 11:00 Inconsistencies
 * 11:00 - 12:00 Testing
 * 13:00 - 15:00 Issue triage


## Attendees

 * Patrick Kettner (Google)
 * Richard Worth (Capital One)
 * Casey Garland (Capital One)
 * Andrey Meshkov (AdGuard)
 * Carlos Jeurissen (Jeurissen Apps)
 * Tomislav Jovanovic (Mozilla)
 * Rob Wu (Mozilla)
 * Devlin Cronin (Google)
 * Kiara Rose (Apple)
 * David Johnson  (Apple)
 * Timothy Hatcher (Apple)
 * Jessie Berlin (Apple)
 * Mukul Purohit (Microsoft)
 * Anton Bershansky (Independent, remote)
 * Rob Wu (Mozilla)
 * Oliver Dunk (Google)


## Meeting notes


### What should we talk about?

 * (introductions)
 * [devlin] What should we talk about?
 * [carlos] Host permissions
 * [timothy] Site access
 * [casey] Direction of mobile extensions
 * [andrey] DNR and cosmetic rules
 * [simeon] Safe imperative network modification
 * [patrick] WECG issue management
 * [timothy] Shared test suite
 * [anton] 3p cookie deprecation
 * [andrey] Proxy extension API inconsistencies. Chrome and Firefox are incompatible; Safari does not support it.
 * [andrey] Firefox supports DNS API, Chrome does not.
   * [patrick] dns API is supported in Chrome's dev channel, but we never shipped.
 * [timothy] sidebar/sidePanel API unification.
 * [andrey] Browser-specific APIs, prefix?
   * [devlin] Considered separate chrome namespace, and then moving method over to e.g. the browser namespace. In practice, observations in CSS, -o-, -webkit-, etc don't work out that well.
 * [devlin] Anything else?
   * [simeon] We will revisit this at the start of Tuesday and Wednesday.
 * [timothy] Icons – SVG
 * [timothy] Dark mode
 * [andrey] Inconsistencies between browsers
   * [tomislav] Specific topics?
   * [simeon] Could roll this into “WECG issue management” topic - establishing process to track and follow up on inconsistencies
 * [carlos] Breaking changes


### 3p Cookie Deprecation

 * [anton] In Chrome, browser tools in iframes don't have access to DOM storage APIs. Extensions break when third-party cookies are disabled.
 * [tomislav] To clarify, NOT the browser.cookies extension API but DOM APIs, right?
 * [anton] Yes, sessionStorage, localStorage, etc. Would be nice to be able to store data independently of third-party storage access of the document.
 * [devlin] We've discussed limiting extension access to 3rd party cookies. Anton mentioned that devtools extensions don't have access to 3rd party cookies because they're loaded in an iframe - that's a bug.
 * [timothy] That is also a bug in Safari - we also load the devtools in an iframe.
 * [devlin] We should disable third-party restrictions when embedded in an iframe in a devtools panel.
 * [devlin] When extension frames are embedded in regular web content, the regular restrictions should apply, for consistency with the web.
 * [andrey] May makes sense to extend this to privacy sandbox, specifically protected private audience API
   * [tomislav] That has external dependencies and is not in the control of our group here. Firefox and Safari have not implemented it.
   * [timothy] Yes.
 * [devlin] Rob, how does FF handle an extension iframe have access to 3rd party cookies?
 * [rob] Should have access to the host's cookies.
 * [carlos] In Safari, an extension frame cannot access the browser.storage API
   * [timothy] That would be a bug.
 * [devlin] Rob, what about an extension main frame and another origin in an iframe. From a security and privacy point of view, the extension can already store data in its own storage.
 * [rob] Depending on the use case of the extension, it may or may not be preferable for the extension to be partitioned. Perhaps the question is what is the default and how do we make it controllable?
   * [devlin] Hesitant to make this controllable because of the complexity involved. Cookies are already complicated.
   * [timothy] Switching it may break extensions
   * [tomislav] Might be safer and easier to implement to partition; extensions that want to access unpartitioned cookies can send a request via the background script.
 * [devlin] Sounds like we're aligned on fixing devtools, extension iframes in web main frames should be partitioned. If a dev wants to work around this they can. This more closely aligns with web behavior.
   * [oliver] There is a difference between cookie partitioning and storage partitioning. Chrome already has an exception for an extension page embedded in a web main frame where the regular extension partition key is used for storage. For consistency, I think we should have the same exception for cookies. Code is [here](https://source.chromium.org/chromium/chromium/src/+/main:content/browser/renderer_host/render_frame_host_impl.cc;drc=353683321da2061bb47d7655d4b3fc04c1540ed3;l=4367).
     * (this remark was discussed later, see “&lt;reviewed Oliver's note above>” below)
 * [timothy] Does Chrome load options in an iframe?
   * [devlin] Not a frame, a webview.
   * [timothy] We load all options as a separate tab.
 * [rob] Should we agree on an API to send a request on behalf of a specific frame or context?
   * [devlin] Would be against having an API that allows extensions to do things on behalf of a frame. There's an existing workaround (injecting in the frame) and a separate API adds lots of complications (e.g. lifetime)
   * [rob] Then you'd have CORS issues
   * [devlin] You would on behalf of the frame as well. “On behalf of” implies acting as. Another idea is to set an origin header on the request. I prefer the idea of extending the Fetch API to allow extensions to assign the origin header.
   * [simeon] How are you thinking about origin overrides on a request? Does it inherit cookies, etc. or does it _only_ set this one header?
   * [devlin] Not sure.
   * [tomislav] I feel there are other cases where you may need to act as a frame, for example 3rd party nested iframes. Example of use case is a download manager that may want to initiate, pause and resume downloads.
   * [devlin] Hesitant to copy the state of the frame.
   * [rob] We can design the API that allows retrieval and passing an object describing the relevant context. E.g. in the cookies extension API, the partitionKey object has that kind of semantics, where the extension forwards whatever is in partitionKey back to the extension API methods.
   * [devlin] Worth discussing more. Would need to look more closely at the spec to see what is contextual beyond origin and cookies.
   * [timothy] Client hints come to mind. E.g. whether it's in dark mode.
 * [devlin] Sounds like we are aligned that we should partition, that developers may need to make requests (that emulate) other contexts.
   * [oliver] Note: There is further discussion including some concerns below. This may not be the right path.
 * [timothy] Origin plays into our implementation. That makes it hard to have an endpoint restricted to a particular origin.
   * [devlin] Any kind of stable id?
   * [timothy] No. Ecosystem has worked around it.
   * [devlin] threat model?
   * [timothy] Fingerprinting. Not seeing what extensions you have installed if they inject content.
   * [devlin] web accessible resources in theory masks this
   * [timothy] Yes, but if it's a known host for a resource the page can detect the extension through the static host.
   * [devlin] use_dynamic_urls should solve this.
   * [timothy] We make anything that's a safari extension URL if the DOM tries to see it. webkit-masked-hidden
   * [devlin] Would you consider having a stable ID for situations where it's not exposed to the web?
   * [timothy] Possibly
   * [devlin] I've seen cases where extensions say “to do this, copy and paste this extension URL”.
   * [timothy] Started very restricted, could potentially relax.
 * [rob] Oliver wrote a note in the document that we haven't discussed, regarding the difference between cookie partitioning and storage partitioning..
   * &lt;reviewed Oliver's note above>
   * [rob] Firefox uses the same partitioning for storage and cookies.
   * [timothy] In Safari it is the same bucket for everything.
   * [tomislav] Same in Firefox.
   * [devlin] I'm not familiar with this code, but [the code Oliver linked](https://source.chromium.org/chromium/chromium/src/+/main:content/browser/renderer_host/render_frame_host_impl.cc;drc=353683321da2061bb47d7655d4b3fc04c1540ed3;l=4367) does seem to separate them.
   * [timothy] So, Oliver is saying there's a carve out for extensions in Chrome?
   * [rob] Looking at Chrome's code - isn't that carved out for ALL storage APIs, not just cookies?
   * [devlin] Yes, which is strange because it implies that this would have taken effect for the DevTools case. We need to investigate and test. If we are not partitioning at all, then it becomes a breaking change to fix that.
   * [rob] Would you be willing to make a breaking change?
   * [devlin] In principle yes, in practice we would have to consider the impact on extensions. Lately we have made many breaking changes at once and I want to be mindful of the impact to extensions.
     * [carlos] Would be nice to discuss a process to make breaking changes.
     * [tomislav] let's add this topic to the agenda.
 * (end of online+in-person part; the rest of the day continues in-person)


### Inconsistencies

(Mostly about sidebar_action/sidepanel, tracked at [issue 128](https://github.com/w3c/webextensions/issues/128))

 * [timothy] How do we resolve inconsistencies, e.g. to avoid needing browsers to require two implementations?
 * [jessie] sidebar/sidePanel is a concrete example.
 * [tomislav] The approach the web has taken for this is Origin Trials, where one can enumerate every user of a trial API.
   * [patrick] And users of origin trials explicitly acknowledge that the API can go away.
   * [tomislav] If we could lean into a similar design if not reuse it directly,
   * [rob] Mixing future & present. We have a concrete list of issues that we can discuss.
 * [timothy] Concrete example is sidebar/sidepanel.
 * [devlin] sidebar is very tied to a browser surface that has not been shared. For example, Firefox doesn't have the difference between contextual and global sidebars.
 * [timothy] In Safari sidebars are global, not contextual.
 * [tomislav] We have a per-tab context, but by default it is global. Similar to the extension action APIs.
 * [mukul] Edge also has a side panel, but our behavior diverges from Chrome and Firefox.
 * [timothy] In Chrome, is it contextual or global?
 * [devlin] The surface itself supports contextual and global, and the API too. User-facing differences when the user switches tabs.
 * [timothy] Is edge contextual or global?
 * [mukul] We are both, but there are some issues with contextual - there are some conflicts with the underlying Chromium implementation.
 * [timothy] Main use of sidebars is to get content out of the page? (e.g. sidebars)
 * [devlin] Multiple use cases for both global and contextual – e.g. a contextual one may show data from the page, while a global one may be something like a messaging app
 * [timothy] Edge also has the manifest side panel for webapps.
 * [mukul] That is different; a proposal from a different team.
 * [rob] Link to this (non-extension) Edge proposal: https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/SidePanel/explainer.md
 * [devlin] If that were implemented, that mostly gets rid of the use cases for global sidepanels.
 * [mukul] That's why we think contextual use cases are more interesting.
 * [david] If extensions APIs are contextual, couldn't they ignore the context and display global content?
 * [devlin] If it defaults to contextual and there is no way to declare global, … If you have a contextual panel, every page has a separate side panel instance.
 * [rob] Although you're referring to it as “global”, there may be more than one, each window has their own sidebar document.
 * [devlin] Yes, each window has its own sidepanel page instance.
 * [rob] Back to the original question of sidepanel vs sidebar inconsistency; Chrome introduced sidepanel because it wanted an extension API for a new UI surface in Chrome, and had its reasons to not implement the previously existing sidebar API.  Developers aren't generally interested in the nuance. Would suggest that Chrome adopt the pre-existing pattern.
 * [devlin] Gaps. Get/Set pattern – single action. Can't batch updates (can, but it's racy). Batching them in the options bag improves that process. Would FF be open to aligning on sidepanel?
 * [tomislav] Historically we prefer to align on an existing API.
 * [rob] Would prefer to align on sidebar since it existed first. Ultimately, alignment & reducing friction for devs is the goal. Would be open to considering it. Don't want it to set precedent.
 * [devlin] Would agree that the precedent should not be we align on Google's implementation just because it's Google.
 * [devlin] As a less controversial, smaller change, what about unifying getters and setters?
 * [tomislav] Yes.
 * [timothy] Manifest key is the big sticking point.
 * [devlin] If we named it from scratch today, what would we call it?
 * [rob] Sidebar.
 * [devlin] Probably, yes.
 * [rob] Would you be willing to adopt that?
 * [devlin] In principle yes. Could alias. Expect that there will be some differences.
 * [rob] Resolution? Options: do nothing, move to sidebar_action, move to sidepanel, move to (new) sidebar.
 * [devlin] Could further break this into smaller pieces. Mozilla could add batch actions. setPanelBehavior from Chrome will require more discussion. Sounds like FF will look to align on behavior for now. On the Chrome side we're supportive of aligning on a namespace. Safari will potentially adopt the new name for this API.
 * [timothy] Will likely need to alias the old names for compatibility.
 * [tomislav] Would Chrome adopt the single-property getters and setters?
 * [devlin] Hesitant to add things we know are undesirable patterns.
 * [timothy] If we choose to support this, we'll want to support both.
 * [richard] If you're introducing a new namespace, back-compat doesn't seem as much of a concern to me.

(there will be another session on inconsistencies in APIs on Wednesday)


### Testing

 * [patrick] In Seville we agreed that testing is good and we should do it. Met with WPT folks at TPAC and they were good with us integrating with that project. There are some inconsistencies with how WebDriver handles extensions across browsers. Chrome can load extensions dynamically, Firefox cannot. Safari doesn't (didn't?) support installation at all. I created a rough initial implementation during TPAC.
   * [rob] Meeting notes from TPAC, search for “Automated compatibility testing” at: https://github.com/w3c/webextensions/blob/main/_minutes/2023-09-11-wecg-tpac.md
 * [timothy] I know WPT has a sub-project called Interop. An active area of interop is the “investigations” section: areas that WPT wants to improve. Maybe this is something we can get added to the list of active investigations for 2025?
 * [tomislav] We could aim for more.
 * [timothy] Fair, that might be a low bar.
 * [patrick] We've been working with Mozilla folks on MDN, Baseline.
 * [tomislav] Brief overview of Baseline?
 * [patrick] Browsers agree that Feature X should be safe to use across all browsers. Based off WPT info, feedback from engineers, based on CanIUse / MDN Compat data model. CanIUse is one person.
 * [tomislav] We don't have a dedicated person working on checking compat with other browsers.
 * [patrick] Example: https://github.com/patrickkettner/web-platform-tests/tree/webextensions, specifically this one commit that shows changes to test the runtime API: https://github.com/patrickkettner/web-platform-tests/commit/5ef608ee6c07d3d294568e494824fb55e8ee3944
 * [patrick] General structure of WPT is that each test is a separate HTML file. In the branch you'll see there's an &lt;API_NAME> subdirectory. Idea is that each file is a separate test, and each test is a separate extension.
 * [timothy] We have WebDriver in Safari, might be able to use our existing mechanism to hook into wpt.
 * [andrey] Every file is a separate extension, does the browser start fresh for each test?
 * [patrick] By default WPT tries to reuse contexts, but you could do this. That would be done with a test harness which tells the browser what to do.
 * [andrey] No immediately clear if/when the browser restarts. If I clone an existing test to create a new test, will the browser restart before running this test?
 * [patrick] If you clone the existing test, yes.
 * [tomislav] Can you load another extension while one is running.
 * [patrick] It's possible, but not currently implemented that way.
 * [timothy] I think our safari driver can also join the existing test.
 * [devlin] Looks like WPT wants you to account for previous state.
 * [patrick] That's true for the web platform stuff because they reuse domains.
 * [devlin] that causes a lot of complications for extension behavior, which very commonly affects browser state
 * [patrick] We can control for that, but we would have to write code to handle it. When writing tests you have to explicitly make it a clean context.
 * [devlin] Can we expect a clean slate when designing our tests?
 * [patrick] It's calvinball, we can do whatever we want.
 * [devlin] Will other web platform tests poison our environments?
 * [patrick] No.
 * [timothy] What about more complicated tests? Specific tabs open, incognito, etc.
 * [devlin] Have folks seen Chrome's testing framework? Tests are basically extensions, essentially our own JS testing library (kinda like e.g. Mocha). You can create tabs, query that the created tabs, and so on…
 * [devlin] We need the ability to run an arbitrary number of extensions.
 * [tomislav] Would we want to have an extension set up the environment, then load the other extensions?
 * [rob] WPT has some internal only test APIs. Could leverage this concept.
 * [devlin] There are things that we will want to verify that aren't exposed in the existing APIs. In those cases we'll need to implement them in the test runner.
 * [tomislav] I think injecting a content script is a good example. Can't verify execution without use of timers.
 * [devlin] If you're injecting at document_start or document_end, we can detect and test for those executions at set times.
 * [devlin] If we could write a half dozen tests or so to explore how we should implement them in WPT.
 * [tomislav] Could consult our existing tests and port them over.
 * [patrick] Before we can merge into WPT, we need multiple platforms to support. We can use some breakout time to work on this.
   * Timothy, Patrick, Tomislav tentatively planning to sync up to work on this.
 * [timothy] Context menus sounds like a good one.
 * [rob] Would like to focus on the requirements of what we want the test runner to do before diving too much in specific tests.
   * [patrick] We can work on that in a breakout.
 * [timothy] Will need multiple meta tags to handle loading multiple extensions
 * [patrick] Would want to create a single meta tag that takes multiple extension declaration objects.
 * [devlin] You mentioned most of them run in service workers, but there's a separate page for each test…
 * [patrick] service worker is used to collect results.
 * [devlin] Looks like the test runner injects tests as content scripts
 * [patrick]  Some, yes
 * [devlin] One of the main things I'd want is to be able to test from the context of an extension service worker. Are the bindings to emit test results exposed to an extension service worker?
 * [patrick] They weren't originally, but they may be.
 * [devlin] Sounds like we have next steps for breakout session	
   * We need a Firefox & Safari implementation
   * A few implemented tests to flex the API, work backwards to find gaps
     * tabs, context menus, runtime
     * Idea is to write the test as we would want it to be written, work backwards from there to find what we're missing & what we need to implement to enable the tests
     * [rob] Given the expressed timeline, will Chrome already have the `browser` global as the extension namespace by that point?
     * [devin] Best not to expect that, but it would depend on timing.
     * [timothy] How would we handle permission requests?
     * [devlin] Maybe auto-grant requested perms?
 * [timothy] For now we'll likely want to implement as much as possible in a single extension manifest.


### Issue triage

 * **[Issue 1](https://github.com/w3c/webextensions/issues/1): What to do with the older CG?**
   * [rob] The existence of these old “specs” are confusing, and continue to occasionally confuse people who are not already familiar with the WECG..
   * [timothy] I'll resolve this task.
 * **[Issue 7](https://github.com/w3c/webextensions/issues/7): request: separate extension permissions from site permissions**
   * [devlin] From the Chrome side we are hesitant to do anything like this when the extension scripts are running in the main world. We are also very careful with exposing functionality to content scripts because they share the process.
   * [timothy] In favor of closing.
   * [rob] Recommend closing this topic, more specific topics are covered by other issues.
 * **[Issue 9](https://github.com/w3c/webextensions/issues/9): New Issue Template**
   * [devlin] We don't have a template, but have organically established a process.
 * **[Issue 12](https://github.com/w3c/webextensions/issues/12): request: allow to retrieve a frameID from an &lt;iframe> element**
   * [devlin] There were some concerns about exposing the frameId directly to the web page, due to the amount of information captured by the ID. I'd like to follow up with security and follow up.
     * [simeon] Issue is being tracked at https://issues.chromium.org/issues/40200404
   * [oliver] A recent comment requested documentId as an alternative, which would not have the same issue.
   * [oliver] I'll follow up with Chrome Security about this
 * **[Issue 14](https://github.com/w3c/webextensions/issues/14): request: manifest error handling for unknown properties**
   * [patrick] The consensus is to not error on unknown values. Does Safari need to make any changes?
   * [timothy] We don't.
   * [devlin] Oliver made a change for background.scripts in MV3 ([CL](https://chromium-review.googlesource.com/c/chromium/src/+/4979885)).
   * [richard] On the issue, Firefox linked an issue.
   * [rob] That is about enforcing it easily by default.
 * **[Issue 274](https://github.com/w3c/webextensions/issues/274): Proposal: i18n.getLanguageDictionary**
   * [carlos] API to allow extensions to use a specific locale
   * [timothy] I am in favor of supporting.
   * [devlin] This proposal returns an object with methods (not a plain old JS object), which is unusual in the extension API. Wonder if there's another approach that might be more inline with existing patterns.
   * [carlos] Alternative API shape is to pass an extra parameter with the initialized state to the getMessage method.
   * [patrick] Next step is for Carlos to make a formal proposal.
 * **[Issue 336](https://github.com/w3c/webextensions/issues/336): Inconsistency: action.setIcon() & action.setBadgeBackgroundColor()**
   * [timothy] We recently fixed this in WebKit, and match Firefox's behavior; to reset to the default. We also support windowId in the APIs.
   * [devlin] Supportive of changing that.
   * [rob] There is already a crbug filed, https://issues.chromium.org/issues/40073862.
 * **[Issue 483](https://github.com/w3c/webextensions/issues/483): Proposal: API to embed pages in WebExtension bypassing CSP**
   * [rob] The issue presents several potential ways to address the issue. Last time we discussed this, the decision was to await Chrome's preferred solution before Safari and Firefox look at the options in more detail. Especially because some suggested “solutions” are Chrome-only.
   * [oliver] Don't think that we should block on window.top; some use cases are only concerned with the CSP and not window.top.
   * [devlin] This is a topic for more discussion; let's cover it later
 * **[Issue 252](https://github.com/w3c/webextensions/issues/252): Introducing browser.i18n.getOSLanguage**
   * [carlos] All supportive, next steps example case.
   * [carlos] I will file a proposal.
   * (consensus) Yes.
 * **[Issue 319](https://github.com/w3c/webextensions/issues/319): Increase the maximum number of dynamic rules to 30,000**
   * [devlin] Implemented in Chrome.
   * [rob] Not implemented in Firefox yet. Tracked at https://bugzilla.mozilla.org/show_bug.cgi?id=1803370.
   * [timothy] We're supportive but not implemented yet. We can file an issue and link it from the issue.
 * **[Issue 231](https://github.com/w3c/webextensions/issues/231): Extension API to find the public suffix (eTLD) of a given URL/domain**
   * [devlin] Some more investigation needed; e.g. include vs exclude private registries.
   * [devlin] Next step: have a concrete proposal
   * [devlin] Wondering about the value of adding a new namespace for one method.
   * [rob] In the issue I linked to the interfaces of the three browsers, take a look there for inspiration on what other methods we could add.
   * [oliver] AI: Reach out to PSL maintainers
 * **[Issue 318](https://github.com/w3c/webextensions/issues/318): Adjust the maximum number of static rulesets and enabled rulesets**
   * [devlin] Implemented in Chrome
   * [timothy] Implemented (but not yet shipping) in Safari
   * [rob] Not implemented in Firefox yet, tracked at https://bugzilla.mozilla.org/show_bug.cgi?id=1803370.
 * **[Issue 44](https://github.com/w3c/webextensions/issues/44): Proposal for Manifest V3: add permission allowing a background script to be persistent**
   * [devlin] We won't do this in Chrome.  Since Chrome and Safari are opposed and FF doesn't support service workers, can we close this out?
   * &lt;consensus>
 * **[Issue 134](https://github.com/w3c/webextensions/issues/134): Proposal: Limited Event Pages for MV3**
   * [simeon] It is opposed by chrome. Should we keep it open to spec it?
   * [timothy] Implemented and supported by two browsers, so it is eligible for being specified.
   * [rob] We could put the spec clarification limit on this.
   * [simeon] We can close it - it is unlikely for us to forget about event pages when we start specifying.
 * **[Issue 162](https://github.com/w3c/webextensions/issues/162#issuecomment-1993994033): Declarative Net Request proposal: disable individual static rules (comment)**
   * [andrey] Chrome has implemented, but we've shared data suggesting the 5000 limit is too low.
   * [devlin] Hoping to have support for faster review for ruleset updates. Wonder if that would address the need to raise the limit.
   * [andrey] Differential updates require the same number of added rules and disabled rules.
   * [devlin] That would imply filter list size never grows, which is probably not the case.
   * [andrey] This feature was designed and implemented for the use case of differential updates. Why are we limiting the API such that it interferes with the use case?
   * [devlin] If you are updating every day, and 5000 is enough for two weeks, isn't that enough?
   * [devlin] There are no real privacy and security concerns, just performance and implementation concerns. Currently stored in prefs in Chrome, which makes it immediately available at browser startup.  Changing that has negative implications for performance and potentially user-visible effects (the extension might not take effect immediately). Wonder if the issue goes away with faster extension updates.
   * [andrey] We're discussing an extension API but you are creating a strange dependency on the Chrome Web Store.
   * [rob] Current design relies on the assumption that an extension update is the right way to propagate these updates. When an extension is reloaded, there is a brief period where the extension is not active. Is disabling an extension across updates a concern?
   * [devlin] Users should be restarting their browsers more than every 14 days.
     * [simeon] 👀👀
   * [devlin] You could prompt your to request a browser restart. That would ensure the extension is always active (vs. disabling an extension, updating it, re-enabling it)
   * [rob] Why are you suggesting that instead of `browser.runtime.reload()`?
   * [devlin] The browser startup path ensures that there is no period when the filters are not active.
   * [rob] Would that be an argument in favor of an option to `browser.runtime.reload` to suspend network requests until the extension has been updated?
   * [devlin] Yes that is an argument, but I would not be in favor of supporting such an API.
   * Next steps: re-evaluate once fast DNR store reviews are in place
 * **[Issue 493](https://github.com/w3c/webextensions/issues/493): Support redirect-only rule in DNR**
   * [devlin] Not sure I follow, can someone clarify the request?
   * [andrey] The request here is to only redirect if blocked by another rule.
   * [timothy] We talked about replacement resources, meant to fill in for the resources.
   * [andrey] DNR already has support for rules to redirect. This request is a conditional request, basically a different redirect.
   * [rob] Concern with the specific request, that it is an API to counter anti-adblockers. Even if we were to implement the requested feature, then anti-adblockers would switch to another mechanism. At that point, I wonder whether the API would serve any other purpose.
   * [andrey] I'll write something and post on the issue.
   * [devlin] Sounds good; let's discuss this at a deep dive later.
 * **[Issue 24](https://github.com/w3c/webextensions/issues/24): Request: consider extension store implementation and review policy during specification process**
   * [devlin] There is no actionable task here.
   * [simeon] I'll comment and close.
 * **[Issue 25](https://github.com/w3c/webextensions/issues/25): request: don't standardize around lowest common denominator platform (e.g., mobile)**
   * [patrick] This issue is not actionable either.
   * [devlin] Agreed.
   * [patrick] I'll close the issue.
 * **[Issue 21](https://github.com/w3c/webextensions/issues/21): How should sidebarAction be considered, since it's only implemented in two browsers?**
   * [oliver] Almost a meta spec issue – how do we handle cases where we don't have consensus.
   * [timothy] We are interested in sidebar_action, sidePanel, and (as discussed earlier today) sidebar.
   * [rob] Issue raised at (closed) https://github.com/w3c/webextensions/issues/387.
   * [devlin] On the meta question here - when there are multiple APIs without consensus, we don't specify them, but can discuss them.
   * [patrick] Requiring a shipping implementation seems like it may be a prohibitively high bar.
   * [andrey] Should we reach out to Opera about this?
   * [carlos] Naver also supports it, should contact them.
   * [simeon] Agreed. I can reach out to them to invite participation in sidebar related discussions.
 * **[Issue 128](https://github.com/w3c/webextensions/issues/128): Proposal: agree on a unified sidebar_action API for mv3**
   * [carlos] Duplicate, this is the other sidebar issue
   * [rob] Let's use this as the canonical issue to track the discussion we had this morning.
 * **[Issue 38](https://github.com/w3c/webextensions/issues/38): Support for the distribution of Web apps?**
   * [devlin] Out of scope, close it.
   * [timothy] Agreed.
 * **[Issue 40](https://github.com/w3c/webextensions/issues/40): Provide consistent access to browser.permissions API in the devtools**
   * [rob] This is about privileged extension APIs, including browser.permissions in devtools_page.
   * [devlin] The old behavior was a carry-over from when extensions were in-process. When we supported out-of-process extension frames, we started to support this.
   * [rob] I'm hesitant about exposing privileged extension APIs to extension frames, but am in favor of doing so for devtools panels. Tracked at https://bugzilla.mozilla.org/show_bug.cgi?id=1796933.
 * **[Issue 541](https://github.com/w3c/webextensions/issues/541): Proposal: AI Assistant API**
   * [oliver] Suggest closing the issue, because it is a request to expose powerful functionality without permissions. The request is not very specific.
 * **[Issue 69](https://github.com/w3c/webextensions/issues/69): Use case of eval**
   * [rob] What is this issue tracking?
   * [devlin] One of the mentioned issue (WebAssembly) has been fixed
     * [rob] Through ‘wasm-unsafe-eval'. For details see https://github.com/w3c/webextensions/issues/98#issuecomment-1106702230
   * [devlin] Don't know much about Secure ECMAScript, looks like it depends on ShadowRealms with fallback to eval.
   * [rob] I don't consider that to be a significant enough use case to introduce eval.
   * [carlos] default and enforcement CSP issues:
     * https://github.com/w3c/webextensions/issues/98
     * https://github.com/w3c/webextensions/issues/99
   * [simeon] I'll comment on the issue
