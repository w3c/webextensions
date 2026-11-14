# WECG TPAC Oct 28, 2026


## Agenda

https://github.com/w3c/webextensions/wiki/2026-TPAC-Coordination#wednesday
(all times UTC)

 * Breakout session: Integrating WebMCP into WebExtensions - 14:00 - 15:00
   * 5 min: Introductions, scribe, ground rules
   * 10 min: WebMCP primer (WebMCP spec contributor)
   * 10 min: How extensions integrate with agents today
   * 30 min: Requirements discussion (questions 1–5)
   * 5 min: Summary, owners, follow-up issues


## Attendees

 * Patrick Kettner (Google Chrome)
 * Oliver Dunk (Google Chrome)
 * Dominic Farolino (Google Chrome)
 * Simeon Vincent (Invited expert)
 * Devlin Cronin (Google Chrome)
 * Tim Judkins (Google Chrome)
 * Mukul Purohit (Microsoft)
 * Johann Hofmann (Google Chrome)
 * Kiara Rose (Apple)
 * Timothy Hatcher (Apple) [Remote]
 * Rob Wu (Mozilla)
 * Tomislav Jovanovic (Mozilla)
 * Kenneth Christiansen (Intel)
 * Anssi Kostiainen (Intel)
 * Benjamin Bruneau (1Password)
 *
 * (and many others who were not introduced)


## Notes

