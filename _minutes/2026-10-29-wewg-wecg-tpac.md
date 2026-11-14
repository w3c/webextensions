# WECG TPAC Oct 29, 2026


## Agenda

https://github.com/w3c/webextensions/wiki/2026-TPAC-Coordination#thursday
(all times UTC)

 * Inconsistencies #1 - 09:00 - 09:45 (45 min)
 * Bug triage #1 (continuing Inconsistencies #1) - 09:45 - 10:30 (45 min)
 * Exposing Types and Constants - 11:00 - 11:15 (15 min)
 * WebExtensions Types Repo - 11:15 - 11:30 (15 min)
 * Supports API - 11:30 - 11:45 (15 min)
 * Secure Cache - 11:45 - 12:30 (45 min)
 * DOM Autofill - 13:45 - 14:15 (30 min)
 * Dashlane MV3 feedback - 14:15 - 15:00 (45 min)


## Attendees

 * Devlin Cronin (Google Chrome)
 * Oliver Dunk (Google Chrome)
 * Tim Judkins (Google Chrome)
 * Rob Wu (Mozilla)
 * Kiara Rose (Apple)
 * Timothy Hatcher (Apple)
 * Carlos Jeurissen (Invited expert)
 * George Henderson (Capital One)
 * Jordan Spivack (Capital One)
 * Patrick Kettner (Google Chrome)
 * Simeon Vincent (Invited expert)
 * Benjamin Bruneau (1Password)
 * Mukul Purohit (Microsoft) [Remote]
 * Timothée “Tim” Pillard (Dashlane)
 * Yannick Mougin (Dashlane)
 * Ben Greenberg (Aglide) [Remote]
 * Rene Leveille (1Password)
 * Jason Kurian (1Password)
 * Christian Rask (1Password)
 * Gaurang Tandon (Blaze Today)
 * Ricky Mondello (Apple) (from 11:45, Secure Cache and DOM Autofill topics)
 * Tomislav Jovanovic (Mozilla) (from 13:45)


## Notes


### Inconsistencies #1

09:00 - 09:45 (45 min)
A grab-bag of cross-browser inconsistency issues. Goal: resolve these ahead of the spec text.
We'll start with whether APIs should reject unknown method properties and non-matching signatures. This session covers validation, menus, action, icons and background; the remaining issues continue on Friday in [Inconsistencies #2](https://github.com/w3c/webextensions/wiki/2026-TPAC-Coordination#f5). Maximum of 2 minutes per issue so we get through the whole list.


#### Validation

##### [Issue 1115](https://github.com/w3c/webextensions/issues/1115): Make `action.setIcon({path: "invalid.png"})` reject and have no side-effect

 * [carlos] Chrome validates existence of path and rejects otherwise; Safari resets to manifest default; Firefox shows broken icon.
 * [timothy] Rejecting to match Chrome behavior.
 * [rob] Non-existence or validity?
 * [carlos] Non-existence
 * [kiara] Should also do the same for setPopup
 * [devlin] Another topic in the list today.
 * [rob] Sounds good to me.
 * **Resolution**: `action.setIcon` to reject non-existent path, matching Chrome's behavior

##### [Issue 1101](https://github.com/w3c/webextensions/issues/1101): Inconsistency: Behavior of `action.setIcon({})`

 * [oliver] Empty object resets to default in Firefox and Safari; Chrome throws, expecting required imageData or path.
 * [devlin] Don't like resetting when passed an empty object. Most APIs taking an object only set properties that are explicitly set. Could result in code to inadvertently reset all fields when no-op is the intention. Sample code:

```
let options = {}
if (updateFoo) {
  options.foo = fooValue;
}
if (updateBar) {
  options.bar = barValue;
}
setOptions(options);
```

 * [timothy] Is this meant to catch a programmer error?
 * [devlin] Not necessarily. The pattern above is a regular issue.
 * [timothy] But you currently throw?
 * [devlin] Think we should not throw either.
 * [oliver] The argument seems to be that we treat `set` as `update`. Is this the precedent that we want to set?
 * [devlin] Say you have a method with 3 properties on a set method and we add a 4th in the future. The 4th property now becomes default value.
 * [oliver] Why would that be if the extension has no knowledge of the 4th property?
 * [devlin] You'd have to update every call site. Couldn't have a new field in the manifest.
 * [oliver] Still think if we added more properties there should be updateIcon or updateIconConfiguration, but we're on a tangent now.
 * [devlin] For our purposes set and update are synonymous, but agree it's ambiguous.
 * [oliver] Are you suggesting that we document/specify `set` / `update` generically in the specification guidelines doc that we are working on?
 * [devlin] Don't think we need to.
 * [oliver] Say we didn't have icon variants and added it later. Empty object or unknown keys?
 * [devlin] Separate issue scheduled for later.
 * [carlos] Given the current icon properties are mutually exclusive, not sure if adding additional properties is ergonomically doable.
 * [timothy] Can add a property treating it as a bool, not mutually exclusive with imageData/path.
 * [devlin] or “grayscale”. Plenty of ways we could add a future property. Wouldn't want it to override everything if you supplied nothing.
 * [timothy] I like the idea of treating empty as a special no-op case. In agreement there.
 * [devlin] Doesn't even feel like a special case. Set a property only if it was present on the object passed in.
 * [rob] This comes up often with how to reset things.
 * [devlin] Supply `null` for the property you want to reset.
 * [timothy] If it's resettable.
 * [rob] For precision, null vs undefined vs. property being set?
 * [devlin] I think null, biased because we don't recognize setting undefined as an explicit property in Chrome
 * [timothy] I think null, think undefined is weird. We treat it similarly though.
 * [rob] In Firefox, we can distinguish between these cases.
 * [devlin] Sounds like we might be vaguely aligning on, when a dictionary is passed, properties will be changed if and only if they are present on the object.
 * [carlos] That's actually the current implementation in Orion.
 * [oliver] So we should leave a comment and update the labels. I can do that.
 * **Resolution**: `action.setIcon` should be no-op instead of reset/reject for empty objects or an object that does not set a known property to a valid value or null.

##### [Issue 254](https://github.com/w3c/webextensions/issues/254): Inconsistency: some functions accept optional arguments while other take in only `{}`

 * [oliver] Interesting thing here, in WebIDL you're not allowed to have a required empty object
 * [tim j] Strictly you can, but it's recommended that you don't.
 * [devlin] Already non-compliant there. setIcon doesn't follow
 * [simeon] That's Chrome IDL, not WebIDL
 * [oliver] Found this while working on alarms.
 * [rob] Suggestion?
 * [devlin] I'm less worried about aligning with the requirements if we're saying you can't require an empty object
 * [devlin] I'm okay with saying if we have an object with only optional parameters, the object itself is also optional.
 * [timothy] Fine by me.
 * [oliver] What about `alarms.create()`?
 * [devlin] Oliver has a point that not every object is truly optional. It's a union in that case.
 * [oliver] Could we specify the second parameter as optional, but then have a validation step in the specification that requires a property to be set?
 * [timothy] Values are validated separately
 * [devlin] But you have to validate the object first. Conceptual variation here is that this is a (programming, not set) union.
 * [timothy] Optional, but not required.
 * [oliver] Agree, but what about `setIcon` with `path`?
 * [devlin] Similar as what we just discussed in the other issue; In a future world with “grayscale” you can not supply that. But you can't call an alarm without a time.
 * [simeon] We should have documentation or normative note on how to do this.
 * [timothy] We can also invent our own idl attributes.
 * [simeon] Right, I always forget that.
 * [devlin] Sounds like what we're aligning on, which may be difficult to specify, in the case that an empty object is valid, the object itself should be optional. Aligns with general webIDL. We have an exception for when there must be some property present.
 * [oliver] Does that mean you can call setIcon with no parameters?
 * [devlin] Yes. Tabs.query having no properties is valid. Would allow passing no object. For alarms.create, the object IS required, but there is an implicit (not easily expressed by IDL) required object.
 * [timothy] In alarms.create the object would never be optional. At least one property is required.
 * **Resolution**: options dictionary should be optional if all of its properties are truly optional
   * If all properties are truly optional, the parameter must also be marked as optional
   * If one or more parameters are required (e.g. alarms.create), the parameter can be required
   * We may add an additional IDL attribute

