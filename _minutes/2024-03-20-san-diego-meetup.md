# WECG March 2024 Meetup, Public Notes, Mar 20

Wednesday, the third day of the three-day in-person meetup of the WECG in San Diego ([#525](https://github.com/w3c/webextensions/issues/525)).


## Agenda

 * 9:00 - 10:00 User Scripts
 * 10:00 - 10:20 Embedding pages that don't want to be embedded
 * 10:20 - 10:30 Icons: SVG
 * 10:30 - 10:45 Icons: Dark Mode
 * 10:45 - 11:00 DNS API
 * (break; transition from remote to in-person only)
 * 11:15 - 11:40 proxy API
 * 11:40 - 12:00 Browser specific namespaces
 * 12:00 - 12:10 Feature support detection
 * 13:00 - 15:30 Issue triage
 * 15:30 - 15:35 wrap up


## Attendees

 * Devlin Cronin (Google Chrome)
 * David Johnson (Apple)
 * Timothy Hatcher (Apple)
 * Elijah Sawyers (Apple)
 * Tomislav Jovanovic (Mozilla)
 * Rob Wu (Mozilla)
 * Anton Bershanskyi (Independent, remote)
 * Carlos Jeurissen (Jeurissen Apps)
 * Richard Worth (Capital One)
 * Mukul Purohit (Microsoft)
 * Oliver Dunk (Google)
 * Andrey Meshkov (AdGuard)


## Meeting notes


### User Scripts

Future enhancements of the userScripts API, including multiple worlds, inter-world communication, one-time script execution, and more.

 * [devlin] New capabilities in userScripts API: userScripts.execute, multiple user script worlds. Already referenced in the original userScripts API proposal
   * https://github.com/w3c/webextensions/issues/477
   * https://github.com/w3c/webextensions/issues/565
 * [devlin] Another topic is inter-world communication. Recap is communication between multiple world, main world vs isolated world, userscript vs userscript, and any combination thereof. Current common mechanism is through the postMessage API. Extensions need to make an effort to capture the necessary APIs and hide the event from the other scripts in the (main) world.
 * [rob] WRT postMessage, I want to call out that CustomEvent + dispatchEvent, the important part about this is that it is synchronous, unlike postMessage.
   * https://github.com/w3c/webextensions/issues/77
 * [andrey] This is not about user scripts only, right?
 * [devlin] Correct.
 * [andrey] Event?
 * [devlin] Don't think that the main world should be able to initiate a message.
 * [rob] Shape of the API should have the content script pass a closure to the main world, with access to a private object or method for cross-world communication. Common way to hijack extensions is prototype hijacking. We should make that impossible.
 * [devlin] ?
 * [rob] Could fire an event.
 * [devlin] Wonder how complicated it would be to block sending a message to the main world until resolution of the event. (...)
 * [rob] Glad to hear you're considering synchronous responses as it's a long standing issue.
 * [devlin] There are many prior proposals. One I like is …
 * [rob] Wouldn't go that way.
 * [devlin] Was thinking the API surface, not implementation.
 * [rob] Would recommend
 * [devlin] What considerations do we need for passing a message to a receiving world
 * [rob] String methods, can be a common attack vector.
 * [devlin] One time script execution may be relatively easy. Not sure how it would work with other types of script (js file). How would we expose the listener there? What prevents the main world from registering that listener?
 * [rob] The code could be wrapped in an arrow function, and receive the communication mechanism through the function parameters. Main world code (of the web page) would not see that argument, unless the extension accidentally leaks that.
 * [devlin] Say we want to do many worlds and content script execution, how do we know whether or not to wrap something in an arrow function for execution?
 * [rob] This is mostly about the main world.
 * [devlin] What about a content script in the main world?
 * [rob] My understanding of a content script is that it executes in the isolated world, user script is in the user script world
 * [devlin] I was thinking content script as in a bundled script, user script is dynamic
 * [rob] New manifest key could be used.
 * [devlin] Seems doable but clunky
 * [rob] Don't want this for all scripts. Opt-in may be best.
 * [tomislav] We may be trying to make the square solution fit in a round box in trying to make this work for files. Can we go back to globals?
 * [rob] I'm open to other approaches that would prevent a variable from being leaked. Function closures, modules, etc.
 * [devlin] Was focusing on files because it's a case we may need to address.
 * [rob] As an alternative, add a new method to the isolated world to run a function in the main world. …
 * [devlin] I get the idea of executing a …, but that includes exposing a handle, right? So if we serialize the function, we make exposing the handle part of the API. That seems viable. But if I have a 1k line file, how do I set up a function that …?
 * [rob] I think developers are more concerned with having a way to do this. A large file is a nice to have.
 * [tomislav] …
 * [rob] As an example one of my extensions injects a script in the main world in order to know if some flags are set. In this case I'm not concerned about the hostility of the main world (e.g. prototype tampering). For extensions that are more privacy oriented that solution wouldn't work. We would need the handle-based approach we're discussing.
 * [devlin] A few different pieces here. Synchronous execution of script in another world. The ability to add in another object to enable communication between worlds (message pipe of some kind). Are there any aspects not addressed?
 * [rob] I don't think so.
 * [devlin] Concerns with synchronous execution being able to execute in any world? That is, exposing this in both user script and isolated worlds and allowing any to communicate with any.
 * [rob] User scripts not targeting isolated, but user scripts targeting each other. If someone wanted to create some user script worlds that are more privileged than others..
 * [devlin] That could be accomplished with the API we're discussing.
 * [oliver] Can you clarify what the concern is with prototype modification?
 * [rob] If we don't account for prototype hijacking, it would be possible for a main world script to modify an underlying prototype (e.g. Message.prototype.handle) and intercept every message exchanged.
 * [oliver] Seems interesting because it seems like sending data to the main world at all may be dangerous.
 * [rob] Userscripts aren't the only case. There are some situations where an extension may want to perform modifications in a page that require main world access, but
 * [rob] Something that can be configured once wouldn't require this capability. Something
 * [andrey] Unsure why we need to talk about synchronous message passing? We are trying to replace window.postMessage which is not.
 * [devlin] We are talking about multiple mechanisms. Agree postMessage is not, but event dispatching is synchronous.
 * [devlin] Note that chrome.dom.executeScript runs synchronously.
 * [andrey] Should this be synchronous by default?
 * [devlin] Don't see any concerns with that.
 * [rob] Blocking while waiting for response is not a new problem, since this can happen with the dispatchEvent method getting blocked if an event dispatch is not immediately completed.
 * [rob] The use case we are trying to solve is sending data safely between two worlds.
 * [timothy] Could you clarify why we need the targetWorld parameter? Seems like this might be unnecessary given we pass to a specific world with executeScript.
 * [devlin] I like having this because it makes it clear you cannot pass the port to multiple worlds.
 * [rob] I think there is agreement on what API should do and should not do. We don't feel strongly about a particular API shape.
 * [devlin] Agreed. We don't need to establish every piece but it is useful to agree on the type of approach we want to take. Prefer not to leverage message channels for example which would be a big difference and doesn't feel appropriate.
 * [rob] We could also support return values from the onMessage handler. Something else we haven't touched is how we define the serialization of the arguments to executeScript.
 * [devlin] Realistically from implementation on the Chrome side we would want to start with just JSON serialization. Limited but well known. In the future structured cloning and ideally transferables would be useful, including on other APIs. However this greatly changes the timeline within which we could ship this.
 * [rob] It would also be nice if DOM elements could be forwarded without serialization.
 * [devlin] Yes. Agree there is a use for this. Should be relatively trivial for developers to workaround.
 * [simeon] Disagree for the average extension developer.
 * [rob] You have to use the DOM APIs which could be hijacked.
 * [devlin] For the first version we can agree to support a small number of values and look at changing this in the future.
 * [tomislav] I don't like that we are introducing new APIs with JSON five years after we introduced structured clone in Firefox. We have some minor issues but other than these this is strictly better for performance, capabilities etc.
 * [rob] Agreed. The API we're replacing (postMessage/CustomEvent) uses structured cloning already.
 * [tomislav] Structured cloning is a web exposed API and closer to the web. Developers should be more familiar with this which alleviates other concerns.
 * [devlin] Is there a risk of contamination between worlds?
 * [tomislav] No, this is a deep clone and there is no ability to mess with prototypes.
 * [devlin] I think we can probably implement structured cloning. Can have this as an initial target but will need to look into complexity.
 * [rob] Next steps?
 * [devlin] Need to write up a real API proposal that defines these different pieces. Can discuss more in WECG. Can loop in folk who have been involved in other threads.
 * [tomislav] Timothy?
 * [david] We can follow up.
 * [devlin] Happy for Chrome to take on the action item of writing up the proposal.
 * [devlin] I tentatively put these methods on the browser.dom API.
 * [rob] This seems reasonable. When I described this capability at TPAC 2023, I also suggested this as an addition to the dom namespace.
 * [devlin] Everyone ok with this?
 * [tomislav] This won't match the API shape of extension messaging?
 * [devlin] This will be different.
 * [carlos] Yesterday we discussed a language dictionary proposal that also returns an object with methods. This appears to have a similar structure.
 * [devlin] The complexity in that case arose because it was a return type from a browser-side API – those need to go through serialization.  Here, the API is entirely on the renderer, so it's easier to implement custom types and handling (and we need custom code already).
 * [patrick] Do we need a new permissions?
 * [devlin] I don't believe so.
 * [simeon] Do we want one?
 * [devlin] I don't believe so.
 * [rob] Do we want a way for the main world to receive additional data?
 * [devlin] Assume we can transmit data onMessage on the port.

A sketch of the API and usage was made during the above discussion. This is the final version of that sketch:

```javascript
// Future work: structured cloning, transferables, DOM references

// Port type TBD. Not a MessageChannel.
let port = browser.dom.createPort({targetWorld: 'MAIN'});

// This function will be executed in the other world synchronously.
// To make this operation async, use an async function.
function myFunctionInMainWorld(port) {
  // NOTE: port prototype is not visible to the main world.
  // This script executes in the main world.
  port.sendMessage(getSomeMainWorldData());
  port.onMessage = () => { ... };
}

port.onMessage = (data) {
  // Runs in the isolated world.
  self.mainWorldData = data;
}

browser.dom.executeScript(
    {
      func: myFunctionInMainWorld,  // This runs synchronously
      targetWorld: 'MAIN',
      args:[port],
    });

// Data is set because the `myFunctionInMainWorld` runs synchronously,
// dispatches the message synchronously, which is then received
// synchronously in `port.onMessage`.
console.assert(self.mainWorldData);
```


### Embedding pages that don't want to be embedded

 * [oliver] Two parts. 1. Embedding pages that don't want to be embedded. 2. Embedding pages in a way that the page doesn't know it's being embedded
 * [devlin] Chrome view here is that this fits within the model and makes sense as a feature. Not too worried about (1). On the Chrome side, we can selectively ignore the don't-embed signals. Not worried from a technical or security point of view. I am more worried about (2). There was some discussion of prior art that addresses similar concerns, e.g. webview, portals, etc. I don't know that we want to expose webview in extensions and I don't know that other browsers have that capability.
 * [tomislav] We have a similar functionality and our platform team doesn't want to extend its use.
 * [david] We don't have this.
 * [devlin] Sounds like we don't want to extend/implement this. Challenge is that we end up creating something very similar to webview. Now, without 2 we could only address 1.
 * [oliver] Not concerned with that, most uses I've seen are where the website doesn't want to be embedded in a website.
 * [carlos] It's very hard to embed a page that really doesn't want to be embedded.
 * [devlin] Unless you have a webview.
 * [oliver]  The simple option is to just ignore restrictions on iframes if you have host permissions. Is this enough, or are there problems with that that warrant something more?
 * [devlin] That's the direction I'd lean, but curious if there are use cases where this break things. I'd prefer this to not be an opt-in.  If we had a lever, it would be complicated. Per-origin?
 * [devlin] Are there cases where an extension would want to respect a site's preferences?
 * [carlos] Could use the non-blocking webrequest API to detect it?
 * [devlin] Are there cases where we want to make it easy? I can't think of cases where we'd want to make it easy for an extension to say “don't embed this page I told you to embed.”
 * [oliver] Sounds like it might be okay to not have this be opt-in.
 * [rob] Can you recap?
 * [devlin] I think we're aligned that we want to allow embedding if an extension has host permissions. Oliver raised the question of whether we can just do that or if we need an additional signal.
 * [rob] Top-level documents OK. Would prefer to not do it by default in iframes. I'm afraid it could be too easily abused by web pages that exploit vulnerable extensions.
 * [devlin] Good point. Taking it a step further, not just require opt-in, but maybe we should disable embedding like this in iframes.
 * [oliver] So only allow this in cases where the top level document is on the extension's origin?
 * [devlin] Allow embedding of frame independently of XFO, COOP, COEP etc., only when the full frame hierarchy above consists of same-origin and extension origins.
 * [oliver] Is this feasibly implementable?
 * [rob] In Chrome yes, the information is available for location.ancestorOrigins; In Firefox also possible.
 * [oliver] Confused why there are security concerns with doing this for iframes and how this is different from stripping the X-Frame-Options header today.
 * [devlin]  It's not different. It's that the extension doesn't have to strip the header any more, which is a win for security (especially for e.g. csp-related headers)
 * [rob] DNR/webRequest are generic APIs, where this capability is possible. In this case we're designing a new API that allows extensions to do what they want without compromising security. If use cases exist, I wouldn't mind an opt-in, but it should be off by default in iframes.
 * [oliver] The impression I was getting was that we would never allow site -> extension -> site frame embeds.
 * [devlin] Not never, would want strong evidence that this is a beneficial capability. It's possible for the top level frame to navigate a sub frame using iframe.frame.frame references.
 * [rob] I've seen real world extensions vulnerable to this kind of attack.
 * [oliver] Apple folks, thoughts?
 * [timothy] Will need to talk to WebKit folks to explore this idea. Can't commit to anything right now.
 * [devlin] In the cookie deprecation process in Chrome we did get some reports around samesite (I think) cookies not behaving as expected with nested frames. Could potentially start by saying it has to be embedded in the top level extension frame, has host permissions, and the limited frame hierarchy.
 * [carlos] Would it be possible for an embedded frame to trigger a navigation to a frame you didn't want to embed? No. You can use frame-src csp on the extension.
 * [rob] Are we going to move from this discussion to a proposal?
 * [devlin] Think so, yes.
 * [rob] When we do, we should detail exactly what features we want to bypass and handle. That would even make sense in general independently of this proposal; same-site / first-party / CSP bypasses, etc. are currently not well-defined across browsers when extensions are involved.
 * [devlin] To recap, we are all on board (in principal) with this capability. We are not currently solving for embedding content that explicitly does not want to be embedded. Next steps are to write a proposal.
 * [oliver] AI: I'll write the proposal.


### Icons: SVG

 * [devlin] SVGs are not supported in Chrome, are they supported in Firefox or Safari?
 * [tomislav] Yes.
 * [timothy] Yes.
 * [devlin] We don't want to allow script execution. Do other browsers have a subset of SVG that doesn't permit script execution?
 * [rob] SVGs can be rendered without scripting. SVGs in an `<img>` do not execute code, when loaded as a document it could execute code.
 * [tomislav] SVGs can be rendered in a separate process.
 * [devlin] You render in a sandboxed process?
 * [tomislav] I believe so.
 * [devlin] I assume this also means you don't support dynamic SVGs.
 * [tomislav] No. Same rules as for an image.
 * [timothy] Same. Just the drawing parts of SVG.
 * [devlin] Have you received bug reports about insufficient support for SVG capabilities?
 * [tomislav] We've had requests for capabilities like dark mode.
 * [patrick] Is it worth making sure we have the same subset?
 * [tomislav] It's the same support as if you put an SVG in an img tag. I believe that's consistent across browsers
   * https://html.spec.whatwg.org/multipage/embedded-content.html#the-img-element:document-element
 * [rob] Most SVG users want the scalable vector aspect of it; while some may also want automatic adoption to dark theme etc., that does not need to block support for SVG.
 * [devlin] Timothy, were there more aspects that you wanted to discuss about this?
 * [timothy] Cross-browser support for existing SVG support.
 * [tomislav] Forgot that SVG supports declarative animations.
 * [devlin] Is that supported?
 * [timothy] Not in Safari.
 * [tomislav] I think so.
 * [rob] I'd say that we explicitly support static SVGs, without explicit support for animated SVG. Any existing support for animations is accidental and not guaranteed.
 * [devlin]  I think on the Chrome side supporting the subset of SVG that does static rendering of an icon should be do-able. Even with SVGs, I think it makes sense to have different keys in the icon dictionary. At different sizes you may have different rendering expectations.
 * [patrick] SVG has the ability to have multiple different images that display at different sizes. Not saying we shouldn't support multiple breakpoints in the manifest, but that we should be able to also use a single SVG if so desired.
 * [devlin] That makes sense.
 * [mukul] Is that (defining multiple sizes in the manifest) already supported in Firefox?
 * [carlos] Firefox supports.
 * [timothy] Safari supports both, so you can declare both SVGs and PNGs. Basic styles are supported. We don't use WebKit SVG for this. We use the system's SVG parsing support.
 * [patrick] Same support as for desktop icons?
 * [timothy] Yes, same support as used for SF Symbols
 * [devlin] Need to do some exploration on the Chrome side for what we could support. Scripting is out, but would like to explore stylesheet support.
 * [mukul] We can explore this.
 * [devlin] Great.
 * [rob] You can pass a hash to select a specific area of an SVG. This code snippet shows the same image with different colors. If we were to support this explicitly, it could reduce the number of SVGs they need to create. Is this something we would support?
   * https://github.com/Rob--W/bookmark-container-tab/commit/afd4aa5165d91b69841df2899ff615795417a0ad
 * [timothy] Not sure if our implementation supports this.
 * [devlin] Suspect that on the Chrome side we'd have very limited support for SVG.


### Icons: Dark Mode

[Issue 229](https://github.com/w3c/webextensions/issues/229): Extension Icons for Light/Dark/Custom Theme

 * [timothy] Wanted to check in on this. We haven't begun implementation yet.
 * [devlin] My recollection is that we had a proposal from quite a while back, and that there are no open questions. Is there anything left to do?
 * [oliver] That matches my recollection.
 * [timothy] I think we all largely agreed. Think we should proceed with that proposal.
 * [rob] No objections. Someone just needs to implement it.
 * [tomislav] Patches welcome.
 * [devlin] Brought up themes when we were first discussing this and it's much harder. Custom themes in the browser don't typically have a great way to decide whether to use light or dark. One idea we discussed was giving extensions access to the theme color to let them decide how to handle the theme colors. We started with light and dark because we expected that would give developers most of the benefit.
 * [carlos] Potential solution is to have the default icon be generic, use light/dark when the setting is more clearly one extreme.
 * [devlin] That rings a bell.
 * [carlos] I think I brought it up in the issue discussion.
 * [devlin] I think that makes sense – light, dark, default fallback.
 * [rob] Does the existing Google Doc capture the latest proposal? If not, then we should create a proposal with our new proposal process to document the latest state of the proposal.
 * [oliver] We previously discussed having a light/dark in the icons manifest key, but that would be a hard error in earlier versions of Chrome. Introduced the idea of a icons_variant key to address this.
   * https://github.com/w3c/webextensions/issues/229#issuecomment-1877038396
 * [carlos] Is there a way to update icons programmatically, to replace what is in the manifest?
 * [devlin] That's one of the pieces we were planning on following up with. Would hope that would be a fast follow (but this hasn't been going fast so maybe just follow up).
 * [oliver] Suggest creating an updated proposal to capture this.
 * [devlin] Rob also suggested this. We should.
 * [timothy] All black icons have given us some amount of light/dark mode support.
 * [oliver] I've found this behavior hard to work with. First creating an icon, then trying to reason about how to convert that into an all-black icon.
 * [patrick] I think Timothy was suggesting we potentially support this in addition to other approaches.
 * [oliver] In Safari, if you only specified the light icon and it was pure black, would you auto-generate the other style?
 * [timothy] Not sure. Seems like the extension developer is explicitly indicating something in that choice.
 * [devlin] On the Chrome side we would not prefer that, and instead just add the dark key.
 * [tomislav] Keep behavior of existing things, but no magic for new things.
 * [devlin] Action item is to write up a refreshed proposal using the new process to capture the changes we discussed here. Are we also on board with exposing these keys to action.setIcon?
 * [rob] Yes. All APIs where it makes sense.
 * [devlin] Explicitly calling those out as potential future work or as part of the same proposal. Then, we just have to actually do it.
 * [devlin] I'll ask Solomon (the original Googler who authored the proposal).
 * [carlos] What about other areas where extensions are used? E.g. notifications.
 * [rob] Suggest handling these on a case-by-case basis.
 * [carlos] But they're related, right?
 * [rob] In the case of the notifications API specifically, the way Chrome and Firefox are implemented, we pass the icon to the system for rendering. The browser's handling of icons may not match what the system does. If you want dark mode handling of notifications, it may be better addressed in a separate proposal.
 * [devlin] Settings page in Chrome has dark theme support, in that case we would select the dark/light mode of choice.
 * [carlos] You're saying that dark mode icons would also be handled from the icons field in the manifest?
 * [devlin] Yes.


### DNS API

[Issue 570](https://github.com/w3c/webextensions/issues/570): Inconsistency: dns.resolve()

 * [andrey] What about bringing Chrome DNS API to extensions?
 * [devlin] Security team previously had  concerns.
 * [andrey] Why?
 * [devlin] Accessing local DNS is my recollection.
 * [tomislav] If you're in an enterprise, using public DNS can't reach in to scan the user's environment. With this you can see private DNS results.
 * [andrey] Why is that not an issue in Firefox?
 * [tomislav] It's also an issue for Firefox. The problem is we don't always know what a local address is in an environment.
 * [andrey] I don't follow.
 * [tomislav] Exposes IP addresses of devices on the local network.
 * [andrey] …
 * [rob] I see a potential solution if security is the concern - would the use of public DNS servers by the API address your use case?
 * [andrey] We would prefer to use the user's DNS and not public DNS, because the latter would not be accurate. Can't always rely on public DNS services as they may be blocked. There are a number of issues here. Scanning of local network can be prevented or limited at the API level.
 * [oliver] can you explain the use case?
 * [andrey] Simple example is how it's used in uBlock Origin: checking if a domain name is an alias for a known tracker.
 * [patrick] What's a use case that shows why public DNS is unreliable?
 * [andrey] Implementing the uBlock Origin's CNAME blocking feature using Google DNS in China. Can't expect that every extension developer will run their own DNS over HTTPS server.
 * [oliver] With the DNS API, would you be able to handle CNAME masking, even without the blocking version of the webRequest API?
 * [andrey] The other thing we use with DNS is service discovery in our VPN extension.
 * [devlin] What kind of discovery?
 * [andrey] In the VPN extension we query DNS to figure out which backend server can be used at this point. Using public DNS services might not work due to blocking, but accessing user's DNS is more reliable.
 * [devlin] If we exposed the DNS service that's currently implemented in Chrome, would that address your use case?
   * https://developer.chrome.com/docs/extensions/reference/api/dns
 * [andrey] Yes, I think so.
 * [devlin]  And you don't need access to browser.mdns, correct?
 * [andrey] No, we don't need that.
 * [oliver] I don't fully understand. Could you not just do an HTTP request to find if the device is there?
 * [andrey] Point of DNS is that it's not centralized. If we do a fetch request, we need to point it somewhere. If we do that, the server could be blocked.
 * [oliver] Say you do a fetch request for 5 domains and you only get a successful request for 1, you know that 1 is unblocked.
 * [andrey] We would have to cascade our DNS resolution attempts.
 * [rob] Back to the security issue, the webRequest API already offers the IP address of the server that served the response. What makes this different?
 * [devlin] My recollection is that DNS exposes more information about the intranet the device is on. In enterprise environments, we allow admins to lock down resolution of HTTP requests, but not DNS.
 * [andrey] I don't see how it allows additional scanning. ? What if we limited by host permissions, for instance. Only resolve DNS request for domains for which you have host permissions.
 * [devlin] I would have to ask the security team. One the reasons I asked about mdns is that one is \*very\* scary.
 * [rob] mdns is different.
 * [rob] There's a difference between dns.resolve() in Firefox and Chrome. Would you consider adopting Firefox's signature before shipping dns.resolve from dev to stable release?
 * [devlin] what's different?
 * [rob] dns.resolve in Chrome returns an object with “address” and “resultCode”, Firefox may accept an optional additional object and returns an object with “addresses”, optional “canonicalName”, “isTRR”.
   * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/dns/resolve
   * https://developer.chrome.com/docs/extensions/reference/api/dns#method-resolve
 * [devlin] And they're both called “resolve?”
 * [rob] Yes.
 * [devlin] Dang. This API is also used by platform apps, so we can't change it without risk of breaking someone. If we can find a way to address this in a backwards compatible way, then I'm open to further discussion.
 * [rob] There is a way to have a backwards-incompatible signature.
 * [devlin] I am open to considering it.
 * [andrey] I will open a WECG issue.
   * https://github.com/w3c/webextensions/issues/570
 * (end of online+in-person part; the rest of the day continues in-person)


### Proxy API

[Issue 573](https://github.com/w3c/webextensions/issues/573): Inconsistency: proxy API

 * [andrey] Many extensions use proxy APIs but there are large inconsistencies between Chrome and Firefox. Firefox is more advanced but maybe not fitting with MV3. Firefox has proxy.onRequest that enables extensions to asynchronously respond with how a proxy should be handled. Chrome either has a limited declarative API, where one thing is missing. There is also an option to configure a PAC script, but the inconsistencies are still there. We could use the same declarative approach there if there was an option. I don't mind the API, as long as the capabilities exist. In Chrome there is only a bypass list. If there is a “no-bypass” list, i.e. inclusions and exclusions, then that would cover our needs. There is a popular extension SwitchOmega that tries to emulate the inclusions and exclusions list, and had to remove the feature from the extension.
 * [rob] Why?
 * [andrey] Removed the PAC script. I don't know why. Anyway, if we had a capability across browsers to specify the inclusion and exclusion lists, then we could use it.
 * [andrey] Extensions in Chrome use the PAC script, in Firefox proxy.onRequest
 * [devlin] So you're basically asking for the inclusion list or a new API?
 * [andrey] Yes.
 * [devlin] Adding support for an inclusion list seems much simpler.
 * [devlin] We're not deprecating the proxy API, but aren't adding much functionality to it. Open to inclusion lists.
 * [andrey] Is it possible to have similar API and support inclusion lists?
 * [oliver] There was recently a CL to add a bypass list to PAC scripts.
   *  https://chromium-review.googlesource.com/c/chromium/src/+/5227338
 * [andrey] PAC scripts is not an issue, can embed the bypass list there.
 * [oliver] So you're referring to cases where the PAC script is not used?
 * [andrey] Would be nice to have a common API so that we don't have to maintain two separate versions of extension code.
 * [devlin] In terms of finding a more consistent API, is the primary ask that the API have the same names and properties etc., or to add the features to Firefox that Chrome doesn't?
 * [andrey] Feature-wise, just inclusion list in Chrome, the other thing is a common subset of API in Firefox.
 * [tomislav] Hesitant because that would be the fourth way to specify a proxy. Not sure if there is more use in it.
 * [rob] The request is a declarative API. This would eliminate the need for proxy.onRequest. The proxy.settings API that we have applies globally without a filter. The requested declarative API can be more scoped.
 * [tomislav] Do you know why we did not support the declarative API back then?
 * [rob] Because it did not fulfill the full use case of proxy extensions.
 * [tomislav] And it does now?
 * [rob] With the addition of inclusion list, yes.
 * [andrey] Removing the old API would be undesirable because it is more powerful and may be needed in some cases.
 * [tomislav] We may need to remove some APIs eventually since we can't indefinitely maintain APIs when there are better ways of doing things.
 * [rob] Andrey, would you be open to writing a patch?
 * [andrey] Potentially, we can look at this.
 * [andrey] Would Apple provide a proxy API?
 * [david] We don't have plans to work on this.
 * [tomislav] Would you want to be consulted on API design?
 * [david] We will contribute as we see things opened.
 * [andrey] We need an issue. Who will open this and where?
 * [tomislav] We should have the API proposal opened in the WECG.
 * [andrey] We can look at this.
 * [rob] Are there parts of the chrome.proxy API that Chrome is considering to deprecate?
 * [devlin] Not at the moment.


### Browser specific namespaces

 * [devlin] To recap, we've discussed a number of times an idea that APIs that are Chrome specific should be exposed on chrome, whereas APIs exposed on browser are the reliable, cross-browser ones. I'm not in favor of this since previous attempts like prefixing in CSS have not gone well. Don't think it makes sense to use a prefixed API set.
 * [tomislav] Agreed. If one browser implements a specific namespace, that's fine. But how do we handle collisions in permissions or namespaces?
 * [devlin] Going forward, new APIs would be raised in the WECG where we can catch collisions early. Individual fields in APIs that are browser-specific simply be supported in some browsers and ignored in others. Incompatibilities in the same method (e.g. addSiteAccessRequest) should be discussed at that time.
 * [oliver] All browsers have at least one of the browser and chrome namespaces, there is history of adding private / non-standard APIs, and we don't hit the issue at the moment. May be premature to try and solve this.
 * [tomislav] So do we bring every new extension API in the WECG?
 * [devlin] Any (new) extension API should be discussed in the WECG. Might be worth documenting that the `*private` naming pattern is reserved for internal use.
 * [tomislav] E.g. dns API.
 * [devlin] These collisions happened before the WECG.
 * [devlin] There is one area that may be worth noting: ChromeOS often has Chrome OS-specific APIs for enterprise installed extensions. So far have not brought to the WECG because these are out of scope for the WECG, potential risk for collisions there. Not sure if we can do something there.
 * [andrey] Can there be a list of reserved namespaces?
 * [devlin] We (extensions) cannot dictate what is or is not exposed on the `chrome` global.
 * [andrey] I meant no secret namespaces.
 * [rob] Chromium, Firefox, and WebKit all expose the namespaces they implement publicly. Suggest that whenever we introduce a new namespace, we check to make sure there's no collisions.
 * [devlin] Whenever we bring something to WECG, we'll make sure there's no collision. Note that this wouldn't apply to other consumers of the chrome namespace, like ChromeOS (since these aren't usually WebExtension APIs).  We'd be sure to work with them to avoid naming collisions.
 * [rob] WECG would maintain a list of our namespaces. If Firefox or Safari introduces a new namespace, if we reserve it, then (e.g.) ChromeOS would not be able to use it. Browsers could regularly synchronize this list with their unit tests.
 * [devlin] How do we do that without WPT?
 * [simeon] Scripts that crawl browser source?
 * [devlin] Haven't seen a human-maintained system that's consistently up to date.
 * [tomislav] MDN?
 * [devlin] Good, but not perfect. I think we're all aligned that we're not going to try to interfere with each other. I have no objection to creating a list, but I do worry about our ability to keep it up to date and act on it.

Feature support detection

 * [andrey] Can we look at this from another step further. We're basically doing discovery of what's available and what's not, and that's not always reliable. Different browsers sometimes make things unavailable in different ways. Sometimes even in Chromium forks. Can there be a way to indicate availability of a given API in a consistent, cross-browser way? For example, supports() in CSS.
 * [devlin] Can you elaborate on why feature detection doesn't work?
 * [carlos] For example, detecting if there are features that don't work on the windows API giving the pairing of normal and private windows.
 * [timothy] On mobile on iOS, windows.create, windows.remove are not defined.
 * [] (...) a way of detecting whether APIs are supported.
 * [rob] Don't think this is that big of an issue. We have the conventions of throwing.
 * [carlos] Some browsers throw, some leave properties undefined. Maybe we can align more on the expected behavior when something isn't exposed.
 * [rob] And sometimes we have methods/events that are not undefined because extensions that expect them to be present break if they were to be undefined.
 * [rob] Similarly, a new method would report such inconsistent answers or offer a different source of truth. What would be the benefit of a new method to detect feature support?
 * [carlos] Point is that browser use different approaches
 * [devlin] And multiple methods for indicating whether something is supported within a single browser
 * [carlos] Exactly.
 * [devlin] Can generally assume it will be undefined if not available. But we can't always use that approach. For example, executeScript …
 * [tomislav] Are you actually asking for a more explicit approach, like CSS supports?
 * [carlos] Not exactly.
 * [tomislav] mdn/browser-compat-data keys can be nested in order to enable more specific queries.
 * [devlin] We already have some infrastructure for that in Chrome.
 * [rob] Tom was describing a way to have a standard identifier that could be used to query support. With the userscripts API Chrome will throw if the extension tries to call but doesn't have access.
 * [devlin] Specifically, if the extension has the permission but the user is not in developer mode.
 * [carlos] 3 errors: didn't request permission, isn't in developer mode, permission isn't supported.
 * [rob] I think we've discussed the problem in sufficient detail, would we be interested in pursuing this?
 * [devlin] Open to it.
 * [rob] We (Firefox) would be interested too, right?
 * [tomislav] Nods.
 * [simeon] Does Chrome support checking properties on an options bag that were introduced later?
 * [devlin] It depends on the API, but it's something we could add.
 * [devlin] I think we can say we're all generally supportive, and that a proposal is welcome.


### Issue triage

 * [Issue 12](https://github.com/w3c/webextensions/issues/12#issuecomment-942826300): request: allow to retrieve a frameID from an &lt;iframe> element
   * [devlin] We've already talked to it; short version was it got stuck and we need to talk with security about it.
   * [oliver] I'm assigned to it.
 * [Issue 91](https://github.com/w3c/webextensions/issues/91): Proposal: scripting.executeScript without specifying tabId
   * [devlin] The request here is to specify only a frameId for certain methods like executeScript.
   * [rob] How about documentId?
   * [devlin] Specifying document ID or non-zero frameID are feasible on the browser side.  We can't do frameId 0 because that always maps to "the main frame" in a tab and is repeated (goes into history of that decision)
   * [rob] Frame ID 0 are ambiguous, but non-zero are not, and globally unique now, correct?
   * [devlin] Correct.
   * [rob] In Should we specify that behavior?
   * [devlin] Are they unique in all browsers? They are in Chrome.
   * [rob] In Firefox too.
   * [timothy] Safari too.
   * [timothy] In Safari the main frame has a unique frameId, and if passed instead of 0, it would also work.
   * [devlin] How would you know the unique frame ID?
   * [timothy] You wouldn't.
   * [carlos]  Add a method to retrieve the frameId for the top level.
     * Request for unique frameIds: https://github.com/w3c/webextensions/issues/90
   * [devlin] Would be hesitant to do that for main frame since we know extensions rely on frameId 0 today
   * [oliver] The implicit assumption here is that if you had a way to specify frameID, you would be able to execute in a popup since this already works. Is that the case?
   * [devlin] Declared content scripts run in popups, I don't see issues from the permission perspective.
   * [oliver] Same in Firefox and Safari? Being able to run content scripts in frames in popups
   * [timothy] Yes.
   * [devlin] A couple different use cases here. Iframes in popups. In that case you don't need the main frame. To message the main frame of a tab, would prefer to revisit ideas about contextID rather than using frames.
   * [carlos] Another use case is replacement for postMessage API across frame boundaries.
   * [devlin] We should be trying to unblock, but have covered 3 different cases. In the issue of focusing on 91, let's proceed with the assumption that we're not changing frameIDs.
   * [devlin] In favor of supporting non-zero frameIds and omitting tabId, or any documentId .  Request here is not requiring a tab ID.
   * [rob] &lt;missed in minutes>
   * [tomislav] You need a magic number to mean ignore tab ID.
   * [rob] Would need to make non-main-frame frame IDs globally unique.
   * [devlin] Need to make that assumption. -1 doesn't specify where the frame is.  So don't need to specifically add -1 as a tab ID since it already has to be unique across multiple potential contexts (e.g., multiple popups)
   * [rob] Specifying -1 means we only need to look at certain contexts
   * [devlin] That's only an optimization, doesn't allow us to avoid the uniqueness guarantee. If impl doesn't guarantee unique IDs across documents, that doesn't address the issue.
   * [rob] Agreed. So to recap, support any of the following combinations:
     - require tabId + frameId 0
     - Non-zero frame ID (tabId not required)
     - documentId (tabId not required)
   * [devlin] I will write up a comment in the issue to outline what we've discussed.
   * [carlos] Should we create issues in browser bug trackers?
   * [devlin] Sure.
 * [Issue 34](https://github.com/w3c/webextensions/issues/34): Request: high precise timer
   * [oliver] Seems to be two parts to this request. 1) smallest amount of time for a repeating alarm 2) potential delay when an alarm fires. Note: this issue says 1 minute minimum. Chrome recently changed to 30 seconds.
   * [rob] Is there any reason why browsers wouldn't want to allow 1 second resolution?
   * [oliver] This resolution is different between packed and unpacked.
   * [rob] Firefox allows millisecond level resolution, it's not fully intentional.
   * [timothy] Currently safari is 1 minute. Would be supportive of changing to 30.
   * [oliver] What about 1 second?
   * [timothy] That would likely work.
   * [devlin] Historical reason for 1-minute timer is lot of trashing in the timer; introduced throttles in extension and web to reduce performance impact.  We saw a quantifiable performance gain when we increased the minimum to 60 seconds.  We later reduced this to 30 seconds (for service workers) because 60s and 30s aren't that different from a performance perspective, but 1s or lower _is_ significantly more detrimental. Use setTimeout for anything lower.
   * [andrey] ? Talking about a need from a very small number of extensions. Example in the thread was tracking time in tabs.
   * [rob] An extension can combine alarms and setTimeout to accomplish this goal.
   * [andrey] Is it reliable?
   * [oliver] You could have a 30 second alarm, then have a setTimeout every second to do the time tracking.
   * [oliver] A comment suggesting that it may not work as expected as the Alarms API may have up to a 30 second delay.
   * [devlin] Not what we would expect – that should be a very rare case.  It may happen, if e.g. the OS is trashing, but then there's nothing we can do to help.
   * [patrick] And it wouldn't be fixed by having a high precision timer.
   * [devlin] Indeed.
   * [patrick] My mental model is that alarms is for making sure you can run at some time in the future. It's not for exact times.
   * [devlin] Exactly.
   * [timothy] I'll update Safari's implementation to lower from 60 to 30 seconds.
   * [rob] Let's close the issue.
 * [Issue 26](https://github.com/w3c/webextensions/issues/26): Features exposed by both a browser's UI and the WebExtensions API should behave the same
   * [devlin] Recap, issue requests that tabs.create() behaves the same as clicking the new tab button in the UI. Tomislav left a comment expressing concern about linking UI functionality directly to extension APIs. I agree, and would suggest we close the issue.
   * [oliver] I think we all generally agree that tabs.create should open the same new tab.
   * [patrick] That we shouldn't be introducing new behavior for no reason.
   * [devlin] Agreed.
 * [Issue 244](https://github.com/w3c/webextensions/issues/244): Better status labels for issues
   * [rob] Let's close it. It was accidentally re-opened.
   * [carlos] Agreed, let's close and move on.
 * [Issue 272](https://github.com/w3c/webextensions/issues/272): Proposal: browser.alert.create()
   * [devlin] Do you still need this if we were to support action.openPopup
   * [carlos] Created this for other people requesting this functionality. I don't personally have much need for it.
   * Tabled for later.
 * [Issue 301](https://github.com/w3c/webextensions/issues/301): \_execute_action, \_execute_browser_action and \_execute_page_action commands
   * [tomislav] This is a bug, has been fixed in Chrome. We have a bug on our issue tracker. This is not a spec issue.
 * [Issue 382](https://github.com/w3c/webextensions/issues/382): Provide a mock way to test upgrade extensions from the extension store
   * [patrick] Store behavior is out of scope.
   * [rob] Yes, but this is not about the store, but testing generic update behavior. Currently documented on a per-browser basis. I think that we can close the issue though.
   * [david] We've heard requests for this. We intend to explore it.
   * [oliver] Would be nice to have an API method to simulate an extension update.
   * [devlin] Can't put that on a button. Drag and dropping a CRX in Chrome also supports this.
   * [oliver] Yeah, a bit of a clunky process, though.
   * [devlin] I think we're all agreed that the extension store aspect of this is out of scope, but what do we want to do with this?
   * [patrick] I'll reply & close out.
 * [Issue 326](https://github.com/w3c/webextensions/issues/326): Any plans to implement "tab" context menu?
   * [david] Not yet in STP.
   * [timothy] Right, implemented but not shipped yet.
   * [devlin] It is currently tracked in Chrome, personally supportive, may work on it in the future.
   * [rob] Thanks for the clarification, I've labeled the issue.
 * [Issue 279](https://github.com/w3c/webextensions/issues/279): User scripts in Manifest V3
   * [devlin] User Scripts API – this  is implemented.  Close it?
   * [andrey] Not implemented everywhere.
   * [rob] I have a comment at the top that I update whenever there are changes to the userScripts API proposals.
   * [devlin] I'll add a comment & add the implemented: chrome label.
 * [Issue 250](https://github.com/w3c/webextensions/issues/250): Current permission system and API design forces developers to create inefficient extensions
   * [devlin] Doesn't seem like a short issue we can quickly triage. Next steps?
   * [andrey] Ask Anton to break up the issue?
   * [patrick] I'll comment.
 * [Issue 101](https://github.com/w3c/webextensions/issues/101): META: background scripting
   * [carlos] Can be closed now, many of the issues are tracked separately.
 * [Issue 138](https://github.com/w3c/webextensions/issues/138): Proposal: let content scripts listen for event chrome.runtime.onUninstalled
   * [devlin] I understand the purpose and don't know if we'd do it. Generally we want to limit the amount of information we expose to the render process. There are workarounds for not having this feature, but they're not ideal.  Oh, take that back, this would be fine since it's only exposing _that_ extension, not any extension.
   * [rob] No new capability here. Extensions can already detect it: APIs become inaccessible, which can be detected.
   * [devlin] Agreed
   * [andrey] Could introduce a new error type that would be thrown in the page to detect that an extension has been removed
   * [devlin] Prefer the proposal as described modulo naming.
   * [patrick] Sounds like we're open to discussing, yes?
   * [devlin] Yes.
   * [devlin] Would probably want to use something like onUnloaded to catch other cases like the extension being disabled.  We're also looking at the related onLoaded event.
   * [timothy] I'd be supportive of this.
   * [andrey] Would you also support an event when the SW is unloaded?
   * [timothy] I wouldn't want to. It will wake up next time you send a message. Doesn't seem eventful.
   * [andrey] Naming is unclear then.
   * [rob] Should fire when the content script context is unloaded, not tied to extension unload.
   * [devlin] Next steps: conceptually supportive; need a concrete proposal.
 * [Issue 466](https://github.com/w3c/webextensions/issues/466): Proposal: allow storing metadata in a static ruleset
   * [andrey] Would like to store additional data in the DNR file for every DNR rule. Rules aren't written by hand, they're derived from filter lists. Chrome doesn't currently error when additional data is included, but ideally we would have a formally supported way of adding this data.
   * [andrey] Initial motivation for this proposal is fasttrack review by CWS. Extension updates are fast tracked when the only changes are DNR static rules changes. We need to be able to maintain the association between the initial DNR rule list and the modified list updated post-install.
   * [rob] Why do we need a new API for this?
   * [andrey] Not a new API.
   * [rob] Why not have this data in a separate file and have CWS consult that during review?
   * [devlin] Untenable.  We need to be able to detect DNR-only changes in an automated way and having other arbitrary files change is incompatible with that.
   * [andrey] Cost to fetch this file on every extension every day is prohibitively high.
   * [devlin] Can you address this through a JSON comment?
   * [simeon] JSON doesn't support comments.
   * [devlin] We do in Chrome.
     [oliver] Could use “\_comment” as a key.
   * [devlin] Would that work in Firefox? Andrey's comment indicates that an unknown field in a rule causes a rule to be ignored.
   * [devlin] Sounds like we have 3 different behaviors. (1) We error and refuse to load the extension. (2) We ignore the rule. (3) We parse as much of the rule as we can.  We're agreed that (1) is bad and goes against the direction we've been moving with accepting unknown keys.  It sounds like FF does (2) and Chrome does (3).
   * [timothy] Safari follows behavior 3.
   * [andrey]
   * [devlin] There are cases where either might be desirable. Adding a new condition that narrows a rule, and the condition matches too much content in browsers that don't support the new field.
   * [rob] I'm willing to consider accepting otherwise valid rules with unknown keys.
   * [devlin] Could have a well known field we all choose to ignore.
   * [rob] E.g. “comment”
   * [oliver] I like “metadata”, but that name does imply it's, well, data, not a comment.
   * [andrey] “\_comment”?
   * [devlin] A \_ prefix normally means reserved by the browser. That's the opposite of this case.
   * [carlos] Someone suggested “userdata”
   * [timothy] Does not like “userdata.” In favor of “metadata” or “comment”
   * [devlin] suggest “comment”.  "metadata" seems more likely to be a "real" part of the rule considered by the API.
   * [patrick] If someone uses runtime.getManifest in Firefox today, would “comment” be included?
   * [rob] No, that property would be discarded.
   * [devlin] Out of scope.
   * [rob] Relevant in that it's JSON normalization behavior.
   * [oliver] `_comment` is a common convention.
   * [patrick] FWIW, I have seen `__comment` (double underscore)
   * [rob] Is the value always a string?
   * [andrey] Anything would work; if a string we can serialize its value.
   * [simeon] Does the key matter?
   * [devlin] No. Just trying to understand ecosystem conventions.
   * [oliver] Note that this field could be abused to load code. Also note that DNR rule files may become very large.
   * [andrey] That's somewhat unavoidable.
   * [oliver] You may have lots of DNR rule files in your extension, but you only need the metadata for the rules that are enabled. Another implementation could allow you to dynamically fetch this data.
   * [devlin] We should work with our respective stores on this.
   * [devlin] I see you have a couple of examples of the comment/metadata. Are these representative?
   * [andrey] yes.
   * [devlin] Then it isn't scaling the size significantly.
   * [andrey] I'll add a comment.
 * [Issue 441](https://github.com/w3c/webextensions/issues/441): Is there any interest in creating extension-specific test harness like the WPT one?
   * [devlin] Is there any interest? Yes. But this is just a tracking bug. Patrick, thoughts?
   * [patrick] I'm not a big fan of tracking issues. If this was my repo I'd close out.
   * [simeon] I'm comfortable closing.
   * [oliver] I'll close it out.
 * [Issue 58](https://github.com/w3c/webextensions/issues/58): API to get organizational domains using public suffix list
   * [andrey] Duplicate.
   * [patrick] Discussed 231 yesterday. Technically this is a duplicate of that.
 * [Issue 87](https://github.com/w3c/webextensions/issues/87): Specify declarativeNetRequest rules
   * [devlin] Timothy, how accurate is this?
   * [timothy] There are still some differences. We convert urlFilter into regExps under the hood.
   * [timothy] I'll update and close out.
 * [Issue 467](https://github.com/w3c/webextensions/issues/467): Proposal: change the static ruleset JSON structure (DNR format)
   * [andrey] Current structure of the JSON file doesn't allow adding additional metadata about the ruleset.
   * [devlin] Right now we're handling rulesets though the declarative_net_request key in the manifest. Could also see that data being handled in the file itself. Do you see a strong reason for having this information in the ruleset file itself rather than in the ruleset section of the manifest?
   * [andrey] Not a high importance issue, but canonically you tend to put structured data in the file.
   * [devlin] My intuition is that it's too late to tell developers to make this change and tell developers to move. We could perhaps accept both an object and an array. If there's no driving reason, questionable as to whether we should.
   * [rob] Why not add a dummy rule containing this data?
   * [andrey] Broader issue is that if we ever need to extend this spec it would be easier to do with a top level object than an array.
   * [devlin] If we were starting from scratch I'd do this, but given that we're not I think this is low on the stack rank. I'm inclined to close this and explain that we'd be open to revisiting it if/when there's a concrete need.
   * [rob] Question about metadata. You can currently fetch it.
   * [andrey] It's expensive to fetch a JSON file.
   * [rob] There's no API to expose the comments.
   * [andrey] Ah, I see. Yes, there's no need for an API.
   * [rob] My expectation is that we'd ignore the unknown rule.
   * [devlin] I'll write a very nice comment & close out.
 * [Issue 179](https://github.com/w3c/webextensions/issues/179): browser.secureStorage: Document user-gesture requirements
   * [oilver] This was a proposal in the proposals directory. This was about editing that, but that isn't going anywhere at the moment. I'm inclined to close it.
 * [Issue 449](https://github.com/w3c/webextensions/issues/449): Provide way of handling unsupported DNR rules
   * [andrey] sammacbeth had some good additional information on this.
   * [oliver] Yeah, that was added at TPAC.
   * [andrey] Is the intent to have the same behavior in every browser?
   * [oliver] I believe so. As well as having consistent behavior, it would be nice if there was a programmatic way of determining if rules in your ruleset weren't loaded.
   * [rob] I think the intent of DNR was to catch invalid rules during development.
   * [oliver] Yes, but there are cases where a rule may only be supported in certain versions of a browser. You may want to detect and react to those situations.
   * [simeon] Next steps?
   * [andrey] Seems that the only difference is that Safari ignores duplicate rule IDs while others don't.
   * [timothy] Is that true? That doesn't sound right.
   * [andrey] That's what Sam's test results show.
   * [andrey] Since Chrome's behavior is the most strict, what happens if we push an update with invalid rules and it somehow makes it past review, what happens?
   * [rob] In Firefox we try to avoid failing to load the extension if there is a non-fatal error.
   * [andrey] Would be generally better if Chrome didn't error. Devlin?
   * [devlin] I think we're all collectively moving away from hard erroring. Is there a reason we would expect extensions to have duplicate rule IDs, or is the concern just that fatal errors are scary?
   * [andrey] Just that fatal error is scary.
   * [devlin] Understood.
   * [oliver] Do we see a need for isRuleSupported()?
   * [timothy] I'm supportive.
   * [rob] Same.
   * [devlin] Oliver, add a comment and if we don't have a crbug create one?
   * [oliver] Yes.
     * https://issues.chromium.org/330579934
 * [Pull 562](https://github.com/w3c/webextensions/pull/562): Browser specific “needs triage” labels
   * [rob] Was approved by all, just include the “engine” word.
   * [simeon] Merged the suggestion.
   * [rob] Merged PR.
 * [Issue 440](https://github.com/w3c/webextensions/issues/440): Proposal: add dictionary operations to DNR modifyHeaders
   * [carlos] Currently there's no way to easily modify existing headers, so developers strip them.
   * [devlin] We discussed this at TPAC 2023 and Ad Filtering Dev Summit. Unlikely to do this due to additional complexity and security / performance risks.
   * [andrey] What risks?
   * [devlin] In order to do this, we have to parse and modify rules as described.
   * [andrey] You already parse them?
   * [devlin] In “the browser” as a whole, yes, but not where we're executing rules. Parsing is expensive and we can't do it with untrusted data.  So we'd need to do this asynchronously in a sandboxed process, which then has performance hits.  And this is a lot of complexity.
   * [rob] I'm worried about the complexity of 440 for general cases. Recognize the value of specific headers such as Content-Security-Policy, but think that a dedicated API (not necessarily part of DNR) would make more sense.
   * [timothy] No objection to closing.
   * [devlin] I will close nad add a comment
 * [Issue 439](https://github.com/w3c/webextensions/issues/439): Proposal: Add filter for DNR modifyHeaders
   * [andrey] This implies that there's a modification using a regular expression. Given how sensitive browser reps are to performance, would that also apply to
   * [devlin] I think we're supportive, will add a label.
   * [timothy] Would likely be able to do this as well.
   * [andrey] I assume these would count against regexp rule limits?
   * [devlin] Ideally we'd avoid introducing additional constants (there's already too many), so yeah, maybe applied to the existing regexp limit.
   * [rob] What syntax engine should we support?
   * [devlin] We'll use RE2
   * [timothy] We would probably use something (closer to) the JS RegExp engine.
   * [rob] Same in Firefox - JS RegExp.
   * [andrey] Do you have a limited RE engine in Firefox?
   * [rob] We could have one if we wish.
   * [rob] I'll add a comment.
 * [Issue 342](https://github.com/w3c/webextensions/issues/342): Create an API proposal template
   * [devlin]  Can be closed. We already have one.
   * [rob] I'll close, fixed by https://github.com/w3c/webextensions/pull/543.
 * [Issue 191](https://github.com/w3c/webextensions/issues/191): Should background pages be allowed to navigate
   * [timothy] This is navigating to another extension page.
   * [devlin] What happens when the page wakes up again?
   * [timothy] We load the background page defined in the manifest.
   * [rob] I think we can do this async.
   * [timothy] I'd be fine blocking navigations.
   * [rob] I'll put follow-up:safari on it.
 * [Issue 457](https://github.com/w3c/webextensions/issues/457): Proposal for runtime.onConnectNative Event
   * [timothy] Chrome has this, it's just not documented.
   * [patrick] It's a dev channel feature, not in Stable.
   * [oliver] I believe the behavior of this was odd & not in a good state to ship.
   * [devlin] Biggest issue is that there's not a great way for a 3rd party binary to know how to communicate with Chrome. As far as I recall at least. A 3rd party binary doesn't necessarily know where Chrome is on the system, nor the profile directory to use. There isn't a good way for another binary to know which Chrome to communicate with.
   * [carlos] Can an app not try the default browser?
   * [andrey] No. Inaccurate assumption.
   * [oliver] is the goal to get this implemented everywhere, or to just run it by the group for feedback because you're going to implement it.
   * [timothy] Would be fine with me.
   * [devlin] Have you seen the chrome impl?
   * [timothy] Not yet.
   * [devlin] I'd ask that you match that impl or discuss how to modify it so we match up. There's a possibility that we may add this in the future, so we don't want to get into a situation where we have a major divergence.
   * [andrey] This proposal seems reasonable for mobile extensions. If Firefox or Edge ever add cross-app support on Android.
   * [devlin] I'll also add a comment.
 * [Issue 272](https://github.com/w3c/webextensions/issues/272): Proposal: browser.alert.create()
   * [devlin] is this solved by openPopup()?
   * [simeon] alert is especially useful for debugging purposes.
   * [oliver] developer experience of trying to show another popup is weird.
   * [rob] A prompt could also have a strong keepalive.
   * [devlin] There are a couple of things I'm concerned about. We've largely been moving away from prompts & dialogs on the web as there are a lot of downsides to them. Specific concern with prompts in background contexts is that they render in weird places and it's unclear it's associated with an extension. We've seen them used in phishing, etc. There is a concern that the user doesn't know where the prompt is coming from. There are things we can do to mitigate it, but at that point we're opening a popup.
   * [rob] The advantage of this API is that there is a clear signal for a request for input from a user via prompt() or confirm(), i.e. make it focusable.
   * [tomislav] Whatever we want to support, we could do so with a popup.
   * [carlos] openPopup API might work well for this use case; is that available in Chrome?
   * [devlin] We had some security issues with that API, but I think we've worked through them.
   * [rob] With these specific methods, the UI and prompt can be consistent with the native platform. In the case of Android, openPopup() is effectively a tab. With a dedicated API, we could potentially have more platform appropriate UI (e.g. using a notification on mobile).
   * [devlin] Following device standards is a good point, but I don't think it persuades me for this case.
   * [oliver] Keepalive that Rob mentioned could keep the background alive until the user resolves the prompt. With a popup, you'd have to implement custom logic to handle the message passing.
   * [tomislav] Requiring the background to stay alive is a downside from my point of view.
   * [rob] Not a blocking aspect of the design.
   * [oliver] The web has been moving away, but I'm not sure it's fair to say browsers have been moving away.
   * [tomislav] Respectfully disagree
   * [patrick] Is this about a UI surface or the web API's behavior.
   * [timothy] I'm in favor of a dialog or alert feature. Don't think it needs to share behavior with the web alert() method.
   * [devlin] I think we're aligned that we wouldn't expose this as a synchronous API.
   * [david] Seems like reusing things like openPopup would make sense.
   * [rob] Status? I'd lean towards neutral.
   * [devlin] We're not aligned in Chrome
   * [tomislav] Firefox is not aligned either.
   * Follow up to discuss more.


### Wrap Up

 * Action items – any in addition to those that are in the rest of the docs and meeting notes?
 * [?] When will the notes get shared publicly?
 * [david] Let's aim for publishing by the next public meeting.
 * [devlin] We can merge the in-person minutes into the public ones.  I think Rob volunteered to do that
 * [rob] Assuming everyone reviews and approves, I can take on the final merge.
 * [devlin] Other action items for the group before we meet again in person? &lt;silence> Okay!
 * [devlin] How do folks feel this went?
 * [simeon] Very well.
 * [patrick] Great.
 * [timothy] Good
 * [rob] How are we on remote friendliness?
 * [timothy] Mic situation was a little tough. Handheld mics significantly improved things.
 * [devlin] Impression from the point of view of extension devs?
 * [andrey] Very productive.
 * [richard] Felt like a good balance of how we spent our time.
 * [carlos] Would like to do deep dives outside of our scheduled time.
 * [richard] Liked issue triage.  Given how much we covered in 2 hours, if we did that for an hour a month, we'd be able to stay on top of issues.
 * [devlin] I think there's appetite for that.
 * [devlin] Andrey and Carlos, given the amount that you had to travel, was it worth your time?
 * [andrey] Was a good use of our time, next time Europe would be nice.
 * [tomislav] Mozilla has a Berlin office.
 * [timothy] We also have Cork and London offices.
 * [devlin] Any other feedback on format, how it went?
 * [tomislav] How did this compare to TPAC?
 * [richard] TPAC 2023 was ad-hoc. It was nice to have structured time.
 * [tomislav] And it was a bit broader, given the other groups.
 * [carlos] At TPAC it was hard to find a place to actually meet.
 * [simeon] I think TPAC room issues can be addressed. This event demonstrated that we can easily consume 3 days of meetings.
 * [tomislav] 4 days would be better; traveling across the atlantic for just 3 days is a bit little.
 * [patrick] Would also like to do 4 days. 3 makes the rest of the work week a bit weird.
 * [oliver] Also wonder about starting on Tuesday rather than Monday.
 * [david] I think we initially thought we'd do Tuesday - Thursday, but room was booked. Agree that 2 normal days at the end of the week makes those work days … odd.
 * [rob] I'm okay with lengthening the day if we need the time for it, but also appreciate having some personal work time.
 * [devlin] Did the individual sections work well?
 * [carlos] Public sessions weren't well communicated in the community group.
 * [andrey] In the future we could ping the issue?
 * [devlin] I did.
 * [rob] We emphasized that it was an in-person meeting. Maybe lean more into remote participation?
 * [devlin] We also want to make sure we have in-person time, since it's much more efficient and is the reason we're traveling to do this
 * [tomislav] agreed
 * [rob] Deep dives – I didn't feel there was much difference between early session and the in-person sessions.
 * [devlin] I suspect that if we had more remote people that wanted to participate it might have felt different. It was less about being private and more about being fast communication.
 * [rob] Agreed.
 * [devlin] Thanks everyone for participating.