Breakout session [Integrating WebMCP into WebExtensions](https://github.com/w3c/webextensions/wiki/2026-TPAC-Coordination#-integrating-webmcp-into-webextensions-).

The current draft of the [WebMCP specification](https://webmachinelearning.github.io/webmcp/) allows websites to register [tools](https://webmachinelearning.github.io/webmcp/#intro) that an [agent](https://webmachinelearning.github.io/webmcp/#agent) can discover and invoke.
Extensions are currently one of the main ways that third party developers bring agentic features into web browsers. Such extensions work by scraping the DOM, generating an accessibility tree based on the DOM, capturing screenshots of page content, or driving the page through debugging and automation interfaces. WebMCP is an attractive alternative for these extensions, as it could provide a structured, site-sanctioned alternative.
This session aims to collect requirements from extension developers and browser vendors, and to check those requirements against WebMCP's current design. Questions we plan to work through:

 1. **Consuming site tools**
   * Should extensions be able to enumerate and invoke a page's tools without injecting a content script?
   * Are any social considerations needed to expose `navigator.modelContext` to `ISOLATED` world content scripts?
   * Would a dedicated extension API add sufficient value beyond calling the web API from the page?
 2. **Providing tools**
   * Should extensions be able to expose their own tools to the browser's agent?
   * Should extensions be able to expose their own tools to websites?
   * How does this relate to the iframe and embedding discussions in WebMCP? Are any design changes necessary to cover both use cases?
 3. **Permissions and trust**
   * What (if any) permissions should gate an extension's access to WebMCP tools?
   * Is a new permission warranted?
   * How (if at all) are users informed when an extension invokes a site's tools?
 4. **Lifecycle**
   * How do event-driven background contexts (service workers, event pages) interact with tool registration, discovery, and long-running invocations?
   * Which events do extensions need when a page's tools change?
 5. **Gaps**
   * What other use cases should be considered before stabilizing the API design?

This is a community discussion, not a group meeting. We especially want to hear from extension developers building agentic or automation features, WebMCP spec contributors, and browser engineers working on both Web and WebExtensions platforms.

**Goal(s)**: A shared list of extension use cases and requirements for WebMCP. For each item, identify whether it should be integrated into the WebMCP specification, WebExtensions specification, or both. Identify owners for any follow-up issues.

 * (requested consent for AI transcript; nobody objected; the meeting minutes below are the hand-curated notes as usual)
 * [simeon] [Administration notes on the session.] I wanted to start with a brief overview of the API surface and capabilities of WebMCP. Can someone more familiar with the spec take a shot?
 * [dominic] WebMCP is an API to let devs expose chunks of functionality as machine readable tools so that an agent or machine can activate the behavior. We currently have a registerTool function; can be called from iframe, all tools contribute to overall tools surface area. Extensions currently do not have a dedicated API, and currently use a content script to run in the page, call `getTools()`, feed the tool data back to the model and then interact with the site.
 * [simeon] Sorry, I specifically want to touch on the API surface; currently 3 methods `registerTool()`, `getTools()` and `executeTool()`. 3 events: `ontoolchange`, `ontoolactivated`, `ontoolcancel`. Major concepts are “tools” that are essentially capabilities that pages expose and “agents” that use those tools to perform actions. Two kinds of agents: browser agents and “in-page” agents. Extensions can do stuff today, but requires injecting content scripts in pages and monkey-patching APIs, which is not ideal.
 * [dominic] Extension access currently bound to origins; tools cross origins; what would an API look like that looks like a tool, `getTools` and talks like getTools, but has privileges beyond the origin rules.
 * [simeon] Imagine that we don't give extensions access to all URLs.
 * [dominic] So tool permission without needing content script in all pages.
 * [johann] From the privilege perspective, should be exactly the same as top-level frame, right?
 * [dominic] WebMCP can expose a tool via a cross-origin iframe.
 * [johann]
 * [dominic] We have a permission policy for tools. Would propose that extensions have an API that allow extensions to come into the role of a trusted agent. Question of when we want a separate tools permission (WebMCP tools only), what motivates that view? If you want WebMCP tool access to a site. Assume you'll need additional capabilities.
 * [devlin] Unlikely you're going to be able to solve or address many use cases without access to the page. Even if we could do this without giving content scripts or other APIs, don't think from a user facing or security model for extension there's a fundamentally different security stance that we'd take from host permissions. Host permissions augment extension capabilities by granting site access to other APIs. For example, content scripts API + host permissions allows you to inject scripts onto that origin. With WebMCP, even if you only have access to the tools exposed by WebMCP, we don't know as the browser if those tools access sensitive data, if they read/write, etc. It's beneficial for extension developers to take a CSP-style approach to limit your own capabilities, but doesn't fundamentally change the access that the extension has.
 * [dominic] Sounds like you doubt the utility of a tools-only permissions.
 * [devlin] In the limit, can't provide guarantees as a browser about what can/cant be done. That doesn't mean there's no benefit. Most actors want to do the right thing. Good actors will take advantage of that, but it's not a true security boundary.
 * [dominic] Sounds like we could introduce a tools only permission tomorrow, but it wouldn't be very useful. We'd be building for a time in the future where you can claw back access to a site.
 * [devlin] From a security model point of view, not a boundary, but a useful signal and tool to help encourage good behavior. Less hurdles for an extension developer. Depending on contents/capabilities we expose in the future, may become more necessary.
 * [johann] Doesn't it make sense to limit access to this?
 * [devlin] Prior art: cookies API. Useful to limit access for a specific use, but not itself the only way to access this data. Similar here. Don't have any guarantee about what WebMCP tools access data.
 * [johann] Within the powers of what sites choose to give you.
 * [devlin] Need to account for sites that don't adhere to these practices.
 * [johann] Odd to voluntarily
 * [patrick] Is there anything stopping a content script from registering a WebMCP tool today? An extension could register a malicious WebMCP tool on a bank site and another extension could consume that without realizing it wasn't a blessed capability.
 * [johann] What you're saying is content scripts are powerful and scary. That's definitely true. Practically speaking, might be a mistake to say we hand out content script access to people requesting tool access.
 * (discussion interrupted)
 * [anssi] I'd like to bring us back to the agenda - the requirements gathering. Kenneth, can you speak to your experience with WebMCP
 * [kenneth] We've built MCP tools, WebMCP tools, custom bridges. We've been polyfilling thing ourselves, which works but may be incompatible with multiple other extensions trying to do the same thing. Would prefer not to rely on our custom solutions.
 * [anssi] You opened a couple issues on WebMCP recently. Can you speak to any of those.
 * [kenneth] Happy to speak to it, but don't want to dominate the discussion.
 * [anssi] Has anyone done prototyping?
 * [khushal] Not myself, but remember someone who did create an extension that tried to inject tools in the site (e.g. convert to markdown). Worry is how to register tools without colliding with the site itself.
 * [anssi] Possible logistics question: WebMCP editors, do you see these extensions features integrated into the spec itself?
 * [dominic] My understanding based on previous conversations with Chrome team members is that we're making good progress on the extensions spec. Can see including it in ours initially and in the fullness of time moving it into the WebExtensions spec. … What is the bar for introducing a new extension API?
 * [tomislav] Candidates for new APIs that can be done in a hacky way usually target performance or security gains. Those are usually good candidates for new APIs. Seems like it could be a good candidate to reduce performance impact of custom solutions.
 * [devlin] We add APIs as ergonomic improvements regularly. Bar is basically “would it be useful?” Looks like the answer is yes here. For this, I'd probably lean towards prior art for extensions to changing how web APIs work. There's an existing way to get tools. There's an existing way to get cross-origin tools. If the extension is suitably permissioned, we can bypass those restrictions for the extension. Reusing existing API shapes instead of introducing an extension API is preferable where possible. I'd lean us towards that rather than having a new “browser.webMCP” case just to execute those tools. To be clear, I see a benefit to exposing an API and think there's a security benefit, it's just not a security boundary.
 * [johann] We have some consideration for something called native agents. Special mode not accessible to the page. Cross-origin restrictions are in place to protect the page itself.
 * [devlin] Can bikeshed on the specifics later. Having an opt in likely makes sense. My intent is to avoid duplicating API surface. Having a way for an extension to indicate it specifically wants permissions for this makes sense. The question is what's the right way to approach this. Do we do it as an extension (sorry) of the web API or do we do it through a custom extension API. For example, we don't want a `browser.fetch` api. That's hard to do right. This WebMCP case is similar.
 * [johann] What about cookies. Historical mistake/artifact?
 * [devlin] Browser namespace has a lot of things that are distinct from the extensions API. Cookies gives you access to cookies for different sites. If we hypothetically had tool management exposed to extensions (register, tweak tools), I'd expose that on `browser`. If we're talking about slightly tweaking the behavior of `getTools`, makes more sense to tweak the existing API.
 * [oliver] If you have multiple tabs open to the same origin, are those tool names unique across different tabs?
 * [dominic] They're scoped to a document.
 * [oliver] If we expose a getTools that allowed extensions to get all of the tools for a given origin, how would we handle the per-document tools?
 * [dominic] Moving towards a model to require tool provider, e.g. accessing through `iframe.contentWindow`. Is there an obvious page that an extension API would act on? Say getComposedPath in fetch, how does that work?
 * [devlin] Uses the calling context. For something like this, we'd need the extension to specify the calling context where the tool would execute. We've chatted in the past about whether it makes sense for a web service worker to handle an extension tool invocation, even if it is not open (e.g. Gmail). We would need to identify that context that we can use on the extension side.
 * [dominic] In the non-worker case, I can use windowProxy to call the tool. How does that work in workers for extensions?
 * [devlin] Could do something like require a documentId in the extension call.
 * [dominic] What about being able to call a tool in a shared worker?
 * [devlin] Possible today?
 * [dominic] No, but interested in making it possible. … Model we're moving to is having a native-agent-exposed ID for each tool in a JavaScript context.
 * [devlin] If that's how we'd do it for a browser native agent, we could likely piggyback on that for the extension context.
 * [anssi] Summary, follow up, next steps. I'm proposing we do a debrief in the WebMCP call a month from now. We take the summary taken by our tooling, recap what was discussed.
 * [dominic] Sounds reasonable. To nail it down, does it sound like we'd want to move to an extension-specific API for this if we have IDs?
 * [devlin] Suspicion is we will likely want to do both. We're likely going to want to use the web API so extensions can register their own tools.
 * [dominic] So it sounds like we'd reuse registerTool() (keep as-is in extensions context), and give getTools() a special parameter for native privileges when used in extension's context
 * [devlin] When it comes to adding tools for a cross-origin context, we probably wouldn't want to do that with existing API. But if we're talking about basic registration, we'd probably want to reuse. Open problem right now is that types in extensions and types on the web don't mix well. Initial reaction is getTools would probably be on the webApi, execute would probably be an extension API
 * [dominic] Little sceptical that we'd expose a getTools like we would for a native agent on the web platform, but we can probably figure that out.
 *
 * (post-meeting)
 * [anssi] These meeting notes will be discussed during the next month's WebMCP meeting.
 * [rob] Who is going to somehow include the AI transcript? I sent the raw notes to Roy from W3C (I didn't catch the full name, but Anssi knows him).
 * (Simeon, Rob and Dominic sat together post-meeting to fix up the notes before anyone forgets)