##### [Issue 1124](https://github.com/w3c/webextensions/issues/1124): Inconsistency: insertion of default values into dictionaries, null vs undefined vs false

 * [timothy] Seems like we covered some of this. Chrome and Safari treat undefined as if the key was never there. `null` is also sometimes treated as if the key is missing, unless it's a special case like set icon where it's valid.
 * [devlin] Arguably we should change that. The key being missing in Chrome is mostly because when set to null it doesn't have an effect. We could change it so we always preserve null and that doesn't have an effect on most API implementations so it never reaches spec.
 * [rob] Firefox treats undefined and null similarly. If a value is not provided, internally represented as null. There are some cases where we have explicit handling. Least we can do is, in cases where `undefined` and `null` have different expectations, we can have special handling.
 * [devlin] Difference in JavaScript between hasOwnProperty.
 * [rob] But we default to `null`
 * [devlin] In Firefox, that's an implementation detail. What's your stance?
 * [rob] Current behavior in Firefox is treating to `null` and `undefined` similarly, in cases where we have special handling for one of those values, we take additional steps to align on behavior. That said, it just occurred to me that there's no way to set `undefined` in JSON schemas.
 * [timothy] Reason to avoid `undefined` as much as possible.
 * [devlin] Is it reasonable to say that, if a developer explicitly provides null, we treat that as an intentional value.
 * [rob] Yes
 * [timothy] Yes
 * [kiara] Makes sense.
 * [devlin] If dev sets key to undefined, not treat that as null.
 * [timothy] I think that matches both of our behaviors today.
 * [rob] I need to check how backwards compatible that would be, since it's long established behavior in Firefox.
 * [oliver] Another issue, if you call `alarms.get()`, is it omitted from the result.
 * [timothy] That's separate but related. About return value rather than developer-supplied value. Question is should the entire object be returned or should omitted keys be omitted. I think I'd be okay with either.
 * [tim j] We support this in Chrome, where if supply preserve null is specified in the schema, null values are provided in the return
 * [devlin] I wonder if, conceptually, we'd want to treat preserve null as the default.
 * [timothy] That'd be a bigger change for us. We'd have to audit all the return objects. Overall input is easier than output for us. We should track these as separate issues, but it sounds like we're aligned.
 *
 * [rob] The request was to not treat undefined as null, but what was the desired alternative?
 * [devlin] To treat it as the key not being present.
 * [timothy] In some cases that may mean `null`.
 * [devlin] If null does something special, undefined does not do that thing.
 * [rob] I see; that matches with my intent before, to special case null in APIs that care about distinction between null and undefined. Need to investigate impact, but in principle supportive.
 * **Resolution:** In general if null is supplied, respect it. If undefined is supplied, treat it as the key not being present.

