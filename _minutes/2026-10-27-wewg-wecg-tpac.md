# WECG TPAC Oct 27, 2026


## Agenda

https://github.com/w3c/webextensions/wiki/2026-TPAC-Coordination#tuesday
(all times UTC)

 * Deferred Permissions - 08:30 - 09:15 (45 min)
 * Sidebar API - 09:15 - 10:00 (45 min)


## Attendees

 * Simeon Vincent (Invited expert)
 * Rob Wu (Mozilla)
 * George Henderson (Capital One)
 * Casey Garland (Capital One)
 * Benjamin Bruneau (1Password)
 * Carlos Jeurissen (Invited expert)
 * Patrick Kettner (Google Chrome)
 * Oliver Dunk (Google Chrome)
 * Tim Judkins (Google Chrome)
 * Yannick Mougin (Dashlane)
 * Devlin Cronin (Google Chrome)
 * Mukul Purohit (Microsoft) [Remote]
 * Jason Kurian (1Password)
 * Mike “sideshowbarker” (W3C) [Remote]
 * Timothy Hatcher (Apple) [Remote]


## Notes


### Deferred Permissions

08:30 - 09:15 (45 min)
Discuss how extensions can add new permissions to an installed extension without overly alarming their current users. This follows the October 8 WECG discussion.
Goal: go through the 1Password proposal in detail and identify major challenges and blockers.
See [issue 1032](https://github.com/w3c/webextensions/issues/1032) for a comparison of [issue 798](https://github.com/w3c/webextensions/issues/798) and [PR 883](https://github.com/w3c/webextensions/pull/883), and [PR 1109](https://github.com/w3c/webextensions/pull/1109) for a narrower proposal (`deferrable_permissions` and `deferrable_host_permissions`).

 * [benjamin] (summarizes issue 1032). My proposal at [PR 1109](https://github.com/w3c/webextensions/pull/1109) is `deferrable_permissions` key sitting between `permissions` and `optional_permissions`; acts as permission on install but optional permission on update.
 * [benjamin] This setup would allow you to start with a `deferrable_permission` and when you have enough coverage switch over to `optional_permissions`.
 * [carlos] Looking at the `deferrable_permissions` Venn diagram … (did not minute: Carlos walked through the behaviors conveyed by the illustration)
   * https://github.com/w3c/webextensions/issues/1032#issuecomment-6397030849
 * [carlos] Looking at `initial_permissions` from 883, allows you to specify what permissions you want on installation. On the left is the status quo. On the right is the proposed situation, where optional permissions are a union of permissions and optional permissions, and install_permissions are required at installation time.
 * [timothy] Are we debating which proposal to go with?
 * [carlos] Correct.
 * [timothy] I sort of like the initial_permissions proposal a little better for lower overhead. May have bias here because we use a different approach to permissions than other browsers where all permissions are optional. This is more of the direction that we'd prefer. Curious about other browsers.
 * [devlin] We've chatted about this a number of times over different meetings. Understand the pain point for developers. In general, the larger direction we want to move as a browser is to move towards having more things be optional and granted at runtime. Having a new key, whichever it may be, that controls install permissions is to some extent counter to that. Would prefer to move more in the direction of the web or iOS or Android, where permissions are granted contextually. Timothy, can you share more about the Safari flow?
 * [timothy] We have a similar approach where if you add permissions after the fact you will get disabled. It's our approach to host permissions that's different. E.g. if you add one of the DNR permissions later, the extension will be disabled.
 * [devlin] From a developers point of view, it seems like there may be too many hurdles that are problematic today. If you add a required permission, you get disabled. If you're disabled, you can't communicate why. For new users you want to have that permission by default - you don't want to go through that permission request flow. Those seem to be different problems. From a developer point of view, these proposals solve both, which is great. Concern is with how compatible that is with where we want to go. From an extension developer's point of view, what's the major concern?
 * [carlos] Browser extension devs don't know when the permission is prompted. May want to show the popup and reload the page yourself. … For developers, you could potentially cover additional cases.
 * [] I think you can already do that in Chrome.
 * [devlin] registerContentScripts/executeScript; In chrome, the permissions you have are the intersection of what the extension requests, what the user grants, and what the administrator allows. The user withholding permissions is what's triggering all this behavior. Both of these proposals only affect the permissions that the extension views as having requested initially.
 * [benjamin] Makes sense. I'm very cognizant of the utility of granting permissions as you go. Two things I've experienced. On one hand, the grant of permissions (e.g. site access) where you have to reload a page after granting. Confusing to users. Not obvious to
 * [devlin] Orthogonal. We're talking about runtime grants, what we call “click to script” in Chrome. This discussion was originally more about install time permissions and updates. Not opposed to diving into that, but that's a separate issue.
 * [benjamin] Just giving that preamble because one of the most obvious ways to ameliorate that situation is to grant permissions up front.
 * [devlin] Not the same capabilities or UI presented at the same time. In Chrome we consider that a withheld permissions. That's independent of whether the extension had optional or required permissions. Optional permissions are not considered at all unless an extension requests it at runtime. The withheld state only applies to required permissions that have been denied. I do want to have the discussion around click to script, but that's orthogonal to on update behavior, at least in Chrome.
 * [timothy] They don't have to be. Could be considered withheld permissions on update. If on update they're treated as withheld permissions that could be clicked through
 * [devlin] Depending. The difference is the extension said I really need this and it has been withheld vs. not really needing it.
 * [timothy] Doesn't the extension say “I really need this” if it's not optional?
 * [devlin] If it's in the required permissions, we considered that a strong request, yes. I think there's the possibility that on install or update we could put permissions into the withheld state. Goes back to the question I tried to ask: is the bigger concern getting the permission or being disabled? I could imagine that there are required permissions that are just not granted on update. I don't think we'd be as interested in having that be a new permission set. An extension could say “I understand I'm not going to get my required permissions on install”
 * [timothy] I can see that being a simpler model
 * [devlin] Taking that a step further, we could just make it that you don't get any permissions until you request them. You'd have to request permissions on install.
 * [timothy] And then you're basically at the Safari model, where you don't get any host permissions.
 * [devlin] Yes, but all permissions into that bucket, not just host permissions. Could see that being too far away from the status quo before we address the user experience concerns.
 * [timothy] We do a lot more implicit permission prompting. If you're using an API that needs host permissions (e.g. insertCSS) we'll basically do a permissions.request on your behalf and await a response (up to 2 min), wait for the user to respond, if they don't answer show a non-blocking dialog, deny the request. There are some things we could do in this flow to make things easier for the extension developer.
 * [benjamin] Is there a mode in this direction where we have a transitional period? How would we describe this in the interim? Or would we have to wait for everyone to adopt a browser version that supports this?
 * [devlin] Say we introduce a new manifest key with a new behavior. If that were to be always optional on browsers that support that key, on browsers that don't it would continue working as it does today. You'd still get disabled on older browsers. That would allow a shorter timeline than all of your users accepting a new permission and putting it into required. Chrome, the oldest browser we support is ~6 months old; Imagine extension devs to have a longer timeline. Anyone have data on how long it takes for an optional permission to be granted by most users?
 * [benjamin] Quite variable depending on how often it gets used. If it's in the main flow, it can be quick. If not, it can take quite a long time.
 * [carlos] So extension devs have no way to disable this prompting? E.g. if an extension wants to check whether an API can be called, not mandatory for functionality, and a permission prompt would be quite disruptive.
 * [timothy] Is quite intentional; at the time we were doing something that is new in the ecosystem, and wanted to add a smooth path for extensions that assumed that the permissions would be granted by default.
 * [devlin] Does permissions.contains (…)?
 * [timothy] It does.
 * [rob] I think we're diverging from the original topic. Question for extension devs, if we introduce a new API key, at what point would you cut over from deferred to required permissions? I'd imagine that you don't want the extension to be disabled in some browsers (Chrome).
 * [carlos] Only necessary with the deferred permissions proposal.
 * [devlin] Also only a concern if you introduce a new behavior key. If you have a key that's just “I'm okay with everything being optional”, you can do whatever you want with legacy browsers.
 * [george] Could we have a key that allows you to say “I want all my optional permissions to be required”?
 * [devlin] I think that's what (...) was targeting. In general we want to move to more things being granted in context. Realize it's somewhat painful. If you need 10 permissions to be useful in any reasonable way, that can be frustrating.
 * [george]
 * [devlin] I understand the desire for a developer point of view, but install time grants are something we want to move away from. The thing I'm more interested in is how do we keep extensions working between updates. I'm less enthusiastic about having more permissions be granted at install time.
 * [timothy] I share that sentiment - should be at runtime use, not at install.
 * [carlos] I believe the initial permissions approach could be reframed as permissions the extension wants to be required in the future.
 * [devlin] Bikeshedding a bit, but I think an enum in the manifest might be better. Very difficult to tell what “initial permissions” means, when it takes effect, what users have been prompted. Right now it's deterministic, if you have a required permission that isn't granted you get disabled.
 * [timothy] I think I prefer Devlin's idea of an enum key so we're treating the existing arrays as something different that the developer has opted into instead of moving permissions from one array to another.
 * [devlin] Aligns more with the intention that the extension is saying “i'm okay with everything being granted at runtime.”
 * [rob] Returning to the question I asked, what's the point where the extension developer says “I've got enough adoption, I'm ready to make it required.” I assume users will ignore most prompting the extension does. Most existing users will have the permission be optional by design in either proposal; the only difference is for new users. You can achieve the same effect without new APIs by using an onboarding flow for new users to get the new permissions; some may deny the request, but that is no different from today.
 * [benjamin] That's a decision an extension developer can make, vs the current state where it's very tough to choose when to make it required. The exact when is subjective. I'm a bit surprised to hear the proposal. Having a page where you request a bunch of permissions. Maybe I was reading into it, but I thought it was verboten to have a page where you ask for a bunch of stuff.
 * [devlin] Depends. In many cases optional makes sense to do contextually. In other cases it may be something that you need for a core use case that isn't needed by all users. On mobile, if you download a camera app it will ask you for camera access. If you say no, it's reasonable for it to quit because it can't do anything.
 * [benjamin] I think we can all agree it's complicated and not super clear. Above all, having a clear expectation on lifecycles and when the right time to request would be very helpful. I'm supportive of an all-optional world, but we've been living in a world where install time is the norm.
 * [devlin] Also want to acknowledge the business realities that if you were all optional you may have lower total conversion.
 * [timothy] We're a bit over time at this point. Let's try to find a stopping point. We seem to have a direction that at least Devlin and I were agreeing on, not sure about Rob.
 * [carlos] Not sure an enum is the right approach.
 * [devlin] ...
 * [carlos] On Rob's question, why not prompt for everything after install, because then you have multiple tiers of permissions requests. What everyone had on the first version and any optional permissions added later.
 * [rob] I think you're suggesting making everything optional, correct?
 * [devlin] I think Chrome's stance is we don't want to add a new permissions key. My initial proposal is that we introduce a new key that makes everything optional and prevents you from getting disabled on update.
 * [rob] I think that's a good idea. I think when we discussed this before I framed it as having a flag to change the behavior of new required permissions when updating. Could consider making it all optional at install, but I don't anticipate that being well adopted, hence recommending to focus on applying the “required permission is optional” behavior on update only.
 * [devlin] If we did that, I assume we'd want to have an enum flag where we could have multiple behaviors including optional on upgrade, and in the future work to deprecate those options. I recognize all options are a bigger leap for extension developers.
 * [timothy] Do we have a feeling on where we should go from here?
 * [devlin] I think you and I are aligned. I may be able to chat with Rob to make sure we're on the same page. After that I can follow up with a proposal.


### Sidebar API

09:15 - 10:00 (45 min)
Work on the unified sidebar API hasn't started yet. Align on direction and next steps. Highlight the remaining inconsistencies between implementations and how to resolve them.
See issues [issue 128](https://github.com/w3c/webextensions/issues/128), [issue 1080](https://github.com/w3c/webextensions/issues/1080), [issue 1081](https://github.com/w3c/webextensions/issues/1081) for background. Also [issue 1126](https://github.com/w3c/webextensions/issues/1126) (configure and determine action click behavior). Carlos posted an [overview of discussion points](https://github.com/w3c/webextensions/issues/128#issuecomment-6399339421) to walk through.
See https://github.com/w3c/webextensions/issues/128#issuecomment-6399339421 for the starting list of sidebar issues to discuss and agree on.

 * [timothy] There's been a lot of sidebar related work recently. Safari is in the process of implementing both sidebar_action and sidePanel. We'd like to have a unified API. We've talked about this a few times over the past few in person meetings. I think we all aligned that the side panel API was the better approach where it takes an options dictionary for all APIs to allow for future expansion. Is that the starting point? Basically rename sidepanel to sidebar and take into account the open issues I've flagged in the wiki related to context? I think there were a few other issues that Carlos flagged.
 * [carlos] I created a list of issues at the bottom of the unified sidebar issue.
   * https://github.com/w3c/webextensions/issues/128#issuecomment-6399339421
 * [carlos] That covers the issues on the issue tracker.
 * [devlin] Some of the issues highlighted in that comment (thanks for putting that together) seem unrelated to the unified API surface. Wondering if we should start by going through any that are related to the unified surface and address the inconsistencies later.
 * [carlos] I think we should make sure the unified API isn't implemented in a way that we will regret later.
 * [devlin] Agree that we shouldn't lock ourselves out. What should happen if you open a window specific sidebar is, for example, something that we have today and could resolve later.
 * [timothy] One big thing that stands out to me is icons. Does sidepanel inherit the extension icon? Seems sidebar action support setting an icon where sidepanel does not, correct?
 * [carlos] Following up from Kobe, where we already settled on the namespace.
 *
 * [carlos] Next, contextType. Is this something we want to keep?
 * [devlin] From my point of view it would be nice to use sidebar. Would it make sense to use “SIDEBAR” if and only if the extension declares sidebar (opposed to side_panel).
 * [rob] +1
 * [carlos] Would need to decide when this happens. If there's a manifest key, then it's inclusion would change that scenario.
 * [oliver] Our platform and documentation would need to handle both cases.
 * [timothy] People don't use constants that much, strings are usually used.
 * [devlin] For the docs, let's wait 6 months and flip everything over to the new one.
 * [simeon] MDN will have the legacy baggage.
 * [carlos] Could also prepare extension developers to know that the name will change eventually and support both in the interim. Extension developers will still need to check if the namespace is exposed.
 * [rob] I think devlin's original proposal of using “sidePanel”, “sidebar” as ContextType and aliasing sidebar in the longer term makes sense, and recommend moving to the next point on the long list (instead of bikeshedding further).
 * [timothy] Aligned with that.
 * [oliver] If we want to move forward this way that's fine.
 *
 * [carlos] What should the name of the new manifest key be? “Sidebar”, reuse existing keys?
 * [timothy] Shouldn't reuse old names. I'd prefer “sidebar”
 * [rob] sidebar.
 *
 * [carlos] Next, sidepanel permission. Requirement for Chrome.
 * [timothy] Permission is one of the things we'll need to rename.
 * [carlos] Do we even want a permission? Should a manifest key be enough
 * [devlin] Permissions key is useful for a couple different things. Telemetry in the browser. Useful for understanding impact and gauging potential breaking changes. Sometimes people don't realize that manifest keys that aren't related to permissions have permissions implications. E.g. content scripts. There isn't a permissions warning here, so that's less relevant. There are attributes of sidebar functionality that we'd need to know to expose the API. May be useful or desirable to have the permission but not the manifest key.
 * [carlos] Why not have something like the action key?
 * [rob] +1
 * [devlin] Doesn't play as nicely with the existing systems. Includes 3rd party evaluations of extensions.
 * [rob] I think those potential benefits are overstated. We already have a pattern for this (`action`, `commands` manifest keys). There isn't much of a reason to have a permission especially if we're not prompting for it.
 * [oliver] Something of a weird middle ground in Chrome today is that you can add a side panel in the manifest but not request the permission. You end up with the UI but not the API access. I like that Rob's proposal resolves this.
 * [simeon] Inconsistencies in our APIs; for clarity with developers I encourage a permission.
 * [devlin] Not a hill to die on.
 * [george] As a developer, I don't think of a permission as granting access to an API. A permission is something more inherent to a user having to agree to it.
 * [benjamin] How differently do browsers think of sidebar vs `action` popup.
 * [timothy] I think we're already in this territory with the action API.
 * [devlin] Sidebar is meant to be a little more sticky than the popup. The only other consideration I'd raise is that if we have a sidebar permission, it is easier to potentially add a permission warning to that in the future. There are some previous examples of warningless permissions that we later added a warning to. If that's something we'd ever consider with the sidebar, I'd feel more strongly about having a permission. Say if we introduce more capabilities around managing the sidebar, opening or closing another extension's sidebar. If there's something a user needs to make a decision around, we should expose that as a permission.
 * [timothy] Could be a separate permission at that point, e.g. “sidebar.management” (hypothetically)
 * [devlin] I see two choices. 1 add a sidebarManagement API or 2 add a “sidebar.management” permission that allows you to control management related capabilities on the existing namespace.
 * [rob] Either approach feels like the cleaner way to handle that than retroactively attaching a permission warning. And if there is a desire to add a warning, it could still be triggered by the manifest key. And if the objective is to allow extensions to suppress the warning, in Firefox we have an example of `devtools_page` triggering a scary warning, but devs can add “devtools” to `optional_permissions` to suppress the warning, making it an optional API.
 * [devlin] I think I'm okay saying we don't have a permission for this and regretting it later.
 * [timothy] In either case, I don't think we should have the weird state that you can have in Chrome where you have a sidebar without permission to manage it in JavaScript.
 *
 * [carlos] Icons property. Is this something Apple and Google want to support as well?
 * [timothy] In Chrome, can a sidebar have a different icon than the extension's icon?
 * [devlin] no. One topic: icons. Two sub topics: declaring in the manifest, runtime API. I'd prefer not having setIcon as an API method and fold that into setOptions. Allows for atomic updates of multiple properties. Doesn't make sense to have a separate setIcon when it could be part of that.
 * [timothy] I'm in favor of that.
 * [oliver] I've already seen examples of extension abusing a different API. In Chrome we allow `short_name` in the manifest. I've seen extensions use this to brand their extension as something else unrelated to the extension you have installed. Not something we have to solve in the API design, but wanted to highlight.
 * [timothy] Hard problem to mitigate in the API. No different than the action title.
 * [devlin] Are you worried about icons?
 * [oliver] Yes
 * [devlin] I'm more worried about setting the title than setting icons.
 * [rob] Are you okay with the icons feature?
 * [devlin] Yes. manifest icons, setting icons. Are you okay with the field being `default_icon`?
 * [rob] Yes.
 * [timothy] What about `icon_variants`? I'm willing to accept both.
 * [carlos] Seems weird to introduce two keys right from the start.
 * [simeon] Advantage of both?
 * [timothy] `default_icon` is a simple string.
 * [oliver] Benefit of `icon_variants`?
 * [timothy] If you have a dark version, for example.
 * [oliver] Almost seems to me like it's just a new icon variant. Could we specify that as a value in that?
 * [devlin] No. Counter to how we do icons in other contexts.
 * [oliver] Slightly different.
 * [timothy] Not how we approached the `action` dictionary. Might have been good to consider that, but that ship has sailed.
 * [carlos] The icon_variants is designed in such a way that we can still add support for such concepts.
 * [devlin] Timothy, what's the format for setting icon variants in Safari?
 * [timothy] If you have it defined in the action we'll use that. If not, we'll fall back to `icon_variants` for the extension.
 * [devlin] How about Firefox?
 * [rob] We have `theme_icons` with the meaning of dark/light inverted. Willing to adopt a different approach. Currently `icon_variants` is not implemented yet.
 * [timothy] I suggest we approach it like Safari does for the action's icons.
 * [devlin] (???)
 * [timothy] Then we should prefer icon_variants. Then have a top level legacy icons. (???)
 * [rob] Running out of time for this meeting; Since Safari is already working on sidebar unification; suggest Safari put together a proposal with what they think should be the behavior. Does that sound good?
 * [timothy] Yes. Carlos's work gives us a solid foundation.
 * [devlin] I think a number of these are small divergences between implementations rather than major differences between APIs.
 * [timothy] Can work on putting something together in a month or so.
 * [devlin] Chrome is actively working on this too. Can you do this in less than a month?
 * [oliver] We never got to the title discussion, maybe we can discuss that later in the week?
 * [timothy] Don't really have open sessions.
 * [devlin] Oliver and I can discuss.
 * **Decision Log**
   * Namespace: sidebar
   * Not an alias
   * ContextType: Use SIDEBAR if and only if they use sidebar in the manifest, else SIDE_PANEL
   * Manifest Key: sidebar. Overrides any existing sidepanel/sidebarAction declarations.
   * Permission: No developer-facing manifest permission (implied by the manifest key)
   * Icons
     * Support separate icons
     * Support setting the icon via the manifest icon_variants
     * Support setting the icon via JS with the setOptions() API
 * **Action item**: Timothy to put up a proposal with what Safari believes the unified sidebar API should look like (linked to [issue 128](https://github.com/w3c/webextensions/issues/128)).
