# WECG TPAC Oct 30, 2026


## Agenda

https://github.com/w3c/webextensions/wiki/2026-TPAC-Coordination#friday
(all times UTC)

 * Prefetch Activation Beacon - 09:45 - 10:15 (30 min)
 * Bug Triage #2 - 10:15 - 11:00 (45 min)
 * Developer Outreach - 11:30 - 12:15 (45 min)
 * Runtime Context Proposals - 12:15 - 12:45 (30 min)
 * Inconsistencies #2 - 14:00 - 14:45 (45 min)
 * Wrap-up - 14:45 - 15:30 (45 min)


## Attendees

 * Rob Wu (Mozilla)
 * Simeon Vincent (Invited expert)
 * Kiara Rose (Apple)
 * Benjamin Bruneau (1Password) (until 12:45)
 * Devlin Cronin (Google Chrome)
 * Kouhei Ueno (Google Chrome)
 * Oliver Dunk (Google Chrome)
 * Markus Sabatello
 * Barry Pollard (Google Chrome)
 * Tim Judkins (Google Chrome)
 * Timothy Hatcher (Apple) [Remote]
 * Mukul Purohit (Microsoft) [Remote]
 * Carlos Jeurissen (Invited expert)
 * Yannick Mougin (Dashlane)
 * Jiacheng Guo (Google) (only during Prefetch Activation Beacon topic)
 * Tomislav Jovanovic (Mozilla) (from 14:00)


## Notes


### Prefetch Activation Beacon

09:45 - 10:15 (30 min)
Discuss how the [Prefetch Activation Beacon](https://github.com/explainers-by-googlers/prefetch-activation-beacon) interacts with extensions. The API is proposed as a reliable signal for the activation of prefetched pages, and extension filters are one source of lost signals. [Requested on issue 1072](https://github.com/w3c/webextensions/issues/1072#issuecomment-6310204997).

 * [simeon] Could a Googler introduce the topic?
 * [jiacheng] Prefetch Activation Beacon is about detecting of successful prefetch. API designed as new `on-prefetch-activation `response header. Prefetch allows detection ahead of page. Extensions may block original methods.
 * [jiacheng] Motivation: speculative loading breaks the HTTP loop. Original user visit -> GET /page, request = visit, server knows that page was visited. With speculative prefetch, request = bytes sent, server knows that request was cached, no signal for visit (`Sec-Purpose` is `prefetch`).
 * [jiacheng] We need these accurate signals so prefetch and prefetch pages can be measured accurately. These requests provide user engagement signals. Current work-arounds using JS beacons are unreliable for various reasons, including content blocker extensions (ad blockers).
 * [jiacheng] Goals, in scope: restore 1st-party main document GET signal of normal navigation. Non-goals: in-page analysis, third-party tracking, no subresource/legacy requests.
 * [jiacheng] Design principles and core goals. Complete HTTP loop, prefetch becomes 3-phase commit (fetch → response → commit (ack)). Declarative via opt-in response header. Browser-native via HTTP stack (no JS). Strict “Echo-Back” only (return URL and original cookie headers).
 * [jiacheng] Proposed API uses a 3-phase commit. 1) Fetch, 2) Header, 3) Commit (with path from `on-prefetch-activation` response header).
 * [jiacheng] Fires only when documents commits to active frame. No JS / service worker involvement. BFCache/cache not involved.
 * [jiacheng] Same-origin & redirects: header only takes relative paths (no URLs). Header only used for last request in redirect chain. Redirects of beacon blocked for cross-origin redirects (same-origin beacon redirects are permitted).
 * [jiacheng] Also want to make this immutable. Render side scripts, service workers, and JS extension content scripts should not be able to intercept these requests. The activation endpoint is directly handled by the browser, not exposed to JavaScript. The URL is immutable and is not modified by any part of the browser.
 * [jiacheng] Mitigation against potential abuse of cookies. Live cookie jar modifications are visible across tabs in prefetch events. This proposal addresses that by freezing prefetch cookies in a window, sending only and exactly the cookies from the initial prefetch request with the beacon.
 * [jiacheng] Intersection with WebExtensions is that we do not want cookies to be interceptible by cookie extensions. Ad blockers tend to block beacon endpoints. We want to make the beacon part of navigation. API design guarantees that no state is sent other than what the initial request already included
 * [jiacheng] First proposal is to bypass the navigation stack (service workers, extensions, etc). Second is to expose this to extensions via a new type of network requests (DNR/webRequest ResourceType)
 * [jiacheng] First approach is straightforward. Second is more complicated, but friendly for extension developers. If they want, they can disable the API with the existing networkPredictionEnabled extension API (by disabling prefetch altogether), but not leak extra information.
 * [jiacheng] Would like to ask how the WG is thinking about this space and how the
 * [simeon]
 * [devlin] Time check, scheduled to move on in 7 min. Unsure about the value of proposal 2. Expect filter list authors would choose to block. At a high level this makes sense to… prefetch didn't exist when we first made the web. Having a way to confirm \__\_ is important. Extensions can disable prefetch today. There's clearly value in having a way to prevent the browser from making requests without your knowledge. That case is addressed. Inclined to
 * [rob] How does this work with proxies? Does this force reuse of the connection? Lower level than extensions typically see, but extensions have a proxy API so this may be relevant.
 * [jiacheng] Currently not planning to send these request to proxies. They use a different part of the API, not using web request features. May want to allow activation beacons to be proxied.
 * [rob] If the beacon is forced to reuse the same connection where possible, the proxy doesn't have to do anything because you already have the initial connection. But that puts some requirements on the usage. Would be nice to include this in the proposal.
 * [barry] What happens if your network drops between prefetch and resolution?
 * [rob] No opinions. Curious to see how it could fit in the API.
 * [oliver] Generally agree with Devlin. Goal of this appears to be to have a reliable signal, and this signal hasn't been reliable with previous approaches. Definitely the case that if you asked relevant extensions, they would likely want to block it. Expect there will be different opinions about how to approach this.
 * [jiacheng] For reliability of these APIs, we may want to communicate out that these event disable methods exist for extensions and those should be used to block this route.
 * [simeon] Does Firefox also support this disable mechanism.
 * [rob] Yes. Existing extensions already block prefetch via `browser.privacy.network.networkPredictionEnabled`, so this wouldn't affect existing adblocker users anyway. Whereas servers get the benefit of not sending prefetch responses without signal about its utility. Positive-leaning neutral about shape 1.
 * [kiara] Neutral.
 * [timothy] Don't have much to add.
 * [devlin] I assume this will be part of a different WG's work, but note in the spec that extensions should not be able to modify this header, along with a note that UAs should provide a way to disable prefetch entirely. Sounds like from the extension side we're supportive or neutral (not opposed).