##### [Issue 1138](https://github.com/w3c/webextensions/issues/1138): Make `action.setPopup({ popup: "invalid.html" })` reject and have no side-effect

 * [kiara] So similar to set icon, if it's invalid, reject. Are we all supportive.
 * [rob] What does invalid mean? Does a query string invalidate?
 * [devlin] Not a valid path for a file.
 * [rob] I don't think we have agreement on what invalid means.
 * [timothy] I have a separate issue tracking resource resolution. Firefox is all URLs, WebKit is a mix of both files on disk and URLs, Chrome is all files I think.
 * [rob] Although it is tempting to say “reject on invalid”, I don't think that we should reject when invalidity is unclear, especially because of backwards compatibility concerns.
 * [devlin] Two separate questions. What do we do on invalid values being passed, and how do we define invalid.
 * [rob] setIcon as discussed before had a natural step to validate, to prepare for image validation. setPopup does not have that usually.
 * [carlos] Can check if the url resolves which should cover cases in which developers set query or hashes.
 * [devlin] Also weirdness with setting a value that could be handled by an extension's service worker.
 * [rob] Conditionally supportive (if we can agree on invalid in a somewhat backwards incompatible way), but not sure how likely that is.
 * [timothy] [Issue 1035](https://github.com/w3c/webextensions/issues/1035) covers “what is an invalid path”
 * **Resolution:** Reject on invalid. "Invalid" to be defined later. No side-effect. Match behavior from previous discussion.


#### Menus

##### [Issue 1086](https://github.com/w3c/webextensions/issues/1086): Inconsistency: menus vs contextMenus

 * [simeon] Previous discussion there was a desire to have menus as the general, and Chrome was against that.
 * [devlin] Yes.
 * [simeon] How strong of an opinion is that?
 * [devlin] 7/10.
 * [simeon] Unusually strong for you.
 * [timothy] We support both in Safari.
 * [rob] Firefox supports both.
 * [timothy] They're direct aliases for us. I think Firefox has slightly different behavior.
 * [rob] Yes, there's another issue later about this (1088).
 * [carlos] Can you explain Chrome's position?
 * [devlin] Right now `contextMenus` only affects context menus, no other kinds of menu. There is a conceptual difference between those different types. If we introduced support for a new one, we may want a new permission and namespace.
 * [timothy] Menus are just context menus without context.
 * [devlin] Kind of. May have a desire for different behavior.
 * **Resolution**: Chrome is opposed and unlikely to change this. (Devlin added comment on the issue)

##### [Issue 1088](https://github.com/w3c/webextensions/issues/1088): Inconsistency: `browser.menus` and `browser.contextMenus` aliasing

 * [devlin] irrelevant for Chrome given the above.
 * [carlos] Firefox specific. There are some specific scenarios where they don't behave as aliases. Removing that gap could reduce complexity.
 * [timothy] I'm in favor of having them being direct aliases. I don't see a concrete difference between them.
 * [rob] They're conditional on their permissions, correct?
 * [timothy] Yes, but they're `===` objects (identity)
 * [rob] I think we can follow up on this async given that this is Firefox specific due to the Firefox-specific methods (getTargetElement, overrideContext).
 * **Action item**: Firefox to continue discussion async on [issue 1088](https://github.com/w3c/webextensions/issues/1088)

##### [Issue 1090](https://github.com/w3c/webextensions/issues/1090): Inconsistency: sub-menu context inheritance

 * [carlos] When you have a context menu with a specific param, but you don't pass an explicit context object. In Firefox and Safari it inherits the parent. In Chrome it does not.
 * [devlin] What happens if you provide a different object?
 * [carlos] That object is used. If the parent is `image` and the sub-menu doesn't specify anything, the sub-menu doesn't appear when interacting with an image. Doesn't seem to be a reason not to inherit by default.
 * [devlin] If we were starting over (which we're not) what would make the most sense to me is an unsupplied context is `all`, which implicitly behaves as you've described. Wondering if there's some overlap with our previous discussion of unsupplied parameters.
 * [carlos] Quite relevant if it's set to default or live updates from the parent, because a parent could be redefined at runtime.
 * [timothy] Can we have the default change if parentId is supplied? If omitted, use default, if provided, inherit from parent.
 * [devlin] Could.
 * [rob] Don't think we should have multiple default meanings. If you remove a parent, the child item becomes a top-level menu entry. We should ideally not have a different outcome in the scenario “create child menu, unparent it” vs “create as top-level” on its own.
 * [timothy] … if you have context unset, it's conditional at runtime. Default value for context could change.
 * [devlin] Does it work to remove the parent with child menus?
 * [carlos] Child becomes top level
 * [rob] No? (it does not, at least not in Firefox; the children are removed too)
 * [devlin] Surprised.
 * [carlos] I haven't tested that specific scenario.
 * [timothy] I thought it was about setting parentId to null to reset it. Unlinked case also needs to be specified later.
 * [devlin] Most intuitive to me is to have the default be everything (solves inheritance problem). I wonder whether or not we could just change that default. Would need to look into existing ecosystem usage.
 * [carlos] And why is that a compatibility concern?
 * [devlin] If extensions are expecting default to only show on page, then the change could make it appear on the action, tab, etc.
 * [carlos] If the Venn diagram doesn't overlap, then there's no impact
 * …
 * [devlin] If we can change the default everywhere, that becomes easier to implement and document.
 * [
 * [devlin] If the default specifies everything, restricting a parent narrows what “all” means on children, which narrows to the parent's scope.
 * [oliver] If you have a parent context menu specifying “tab”, and the child would default to “all” and not show up. I think that we cannot solve this with just changing defaults; we need to change the inheritance behavior (in Chrome).
 * [devlin] So if you un-parent a context menu, what does its value become?
 * [carlos] Default for normal top level menus.
 * [rob] In Firefox, if you unparent the menu, it takes.
 * [carlos] If it is copied in firefox on sub menu creation, this is problematic if the context of the parent changes.
 * [rob] In Firefox, we could change behavior to be more like Safari. In practice, we'd probably still compute the result. Can probably dynamically update in response to parent changes, but that's an implementation detail. Timothy, are you applying dynamic behavior at any specific moment? Do you compute whenever you open a menu, when you call extension APIs to change the meaning of menus, something else?
 * [timothy] At render time of the menu we determine what to show.
 * [rob] I think there are more edge cases, but I think we can write a spec with what we have.
 * [rob] Safari and Firefox action items: we should specify our exact behavior in a comment on the issue. Chrome action item: check whether the common behavior described is acceptable.
 * **Resolution:** Inherit from the parent if unspecified. If parent becomes unspecified, treat as default set.

##### [Issue 774](https://github.com/w3c/webextensions/issues/774): Inconsistency: `contextMenus`/`Menus`

 * [simeon] How's this different?
 * [devlin] 3 sub issues: default contexts if unsupplied, inheritance (just discussed), unicode character support.
 * [timothy] Chrome and Safari default to `page`, Firefox defaults to `all`. Specific reason, Rob?
 * [rob] Not sure if I commented. Vaguely recall that something motivated this.
 * [kiara] In the last discussion Rob said we'd be willing to consider changing the default, slightly concerned about the impact.
 * [rob] Sounds right.
 * [timothy] Page default has always felt odd to me. Hitting the page and not some other element can be difficult.
 * [oliver] You want it to be right click anywhere, right?
 * [timothy] Correct. “Page” means the background of the page. “All” is more friendly unless you want to get more specific. I'd be in favor of changing the default here in Safari. Sounded like Devlin may be interested in all based on the previous discussion.
 * [devlin] If we were starting fresh, yes. Worried about a breaking change.
 * [rob] I imagine that if you do a/b testing in Chrome to change the default, you might receive bug reports or a volume of complaints if it had an effect.
 * [devlin] Defaults matter. As timothy said, page is increasingly difficult to hit. Could have something where extensions are adding slightly different context menus for different types of content. Could end up in a situation where the current default starts showing up in unexpected places (e.g. double entries).
 * [timothy] Could be same name with different behavior, users don't know which to pick.
 * [devlin] We'd have to communicate and a staged roll out something like that. I'm supportive of the direction of moving towards all, but not sure we can. We should collect data to inform next steps (default page/all).
 * [oliver] Sounds like we're interested in doing this no matter what the data shows, but data will change execution plans?
 * [devlin] Yes.
 * **Action item**: Chrome to collect data to inform next steps (default page/all) for [issue 774](https://github.com/w3c/webextensions/issues/774).

##### [Issue 1116](https://github.com/w3c/webextensions/issues/1116): Inconsistency: `selectionText` in `contextMenus`/`menus`

 * [timothy] Safari has no limit.
 * [rob] Firefox has 16k limit; it's too low. Willing to raise limit, to what level though?
 * [oliver] On the topic of limits, I don't think it makes sense to enumerate every API and determine a limit
 * [devlin] agreed. That should be up to the browser since certain devices might have different limits.
 * [rob] Implication of a high limit is that it makes the browser slow, because the context needs to be gathered and shown. Extension developers likely aren't expecting that. Are you okay with the browser hanging when the user right-clicks?
 * [devlin] Not as much of an issue for us because we don't have onShown event.
 * [rob] This is relevant even without onShown; the context is gathered when the menu opens.
 * [devlin] Big thing, I don't think we should specify this. Smaller thing, I don't think this is unique to extensions. There are a bunch of other situations where menus have to do this.
 * [timothy] … That will show the selection text in the menu title when shown to the user, so you have to resolve selection text when shown, not when the menu is picked.
 * [rob] Do you pass selection text truncated in the menu item?
 * [timothy] Looking.
 * [rob] Resolution? Sounds like Devlin doesn't want to limit it.
 * [devlin] I don't think we should specify. Browsers should do their best to cover call cases.
 * [rob] Non normative note on recommended size?
 * [devlin] Don't think we should.
 * [rob] Can we specify a minimum?
 * [timothy] A reasonable amount. I don't think we should specify because different platforms may have vastly different memory constraints.
 * [devlin] Wouldn't bring this up in this specific API. If anything I'd have a global note that browsers may implement limits for performance reasons.
 * **Resolution**: Don't do anything in the spec.


### Exposing Types and Constants

See [issue 1114](https://github.com/w3c/webextensions/issues/1114) and [issue 1065](https://github.com/w3c/webextensions/issues/1065) for background.

#### [Issue 1114](https://github.com/w3c/webextensions/issues/1114): Exposure of types in the browser.\* namespaces

 * [carlos] All browsers have exposed this.
 * [oliver] Anything to specify in the guidelines document?
 * [carlos] So far we don't have a precedent for opening an issue to spec something out.
 * [oliver] Basically is there any
 * [kiara] We expose the types for all namespaces we support.
 * [timothy] And enum values
 * [tim p] Where is this exposed?
 * [rob] On namespaces on the browser global. Chrome has objects exposed for all cases where they accept enum values. In Firefox we inline simple objects. Should we expose all values like Chrome?
 * [carlos] Would be useful for developers.
 * [rob] Felt like an implementation detail rather than an intentional choice by Chrome.
 * [devlin] It is mostly a design decision because we wanted to expose them as programmatically accessible values. Bad way of working around inconsistencies in casing.
 * [simeon] As a developer I like having the objects available. Allows me to ensure that I'm using the correct value rather than trusting I have the string correct. Also allows iteration through a collection.
 * [rob] Not clear if we should adopt this as a general pattern. I'm inclined not to unless there's general agreement to.
 * [kiara] I see value in exposing it, especially if there's an angle for future compatibility.
 * [rob] Is the action item for browser to check if they have all enums exposed and if not do so?
 * [timothy] I think Kiara already covered that on our end.
 * [rob] Guidelines for how to approach casing?
 * [timothy] I have an action item to write up that guideline based on a conversation between me and Devlin.
 * [rob] Are there cases where the enum value is not all lower case? Should we special case to accept lowercase or uppercase in cases where we currently do uppercase?
 * [timothy] That makes sense to me.
 * [rob] Feels like all browsers have work to do here, even if it's just audit all APIs to make sure that we're consistent.
 * [devlin] We can do lowercasing, but it will still be wrong. Desire going forward is lower case hyphen separated. Lots of cases where we don't do that. Could hypothetically have a weird conversion to handle camel case, etc. but will likely be wrong.
 * [timothy] Don't think there's camel case. I think it's underscore.
 * [devlin] We have lower, shouting, camel, snake. There was a point where we and a lot of APIs incoming and no standard. Not clear on what we're trying to do in this discussion.
 * [rob] We're discussing the exposing…
 * [devlin] Today we're inconsistent across [our 250] APIs across what casing we use. We're not going to change all of them to be consistent. We should expose enum values for utility. The exact value of the enum we expose is not important.
 * [timothy] The canonical enum values should be specced.
 * [devlin] You're either writing the string or using the enum value, if the enum matches the string is less important. We're not going back to change all existing ones. I'd say for exposing new values in other browsers, expose the enum value that you accept.
 * [timothy] What about hyphens?
 * [devlin] Can't have hyphens in property names, those turn into underscores.
 * [rob] Have you run into inconsistencies when adopting enums? Concretely, executionWorld. Have you had issues with compatibility?
 * [kiara] We match Chrome.
 * [timothy] Down to the weird inconsistencies with casing on OS values.
 * [kiara] Should we keep this open?
 * [rob] I think so. There are inconsistencies we should work through and create guidance around new values. Would be nice to have a description for our expectations.
 * [timothy] I can document our guidelines going forward. Already on my plate.
 * **Action item**: Timothy to document guidelines. Firefox to expose enums. Chrome to check if they have unexposed enums that they should expose.

#### [Issue 1065](https://github.com/w3c/webextensions/issues/1065): Specify behavior of browser global using accurate WebIDL

 * (skipped; lack of time.)


### WebExtensions Types Repo

11:15 - 11:30 (15 min)
Align on next steps for the WebExtensions types repo, following the [discussion at the London face to face](https://github.com/w3c/webextensions/blob/main/_minutes/2026-04-09-london-f2f.md#webext-types).
See [issue 1071](https://github.com/w3c/webextensions/issues/1071) for background.

 * [tim p] Dashlane's position here, we're still relying on the Chrome namespace for historical reasons. We rely on the types-chrome library. We have over 90 assertions, which are not ideal. Lot of linting suppressions. We would support a cross-browser library package on npm as a TS types library if that were to exist. Would be happy to contribute.
 * [patrick] I made one, composed of types from browsers; softly blocked on commitment(?) from other browsers. I spoke to Tomislav yesterday; don't want to overtake a package that existed for years, but what we are coming up with is more complete. Feels weird for me to be the owner of a Safari types package.
 * [kiara] Can we try to get this on the Apple repo (repo under apple org on Github)?
 * [timothy] I'll need to talk to someone about where this could live. Don't know a good spot for it. We have a few places, just need to talk to someone about creating another repo in the WebKit org.
 * [patrick] Two current issues. Based on WebKit, not Safari. Also need to validate (...). Timothy, can I follow up with you?
 * [timothy] Keep bugging me about it. I'll work through it on my end.
 * [patrick] Tim-dashlane, I'd love to talk later to get your opinion on the actual library.
 * [ben] From a developer perspective, how should a developer report an inconsistency or missing value?
 * [patrick] Plan is that this would be exposed on a w3c github page as project produced by our group. In theory the types are defined programmatically from the source of the browsers.
 * [timothy] Why does there need to be something that lives in Firefox and Safari, instead of something like this (webextensions) group's repo?
 * [patrick] Two things here. WebExtensions typescript package, which is the project that consumes 3 projects, one for each browser. Then there are the 3 packages, one for each browser.
 * [timothy] Why does that need to be on Apple?
 * [patrick] Strictly speaking doesn't need to be. Feels weird for safari's intermediate values to be exposed by me or the group rather than Apple.
 * [timothy] I understand.
 * [carlos] Unifies current stable version of browsers? How about removing entries from past browser versions?
 * [patrick] The way it's structured, you can supply a browser version string to define per-browser version support. Currently it's only building for main stable releases of each browser, but something I'd like to do when I have a place to put them is to generate historical versions as well. Seems useful to the community. Plausible to support older versions, just need to do that data.
 * [ben] If the developer is specifying the range, would that be a linter rather than a typescript package?
 * [patrick] I have a similar project specific to Chrome that provides ESLint linting. Could be expanded. At the moment the types project is specific versions.
 * [ben]
 * [patrick] Currently just building stable versions. Anything that's supported by at least two browsers are included. There are some ergonomics issues I'd like feedback on. Encountered a TS bug where TS exposes data separately in different locations. Too deep to discuss now, but happy to chat later.
 * [tim p] If you're building something more complex, maybe should use browser list?
 * [patrick] That's what we use. Currently ignores versions, but in the future it can pick up and use those. Have a hard time guessing Safari release cycle, so I'm currently pulling once an hour.
 * [timothy] Could be less than an hour.
 * [patrick] Understood. Just trying to avoid surprises.
 *
 * [rob] Any action items or summary?
 * [patrick] Tomislav and I will continue to work on the community-managed package to update or transition the package. I will work with Kiara or Timothy to find the apple repo. Anyone in the room interested in using a typescript package for cross-browser support, please talk to me.


### Supports API

11:30 - 11:45 (15 min)
Discuss adding a method like `browser.runtime.supports()`, similar to `CSS.supports()`, so extensions can check whether an API is supported. It could also cover related checks, such as which declarativeNetRequest rule features are supported.
Issue: https://github.com/w3c/webextensions/issues/1151

 * [timothy] We've talked about this a couple times. Want to revisit as we're tackling spec work. I know CSS has found it nice to have. I think something like this would be very beneficial for extensions as well.
 * [carlos] We should discuss different buckets of support. Types are exposed in all browsers. There are methods you can expose/query. With the exception of the dynamic availability of those (lazy binding for namespaces) can't detect if those exist. Might be a useful way to get around that. Bigger issues developers seem to face is detecting DNR rule support. navigator.canShare could be useful prior art here, you pass it an object to see if the browser can handle it.
 * [rob] Relevant issue is [Issue 638](https://github.com/w3c/webextensions/issues/638): Proposal: declarativeNetRequest: Add a way to feature detect whether a specific RuleConditon is supported on the current browser
 * [rob] Would be nice to have a method. Would remove the need for exposing enums everywhere.
 * [carlos] CSS supports deals with things differently depending on contexts. Don't know if we can have one method that covers all possible situations in extensions.
 * [timothy] I think DNR supports would be its own thing.
 * [devlin] We can discuss more when there's a proposal, but I'm not entirely sure that's the case. Most of what we'd want to determine if it's supported is properties, fields, functions, etc. Those could be deterministically identified by a series of identifiers in the WebIDL. A property on a DNR rule, there could be a dotted path that would make sense for that. I don't know that we'd want supports on every API.
 * [rob] I was also going towards that direction. Browsers already have validation. Chrome and Firefox throw for properties for unrecognized properties, so we have a way of identifying when something is unsupported. Does Safari? You don't throw.
 * [timothy] If it's an unknown key that's unsupported, we can answer yes or no to whether it's supported.
 * [tim p] Insights from Dashlane. Every call to an extension API is gated on our feature detection logic for the Chrome global. Includes permission check from the manifest. Ideally we'd have a browser API that covers both.
 * [rob] Sync or async?
 * [tim p] Sync, but we expose a package for all webextension API calls, so we reject/throw if one of the preconditions fail.
 * [rob] Would an async API work?
 * [tim p] In most cases yes, but not 100% sure. (synchronous preferred)
 * [rob] Imagine many things doing feature detection want to do something later, like consuming a user gesture. Any direction from browsers on what they'd prefer?
 * [devlin] While I normally lean towards async, in this case if we're talking about property definition of availability of a method, we should strive to be sync. Making that async is potentially very disruptive.
 * [timothy] Yeah.
 * [rob] Personally I'd like synchronous, but potentially some validation is in the main process. I am surprised that there is so little pushback on it being synchronous.
 * [benjamin] Is the idea that you'd get a value back if the browser supports that API at all, not that it matches you permissions
 * [devlin] yes
 * **Action item**: Kiara to work on a proposal for `runtime.supports()` ([issue 1151](https://github.com/w3c/webextensions/issues/1151)). Tim Pillard to contribute Dashlane's perspective.


### Secure Cache

Revisit the [secure cache proposal](https://github.com/simpleplaces/webextensions/blob/secure-key-cache-revamp/proposals/secure-cache.md), an update to the `browser.secureStorage` proposal ([issue 154](https://github.com/w3c/webextensions/issues/154)). It stores small amounts of sensitive data in platform key stores, with a time to live and no durability guarantees.
The proposal was last discussed at the [London face to face](https://github.com/w3c/webextensions/blob/main/_minutes/2026-04-07-london-f2f.md#secure-storage-api). Review the current state of the proposal and agree on next steps.
11:45 - 12:30 (45 min)

 * [christian] While at 1Password Oliver worked on a secure storage proposal. Before TPAC last year we picked it back up. Proposed at the London WECG F2F. Got some feedback on API shape and durability concerns. I'm here to present the current state. Ben (Aglide) and I have been working on it.
 * [rob] Is there a link to presentation or slides?
 * [christian] We have a specific rev of the spec we can link.
   * Link: https://github.com/simpleplaces/webextensions/blob/8ba45f7b329de6f360b42f89f7723d09f531b6d3/proposals/secure-cache.md
 * [christian] Version that we'll be talking through has been revised to split secure cache and secure storage out. Combined they confused some concepts. Propose `browser.secureStorage.persistent` and `browser.secureStorage.cache`. One is a temporary best effort, the other is persistent. All user agents would be able to implement secureCache on day one. Storing the values in memory would suffice as a cache, as that would live longer than the MV3 background lifecycle. Keychain values, cryptographic keys, etc. could transparently survive background restarts.
 * [christian] Envisioning the use case here is storing keys or highly sensitive data currently held in session storage, this would be a drop-in replacement. Documentation would encourage the use of these functions for specialized use cases. Provides opportunity for the browser to store them better (memory locked pages, etc) than are possible for an extension in session storage.
 * [christian] Looking at the API surface.
   * https://github.com/simpleplaces/webextensions/blob/8ba45f7b329de6f360b42f89f7723d09f531b6d3/proposals/secure-cache.md#api
 * [christian] Check `browser.secureStorage.persistent` When not present, fall back to session storage or whatever solution you use today.
 * [ben] Just above in the feature detection it shows how to handle differences between platforms and durability. Uses a feature check on the storage area rather than checking deeper properties.
 * [rob] Do you anticipate the availability of persistence is fixed when the browser starts up?
 * [christian] Yes.
 * [patrick] Do you not? Is that difficult in Firefox?
 * [rob] Haven't thought about it. Just clarifying constraints.
 * [christian] Set has a user verification flag (`uvRequired`). When provided, a user would need to use touchId, Windows Hello, polkit on Linux, etc. in order to access the value. Used for biometric unlock in credential manager extensions. Support from developers mentioned later in the doc. Existing use case for storing values in native applications, such as having a password timeout in a password manager. This would be enforced by the browser/UA to hopefully prevent bugs in an extension's own threat model.
 * [rob] Anything else to highlight?
 * [ben] Not that I can think of. Worth pointing out that the FAQ has been expanded to address some additional questions. WebAuthn, other additional stuff. We've noted why this is uniquely valuable vs. building on top of web API. Generally quite keen to hear from those deeply experienced with web extension APIs makes sense. Does mirroring the approach from existing APIs make sense?
 * [rob] Recently we've discussed getKeys to retrieve names of all items in `storage.StorageArea`. The proposal shows `getIds`. This is a new/different namespace, so matching is not strictly necessary, but if you want to match, `getKeys` may make sense. Matching the names may be confusing if the signatures don't add up though.
 * [christian] getKeys may not make sense here.
 * [timothy] Getting identifiers may not require touch ID.
 * [christian] I would expect that to be a silent, promptless operation.
 * [timothy] Grace period to avoid re-prompting the user?
 * [christian] As in multiple sequential queries in a short time?
 * [timothy] yes
 * [rene] Depends on platform support, different platforms use a blessed object to be passed back to the system to prove UV was already done, but not supported on all platforms.
 * [timothy] would be handled internally, not necessarily exposed on the webextension API.
 * [christian] Only concern is that developers would only write code that works on one platform, end up in a compat hazard.
 * [timothy] Would just spam the user multiple times. Falls back gracefully if the platform doesn't support it.
 * [christian] Depends on what you think is graceful. If I'm targeting macOS and it works great there, then I try to pick up Linux support for free, I may not be testing the experience in
 * [patrick] If the platform has the ability to do so (a blessed period), we should try to align so we don't have different per-os values or handling.
 * [timothy] yes
 * [christian] I'd be supportive of a short value between 1-5 seconds.
 * [patrick] Having that kind of statement in text would be wonderful.
 * [oliver] Worried about the loss of control for extensions if we try to help them and don't always prompt for verification. If you're trying to build UI and you display a lock button, if the user does something where the extension is expecting to show UI and it's approved without delay, that could create issues.
 * [christian] Can add a flag to always prompt, not cache, etc.
 * [ricky] a don't cache authorization flag.
 * [oliver] Don't think we should have a magic behavior or opt-out.
 * [christian] I don't think having an opt out would be that confusing. We shouldn't punish good secret storage hygiene. Can imagine people serializing everything in a JSON blob and working against that.
 * [
 * [christian] Second is easier. Browser can unconditionally check the flag. You can signal that the request is stateless or should reuse cached state.
 * [oliver] I think 5 seconds is fine, but it doesn't address abuse scenarios (evil maid attack) where callers don't choose to provide the flag.
 * [ricky] Would re-calling extend the timeout?
 * [christian] No. I can make sure that gets specified.
 * [oliver] One thing I'm not convinced about was the cached aspect. As I recall in London we were moving away from that. Can you speak to what this gives you that session storage doesn't?
 * [christian] session storage vs cache. What I'm interested in, falls in local malware area. Main gain is in areas like memory dumping. Enterprise tools are looking out for things like that. If it's in session storage, that's more dumpable. Windows has the ability to encrypt blobs in memory. Raises the bar from plain text dump to the attacker having to do more work to get these values (from passive attack to active attack). Can gracefully implement secure storage as an add-on. It would be really nice to have a place to put keys that doesn't get written persistently where it's secure but you don't need to write to disk to store it.
 * [benjamin] Having a TTL that you don't have to manage is a nice to have.
 * [oliver] Would be nice to document expected guarantees in the proposal. Not just storing in memory but also having the OS protections.
 * [christian] That's called out in the version linked under the fallback section.
   * “it could keep data written through browser.secureStorage.cache inside of its own process memory (wrapped in any OS-specific guards available) until the browser is closed.”
 * [benjamin] If it were just session storage with TTL, something that could be improved on in the future.
 * [christian] Having user verification available, can't accidentally use stored values raises it beyond session storage.
 * [oliver] What is an example of what you'd store in cache storage?
 * [christian] We'd store what we call our unlock context. We have a protocol that we use for encrypted cross-device communication. We'd use it to store the bundle of keys used to identify a device (in our terminology).
 * [oliver] Unlock keys, you'd have to have the user provide something that isn't in cache storage. Later they'd be able to use user verification to unlock. For other things you'd need \_\_ to unlock. At least some additional protection.
 * [christian] On Windows, .. unlock depends on biometric unlock today. Platform verification to reauthenticate. Status quo our users are used to. Wouldn't be unexpected for them to see this applied to the extension as well.
 * [oliver] I'm convinced of the value. I'd only say we've gone from one proposal that we weren't sure how technically feasible it is to two proposals in one. Worried about scope creep. Fine by me, but depends on appetite of the browsers.
 * [christian] Having implemented both myself, the amount of work to do secure cache is fairly low. User verification primitive can be reused across both. Lot of text, from a code perspective for browser vendors, it's not a lot of work for per-API work.
 * [rob] Looking at this from someone who isn't familiar with these APIs, I don't know what you would mean by “OS specific guards”. Could the proposal be more specific about what protections you have in mind? Include information about the threat model and what you're trying to protect against, as well as technical details about how data is protected, to enable readers to analyze and verify the proposed solution.
 * [christian] Can add more detail to OS specific guards. Felt like scope creep while authoring.
 * [rob] Could be an appendix.
 * [christian] Open asks for the proposal so far: implementer documentation around user verification caching story for UV version of the APIs, caching flag for get methods to provide control over that behavior, elaboration on a bit more threat modeling and technical recommendations. There may have been another?
 * [rob] Folks that were participating in the discussion, please review notes for verification.
 * [timothy] Pedantic note, would be good to clarify what UV means.
 * [oliver] Devlin, any thoughts on \_\_ and expiry field?
 * [devlin] Largely makes sense in both cases. I understand the benefit of having the separation. Don't love that we're introducing a cache that's the same as storage.session. Seems a bit unnecessary/bloated, but not strongly opposed. The expiry makes sense. Don't know enough about underlying device APIs to know if that would be provided or if the browser would have to manage that.
 * [christian] I believe that's something that would be stored as an adjacent key in browser agent metadata bookkeeping.
 * [devlin] Don't have any major concerns beyond, while we think this is doable, we haven't vetted it yet.
 * [christian] 1Password is willing to sponsor providing technical resources to help bring this into the real world.
 * [rob] You're trying to protect against values being read from memory, but inherently we have IPC so the data is exposed on that channel. Any thoughts there?
 * [christian] There's a level where you have to stop going down the rabbit hole. Generally we've had success by not setting the bar for every platform at the lowest bar supported by all platforms.
 * [tim p] For the record, Dashlane is fully supportive for this and we look forward to collaborating more on this going forward.
 * [kiara] Clarification request: 1kb or 5kb, max 5kb total, 1kb per item stored?
 * [christian] I think that's just something that survived from previous revisions. Originally written before post-quantum crypto. Worth capping because you're going to be interacting with APIs outside of the browser's scope.
 * [kiara] Similar to Oliver, I was surprised to see cache included, but I think it makes sense. For 1Password, how much would you be using cache vs. persistent?
 * [christian] We'd likely implement the recommended developer approach: using biometric unlock and a timed cache.
 * [rene] For the unlock flow, we wouldn't want it to persist beyond the unlock session.
 * [benjamin] We want it to live longer than the SW, but no longer than necessary.
 * [christian] Verification would be off by default, opt-in.
 * [oliver] Nit: seems odd that a namespace wouldn't be available if it's not available on the current platform.
 * [rob] That was one of my questions. Determinable at startup, can be cached.
 * [oliver] Don't have that pattern elsewhere. Managed storage namespace exists even if there's no managed storage.
 * [rob] We already have the concept of (sub)namespaces availability being conditional on permissions at runtime.
 * [christian] Seemed simpler to explain to people. Truthiness of an object vs a few boolean flags that you have to know the meaning of.
 * [benjamin] Less nice example: try catches everywhere.
 * [kiara] seems like the supports() API would be useful there
 * [ben] With the web crypto API there's an option to specify unextractable. Thoughts about adding this so a developer can specify it should not be displayed in any devtool?
 * [rob] Difficult to do; if you can step through with a debugger you can ultimately see the value.
 * [ben] Suppress exposure in DevTools UI where feasible.
 *
 * **Next steps**: Ben and Christian to implement requested updates, push the update to the real branch, follow up on the issue to request review.


### DOM Autofill

13:45 - 14:15 (30 min)
Discuss [dom.didPerformAutoFill()](https://github.com/w3c/webextensions/issues/954), which lets an extension tell the browser it has already filled a field so the browser can avoid conflicting UI, for example by not offering to save the filled credentials or by applying autofill styling.

Follows the [2026-09-24 WECG discussion](https://github.com/w3c/webextensions/blob/main/_minutes/2026-09-24-wecg.md), and can also cover anything that comes up at Wednesday's [Autofill CG breakout](https://github.com/w3c/tpac2026-breakouts/issues/19).

 * [rob] Do we have any autofill people here?
 * [ricky] I am here.
 * [yannick] Me too; working on the autofill feature at dashlane.
 * [ricky] This is a seemingly narrow problem that is unfortunately multiplied by the impact on some people. Some platforms offer multiple ways of plugging password management functionality into input fields. For example, web extensions, application extensions. A concrete problem is that if one system tries to fill in a username and password into a form and submits it, and the browser doesn't know that it was filled by the credential provider, the browser may offer to save it. This proposal is about letting a web extension narrowly communicate to the user agent that it has autofilled a given field. You don't have to capture, save, or autofill it, I've already taken care of that. This was the minimal narrowest way that we could think of to solve prompting to save something, either the browser or another provider. Questions?
 * [devlin] Is there ever a time where you want the browser to offer to save what is offered by the credential provider extension?
 * [ricky] Maybe, but we have such rich features for migrating credentials between password manager apps that it's maybe a 10 to 1 ratio of people that are annoyed vs benefiting from making one-off decisions about migrating data between providers. There's a small number of people that may benefit and if a product has a large enough segment of users they can choose to not send this signal.
 * [devlin] Say you have multiple credentials where a value is stored in the password manager and another is stored in the user agent, are we anticipating that the browser would not suggest filling in that field?
 * [ricky] Proposal's scope is really for the extension to tell the browser that anything was filled. I sometimes joke that the hardest problem in my career is the browser UI stacking up against extension UI against extension UI. Out of scope for this proposal. My white whale. Did you want something that would mediate filling from multiple sources?
 * [simeon] I want that.
 * [devlin] Thinking this is more a browser thing rather than a spec thing; for the record not against the API itself; whether the browser does anything is a second question.
 * [ricky] The way I think about this practically is a checkbox in the browser or extension. You can bring calmness to the chaos by turning off in-page interfaces. Users have a way to cope with that, but native functionality in a browser offering to save things, it doesn't know about what the extension has done. Don't have a way of rationalizing about that piece. The proposal is so narrowly focused because we're just trying to solve that slice.
 * [oliver] I spoke to autofill folks on our side. Initial reaction, similar to Devlin, is not opposed but likely that we wouldn't do anything with it. We have the passwordSavingEnabled API that password managers use to disable built-in autofill. Don't think that anything would happen in the browser, possibly no-op. Not clear what value it would offer to/in Chrome.
 * [ricky] Kind of like a more dynamic version of that. In Safari-land we'd prefer to do this for people that are using a password manager for work, one for home, a contract gig, etc. Not full opt-out, but lets us solve it in a slightly narrower way. Respect the alternative approach Chrome is taking, but we're hoping to get something a little more dynamic for our multi-password manager users.
 * [devlin] Firefox?
 * [rob] No concrete thoughts at the moment. Is the interaction between multiple extensions out of scope?
 * [devlin] Don't think that factors in. It's more if an extension fills something, the browser knows to do something. If there are 5 managers, the browser still shouldn't do anything.
 * [ricky] This proposal doesn't provide a signal for extensions.
 * [devlin] Existing problem that password managers already have to deal with.
 * [ricky] Nothing precludes us from extending in the future by, say, exposing a way to query a field to see if it has been autofilled.
 * [rob] Trying to imagine what Firefox would do with it.
 * [kiara] Do you have a similar experience of having the browser prompt to save?
 * [rob] Yes.
 * [ricky] I think they have the password autofill opt out.
 * [rob] What would you specify as the expectations for the boundaries that this operates within. If every method is specified as a no-op
 * [ricky] We can be transparent about this providing a mechanism to let the browser not prompt. That's what it's for, might not do anything in all browsers. Seems reasonable to explain
 * [yannick] Dashlane; as an autofill provider we encounter this issue, and are supportive of conflict resolution between password manager and built-in. If you haven't yet, it would be useful to present this to the Autofill community group.
 * [ricky] We were only recently able to join. Would like to do this in the future.
 * [benjamin] We (1Password) would use this if it were available. If not, no worries, we already do some of this ourselves. Could there be a browser.dom.onDidPerformAutofill event indicating that some field was autofilled by another service?
 * [ricky] Sounds like a concretization of what we were talking about before
 * [devlin] Feels too niche for us to worry about. I don't think it's a serious privacy concern, but also doesn't provide much value.
 * [benjamin] One set of features implies the other, but you're right that it's niche.
 * [tomislav] Counterpoint: Almost every browser has a password manager. Anyone with an extension has two potential providers. I see value in the extension manager knowing whether or not the browser did something. Whether it's a privacy concern, both parties could already observe the values being inserted into the document. Seems to be a more explicit and correct way to do something that they're already trying to infer.
 * [benjamin] Knowing there's a credential that's being saved elsewhere in the browser's password manager, we could offer an ability to migrate or teach you how to use the migration tools. When dealing with corp policies, when something is outside our product, that may be a big security risk. We may want to be able to say “you have to save it in 1Password, your company requires it.”
 * [ricky] Sounds like that could be too powerful.
 * [benjamin] Could be. Being able to tell a user how to use the migration tools seems more reasonable.
 * [rob] The setting Oliver mentioned seems like it would address the corp use case.
 * [oliver] passwordSavingEnabled is, as Ricky said, a heavy hammer. I don't know that the narrower API will be adopted, but I can see the utility. If you have passwordSavingEnabled in Chrome and Chrome already has a password saved, Chrome will offer the saved password. For clarity, are we saying we should tackle extension notification now?
 * [kiara] No, should be handled separately.
 * [oliver] Would Chrome implement it as a no-op?
 * [devlin] Likely.
 * [tomislav] We will probably implement something if this is accepted as a proposal.
 * [carlos] Why no-op?
 * [oliver] Purely giving the browser a signal. Up to the browser how it handles it. You don't need to know what happens after you make the call. If the method exists the extension does not need to do feature detection.
 * **Summary:** Firefox neutral, Chrome neutral. Non-blocking. Next steps: official proposal for the group to review.


### Dashlane Web Extension Platform (mostly Chromium / MV3) feedback

14:15 - 15:00 (45 min)
Dashlane's experience with the Web Extension Platform, (mostly Chromium / Manifest V3) background execution: the cost of waking a service worker and the lack of other contexts to move work to. Discuss where the platform could help and which parts are browser bugs versus API design. See [issue 1144](https://github.com/w3c/webextensions/issues/1144), and the related [issue 72](https://github.com/w3c/webextensions/issues/72) and [issue 416](https://github.com/w3c/webextensions/issues/416), among others.

 * Slides: [2026-10-29-wewg-wecg-tpac-dashlane-feedback.md](https://github.com/w3c/webextensions/blob/main/_minutes/2026-10-29-wewg-wecg-tpac-dashlane-feedback.md)
 * [tim p] Speaking on behalf of Dashlane's “Web Platform”. Acting with the support of the organization, under the mandate that was given to me directly by engineering leadership.
 * [tim p] At the core we're a password manager. Millions of users on Chrome, Edge, Firefox, Safari and others. We began preparing for the MV2 to MV3 migration in 2021/2, in production since 2024 on Chrome. Steadily investing (mainly through our Web Platform Team) in extension Framework, build infrastructure, tooling, shared libraries, etc. We have been WECG participants since the beginning. We ship to all of the extension stores every week. On Firefox and Safari we rely on a persistent background page. As of 2 hours ago MV3 service worker in Edge now in production. Our extension is large and complex. Embeds 5+ web applications for different purposes. Popup, Vault, Team Admin Console, etc. We do autofill, content scripts, everything you might expect from a password manager.
 * [tim p] Since shipping MV3 in Chrome in 2024, we have seen a number of customer facing issues. Symptoms include a popup that opens blank or takes many seconds to open. Autofill that doesn't appear to work. Slowness. Extension that doesn't appear to be functioning (often around browser/extension updates). As you can imagine, this causes frustration to our users, and has a significant business impact, as well as other costs.
 * [tim p] We face a number of challenges. Service worker cold start cost. Much of the time is spent reloading state that was in memory moments ago. Loading data from storage is a challenge. Reads in `storage.local` can be slow, get corrupted. We see this clearly in our exception logs. `storage.session`, which we rely heavily on, is capped at 10 MB. In some of our use cases this isn't sufficient, putting the experience or functionality of the extension at risk for some users. Amount of memory allocated during initialization is heavily garbage collected. A lot of memory pressure overall. SW restarts are frequent. A normal user's working day (common scenario) we've observed well over 100 SW restarts. Dynamic import() is not available in the extension service worker, and importScripts() after install only works for scripts already imported during install, so we load all the background JS chunks at the start of the script. We cannot load new code on demand; the official guidance for extensions does not describe the install-time import pattern, so we load all the background JS chunks synchronously at the start of the script. We cannot load these on demand. WASM binaries are now lazy-loaded, which has been a significant improvement. `storage.managed` reads are slow, at least 2 seconds after a cold browser launch on Chrome. We had to design around this.
 * [tim p] Second challenge: runtime performance. One background that serves a number of surfaces (popup, content scripts, etc.). We rely a lot on messaging. We do a lot of heavy work (vault, crypto, machine learning, autofill, etc.) which compete with other requests on the same background thread. High volume of messages, each being serialized and cloned, which certainly has a cost. We rely a lot on `storage.session` and `storage.local` for persistence. Alarms in MV3 are used heavily since we can't reliably rely on JS timers. We use this to do periodic work, scheduled tasks, a side effect of which is that the alarm can wake the SW and the user has to pay the full initialization cost of the whole extension.
 * [tim p] Third challenge: in WebKit, recently had a high impact bug where the messaging APIs, which were naturally expected to be asynchronous, were in fact synchronous. As I understand, that's due to an implementation detail where extensions on Safari share a single background process. Using port messaging. JS bundles include a lot of JS modules, and a lot of text. That text needs to be encoded in ASCII only for Safari or the extension breaks. Haven't pinned down the cause yet. Relevant at the time we last worked on this in 2025. This has been well known in the Bundlers / Minimizers community for many years, ie: Terser.
 * [tim p] Recent Chrome regression (Aug - Sep 2026): macOS process was scheduled as background priority. Firing of events was delayed, to say the least. Thanks to 1Password team for opening the Chromium bug and sharing reproduction steps. We focused on measuring everything we could and optimizing everything we could. For example, for one user in one day, the initialization cost of the extension went from 1s to 9s to 35s to over 4 minutes.
 * [tim p] Second multiplier is the service worker lifecycle itself. Restarted many times an hour, many times a day. Pays the multiplied cost on every restart. In a persistent page in MV2 it is fine-ish, but not for a MV3 service worker. We are going to be affected by any similar change for how a background process is scheduled and the cost will be similarly amplified. This is a per-extension cost, and our background is not as light as we'd like it to be.
 * [tim p] Observability is another issue. Negative store reviews started in 2024 with the migration to MV3 on Chrome in production, with issues we could not see nor reproduce, and not reproducible on Chrome's side either (meeting with Oliver & Andrea in 2025).
 * [tim p] Some of these failures have come down to the initialization of the SW, or it being blocked and refusing message connections. Two years of instrumentation followed. At a high level, we follow the evolution of our engineering throughput (DORA). I tried to split what I could find into 2 categories: browser bugs and API gaps. I won't go into detail with browser bugs; better referenced in the browser issues bugtracker.
 * [tim p] On API gaps, I see a number of items that deserve the attention of this group. First, every SW initialization pays the full init cost. No way to perform, say, periodic scheduled tasks as a separate worker. Can't load code on demand, so no real code splitting. Can't spawn workers from a service worker which seems confusing from a frontend/platform engineer point of view. Looking into offscreen, but heard that it may not be the best fit for us today. Session storage is capped at 10 MB, seems limited to me for our kind of extension. We had a specific issue around storage.managed where different browsers behave slightly differently around managed storage not being ready, or not having data yet. Referenced in existing issues. Also concerned with behavior of the browser when we add a new permission and risk of user churn when doing so. Offscreen (permission) is not a good example. Looks like a feature flag, not a permission. Doesn't trigger a browser warning. Not deemed “risky” but still a permission for some reason. The rest is more informative so I'll skip it in the interest of time.
 * [tim p] Technical use cases. Would love to move heavy work out of the BG main thread. Would love to load modules on demand (ideally ES `import()`). Would love to update permissions without alarming the userbase (e.g. notifications). We want to use web push to update users, which is to my knowledge gated on the same permission. Reliably keeping the background alive for a specific task (e.g. filed before in waitUntil proposal). Reading enterprise policies in a B2B environment is critical - doing so reliably, efficiently and consistently would be great. Multi-threaded web-assembly would be nice, believe the background can only do single threaded. Sometimes in the update an extension, we observe clearly there is a mismatch between the manifest version and SW code. May explain a number of weird behaviors around update. We rely heavily on extension local storage. It is to us the canonical persistence method for extensions. I believe we need to make sure this critical API stays fast and reliable. Already mentioned session storage is great, we use it maybe too much, but 10 MB cap is limiting. Finally, for WebKit it would be great if we could run extension pages in different processes so we don't have to manually solve synchronicity issues between separate contexts starving the process.
 * [tim p] We've made a lot of progress on our side in the past 2 months alone. As I've measured cold browser launch went from 1s to 6ms, that's related to the managed storage workaround. 5x faster initialization of our own extension framework. Median startup time for specific customer from 8s to under 1s. JS bundles: been making continuous progress since 2021. Reduced bundle size, machine learning runtime 90%, content script ~26%, other framework code ~4%. 1MB of WASM was incorrectly inlined into the background's JavaScript bundle, and now all WASM binaries are correctly lazy-loaded. Significantly reduced number of messages exchanged between BG process and other surfaces, significantly relieving memory, CPU & IPC pressure.
 * [rob] Thanks for all this information. In my head due to recency, the Safari process suggestion, is that needed for something specific or could it be done another way? Instead of separate process, can imagine separate threads, or even single thread, with microtask/macrotask (setTimeout).
 * [tim p] Don't have a strong preference. What I heard from these meetings cross-site isolation is required to do this properly.
 * [kiara] You're referring to site isolation in general. That change required all extensions to run in one process, and that caused this behavior?
 * [tim p] Yes.
 * [kiara] Could be addressed another way than via processes.
 * [rob] What's the problem?
 * [kiara] Messages being sent synchronously.
 * [rob] Sounds like a browser implementation bug.
 * [kiara] Yes. Curious to understand more about the session storage issue in MV3 rather than MV2. Are you utilizing it more?
 * [tim p] We use it to persist in-memory state that survives worker restarts.
 * [benjamin] We do the same in 1Password.
 * [tim p] In MV2 we rely on in-memory data. Possible we don't use session storage in the best possible way. Kind of the default for our Framework, which is used by 8 product teams and ~50 engineers.
 * [benjamin] We haven't had issues with storage APIs, but we've created a sync shim over a batched write API. That was largely because moving from sync to async everywhere would be a substantial rewrite, but it's working well. Rob's proposal for a config storage would solve multiple problems, especially with Tim's suggestion for a single shared space. That would solve a ton of coordination problems for us.
 * [tim p] Do you rely heavily on extension local storage?
 * [benjamin] Mostly use IndexedDB.
 * [george] Are you butting up against a limit for your users?
 * [tim p] Not quite. Our observability stack doesn't allow gathering too much about the usage of the extension. I can prepare benchmarks and profiling locally with representative test user accounts. That should give more clarity.
 * [oliver] Thanks for opening this and sharing all this feedback. I know the MV3 migration wasn't easy for everyone. There are so many issues here of multiple years of community and working group work. We should make sure to update multiple other issues with this information. One thing that would be really useful is getting a clearer picture of MV2 vs MV3 and bugs that you've had in the past vs ones that are present now. There are a number that should have been fixed over time, but there's clearly still more work to do.
 * [tim p] Not particularly interested in MV2 vs MV3 profiling, but we observe these customer facing symptoms specifically on Chromium MV3. We do not observe these in Safari MV2 and Firefox MV2. We fear that in the coming days we will start seeing them in Edge MV3 as well since we can no longer delay that migration on Edge. On the data itself, we can share with you directly as we've done in the past. We should absolutely follow up. On our side, we're going to schedule calls with main browser stores and reps to discuss in more detail. Our Web Platform Team is also responsible for the release process, rollout and rollback of our extension.
 * [rob] When you say MV2 vs MV3, I assume most of that can be attributed to the ephemeral background context. MV3's service workers suspend/resume all the time, and MV2 has event pages with similar lifetime characteristics.
 * [tim p] We have no reason to migrate our persistent background page to an event page.
 * [rob] On Safari for iOS you can't have persistent background pages; don't you have a similar problem there?
 * [tim p] We don't ship for iOS. We prefer to guide our users toward our native apps on mobile devices. Eventually that would be great though.
 * [benjamin] 1Password ships a browser extension on iOS.
 * [kiara] Curious about your experience using non-persistent background pages on iOS.
 * [benjamin] In the process of trying to switch to a SW in macOS. On iOS I don't think that we're doing that. We haven't moved to deliberately adopting non-persistent pages on iOS. Main issues we encounter are related to IndexedDB going away when Safari is backgrounded. We have hacky ways to try to recover from that. I would say that's the biggest issue we face. For a while on both desktop and mobile platforms had some issues with memory leaks in the popups. One of my coworkers paired with a Safari engineer to fix that, thanks very much for the help. Similarly, worked with Chrome folks on background processes disappearing. In Safari, I don't think there's ever really been a persistent background; you're very aggressive about killing the background for memory saving purposes. We took a lot of the tech we developed for MV3 Service Workers in Chrome, that has served us very well. We have a lot of alarms and messaging, so the extension's background doesn't tend to die. It's something that's probably bad, but it's a very large undertaking that we're tackling piece by piece. We've changed some of our API calls and told that it could die, but as long as doing real work you should be fine, and we spend a lot of time doing work. I've been pleased with WASM caching in browsers. Unexpected optimization is that combining WASM into a single file
 * [tim p] Why do you rely on IndexedDB? It is a web API, not an extension API.
 * [benjamin] Its fast and structured.
 * [rob] Being a web API isn't a bad thing. Extension platform = web platform + extension APIs. In Firefox, `storage.local` is backed by IndexedDB, by the way.
 * [benjamin] We've experienced almost all of the problems you've experienced. I know that frustration first hand. Overall, though, we've found ways to adapt and roll with the punches.
 * [tim p] This is not about the frustration, it's mostly about the cost. Not just customer support or engineering.
 * [tomislav] You mentioned the 10 MB limit as an issue. What would be a more reasonable limit? Unbounded? Do you have data points we could consider?
 * [tim p] Can pull the data and make a reasonable recommendation.
 * [tomislav] That would be useful. Next, you mentioned service worker and manifest mismatch. That sounds like a bug.
 * [tim p] Definitely a bug. One of the weirdest behaviors we observe.
 * [tomislav] Happens while the browser is running, correct?
 * [tim p] Yes. Manifest and service worker version mismatch has been observed continuously. We suspect that there's more than just manifest/SW mismatch. Potentially content script mismatch as well, but we do not see that at the moment.
 * [tomislav] What changed that made opening times progressively increase?
 * [tim p] Chrome bug due to extension process scheduled with background priority.
 * [tomislav] You said you can't split up the background code and load them on demand. I know there are specific rules about `importScripts()` in SWs, but to my understanding there is a way to tell the SW that here are the `importScripts()` I will be calling in the future, and then later after installation you can asynchronously call them. You pay the full cost on first load, but on subsequent loads you can only pay the cost async.
 * [tim p] Interested in looking into this for Firefox. For MV3 we follow Google's guidance.
 * [simeon] The technique Tomislav shared is the code sample I shared with you.
 * [tim p] I understand that it works, but we can't rely on non-standard behavior here.
 * [tim p] The overlap / differences between web service workers & MV3 extension service workers are a problem.
 * [rob] What Tomislav mentions is not Firefox-specific behavior (we don't support service workers in extensions yet), but standard service worker behavior (across browsers, in service workers on the web).
 * [simeon] This is a communication issue with web specs. This is specified, intentional behavior, but general developer communication is oversimplified to “can't do any async script loading”
 * [tomislav]
 * [oliver] Reason we suggest registering all of your event handlers listening as soon as possible is a current requirement due to a limitation of the platform. Once we are able to land the async listener registration change, we'll update the official docs.
 * [tomislav] Possible disconnect between what each party is saying here.
 * [tim p] Not mishearing Oliver, I've been using the official documentation as the source of truth.
 * [oliver] Reason for documenting it is because registering listeners too late can cause severe bugs.
 * Next steps:
   * Dashlane's “Web Platform” to schedule follow-ups with the browser vendors here.
   * Done: Tim Pillard to share the presentation in Markdown format.
   * Tim Pillard to continue contributing on relevant GitHub issues / proposals & browser bug trackers.
   * Tim Pillard, together with WECG/WEWG members to continue fostering the right relationships.
   * Tim Pillard to experiment and do some profiling around extension storage.
   * Tim Pillard to experiment with more advanced background chunks loading techniques across browsers and background type (persistent bg vs service-worker).
   * Tim Pillard to make a data-backed reasonable recommendation for session storage size limit.
   * Done: Tim Pillard to follow-up with Kiara about the JavaScript bundle ASCII-only issue.
   * [tim p] Official documentation updates on browser vendors side?
   * [tim p] Issues / bugs consolidation / de-duplication on browser vendors & WEWG/WECG sides?
