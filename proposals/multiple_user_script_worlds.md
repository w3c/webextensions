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

This change would modify existing schemas.

Relevant methods and types:

```
export namespace userScripts {
  export interface WorldProperties {
    /**
     * Specifies the world csp. The default is the `` `ISOLATED` `` world csp.
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
  }
}
```

We will add a new property, `worldId`, to the `WorldProperties` and
`RegisteredUserScript` types, as below.

```diff
 export namespace userScripts {
   export interface WorldProperties {
     /**
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
+     * Only valid if `world` is omitted or is `USER_SCRIPT`. If omitted, the
+     * script will execute in the default user script world.
+     * Values with leading underscores (`_`) are reserved.
+     */
+    worldId?: string;
   }
 }
```

Note that the signatures of the related functions, including `configureWorld()`,
`register()`, and others are left unchanged.

When the developer specifies a `worldId` in either the `WorldProperties` or
a `RegisteredUserScript`, the browser will create a separate user script world
for those cases. If `worldId` is omitted, the default user script world will
be used.

Additionally, `runtime.Port` and `runtime.MessageSender` will each be extended
with a new, optional `userScriptWorldId` property that will be populated in the
arguments passed to `runtime.onUserScriptConnect` and
`runtime.onUserScriptMessage` if the message initiator is a non-default user
script world. We do not need to populate a value for messages from the default
user script world, since this is unambiguous given the distinction in the
event listeners (`onUserScriptMessage` already indicates the message was from
a user script).

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

## Alternatives

### Existing Workarounds

Today, user script managers go to various lengths to try to isolate behavior
between user scripts. This includes having various frozen types, making heavy
use of function closures, ensuring injection before untrusted code, and more.

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