### Bug Triage #2

10:15 - 11:00 (45 min)
Triage open GitHub issues and pull requests unrelated to Inconsistencies and the spec PRs, which are covered in their own sessions. Attendees nominate items in the first 5-10 minutes, then we work through them in the remaining time, with a maximum of about 3 minutes per topic.

#### [Issue 306](https://github.com/w3c/webextensions/issues/306): scripting.InjectionTarget.workers property to inject WorkerScope(s)

 * [simeon] Wouldn't this be nice.
 * [kiara] We discussed this in an earlier meeting.
 * [devlin] Every vendor has already expressed support before.
 * [carlos] Open since 2022. Plans to get to this?
 * [timothy] Implementations are potentially unprepared to deal with multi-threaded extension API calls.
 * [devlin] Not currently working on it in Chrome. Unless we hear more requests that increase priority, continues to be lower priority than other issues more affecting developers.
 * [carlos] Extensions work around this by blocking service worker registration.
 * [devlin] Does GitHub have a +1 feature? Can we let people know how they can express interest?
 * [simeon] There are two thumbs up, one from Carlos.
 * [devlin] Not sure if there is more to discuss here.

#### [Issue 470](https://github.com/w3c/webextensions/issues/470): Proposal: expose the new tab URL

 * [carlos] seems duplicate of [Issue 1042](https://github.com/w3c/webextensions/issues/1042)
 * [rob] Can we merge?
 * [simeon] Not on GitHub formally, best we can do is comment and edit.
 * [devlin] Proposals are different; 470 is about detecting URLs, 1042 is about detecting tabs.
 * [carlos] I believe this is asking for === values, not comparing an enum.
 * [timothy] Fixing 470 would fix both.
 * [devlin] Would be more in favor of 1042 because we don't have 1 url.
 * [timothy] New tab extensions use a different URL.
 * [devlin] Currently unspecified.
 * [rob] No objections. Already objected to 470, 1042 can cover the use case.

#### [Issue 1042](https://github.com/w3c/webextensions/issues/1042#issuecomment-5132590086): Tab.isNewTab: Add ability to determine if a tab is a new tab page

 * [devlin] Have supportive from Safari, neutral from Firefox, in Chrome we're high level supportive but need to evaluate this specific proposal.
 * [yannick] Would be useful for us to know.
 * [benjamin] Likewise, would also like this.
 * [carlos] Rob, you're neutral on the issue. Any particular reason?
 * [rob] Don't care either way. Truly neutral.
 * **Outcome:** needs evaluation by Chrome.

#### [Issue 617](https://github.com/w3c/webextensions/issues/617#issuecomment-6406656552): manifest key to enable automatic injection of content scripts after installation/update

 * [carlos] [Issue 617](https://github.com/w3c/webextensions/issues/617#issuecomment-6406656552) and [comparison table](https://github.com/w3c/webextensions/issues/617#issuecomment-3620822767): choose injection in specific scenarios
 * [carlos] Thinking about adding 2 properties to the content script: allow idle injection and allow_repeated_injection to signal that an extension could be re-injected into a page.
 * [devlin] I'd prefer ‘late' rather than idle. Withheld host permissions and runtime host permissions – we wouldn't want to conflate late injection and extension installation. Those are two separate things
 * [carlos] Current safari behavior.
 * [devlin] Could feasibly want late injection without host permissions, but doesn't mean we should inject content scripts in other scenarios.
 * [carlos] Are you more in preference of the other proposal.
 * [timothy] I lean more toward the run on proposal rather than boolean.
 * **Outcome:** Needs more discussion

#### [PR 942](https://github.com/w3c/webextensions/pull/942): Proposal: `i18n.getAvailableLanguages()`

 * [carlos] Open for a while. Had some feedback and patches. Would like to get this merged.
 * [oliver] My comment on the PR is outdated. Overall supportive. Looks nice, thanks for working on it.
 * [timothy] I'll take another look.
 * [oliver] Still no sponsoring browser.
 * [rob] We can sponsor. Carlos already proposed a patch in Firefox.
 * **Outcome:** Revisit next CG meeting.

#### [PR 802](https://github.com/w3c/webextensions/pull/802): Add proposal for `topFrameMatches` and `excludeTopFrameMatches`

 * [devlin] I think we just need to review this again. This we need to actually sit down and review.
 * [kiara] Should we set aside time to discuss these kinds
 * **Outcome:** Revisit in an upcoming meeting.

#### [Issue 547](https://github.com/w3c/webextensions/issues/547): Proposal: document browser.storage.managed initialization

 * [devlin] Doesn't currently have labels from any browsers. Supportive of some way for extensions to detect this, not sure if we need an event for this. May be sufficient to fire a onChanged event for this storage area.
 * [oliver] Extensions may want to clearly distinguish a uninitialized event.
 * [devlin] Agree there's a conceptual difference between undefined and empty, but extensions would expect content in those areas in most scenarios.
 * [oliver]
 * [devlin] If there are concrete use cases where we'd need to know the difference, then we should support it.
 * [kiara] Neutral, we don't support managed storage. Ask seems reasonable.
 * [rob] Supportive in principle, need to see the specifics of the final API shape before finalizing.

#### [PR 793](https://github.com/w3c/webextensions/pull/793): Add proposal: Synchronous data at startup

 * [rob] https://github.com/w3c/webextensions/pull/793#issuecomment-6504032460
 * [rob] Wrote the above comment yesterday after hallway conversations with Benjamin and Oliver. One of the previous feedback points from Devlin is whether we should persist. For developers, that would be very nice. From a browser eng perspective I can see how it would be _really_ nice if we didn't have to. Open to leaving that as a potential follow-up. Can revisit based on developer feedback. Initial proposal declares 2 namespaces: contentScriptConfig, extensionConfig. Devlin previously supported 2. Timothy asked for 1. Originally had 2 so we could distinguish between availability of a synchronous getter method. Following feedback I've removed the getSync method. Devlin, are you in favor of 1 namespace? Tentatively named `storage.configStore`.
 * [timothy] I think we should just have `storage.config`.
 * [devlin] Let's revisit this topic later.
 * [rob] Can we discuss it later today?
 * **Outcome:** Hallway discussion today, follow-up in a future meeting.

Switching over to inconsistencies as we have no other specific topics for triage.


### Inconsistencies #2 early

10:45 - 11:00 (15 min)
(carry-over from Thursday)


#### Action

##### [Issue 1142](https://github.com/w3c/webextensions/issues/1142): Inconsistency: `action.getPopup()` full URL vs relative URL

 * [devlin] I think we should return the full URL. If you want to you can construct a URL and take a path.
 * [timothy] I fixed it
 * [rob] FYI: absolute vs relative URL relevance is when an HTML document is served at a subdirectory.
 * [timothy] Foreshadowing.
 * **Outcome:** Implementations are now aligned.

##### [Issue 1143](https://github.com/w3c/webextensions/issues/1143): Support `action.getPopup()` without parameters

 * [timothy] This is something we already supported. We returned a promise if called with no parameters.
 * [devlin] Tied to discussions yesterday where if we have a parameter with only optional properties, can the object itself be optional, and we all agreed it can be.
 * [timothy] I've audited all of our get functions and now we support calling them with no parameters.
 * [oliver] Started working on this in Chromium for setIcon with no parameters. Once that lands I can move on to this and others.
 * [rob] Also supportive. This follows from yesterday's discussion.
 * **Outcome:** Implementations are now aligned.

##### [Issue 1122](https://github.com/w3c/webextensions/issues/1122): Inconsistency: `action.setIcon({path: "relative.png"})` relative path handling

 * [timothy] This was fixed a while back in Safari to align with Firefox.
 * [oliver] Sounds like Chrome is different. I think it's because of our JS bindings.
 * [devlin] We should be relative to the extension root.
 * [carlos] Apparently CSS wg has a system to automatically create an issue in issue trackers. Worth investigating.
 * **Outcome:** Chrome bug


#### Icons

##### [Issue 1119](https://github.com/w3c/webextensions/issues/1119): Ignore `icon_variants` with unknown properties

 * [timothy] I've fixed this in WebKit.
 * [carlos] Motivation to ignore unknown props in `icon_variants` was to enable future additions to the object. This is a prereq for that. I believe Chrome doesn't do this.
 * [oliver] We don't ship icon variants, it is behind a flag. I'm supportive of ignoring unknown props.
 * [rob] Spec already calls out this behavior. Is it a bug?
 * [kiara] Incomplete implementation.
 * **Outcome**: Implemented Safari. Supportive Chrome.

##### [Issue 1136](https://github.com/w3c/webextensions/issues/1136): Do not hard-error on `manifest.icons` and `action.default_icon` non-integer keys

 * [rob] We discussed earlier this week. The outcome was to not add new things to icons.
 * [carlos] Happy to not change this.
 * [timothy] Didn't need to make it backwards compatible in WebKit, just easier to do that way.
 * [oliver] Does Safari fully ignore?
 * [timothy] The “any” key is special, but that's it.
 * [carlos] Chrome is opposed to changes?
 * [oliver] Makes sense.
 * [devlin] Issue is about hard erroring.
 * [oliver] Oh, then we should change.
 * [carlos] How about Firefox?
 * [rob] Willing to avoid hard errors; in practice extension devs cannot rely on that until at least a year passes after we shipped though.
 * **Outcome:** Do not hard error on the presence of these keys in the specified fields.

##### [Issue 949](https://github.com/w3c/webextensions/issues/949): Specify how icons are chosen given an ideal size - is 'any' preferred or a fallback?

 * [carlos] How icon sizes should be chosen when icon group and any are provided. I think I convinced Safari to prefer specific sizes over any.
 * [timothy] I think `any` should come near the end. I described our fallback order in a comment.
 * [carlos] in practice `any` will be used only if the largest size in the icon group is smaller than the group.
 * [devlin] Confused by the wording of fallback resolution.
 * [carlos] Say you specify 48 and 16 and the browser needs 36.
 * [devlin] Don't know that that should take precedence over any. (we don't support any). If you try to put a 128 icon into a 16, that won't go well. SVG is flexible enough that it could serve that purpose.
 * [oliver] If you have multiple SVGs, it's reasonable to have bespoke SVGs for specific contexts.
 * [devlin] Why would you have multiple and any then?
 * [timothy] That's why I was convinced. An Any approach can be written to smoothly transition between sizes.
 * [devlin] If you're scaling between 16, 128, 48. There are pixel boundaries between each with different renderings. We can have general guidance for developers and we don't need any any key - the size based values with SVG can also adapt to closer values.
 * [carlos] My proposal was to make any the largest possible size.

Inconsistencies session resumes later today.


### Developer Outreach

11:30 - 12:15 (45 min)
How can we better keep the extension development community informed about what is changing, why, and how to adapt? Today this is mostly left to individual browser vendors. Discuss current strategies and channels, how well they work, and where we could collaborate on shared resources. [Proposed on issue 1072](https://github.com/w3c/webextensions/issues/1072#issuecomment-6046784756).

 * [simeon] (introduces topic as stated above)
 * [carlos] Propose a shared document where we highlight changes. Example `setIcon()` behavior. Should have delay between announcement and landing the breaking change.
 * [devlin] Broader question: for changes developers should know about, how do we approach outreach? A bit difficult because if you're an extension developer at TPAC in this room, you're probably more clued in than other developers. How well do our current information dissemination approaches work?
 * [carlos] Cross browser list of breaking changes. Different per browser. Only changes in that browser are covered. Helps to deal with cross browser breaking changes.
 * [simeon]
 * [
 * [rob] I was thinking using MDN with a page to reference recent release notes from browsers. We have browser compat data, used to feed compatibility tables on MDN; having such a page would encourage browser devs to also maintain the compat table time at the same time.
 * [devlin] Is there prior art for historical log of changes on MDN?
 * [rob] Firefox release notes are published on MDN. With the 2 week release cycle, visibility of per-version release notes is a question though. OTOH, if we keep a long running document I think that will be too large.
 * [simeon] MDN should definitely be part of our strategy.
 * [timothy] MDN documents when stuff changes in the compatibility tables.
 * [carlos] My proposal is, like, for PHP. There's a list of changes that show the version range.
 * [kiara] Are there other groups
 * [simeon] I think the documentation group would be open to collaborating if we had something we wanted to collaborate on.
 * [oliver] If MDN wanted to document things, I don't think we'd be opposed. In terms of Chrome contributing, there'd be hesitancy around maintaining multiple sources - already maintain developer.chrome.com.
 * [yannick] Can information be pulled from every browser's breaking change page?
 * [oliver] If someone wanted to do that, I'd be supportive.
 * [carlos] If we had a doc in the W3C repo, would that be different?
 * [oliver] Cross-browser change or change made in our CG/WG, might be odd to document browser specific content.
 *
 * [simeon] We're discussing low level changes, want to shift towards higher level: can we align on communicating and rolling out breaking changes?
 * [timothy] Don't think that it is feasible, as we have drastically different release schedules.
 * [carlos] Minimum time for a breaking change.
 * [simeon] That kind of thing is what I have in mind.
 * [devlin] Different from the topic. More breaking change policy. Can't say “we found a bad vulnerability, we'll fix in 6 months” Need to do collective best on giving head up where possible, avoid breaking changes where we can.
 * [simeon] Maybe that's a breaking change guidance doc where we try to collect information about how we think about changes, how we approach them. Reference for us and for dev community.
 * [rob] Extension APIs are meant to be stable. I think that most developers expect that they don't change, and we should only do so if there is a very good reason.
 * [simeon] (Baseline rambles)
 * [rob] Baseline as a way to communicate towards developers?
 * [simeon] Thinking about ways to coordinate how we push for developers to adopt new things we're working on.
 * [timothy] Eventually we will have a spec.
 * [oliver] Not there yet, but can strive towards making it clearer in our readme what the doc is working on and interested in specifying on. Trying to guess what developers might be thinking it's probably overwhelming coming to the group and trying to figure out where to leave feedback, where we've come to a decision, what's being actively discussed, etc. Having a place where you can see Rob is working on X API proposal could be useful.
 * [rob] Good point. Having an overview of where we are and current status in browsers would be helpful. Not sure if we can automate or if we'd have to manually maintain.
 * [oliver] Hesitant to suggest, but could use Kanban board to try to capture the current state.
 * [rob] Might be helpful to have a label to capture.
 * [timothy]
 * [rob] May need a new label, actionable, to signal something is ready to be worked on? Maybe stages like some other groups, e.g. TC39 (new JavaScript APIs)?
 * [kiara] All the devs I talk to outside of this space don't know this group exists. May be best to improve our visibility.
 * [rob] This is framed as changes and how we communicate them, maybe it's best if we take a different approach. Devs want to build something so they consult docs. They want to know what works. They don't know if we're discussing changes in an area, possible improvements. May also serve for us as a hook to update docs as we finalize changes.
 * [oliver] I like that idea. Happy to take back to the team. Only concern I anticipate is that we generally have quite a strong view that we shouldn't have parts of our docs that talk about things we want to do because aspirational content ends up lingering.
 * [rob] Up to the individuals to become familiar with how to find the content.
 * [rob]
 * [kiara] We have release notes, bugs, etc.
 * [timothy] Regular cadence of Safari Tech Preview releases, release notes link out.
 * [rob] Devs wanting a feature, if something is missing, they have to shift to crawling release notes to find possible references to areas of interest. Having info in docs would cut on the middle step.
 * [timothy] I've put webkit bug links in MDN issues.
 * [rob] When it lands or when working on it?
 * [timothy] Usually when not supported yet I'll link to the bug. When it's landed, we'll update MDN to say its supported and remove.
 * [rob] MDN BCD (browser compat data) already has a structure for linking relevant bugs (impl_url).
 * [oliver] We update content on MDN, but not as often as perhaps we should.
 * [rob] Can we have automation to detect when there are issues etc that can be linked? Doing all of this work manually is not very appealing.
 * [oliver] There's a project – web collector? BCD collector? – keeps information in sync about what's supported in browsers. They basically run scripts in JS contexts to tests what's exposed.
 * [simeon] Seems like WPT?
 * [oliver] Potentially. BCD Collector (https://collector.openwebdocs.org/), maintained by open web docs.
 * [rob] That's about landed features. I'm thinking about more future facing. That extension devs can know whether the absence of functionality is intentional (currently the default assumption), or that it is an area where we're open to contributions.
 * [simeon] Next steps?
 * [oliver] I'll look more into BCD Collector, and if we can set that up for extensions. I'll also speak to the Chrome team about if we can link more to WECG proposals in our documentation.
 *
 * **Action item**: Oliver to look into BCD collector for extension APIs.
 * **Action item**: Oliver to check with Chrome team about linking WECG proposals from our docs.


### Runtime Context Proposals

12:15 - 12:45 (30 min) (started 6 min early)

Relevant issues:

 * [Issue 1164](https://github.com/w3c/webextensions/issues/1164): runtime.associatedTabId
 * [Issue 1146](https://github.com/w3c/webextensions/issues/1146): runtime.Context.associatedTabId
 * [Issue 1147](https://github.com/w3c/webextensions/issues/1147): runtime.getOwnContext()

#### [Issue 1164](https://github.com/w3c/webextensions/issues/1164): runtime.associatedTabId

 * [carlos] Having an associated tabId available on the runtime namespace. Populated to match the tabId of synchronously exposed related concepts, like the window being expected in devtools.inspectedWindow.tabId. For sidebar: open on a specific tab showing it's associated tab ID. A popup when it's opened related to a specific tab.
 * [oliver] Seems like it has utility. Hesitant to comment on this before discussing the others.
 * [devlin] I would have expected a tab has an associatedTabId and a frame has an associated tab.
 * [carlos] The context itself doesn't have a tab id. May be a scenario where a specific tab has an associated tab id.
 * [devlin] I still expect it would be set in a case where its a tab or frame. Associated tab ID becomes a superset of tabId.
 * [carlos] That would make a potential overlap with currentTabId, the same problem with the `tabs.getCurrent()` method.
 * [rob] What's the problem with `getCurrent`?
 * [carlos] Not populated for sidebars except in Safari popups. In general, are you supportive of something like this?
 * [devlin] In general I'm supportive of somehow indicating associated-ness. Want to discuss other approaches first.

#### [Issue 1146](https://github.com/w3c/webextensions/issues/1146): runtime.Context.associatedTabId

 * [carlos] Add the previously discussed concept to the Context object.
 * [oliver] Is there the same backwards-compatibility concern, or can we use `tabId` instead of `associatedTabId`?
 * [devlin] TabId is the actual tab associated with the context. Associated tab ID is the conceptual tab that's linked. May be the same, may not. Popup doesn't have a tab, does have an associated tab.
 * [oliver] Theoretically could say check the type, if it's sidepanel you know the associatedTabId isn't the sidepanel. For the sidepanel type the values of tabId and windowId mean something else.
 * [devlin] I don't think we should say that the meaning of tabId depends on the type; also issue with devtools where tabId may change.
 * [oliver] Do we have associated windowId as well?
 * [devlin] Not yet.
 * [oliver] Do we need it? Seems confusing to set windowId but not tabId.
 * [devlin] Sidepanels are in a window, not in a tab

#### [Issue 1147](https://github.com/w3c/webextensions/issues/1147): runtime.getOwnContext()

 * [carlos] Retrieve the current context. … Could be used to get the associated tab ID if the method were synchronous. Realize that may not be possible. Use cases are implementing options UI, would allow the developer to determine if the current.
 * [rob] Is `options_ui` the only use case? What are the other use cases?
 * [kiara] Fixed version of `tabs.getCurrent()` in the popup.
 * [carlos] getting associated tab id if we add it to the context object.
 * [timothy] Would remove the need to have a standalone runtime property.
 * [rob] Available to content scripts?
 * [devlin] No. getContexts does, but that's not available to content scripts. When talking about adding additional information (e.g. associated tab) that's not available today in renderers. Don't want to expose that there. Would limit what we could add in the future. Already can't do associated tab ID. Appreciate desire to have a sync way of accessing this, requires plumbing more through the start of every renderer. Not clear how important it is to have this be sync. I know it's nice, but do we need it? If so why?
 * [oliver] I see value to style based on current context. Avoid flash of unstyled content. You want to synchronously determine that in an options page.
 * [rob] Elaborate on how that would help with options page.
 * [carlos] You don't know if it's being displayed in options UI. That's a major motivator.
 * [rob] If that's the strongest reason, there could be other options, like setting a CSS variable.
 * [carlos] This should live in CSS world. See also the session in Kobe last year.
 * [rob] I don't mind adding one CSS variable.
 * [carlos] Having an associated tab ID allows us to share this data with other areas of code. Already available synchronously in DevTools
 * [rob] If it doesn't need to be sync, add a `currentContext` boolean option to the existing `runtime.getContexts` method (similar to current in `tabs.query`).
 * [devlin] I like getContexts more from a semantic point of view.
 * [oliver] I don't have other use cases in mind, but it feels like basic information and I feel like sync would be useful.
 * [devlin] I'd want to know those cases. Don't think I'd want to synchronously expose that all the time.
 * [oliver] Even to just extension processes?
 * [devlin] I'd want to see more cases where having this available is meaningfully important rather than just nice.
 * [devlin] Concern I have with synchronicity is that it must be available to the renderer immediately. Potentially doable, but not necessarily trivial. May not be doable for future fields. As such, I don't think getOwnContext should be sync.
 * [rob] I agree.
 * [devlin] I want to leave the door open adding other values from the browser process (not available in the context's own process).
 * [oliver] I think it's unfair to say it's a fork of the context type.
 * [carlos] Firefox and Safari?
 * [rob] Should be async unless there's a strong reason, in the shape of an option on `runtime.getContexts()`.
 * [carlos] How about associatedTabId?
 * [kiara] Sounds reasonable.
 * [devlin] I'd want to see more concrete cases before committing. I'm not convinced it's necessary.
 * [carlos] Extensions already \_\_ in sidebar. Adding it to the URL means they want it synchronously.
 * [devlin] I agree there's utility, sync is easier to code. Exposing it would impact all extensions contexts. From an implementation standpoint, all extension contexts run in the same process. Sending a process global is easy, sending a context value is harder. You need to block the creation of the context until you can retrieve that information. Doesn't matter if you do it for certain frames, that's actually more lines of code. In either case, still need to have something that sits at before context creation, send these values over.
 * [carlos] Safari and Firefox already do this for the frameId and documentId.
 * [carlos] Conclusions?
 * [devlin] Chrome side, supportive of `runtime.Context.associatedTabId`. Supportive of async `runtime.getOwnContext()`. Not yet convinced of `runtime.associatedTabId`. Just easier is not a compelling reason.
 * [rob] Why getOwnContext? Would prefer fitting integrating in an existing method (getContexts) where possible for niche use cases, instead of adding to the pile of methods in `runtime`.
 * [devlin] Cleaner
 * [rob] would prefer to reuse existing method where possible. Prior art in `tabs.query({currentWindow: true, active: true})`.
 * [devlin] Not true – that returns the active tab in the active window, not _your_ tab. If you call tabs query with those from a backgrounded tab / window, it returns the foregrounded tab for the foregrounded window, not yourself. Other piece is if you supply self true, that limits you to 1 context. Could theoretically combine it with, say, type to conditionally filter yourself out.
 * [kiara] Don't love the name. Don't have a better one. Wouldn't be opposed. Want more use cases for `getOwnContext`
 * [timothy] I like the idea of having a getOwnContext method over a freestanding property.
 * [rob] We have getContext because getViews didn't work any more in service workers. Extensions could already know which window they're in (get DOM window directly).
 * [timothy] I'd prefer the method over a standalone property.
 * [carlos] Async.
 * [timothy] I think it needs to be, especially if we added associatedWindowId.
 * **Resolution**: all browsers opposed to `runtime.associatedTabId` (1164), in favor of async `runtime.getOwnContext()`.(1147, chrome:supportive, firefox:neutral,safari:supportive) In favor of runtime.Context.associatedTabId (chrome:supportive,firefox:supportive,safari:supportive). TBD if that property is filled when the context is itself a tab.

#### [Issue 807](https://github.com/w3c/webextensions/issues/807): Proposal: add OPTIONS_UI or EMBEDDED_OPTIONS as ContextType

 * [carlos] Is Chrome supportive?
 * [devlin] We're supportive of this.
 * [oliver] Enum value preference?
 * [devlin] Not either of these. Should be a generic embedded type. You can figure out it's the options page from the URL.
 * [rob] Supportive.
 * [kiara] We don't have an embedded options ui, so not directly relevant.
 * [rob] I say not a generic embedded type.
 * [devlin] If we called it “options”, then it's odd that an options tab is not that. An “options UI” could also mean a tab open to your options page. Nowhere else do we reference the content type, we reference the container.
 * [rob] I wouldn't do that because that gets into browser UI implementation details. Example, Firefox on Android shows the options page embedded in a full frame UI.
 * [simeon] Then you wouldn't signal its embedded?
 * [rob] It is in that case.
 * [timothy] I don't necessarily see the benefit of calling out that it's the options UI. you can infer that other ways.
 * [devlin] Rob, that's still embedded, full screen embedded, but still embedded.
 * [carlos] Supportive?
 * [devlin] Yes.
 * [rob] We're defining something generic for something where only one specific example is known. Concerned, but not a hill to die on - supportive.
 * [kiara] Supportive.


### Inconsistencies #2

 14:00 - 14:45 (45 min)


#### Background

##### [Issue 1127](https://github.com/w3c/webextensions/issues/1127): Inconsistency: should `background.scripts: []` load a background context or not

 * [carlos] Currently when you set an empty array of background scripts, Firefox loads a background document with no script text. Can be used with getBackgroundContext() to do something with the page.
 * [tomislav] Not intentional.
 * [rob] No design intention one way or the other.
 * [carlos] I know there are Firefox extensions that specify background scripts and an empty array, but don't know if they're used.
 * [rob] That was a concern during implementation because it became a hard error. I think we can shortcut this discussion to: what should an empty array do? Not load a background page?
 * [kiara] Sounds good.
 * [timothy] Yes.
 * [devlin] Yes. Sounds like we're all aligned that we shouldn't load a background page.
 * [carlos] In that case it's up to Firefox to decide how to handle potential breakage.
 * **Resolution**: Don't load a background page for empty array. Firefox accepts patches to drop support.

##### [Issue 785](https://github.com/w3c/webextensions/issues/785): Proposal: `create _generated_service_worker.js` based on `background.scripts`

 * [oliver] As I recall this wasn't a priority to investigate, which is why we were neutral.
 * [timothy] This would be bringing back the “scripts” key in Chrome.
 * [devlin] Yes. Are there any developers facing implications?
 * [simeon] None that I'm aware of. importScripts executes the scripts sequentially in order like script tags would. Modules would be odd because it changes global variable semantics, could be odd/unexpected to see a bunch of modules auto-imported to a wrapper background without anything being exposed.
 * [carlos] But that's how modules work.
 * [simeon] Yeah, fair. Behaves as expected, no content differences.


#### Alarms

##### [Issue 1107](https://github.com/w3c/webextensions/issues/1107): Inconsistency: order of expired alarm delivery

 * [anton] Noticed that Chrome and Firefox seem to behave differently, doesn't seem to be intentional. We can potentially impose an order.
 * [devlin] Supportive.
 * [rob] Test cases?
 * [devlin] Linked in the issue.
 * [oliver] What do we do in the case of a repeated alarm? First, last?
 * [simeon] First
 * [devlin] First
 * [oliver] I think we all assumed, but to confirm ilostmypassword2 is you, right?
 * [anton] Yes, I am ilostmypassword2.
 * [rob] Oliver, can we get this into our specification, since you've been working on it anyway? Would also be useful when Firefox implements changes (thanks Anton for patches).
 * [oliver] Yes.
 * **Resolution:** All supportive.
 * **Action item**: Oliver to specify delivery order of expired alarms.

##### [Issue 422](https://github.com/w3c/webextensions/issues/422): Inconsistency: limits on browser.alarms.create()

 * [anton] I believe all browsers are all supportive or already implement this.

##### [Issue 433](https://github.com/w3c/webextensions/issues/433): Inconsistency: Alarms API time slipping

 * [anton] All browsers are supportive or already implement this; move on.


#### DNR

##### [Issue 372](https://github.com/w3c/webextensions/issues/372): Inconsistency: DNR modifyHeaders supported headers

 * [kiara] We may have been the last one to add support for this.
 * [timothy] I've realigned us so we allow any header with some defined like Chrome.
 * [oliver] There was a note in the issue that Chrome has a list of unmodifiable headers beyond forbidden headers.
 * [timothy] I saw it more as a subset. There's forbidden headers for Fetch, but DNR is a smaller subset because there are a couple.
 * [oliver] Wanted to make sure we didn't end up in a place where Safari is more permissive than Chrome.
 * [timothy] Referenced Chrome when implementing this.
 * [oliver] Should we specify our specific list?
 * [carlos] yes
 * [kiara] Yes
 * [simeon] Yes
 * **Resolution**: close issue 372 as resolved.

##### [Issue 439](https://github.com/w3c/webextensions/issues/439): Proposal: Add filter for DNR modifyHeaders

 * [simeon] This is not an inconsistency;
 * [devlin] We should write a proposal following the proposal process and then write a patch.
 * **Outcome**: need proposal (add tag), then patch.
 * **Action item**: migrate existing “proposal” tags to “needs proposal”, archive “proposal” tag.


#### Miscellaneous

##### [Issue 1105](https://github.com/w3c/webextensions/issues/1105): Inconsistency: format of the fulfilled object for browser.notifications.getAll()

 * [timothy] We fixed this. I think the Firefox behavior makes the most sense so you can read back what you registered previously.
 * [oliver] Agree Firefox behavior makes more sense. This API has been around for a while, wondering about compatibility concern.
 * [devlin] Strongly suspect it's not a breaking change.
 * [oliver] Looking through extensions, I suspect you're right.
 * [devlin] Changing the response from a truthy value to a truthy value shouldn't have much impact.
 * [oliver] I can change the label to supportive.
 * [timothy] Should we use Firefox's approach of returning null values for unset keys, or drop them?
 * [kiara] Drop them.
 * [oliver] Yes.
 * [rob] sgtm.
 * **Resolution**: `notifications.getAll()` should return notification object; Chrome changes to do that instead of returning true.

##### [Issue 915](https://github.com/w3c/webextensions/issues/915): Inconsistency: tabs.query behavior for permissions granted by content_scripts.matches

 * [timothy] Safari and Firefox treat it as an implicit host permission. Chrome requires a separate host permission declaration.
 * [devlin] You can access cookies and perform cross origins requests?
 * [timothy] Yes.
 * [tomislav] Yes. Only one concept of permissions.
 * [rob] Initially we didn't grant host permissions by default in MV3 in Firefox, but we changed that to match Chrome's behavior. Users can still revoke it.
 * [devlin] I see, you can turn off the permission, not the behavior of auto-granting the permission.
 * [tomislav] Correct.
 * [devlin] Two pieces here. First, whether we would change this behavior in Chrome. Second, whether content script matches are different from host permissions. For the first, it is unlikely to change in Chrome.
 * [tomislav] How do you explain the difference to users?
 * [devlin] We don't. For users, it is the same. Similar to CSP, it's similar to opting into less privileges.
 * [oliver] What is the current behavior?
 * [devlin] Content script match doesn't give you host permissions. It gives you content script permissions.
 * [oliver] So this issue is slightly incorrect?
 * [devlin] It's a subset. The issue is accurate. We like having the benefit of this separation. I'd be supportive of revisiting in a future manifest change.
 * [tomislav] If you managed in MV3 with not granting permissions on install, I'd be happier with our choice.
 * [devlin] In an ideal state we'd also list what hosts you want each permission to apply to. That would be interesting to explore in a major revision, but given the current world I don't think we'll change this. I think the resolution is “opposed chrome”. The browsers that want to do it have, the browsers that don't don't.
 * [oliver] Leaning to keep this open because it is a sufficiently big inconsistency; in the spec it would be surprising that matches is not also granting host permissions.
 * [devlin] Hesitant to have an issue that we leave open because it's weird, but have no intention of doing anything about it. Also don't think we should hijack this issue for that purpose.
 * [oliver] I'm comfortable opening an issue to track that.
 * **Action item**: Oliver to create an issue to track this awkward design decision of `content_scripts.matches` not granting host permissions in Chrome (raised in [issue 915](https://github.com/w3c/webextensions/issues/915)).

##### [Issue 787](https://github.com/w3c/webextensions/issues/787): extension API availability in extension frames embedded on third party websites

 * [timothy] This likely comes down to WebKit and Firefox not having site isolation for iframes.
 * [tomislav] We do support site isolation in general, just not for extension frames. There was some concern about breaking extensions that reach directly into the frame.
 * [rob] That aspect is an unintentional implementation detail.
 * [tomislav] Currently an engineering challenge to figure out how to do site isolation without breaking the current approach.
 * [rob] We are all in favor of site isolation. Whether to expose extension APIs is a second question (the subject of this issue). Potential concern of exposing more APIs than currently is relatively minor compared to the benefit of exposing extension APIs (that is now long established behavior in Chrome). So Firefox is also supportive of exposing extension APIs once we enable site isolation for extension frames.
 * [oliver] Should we update the label for Safari?
 * [timothy] Yes. Given carlos' clarifications, supportive is more accurate.

##### [Issue 877](https://github.com/w3c/webextensions/issues/877): Proposal: theme.getCurrent() should always return an effective theme

 * [simeon] I think this is only implemented by Firefox?
 * [oliver] There's a chromium patch. Doesn't necessarily mean we're supportive. Seems hard to merge the shape of the browser's theme into the shape expected by this method.
 * [oliver] Devlin, if `theme.getCurrent()` were to be supported and no theme is installed, would we be supportive of generating the best representation that we can think of?
 * [oliver] Currently in Firefox, getCurrent() returns an interpretation of the theme's manifest, if you have a theme. If not, it returns an object with null values. If we had it, would we want to mirror Firefox's behavior or always return color values?
 * [oliver] We have a proposed patch for `theme.getCurrent()` that also generates the theme; Are we willing to accept the functionality?
 * [devlin] I haven't seen the code, but exposing the default browser theme seems important.
 * [devlin] I'm not in favor of implementing this exact API, but open to considering how to expose the user's theme to extension. Important use cases around accessibility for high contrast themes, etc.
 * [carlos] Propose to rely on `icon_variants` for that use case (high contrast/dark/light).
 * [devlin] Light, dark, high contrast are themes we can quantify, “lime green” is not. Being able to adapt to the colors used in the browser makes sense.
 * [oliver] What would your preferred next steps be?
 * [devlin] Firefox is the only one that implements this.
 * [rob] Correct.
 * [devlin] I'd say `browser.theme` go through the proposal process, discuss the API in its entirety, then as part of that process decide how we want to handle getCurrent (or keep it at all).
 * [rob] Who wants to drive this work? Personally I am not (time constraints).
 * [oliver] The reporter seems very active. They can likely champion.
 * **Action item**: Oliver to leave comment on [issue 877](https://github.com/w3c/webextensions/issues/877)

##### [Issue 426](https://github.com/w3c/webextensions/issues/426): Inconsistency: Navigation to file:// URLs using tabs and windows APIs

 * [oliver] Implemented in all browsers.
 * [rob] We never supported it in the first place (there is a feature request for it at https://bugzilla.mozilla.org/show_bug.cgi?id=1617594).

##### [Issue 40](https://github.com/w3c/webextensions/issues/40): Provide consistent access to browser.permissions API in the devtools

 * [devlin] Browsers are supportive or have implemented. Nothing to discuss for resolving incompatibility.
 * [rob] Dependent on site isolation and verifying that extension APIs work with the devtools context.
 * [kiara] We haven't implemented it.
 *

##### [Issue 511](https://github.com/w3c/webextensions/issues/511): Inconsistency: storage onChanged

 * [kiara] Discussed in the last CG session. There's a Firefox patch that's been out for years. Resolution was to get a new patch.

##### [Issue 570](https://github.com/w3c/webextensions/issues/570): Inconsistency: dns.resolve()

 * [oliver] I believe in 2024 Devlin indicated we should talk to the security team.
 * [devlin] Still supportive of you speaking to our security team.
 * (jokes!)

##### [Issue 407](https://github.com/w3c/webextensions/issues/407): Inconsistency: returned value for windows.create({incognito: true})

 * [rob] Why return null.
 * [simeon] spanning modes
 * [devlin] Not having access to incognito. I still like Chrome's behavior.
 * [kiara] I think we match Chrome's behavior.
 * [timothy] If you have incognito access we return an object, if not we return null.
 * [carlos] Reminds me of tabs.create with incognito: true.
 * [rob] An extensions without incognito access, can they call `windows.create()` to open an incognito window with a given URL…?
 * [devlin] With an arbitrary URL it exposes some potential other concerns. If you're logged into another site in incognito and the extension doesn't have access, then the extension opens a tab on that origin loads with that session. Not great.
 * [timothy] We isolate cookies per tab (and origin, storage partition).
 * [devlin] Sounds like per browser instance. Still supportive of our current behavior. May need to change the behavior to not allow URLs with this method if you don't have incognito access.
 * [rob] We reject if you don't have access. If you add more options, like URL, we still reject.


#### Not discussed

On the agenda but not discussed due to lack of time:

[Issue 897](https://github.com/w3c/webextensions/issues/897): `browser.tabs.create({ incognito: true })`

[Issue 1120](https://github.com/w3c/webextensions/issues/1120): Inconsistency: viewport width calculation with visible scrollbar

[Issue 273](https://github.com/w3c/webextensions/issues/273): Inconsistency: path handling across APIs and browsers

[Issue 270](https://github.com/w3c/webextensions/issues/270): Inconsistency: devtools.panels.create()

[Issue 27](https://github.com/w3c/webextensions/issues/27): tabs.duplicate() must implement a way to duplicate at a given index and with a given active state

[Issue 498](https://github.com/w3c/webextensions/issues/498): Proposal inconsistency: runtime.getContexts() proposal differs from Chromium implementation


### Wrap-up

14:45 - 15:30 (45 min)

 * [oliver] Inconsistencies discussions we've had have been more productive than past triage. Thanks for putting those together
 * [timothy] Agree. Useful to have resolution ahead of writing specs.
 * [devlin] Agree inconsistencies can be valuable. So can bug triage. I'd be supportive of doing more in the future. For better or worse we don't do much of that outside of these meetings.
 * [carlos] Maybe some kind of quarterly session?
 * [devlin] Not opposed, scheduling is hard.
 * [oliver] Do we agree that more TPAC meeting time would be better?
 * [rob] Yes.
 * [timothy] We tried.
 * [simeon] We asked less than last year, but got even less than we asked for.
 * [rob] For the future, we should try to make use of the fact that we can benefit from discussion with other groups also at TPAC.
 * [oliver] Simeon had a suggestion: state of the browsers being a breakout that we advertise to other groups. Would give us more time to do it in a regular session.
 * [devlin] Supportive (assuming meaning “state of webextensions in browsers”)
 * [rob] I like that, not just for the broader audience but also to have time for our own discussions. On Monday we barely had time to discuss anything else. If we have a full day, that's fine, but we had so little other time.
 * [devlin] I believe TPAC 2027 is tentatively scheduled for December
 * [tomislav] Tentatively?
 * [devlin] Published on the TPAC site, but I don't know how this stuff works so I'm not making any promises.
 * [rob] Link https://www.w3.org/events/tpac/2027/
 * [devlin] Dec 6 - 10. Panama City, Panama.
 * [kiara] May-June is a tough time.
 * [simeon] Late June?
 * [timothy] Tentative plan is to have MS to host, right?
 * [devlin] Yes. If may/june doesn't work, maybe April?
 * [rob] April sounds good, still 6 months from now.
 * [devlin] Sounds like maybe second half of June, maybe April. When do we want the long gap?
 * [kiara] Prefer late July than April.
 * [tomislav] Depends on location. If India, (late) April preferred over July due to temperatures.
 * [devlin] Sounds like the possibilities are April or post-WWDC.
 * [mukul] I'm interested and will keep you updated.
