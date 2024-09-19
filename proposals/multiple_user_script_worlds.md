# Proposal: Allow multiple user script worlds

**Summary**

Allow developers to configure and use multiple user script worlds in the
`browser.userScripts` API.

**Document Metadata**

**Author:** rdcronin

**Sponsoring Browser:** Google Chrome

**Contributors:** N/A

**Created:** 2024-03-07

**Related Issues:** [565](https://github.com/w3c/webextensions/issues/565)

## Motivation

### Objective

User scripts are (usually small) scripts that enable myriad use cases by
injecting scripts into different web pages. A user may have many different
user scripts that execute on the same page; however, these scripts are
conceptually distinct from one another and should generally not interact with
each other.

Today, user script managers take various steps to isolate user scripts as they
are injected, since all user scripts will run either in the context of the
main world or in a single user script world for the extension. This API would
allow user script managers to instead have multiple user script worlds, each
isolated from one another, to reduce the likelihood of user scripts negatively
affecting one another through collisions.

#### Use Cases

The primary use case is user script managers that handle multiple, independent
script injections in a single page.

### Known Consumers

We anticipate user script managers such as Tampermonkey, Violentmonkey, and
others to use this new capability.

## Specification

### Schema

This change would modify existing schemas. We will add a new property,
`worldId`, to the `WorldProperties` and `RegisteredUserScript` types, as below.

Relevant methods and types:

```diff
 export namespace userScripts {
   export interface WorldProperties {
+    /**
+     * Specifies the ID of the specific user script world to update.
+     * If not provided, updates the properties of the default user script
+     * world.
+     * Values with leading underscores (`_`) are reserved.
+     */
+    worldId?: string;

     /**
      * Specifies the world's CSP. The default is the `ISOLATED` world CSP.
      */
     csp?: string;

     /**
      * Specifies whether messaging APIs are exposed. The default is `false`.
      */
     messaging?: boolean;
   }

   /**
    * Properties for a registered user script.
    */
   export interface RegisteredUserScript {
     /**
      * If true, it will inject into all frames, even if the frame is not the
      * top-most frame in the tab. Each frame is checked independently for URL
      * requirements; it will not inject into child frames if the URL
      * requirements are not met. Defaults to false, meaning that only the top
      * frame is matched.
      */
     allFrames?: boolean;

     /**
      * Specifies wildcard patterns for pages this user script will NOT be
      * injected into.
      */
     excludeGlobs?: string[];

     /**
      * Excludes pages that this user script would otherwise be injected into.
      * See Match Patterns for more details on the syntax of these strings.
      */
     excludeMatches?: string[];

     /**
      * The ID of the user script specified in the API call. This property
      * must not start with a '_' as it's reserved as a prefix for generated
      * script IDs.
      */
     id: string;

     /**
      * Specifies wildcard patterns for pages this user script will be
      * injected into.
      */
     includeGlobs?: string[];

     /**
      * The list of ScriptSource objects defining sources of scripts to be
      * injected into matching pages.
      */
     js: ScriptSource[];

     /**
      * Specifies which pages this user script will be injected into. See
      * Match Patterns for more details on the syntax of these strings. This
      * property must be specified for ${ref:register}.
      */
     matches?: string[];

     /**
      * Specifies when JavaScript files are injected into the web page. The
      * preferred and default value is document_idle
      */
     runAt?: RunAt;

     /**
      * The JavaScript execution environment to run the script in. The default
      * is `USER_SCRIPT`
      */
     world?: ExecutionWorld;

+    /**
+     * If specified, specifies a specific user script world ID to execute in.
+     * Only valid if `world` is omitted or is `USER_SCRIPT`. If `worldId` is
+     * omitted, the script will execute in the default user script world.
+     * Values with leading underscores (`_`) are reserved.
+     */
+    worldId?: string;
   }

   ...

+   /**
+    * Resets the configuration for a given world. Any scripts that inject into
+    * the world with the specified ID will use the default world configuration.
+    * Does nothing (but does not throw an error) if provided a `worldId` that
+    * does not correspond to a current configuration.
+    */
+   export function resetWorldConfiguration(worldId: string): Promise<void>;
+
+   /**
+    * Returns a promise that resolves to an array of the the configurations
+    * for all user script worlds.
+    */
+   export function getWorldConfigurations(): Promise<WorldProperties[]>;
 }
```

Note that the signatures of the related functions, including `configureWorld()`,
`register()`, and others are left unchanged.

When the developer specifies a `RegisteredUserScript`, the browser will use a
separate user script world when injecting the scripts into a document. If
`worldId` is omitted, the default user script world will be used.

Worlds may be configured via `userScripts.configureWorld()` by indicating the
given `worldId`. User scripts injected into a world with the given `worldId`
will have the associated properties from the world configuration. If a world
does not have a corresponding configuration, it uses the default user script
world properties. Any existing worlds are not directly affected by
`userScripts.configureWorld()` calls; however, the browser may revoke
certain privileges (for instance, message calls from existing user script worlds
may beging to fail if the extension sets `messaging` to false). This is in line
with behavior extensions encounter when e.g. the extension is unloaded and the
content script continues running.

World configurations can be removed via the new
`userScripts.resetWorldConfiguration()` method.

Additionally, `runtime.Port` and `runtime.MessageSender` will each be extended
with a new, optional `userScriptWorldId` property that will be populated in the
arguments passed to `runtime.onUserScriptConnect` and
`runtime.onUserScriptMessage` if the message initiator is a non-default user
script world. We do not need to populate a value for messages from the default
user script world, since this is unambiguous given the distinction in the
event listeners (`onUserScriptMessage` already indicates the message was from
a user script).

### Behavioral Notes

#### World Persistence

Configured worlds are persisted until the owning extension is updated (in order
to align with the behavior of the rest of the `userScripts` API) or manually
removes them via the new `userScripts.resetWorldConfiguration()` method.

#### World Limits

User agents may place limits on both the number of registered worlds and the
number of worlds that may be active in a given document. These limits may be
different (since an extension may want more individual world configurations than
they would expect to be practically encountered on a given site).

If an extension reaches the limit of the number of registered world
configurations, attempts to register a new world via
`userScripts.configureWorld()` will fail with an error.

If an extension tries to inject more scripts into a single document than the
per-document limit, all additional scripts will be injected into the default
world.

### New Permissions

No new permissions are necessary. This is inline with the `userScripts` API's
current functionality and purpose.

### Manifest File Changes

No manifest file changes are necessary.

## Security and Privacy

### Exposed Sensitive Data

This does not expose any additional sensitive data.

### Abuse Mitigations

This API does not provide any additional avenue for abuse beyond what the
`userScripts` API is already capable of.

Extension developers may abuse this API by requiring too many user script
worlds, which would have a heavy performance cost. However, this is not a
security consideration. Additionally, browsers can mitigate this by enforcing
a limit of the maximum number of user script worlds an extension may register
or have active at a given time.

These enforcements will be left up to the browser to implement, if they feel
necessary.

### Additional Security Considerations

No additional security considerations. This API may (mildly) increase security
by (somewhat) isolating individual user scripts from interacting with one
another.

Note that since isolated world boundaries are not considered "hard" boundaries,
we would not consider this isolation a security measure from the browser's
security model (just as we don't consider isolated worlds to be a strict
security boundary today).

## Alternatives

### Existing Workarounds

Today, user script managers go to various lengths to try to isolate behavior
between user scripts (for more information, see conversation in
[issue 279](https://github.com/w3c/webextensions/issues/279)). This includes
having various frozen types, making heavy use of function closures, ensuring
injection before untrusted code, and more.

These workarounds are fragile and require significantly more complex code in
user script managers, while providing a lesser guarantee of isolation than a
separate user script world would provide.

### Open Web API

The concept of user scripts should not be exposed to the web; this should not
be an open web API.

## Implementation Notes

N/A

## Future Work

With the addition of a `userScripts.execute()` function (as described in
[PR 540](https://github.com/w3c/webextensions/pull/540) and
[issue 477](https://github.com/w3c/webextensions/issues/477), we should also
allow developers to specify the `worldId` when injecting dynamically. This
will behave similarly to its behavior for a `RegisteredUserScript`.

We have also discussed enabling more seamless inter-world communication, and
the `worldId` could potentially be used in those purposes.
