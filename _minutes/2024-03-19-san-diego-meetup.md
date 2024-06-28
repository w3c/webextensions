# WECG March 2024 Meetup, Public Notes, Mar 19

Tuesday, the second day of the three-day in-person meetup of the WECG in San Diego ([#525](https://github.com/w3c/webextensions/issues/525)).


## Agenda

 * 9:00 - 10:00 declarativeNetRequest
 * (break; transition from remote to in-person only)
 * 10:20 - 10:40 Cosmetic Rules
 * 10:40 - 10:50 Imperative Blocking
 * 10:50 - 11:35 Mobile extensions
 * 11:35 - 12:00 Permissions and Related
 * 13:00 - 15:00 WECG Leads session (no public notes)


## Attendees

 * Devlin Cronin (Google Chrome)
 * David Johnson (Apple)
 * Timothy Hatcher (Apple)
 * Kiara Rose (Apple)
 * Elijah Sawyers (Apple)
 * Brian Weinstein (Apple)
 * Tomislav Jovanovic (Mozilla)
 * Jessie Berlin (Apple)
 * Rob Wu (Mozilla)
 * Anton Bershanskyi (Independent, remote)
 * Carlos Jeurissen (Jeurissen Apps)
 * Richard Worth (Capital One)
 * Casey Garland (Capital One)
 * Mukul Purohit (Microsoft)
 * Oliver Dunk (Google)
 * Andrey Meshkov (AdGuard)


## Meeting notes


### Declarative Net Request

Future expansion in Declarative Net Request, including cosmetic filtering proposal and other improvements, safe imperative modification, header modifications, CSP, and more

[Issue 493](https://github.com/w3c/webextensions/issues/493): Support redirect-only rule in DNR (part 1 of 2)

 * [andrey] Tricky to understand, but widely used. Many generic rules that block by file name in URL. Used by some websites to detect ad blockers, circumvent adblockers. Filter maintainers would like to use a different behavior on specific websites. Could be done like it's done right now in uBlock Origin/AdGuard. First (…) Second way changes how the blocking is done. There are 1000 rules like this and need a solution.
 * [devlin] Do you have an example?
 * [andrey] E.g. ads.js; Then a filter maintainer wants to override the behavior for a whole website, e.g. instead of a server error it wants to serve a replacement. To override how the request looks like to the website.
 * [devlin] Why not use a higher priority redirect rule?
 * [andrey] We can do that, but there are many websites.
 * [devlin] When the redirect redirects to a static resource in the extension?
 * [andrey] Basically yes. Instead of blocking on this website, return an empty JS/image, etc. Solution could be to provide a different action instead of block. One that does not return an error but emulates an empty response.
 * [devlin] If you have the set of 1000 rules to block trackers, then you don't know which of these match on thousand websites, so you need to update them for the websites you want to match.
 * [andrey] In content blockers there is a similar complication to how response headers are matched, because you cannot act on the response at the start of the request.
 * [devlin] One of the proposals here is to have a new action type redirect-if-blocked, which would allow you to specify these rules. Having that as an action type seems weird. So we could also have a condition of block, and then an action of redirect from there.  That would allow us to abstract it to other action types, in principle.
 * [andrey] If we can have another action as a condition, then we can also use it for other scenarios.
 * [devlin] Then we also would have to repeat matching multiple times.
 * [andrey] Right, it's not a bad approach though.
 * [jessie]
 * [devlin]
 * [andrey]
 * _(this topic was revisited later, while discussing the next issue; Search for "issue 493")_

[Issue 468](https://github.com/w3c/webextensions/issues/468): [DNR] Redirect rule does not allow applying other redirect rules to the resulting request

 * [andrey] Removing params from URL, we have several rules to remove params. We want one rule per parameter, and not many intersections. Issue already got some feedback from Rob (Firefox), waiting for feedback from Safari and Chrome.
 * [devlin] I don't think that the solution would be quite the same as what was discussed before (issue 493) because it is just removing params.
 * [andrey] Maybe up the number of permitted redirects to e.g. 100
 * [devlin] Don't want to have so many redirects just remove params.
 * [rob] That's not necessary; We can apply all transformations at once and then redirect once.
 * [devlin] If those rules are applying query parameters. Those rules can be cumulative. Other types we wouldn't want to have multiple apply.
 * [andrey] What's the risk?
 * [devlin] Removing multiple query parameters allows you to, for example, remove trackers. Having a rule that redirects a host, another that redirects a scheme, etc. That's probably not how you'd want to compose those redirect rules.
 * [andrey] Modify document location hash.
 * [devlin] Generic case is anything that would perform a same document navigation?
 * [rob] Same document nav doesn't have any network requests. What are you referring to?
 * [devlin] If you're currently on a page, a modification of a URL wouldn't result in a new URL being loaded. Query parameter, hash, …
 * [rob] Query parameters trigger a navigation. Sounds like you're saying any navigation on the same origin.
 * [devlin] I don't think we'd want cumulative navigation on paths.
 * [rob] For example, a site could embed tracking parameters in path components.
 * [devlin] Note, we've jumped issues. Trying to draw a line between where cumulative rule applications does/doesn't make sense. Something that changes a path and certainly origin doesn't make sense.
 * [rob] You're suggesting query modifications in the query string / reference fragment when it looks like a query param
 * [devlin] Maybe another type of rule to address that: modify path rule parameter (bad name).
 * [andrey]?
 * [devlin] If we do redirects, every rule match results in a network request.
 * [andrey] That's implementation specific. If you match and apply in order of priority, you may not need to execute a new network request.
 * [devlin] What if you do something that results in a new match? That's a loop of N.
 * [andrey] You have an exception that prevents this.
 * [devlin]  ?
 * [carlos] Could you make this behavior optional in order to reduce the performance impact?
 * [devlin] ?
 * [andrey] I don't follow the limitation of applying a redirect rule to the result.
 * [david] I think Devlin is suggesting we wouldn't want to make a rule that applies another redirect.
 * [devlin] That's what I was originally suggesting, yes, but
 * [jessie] You'll have to create another rule anyway, right? The name doesn't necessarily matter.
 * [andrey] Right now we don't have to create new rules.
 * [jessie] You are going to have to create a new rule, so even if there is a new name, I'm not sure how that adds complexity.
 * [andrey] Adds complexity to the syntax. Generally prefer to not extend existing things with new functionality when it can be avoided.
 * [jessie] Adding new functionality instead of updating something existing is additional complexity.
 * [andrey] Both options (single redirect rule or applying multiple at the same time) are easier for a filter list maintainer to reason about. Introducing a new flag for an existing rule creates confusion as the maintainer has to learn about new behavior.
 * [jessie] Applying a redirect and needing to apply new rules that now match is a major concern for me.
 * [andrey] ?
 * [devlin] I think the suggestion is first eval you get all matching rules, just one time, match and apply all in one go.
 * [rob] Current situation. Browser has built in a certain number of redirects, at some point you hit a redirect limit, and you can no longer perform redirects. This is a problem if you want to make more changes than you can redirect. The suggestion is to apply all at once and redirect once.
 * [devlin] Would this only apply on same priority rules?
 * [rob] I was thinking so, yes.
 * [andrey] Higher priority rules go first, lower priority go second so we don't need to apply them.
 * [devlin] I think this is getting to what Carlos mentioned to provide a mechanism for specifying a cumulative redirect. Anything that should just redirect would not be cumulative. You would explicitly mark cumulative redirects if you are doing something like removing query parameters.
 * [rob] Do we need multiple priorities? Removing a param just removes it. Doesn't apply anything else.
 * [andrey] Generally I don't think we need them. So far what has been suggested seems reasonable.
 * [devlin] Would have assumed there are times when you want to replace. In that case you might have a higher priority that you want to remove.
 * [andrey] Replacing is not what we do right now. We do have transformers but this has some limitations and we don't allow everyone to use it. We may need such functionality in the future.
 * [devlin] Time check. Curious for other browser vendors, intuition on if we have one pass of the rule set, apply all matches in the same operation, and output a single new URL. Potential performance hit ‘cause we can't early out, but may sufficiently contain that performance hit.
 * [brian] When we match one, would we start over?
 * [devlin] No, andrey's suggestion was that we'd find all potential matches in one go, then apply them.
 * [rob] In removing parameters, the order of applying rules doesn't matter.
 * [brian]
 * [devlin] In order to avoid trying to fully design this API in the next 15 minutes, is this something we would want to explore? Rob it sounds like you are supportive. Is Mozilla supportive?
 * [rob] Yes, we're supportive.
 * [brian] Open to exploring this.
 * [devlin] On the Chrome side we're in the same boat, if we can contain this to one loop through the rules and do one set of modifications, we are open to this. The open questions are how do we indicate if rules should be cumulative.
 * [andrey] I like Rob's proposal.
 * _(continues previously discussed [Issue 493](https://github.com/w3c/webextensions/issues/493): Support redirect-only rule in DNR)_

[Issue 493](https://github.com/w3c/webextensions/issues/493): Support redirect-only rule in DNR (part 1 of 2)
 * _(while discussing issue 468 about multiple redirects, we circled back to issue 493)_
 * [devlin] Redirect if blocked rule would likely have a different approach to applying multiple redirects.
 * [andrey] The condition redirect block doesn't apply if the request is actually blocked, but if there's a matching block rule. To make that conclusion, we first need to analyze block rules, then check redirect if blocked rules.
 * [devlin] Exactly. If redirect if blocked is a condition, and you get a new request, and you search through all rules, there will no longer be a match because request has not been blocked.
 * [devlin] For matching on response headers, a lower priority rule can take precedence over a higher priority rule, since we don't want to send a request to see if the block rule would match.
 * [andrey] What's the blocker to making progress on redirect-if-blocked?
 * [devlin] The biggest thing we want to ensure is that we cap the possible performance hit. We want to ensure this never becomes something where we continue looping indefinitely. Are there any situations where there is a rule that blocks, and the another rule that redirects if blocked, and then another rule that tries to do something based on that?
 * [andrey] Like the case of multiple redirects, there needs to be something that prevents loops.
 * [devlin] I didn't think it was only once, I thought there was a limit of 7 in Chrome.
 * [rob] Limited, somewhere between 5 and 10.
 * [devlin] We wouldn't want to hit that limit if possible. Want to add something where we are guaranteed to only use one.
 * [andrey] It won't solve anything else, but the number of existing rules that use this format justifies this. Last year Gorhill said there were 600 rules. This morning there were 800. Usage is growing.
 * [devlin] Wondering if a general form would address more use cases. Say a rule condition that applies to blocked rules. This may be the only case where such a feature is useful, but trying to consider what else might leverage it. If we cap this at one additional loop/evaluation of rules, is this something we're generally open to considering? Rob, you mentioned a concern that if we do this, then we get into the arms race between ad blockers & ads.
 * [rob] Right. Was also trying to see what the use case behind this. If we implemented it in a different way, might that better address the issue?
 * [andrey] I probably wouldn't design it differently. Hard to come up with a better way that's flexible enough to solve the task at hand. So far I don't see a better design. Agreed that it seems strange, but I believe it's needed.
 * [devlin] I think there is a good counterpoint to Rob's concern. This is already being used in Manifest V2 and if ad networks were going to do something different, they would have likely already done so – at least, it's a good sign that it's not just something that will be used for a month, and then pivoted.
 * [andrey] Generally, we could probably live without it, but it would require much more manual work by filter lists. Given significantly limited resources of maintainers, don't think that's the best path.
 * [devlin] Apple folks, thoughts?
 * [david] We always have concerns on performance, but we're open to investigating.
 * [devlin] Andrey, sounds like this path is sufficient for your use case?
 * [andrey] Yes.

[Issue 394](https://github.com/w3c/webextensions/issues/394): [DNR] Add support for wildcards in initiatorDomains and excludedInitiatorDomains fields

 * [andrey] Would like flexibility in matching initiator, with wildcard. Safari provides a similar capability in Content Blocking API. Can't use this and matching on domain names at the same time (safari-specific issue).
 * [rob] That doesn't apply to the general initiator. Safari's rule matches the top level only, not arbitrary parent documents that may be a subframe themselves. Which do you need?
 * [andrey] Both.
 * [oliver] When the issue was originally opened, there was a proposal to have a wild card. During discussion, there was a suggestion that it could only apply to the TLD. Allowed avoiding a RegExp which would mean needing the same limits we have to number of RegEx rules in other cases.
 * [andrey] Initiator url filter is not a regexp. Not the same perf hit. DNR syntax for matching URLs is faster than regular expressions. Initiator url filter field would use a similar approach, avoiding RexEp overhead.
 * [rob] By initiator, for documents, do you mean the initiator of the navigation or the parent document?
 * [andre] I think of it as tab URL vs frame URL. In this case we check the frame URL.
 * [rob] That makes sense for sub-resource requests, but what about document requests? Does initiator apply to the parent or the frame that triggered the navigation?
 * [andrey] Does initiator mean tab URL?
 * [rob] Could be either. Commonly the parent of an iframe, but could be a different frame or even window.
 * [andrey] Intent in choosing “initiator” naming is to match the pattern of the existing DNR. I thought it was tab URL.
 * [rob] I'll follow up later and record the answer in the notes.
 * [devlin] We're over time and this will need more discussion. We're potentially open to it, this is easier than restructuring rules (previous topic). URL filter is cheaper than regexp, but isn't free. A combination of URL filter and a list of initiator URL filters, that could potentially significantly impact the performance of the URL filter. Could potentially result in 2x the time. I think we collectively don't want to add a “max number of initiator URLs” constant or something like it.
 * [andrey] Original request was originally on eTLD, but that's not the only case so we expanded the scope.
 * [devlin] Suggest we break, but consider for the future how many rules are satisfied with eTLD, how many are by full initiator URL filter, and if there's other variations of \*eTLD that would give us 99%, or whether we truly need full URL.
 * [david] We also have performance concerns here and would like to discuss further.


### Cosmetic Rules

[Issue 362](https://github.com/w3c/webextensions/issues/362): Proposal: Declarative Cosmetic Rules

 * [devlin] Recap on cosmetic rules.  Andrey, you mentioned this would be easier in Safari
 * [andrey] I expect Safari to be able to implement this easily because Safari's Content Blocker API already has this feature implemented.
 * [brian] Yep
 * [andrey] It blocks us from migrating to web extensions.  What's the next step?  Proposal?
 * [devlin] Does any browser have the bandwidth to start this? It sounds like we have consensus on this being a good idea. Hesitant to work on a proposal if no vendor has the bandwidth/intention to work on this for a long time. If we design now and start implementing in 18 months, we may not want that design (the world changes in 18 months).
 * [andrey] Not a new thing for us. Doubt there will be drastic changes to the design. Could start with some kind of polyfill on our side as we'll need this functionality. Can start with a polyfill, experiment, gather feedback, and discuss. Anticipate that this will be easier on the Safari side.
 * [david] Safari is interested in it, we see significant interest from content blockers. Are you interested in adopting Safari's approach?
 * [devlin]  Not familiar enough with existing syntax to comment on Safari's existing approach. Also wondering if this would make sense for declarative modification (blocking or addition). Canonical example is Pinterest adding pin buttons, but also things like a password manager badging a password field. Potentially another layer that would be interesting to consider.
 * [timothy] Don't feel like this would fully address the password manager use case.
 * [devlin] Could be used in combination with activeTab, but that's a larger discussion.
 * [rob] Is it an objective to have this functionality without host permissions?
 * [devlin] Yes, for at least some cases.
 * [jessie] We're very interested in ways of allowing extensions to put content in front of users that they can interact with, but concerned that this blows up the scope far too much.
 * [devlin] I think we're aligned. I'm thinking we'd start with just the blocking functionality and potentially introduce additional functionality in the future. I'd push back on a name like “declarative css hiding”, since that restricts our ability to expand. I'm thinking about making space in the scoping of this API to potentially introduce functionality in the future.
 * [devlin] Would ad blockers share a common polyfill?
 * [andrey] We share a lot of ideas with other content blockers, but we don't have a formal group where we do that.
 * [devlin] We don't want to end up having a graveyard of proposals. If there was a canonical polyfill, that paves the road to baking it into the platform. Are browser vendors generally agreed that there's interest in exploring this?
 * [david] Yes, we're interested.
 * [rob] This is independent of DNR (declarativeNetRequest), right? If not then I wonder what conditions you require.
 * [devlin] Yes, this isn't network related
 * [andrey] We haven't yet decided where we'd put this, right? Would it be a new namespace or a part of an existing one?
 * [devlin] Sounds like something that Safari can incorporate in the proposal.
 * [david] Would be inclined to … . Do we see this going down a path of putting all declarative features in a single namespace?
 * [brian] DeclarativeNetRequest API surface has a lot of APIs that may be useful to not duplicate in a new namespace. For example, dynamic/session rules.
 * [rob] We can copy the same methods/API design in the new namespace. There is already some precedent for that in the scripting vs userScripts namespace. When we put everything (DNR and cosmetic rules) together, we have to think about the impact on style rules when we make new DNR features.
 * [timothy] Have objected to this in the past. UserScripts isn't the best example because we have a lot of duplication.
 * [devlin] Sounds like something to discuss in a proposal.
 * [andrey] You said you had ideas of how to extend this in the future. For example putting something on the page declaratively. Isn't this what declarative content was supposed to be?
 * [devlin] declarativeContent was an early pioneer in this. Never injected content in the page, allowed devs to conditionally show page action.
 * [jessie] Hesitant. Would prefer to use DNR, but at this point I think we'd alias.
 * [devlin] Want to identify which pieces of DNR we'd want to generalize. Haven't historically shared methods or features across APIs, but I think that's a good area to explore.  I think we'd want concepts of the APIs to overlap (e.g. conditions + actions as a concept, having session, dynamic, and static rules, etc), but not all functionality or types. Would like to see what Apple has in mind in a proposal.
 * [andrey] Declarative content, should we mark it as deprecated?
 * [devlin] Nope.  It still has non-trivial usage. Also depends on how you define usage – parts have more use than others. Used enough that we wouldn't want to throw it out wholesale.  It may still also be a good home for this, TBD.
 * [rob] I did an analysis 6 years ago. Around 11 million users across 1000 extensions. 163 extensions had over 1000 users.
   * Source: declarativeContent usage: https://docs.google.com/document/d/1pOWsOXgDljhiN6hcLA2vojOR4cCh2sq7WfwO5j5cIyg/edit


### Imperative Blocking

 * [devlin] Simeon, you added imperative blocking. I'm guessing that's about doing a blocking webRequest-like thing in a safe, performant way.
 * [simeon] Yes
 * [devlin] From the Chrome perspective, a major concern is that it's very easy to tank performance. Additionally, if we did this, we'd want to use an established primitive (not create something new). For example, fenced frames as a container that would allow the platform to prevent network access. When we see that these ideas go and that they are going to stick around, we can revisit if those could be used
 * [simeon] Was thinking of e.g. something like a WASM module in the network process.
 * [jessie] Biggest concern is perf. We've seen this (ability to prevent a network request from going through) abused in the past. Very concerned about impact.
 * [devlin] I think Chrome and Safari are generally opposed.
 * [tomislav] I'm very skeptical that it's even possible for us to prevent extensions from leaking data. Even with a block/allow engine, I could extract data from bitfields. Could have a page with a 100 images and that's 100 bits of data you could leak based on block/unblock.
 * [rob] Yes, that's true. As soon as there is any shared state and ability to extract bits of information, infoleaks can occur.
 * [jessie] Could explore places where extensions can't read/write from disk, can't have network access. Still concerns about performance, but interested in exploring this area.
 * [andrey] Can't escape the need for host permissions.
 * [devlin] Sounds like participating browser vendors are collectively concerned.
 * [rob] I think privacy concerns can be overcome by not carrying over any state.
 * [devlin] Not fully agreed with that, but can catch up in a break-out session.
 * [andrey] To summarize, if there's a way to safely and in a performant manner register something that could modify network requests
 * [devlin] hypothetically if we can guarantee security, privacy, performance, and minimal complexity, then yes.  But I think that's not going to be very feasible.
 * [tomislav] If this also required host permissions to be usable, I wouldn't be supportive.
 * [andrey] But Mozilla supports blocking webRequest?
 * [tomislav] The alternative proposal should offer advantages over what we already have.


### Mobile extensions

 * [rob] Someone recently spotted that Microsoft was exploring bringing extensions to mobile, so that seemed like a good opportunity to begin discussing. Safari and Firefox have extensions on mobile, and seems like a good time to align on defining the “windows” extension API for mobile.
 * [casey] We are interested in extensions on mobile.
 * [devlin] I, personally, want to see them on Android. There's technical complexity, which we can potentially work around.  UI is strongly opinionated on Chrome and there's limited surface on mobile, which adds additional challenges. Also interesting challenges and questions around distribution of extensions. I continue to personally want them, but it's not actively being worked on.
 * [mukul] Clarify distribution?
 * [devlin] E.g. whether to distribute through the Chrome Web Store or the Play store; whether we could distribute through the App store at all. iOS requires an app, leading to empty shell applications that only load an extension. There's a lot of additional complexity around look, feel, etc..
 * [mukul] Firefox approach is to have a single store (AMO) that covers Android and desktop. Is the concern for Chrome that Play is the distribution mechanism on Android?
 * [devlin] Concern is there are multiple potential paths that require evaluation and consideration.
 * [andrey] Is there any need to change MV3 API in order to make extensions viable on mobile?
 * [timothy] We were happy to see MV3 going in the direction of non-persistent background contexts. Beyond that I don't think there's anything we need.
 * [andrey] Sidepanel probably isn't needed.
 * [jessie] There's multiple mobile sizes. Might be appropriate in some.
 * [andrey] Is there a need for a mobile specific namespace?
 * [rob] No.
 * [devlin] Don't think so. There might be things that are only applicable on mobile, but they could just be used conditionally.
 * [tomislav] Web platform talks in terms of form factors, input capabilities, etc.
 * [timothy] One big limitation that Chrome and Firefox will run into is nativeMessaging. If app and extensions aren't bundled then that's an issue.
 * [devlin] Does iOS nativeMessaging have the same behavior as on desktop?
 * [timothy] Has the same JS API, yes. At the native level it's drastically different compared to other browsers.
 * [andrey] Most apps are not empty shells. Would like to see this in other areas as well. For example, on Android we'd like to be able to communicate between our extension and app
 * [rob] We could try to add something, but would require coordination and standardization. There are ways to do this on Android, but we wouldn't want to independently create our own solution.
 * [andrey] &lt;missed in notes>
 * [rob] on iOS a user has to go somewhere to opt in. Whether the browser or OS, the user needs to opt in somewhere.
 * [andrey] Yes, user has to opt in. On iOS we also have the challenge that users probably won't be able to install things outside of the store (current policy). We would also want to be able to communicate between our Firefox extension and app on iOS.
 * [tomislav] Mozilla does not have an “app store”. Google (Play Store) or Apple (App Store) are in a better position to drive that.
 * [andrey] Probably could provide a native messaging API on Android. Suspect that's true for Edge as well. Implies not just browser extension APIs, but also the app-side of the communication channel. That aspect hasn't been discussed yet.
 * [rob] Is there any interest in implementing native messaging for Android from browsers that haven't implemented Android extension support support yet?
 * [devlin] I work on the Chrome side. I can't comment on Android resourcing. At this moment I can't make any promises one way or another.
 * [patrick] How much effort would it be for you (Firefox) to create a draft proposal?
 * [rob] I don't have time for it. I think it would be a lot of effort, and app+extension developers are in a better position to create a proposal.
 * [patrick] If you're blocked on there being a proposal and none of our teams have time, is the proposal onerous enough that (…)
 * [david] Maybe we should put out a call to get feedback from developers.
 * [rob] Agreed. The concern is that if we are the only group interested and other vendors do something different, then that is not beneficial to the platform.
 * [devlin] &lt;missed in notes>
 * [david] We're aware of browsers that spoof Chrome's UA to install extensions from the web store. What is Chrome's stance on this?
 * [devlin] We've historically allowed other browsers to leverage the Chrome Web Store. That's how Chromium-based browsers like Edge and Opera do it.
 * [devlin] Is Firefox or Edge looking into extensions on iOS?
 * [tomislav] We are looking into a Gecko-based browser on iOS.
 * [mukul] Definitely have a desire to look into it. Open question on how we handle the app store. There isn't too much difference between capabilities of the underlying engines.

(windows API on mobile)

 * [devlin] We've discussed APIs on mobile. In APIs, we have tabs, windows, and tab groups. UI-wise, we only have two of those on mobile, but I don't know which two – it depends on your interpretation
 * [timothy] Currently we expose windows on iOS, but you can't close/open/create them so they can be feature detected in JS.
 * [carlos] Seems to be an edge case. Potential solution is to check if there are two windows.
 * [timothy] Gets more complicated on iPad and Vision because you can have multiple windows and each has two backing windows: a private and non-private window.
 * [rob] If an extension wanted to open a private browsing tab and one wasn't open, how would that work?
 * [timothy] I believe it's exposed as a window that exists with no tabs. Can't close windows on iOS Safari. We don't expose create, remove or update.
 * [david] You can edit the tabs in a window, but you can't edit the window.
 * [rob] Seems like a reasonable approach. Often when the last private browsing tab is closed, the window also closes.
 * [timothy] Each private tab has its own session, so when a tab closes the session does as well.
 * [oliver] Is this documented and if not should we?
 * [timothy] We should and I think it is part of the browser compat data.
 * [devlin] Should document that pieces may or may not be missing, but would not want to spec specifics around e.g. "there's only one inPrivate window"
 * [rob] I'd be in favor of documenting it in spec, that there may be platforms where the number of windows is fixed.
 * [timothy] We don't currently support context menus in Safari, but iOS changes may make that possible in the future.
 * [oliver] Don't think it makes sense for Chrome to drive as we don't have an implementation, but makes sense for Firefox or Safari to do so, assuming interest.
 * [rob] We don't have enough spec to add this to. May make more sense to use our notes to collect decisions and alignment.
 * [oliver] Agree that the spec is too immature right now, but would like to start collecting. For example, a non-normative note that says “windows may not directly correspond to what the user can see.”
 * [devlin] I think tabs, windows, and tab groups are obviously different on desktop and mobile, which makes it interesting to discuss here. Are there other APIs that don't translate or may not translate the same way?
 * [timothy] Action is thankfully not called “toolbarIcon”. Can't think of anything else that doesn't directly translate.
 * [devlin] it's almost like we thought of that (smiles)
 * [rob] Windows API is a little weirdly named given the featureset on mobile, I view it as an ordered collection of tabs. We'll still use the “windows” API name for historical consistency..
 * [timothy] We don't support tab groups. We still need to figure out if we can fit our concept of tab groups into the existing tab groups API.
 * [oliver] Windows works well – likely matches developer expectations.
 * [timothy] Also there are windows on iPad and Vision OS.
 * [devlin] Are we all aligned on using windows as the API namespace, even for small form factor devices?
 * [timothy] Yes.
 * [kiara] Yes.
 * [rob] Yes.
 * [carlos] If we go forward with the Safari approach we might get conflicted in a potential future in which it is possible to open additional windows?
 * [timothy] We handle this by creating two windows, a private and non-private, per “window”.
 * [devlin] Do you currently expose this because of the assumption that sessions are either in private or non-private mode?
 * [timothy] Yes. Users can switch between a normal and private collection of tabs.
 * [devlin] It is not like you have tab1 in private, tab2 not in private, etc, all in the same "window".
 * [david] Correct.
 * [rob] Similar considerations in Firefox. The collection of private and non-private tabs are separate.
 * [devlin] Any specific concerns, Carlos?
 * [carlos] I recall having issues with how Safari approached its implementation. Maybe we want to remove the assumption of having a private & non-private window.
 * [firefox] We wouldn't do that, but in FF we have the concept of containers. We reuse the concept of a cookieStoreId to distinguish between different containers and regular browsing contexts.
 * [timothy] I would be open to having a property on the window to have a relation with the “sibling”/”opposite” window.
 * [devlin] Let's make a new window groups API (joking)
 * [timothy] You're joking, but it is not a bad idea. A property on the window.
 * [devlin] Yeah, a property on a window like groupId in order to associate pairs of windows makes sense – just wouldn't want a dedicated API.
 * [rob] I think we've concluded. Safari and Firefox will work together to specify behavior.
 * [timothy] Suggest adding Edge too.
 * [devlin] I'd be interested in Chrome folks being a fly on the wall
 * [carlos] Should also create an issue to track and organize work.
 * [rob] Would like to be very specific when creating an issue (windows API for mobile). Want to avoid people +1ing requests for mobile.
 * [mukul] Are there any other behavior changes Firefox implemented to support Android?
 * [rob] Most APIs are common across desktop and mobile. Windows have special considerations. Also want developers to move to event pages.
 * [andrey] We observed that limited event pages are very similar to service workers. Didn't quite expect them to be as limited as they are. May want to emphasize lifetime limitations more in documentation.
 * [rob] We were stricter in the past, but as we discussed lifetimes in the group we've advocated for less strict behavior and aligned on common behavior with Chrome for extending lifetimes.


### Permissions and Related

 * [simeon] Besides declarativeContent I'd like to have more ways to show UI to users, especially when there are limited UI surfaces such as on mobile.
 * [carlos] Another potential approach is to only allow an extension to access content when they're actively in view. Especially applicable to sidebars.
 * [timothy] Sounds like activeTab to me.
 * [devlin] Concrete example? Maybe an extension wants to communicate with its own server?
 * [carlos] Yes.
 * [oliver] Another example is sidepanels: if you have a reader view that summarizes the content on the page. When you open the sidebar you have activeTab and can access the page, but after navigation the access is lost.
 * [devlin] Concern about tying sidebar open = have access to the tab. For example, you have a messaging in a side panel and navigate to your bank. Users would likely be surprised at the access they're giving away.  Also the extension can control the tab URL, so can choose to navigate to a new origin.
 * [tomislav] Another example of when this is needed?
 * [carlos] When you need to communicate with a server without CORS or apply DNR with host permissions.
 * [andrey] Browser UI makes it more difficult for extensions to signal functionality to the user, since extension icons are hidden by default.
 * [devlin] Sounds like this may be covered by showSiteAccessRequest().
   * showSiteAccessRequest proposal: https://github.com/w3c/webextensions/pull/529
 * [andrey] Idea is not bad, but depends on how it is communicated to the user.
 * [devlin] On Chrome desktop we are considering sliding out a message from the extension button.  Goal is to be noisier than a subtle badge, but less noisy than a dialog
 * [carlos] There are extensions that are useful generally and then such a notification would be there by default. Already got feedback from users about the difficulty of finding the extension icon.
 * [andrey] What if there was an API where the extension could ask the user to "pin" it and then it'd be on the browser to explain to the user what the extension wants and how to do that.
 * [tomislav] We understand your concerns, but we have to support the entire ecosystem. What extension wouldn't request this?
 * [andrey] Pain is every extension has to explain how to pin/unpin.
 * [devlin] Hear your pain. Other developers also in the past complained when we gave them an icon in the toolbar. There's no single solution that fits everything. We won't allow extensions to configure the UI in that regard, but  I understand it to be painful to developers and we want to look at ways to ease that pain.
 * [devlin] Carlos, you described extensions in the background with host permissions?
 * [carlos] In the foreground. You would restrict an extension from using host permissions when the extension isn't actively being used. When you have activeTab, that is restricted to the current page.
 * [devlin] Yes. And we won't change that.
 * [andrey] If I open a panel, I have a panel that constantly nags for access. But it doesn't necessarily want access, it has activeTab. Should be a good thing because the extension is narrowing its scope, but in reality it's frustrating.
 * [devlin] From a fundamental perspective, on the Chrome side we are against implicitly granting permissions without user consent. We have a number of ways to request consent, all websites, some sites, and some sites with user gesture. The goal of the showSiteAccessRequest API is to present a medium-level request to the user.
 * [carlos] Concrete example: sometimes you need host permissions that aren't on the main page and the user may not want to grant them because the extension can use them in the background.
 * [david] Are you worried about cases where a user wants access to Google, then the extension tries to access your gmail behind the scenes?
 * [carlos] Yes.
 * [david] I feel like that's a really hard problem because an extension could do this in a fraction of a second after a valid use.
 * [tomislav] Maybe a way to address this is to have a way to request permissions temporarily, e.g. an option to permissions.request()
 * [timothy] Safari has the ability to grant for one day and the grant expires.
 * [tomislav] I mean an extension explicitly opts into this so the browser knows the extension doesn't want persistent access.
 * [david] The hard thing is that we know some devs will do the right thing and a lot of devs will copy-paste Stack Overflow solutions that give them persistent access because it's easier.
 * [timothy] Does anyone have host permissions being fully opt-in, like Safari?
 * [tomislav] We do have that in MV3.
 * [devlin] We do not.
 * [tomislav] Any plans to change that?
 * [devlin] We are working on ways to improve the flow to encourage runtime-based permissions rather than install-time based.
 * [carlos] Host permissions are mostly seen with being associated with the current tab. That's why it makes sense to grant and remove them based on what the user has focused.
 * [devlin] We understand there are capabilities that aren't related to a tab. Interested in expanding user control there, time based access, one-time access. Open to exploring, but don't expect this will result in major API changes.  We don't want to have this associated with whatever the user happens to have active, because it can be surprising and because the extension can navigate the tab independent of user knowledge or consent
 * [david] From our perspective this will likely have to be browser driven.
 * [devlin] Agree with Tomislav that it would be useful for a way to signal that the permission is temporary.
 * [tomislav] Browser could show a less scary warning, or default to temporary access. Gives new opportunities for well behaving extensions. Potentially could meet developers half way.
 * [david] Could potentially also let users control grants – you're asking for permanent access, I'll give you access just this time.
 * [casey] Has Chrome considered categories for permissions, e.g. the ability to signal that the extension will never work on sites or classes of sites?
 * [devlin] We have considered it. Would love to be able to do this, but it's really difficult to do. We're very hesitant to do something with permissions when it's a guess, even if it's a good guess. There are a lot of ambiguous sites. Capital One is a great example, it's a bank and offer site (shopping). Amazon is a store and healthcare provider.
 * [casey] What about saying everything but a host.
 * [carlos] I had a request for disallowed host permissions. For example, blocking access to accounts.google.com for security reasons.
   * disallow_host_permissions: https://github.com/w3c/webextensions/issues/123
 * [devlin] Think it makes sense to allow extensions to explicitly opt out. Proposals welcome. Doesn't seem like something that would be controversial, it's a matter of prioritization and resourcing.
 * [tomislav] The UI would be the largest concern there. A large number of sites could confuse the user.
 * [devlin] UI is out of scope of the spec. I suspect that we wouldn't show the list of sites in the UI.
 * [rob] Could manifest as not showing activeTab on particular sites.
 * [devlin] We could explore ways to present this. Extensions could also display their own banners that say “we never inject on X, here's how you verify”
 * [rob] Agreed.  There's no need for UI/UX. Someone could look at the manifest if they really want to. Extension declares it doesn't want access, browser enforces that it doesn't grant access.
 * [casey] Users can't look at the manifest on mobile safari, right?
 * [david] Correct.
 * [andrey] We have to specify why host permissions are used when submitting an extension to the store. Can that be shown?
 * [devlin] It's a known pain point we want to solve. May be outside the scope of this group. My ideal is to expose that through the store experience.
 * [andrey] Alternative is to justify the request as part of the API.
 * [devlin] Permissions request API already requires a gesture. Intent is you explain why you're requesting access and the user chooses to trigger the request.
 * [david] We have a concept of transparency, consent, and control. Locations, permission, etc. We always require a reason.
 * [andrey] Don't understand the reason that CWS doesn't expose the reasons.
 * [devlin] Outside my control.
 * [tomislav] Can't accommodate all use cases where a description of the reason fits inside the dialog itself.
 * [devlin] Lots of precedent in mobile apps. For example, a camera app that requests camera access on first access and closes itself if denied.
 * [carlos] But the extension is in the background.
 * [devlin] You can open a tab and request permissions.
 * [andrey] Lots of work for extension developers. You would save a lot of time for extension developers by integrating it in the browser.
 * [timothy] Us doing it would also encourage the right behavior and give us more opportunity to control the experience.
