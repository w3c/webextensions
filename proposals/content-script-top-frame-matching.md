
# Proposal: Content Script Top Frame Origin Matching

**Summary**

API proposal to allow content script registration (both static and dynamic) to be restricted based on the origin of the top-level frame using standard [match patterns](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns), enabling more intuitive and secure site blocking/allowing functionality for extensions.

**Document Metadata**

*   **Author:** [Polywock](https://github.com/polywock)
*   **Sponsoring Browser:** *(Seeking browser sponsorship)*
*   **Status:** Draft *(Seeking feedback and browser interest)*
*   **Proposal Champions:** [Kzar](https://github.com/kzar), [Carlosjeurissen](https://github.com/carlosjeurissen), [Polywock](https://github.com/polywock)
*   **Created:** 2025-03-30 
*   **Related Issues:**
    *   [w3c/webextensions#117](https://github.com/w3c/webextensions/issues/117)
    *   [w3c/webextensions#668](https://github.com/w3c/webextensions/issues/668)
    *   [Chromium Issue 40202338](https://issues.chromium.org/issues/40202338)

## Motivation

### Objective

This proposal introduces a mechanism to further restrict content script injection by adding a filter based on the **origin** of the **top-level document**. This allows for more precise control over where scripts execute, while also enabling developers to create site blocklists or allowlists that better align with user expectations, improve performance, and enhance security.


### Use Cases

1.  **Intuitive Site Blocking/Allowing:** Many extensions offer users the ability to disable functionality on specific websites. Currently, using frame-level exclusion rules (like `excludeMatches`) on a dynamic content script is a common approach. However, this leads to counter-intuitive behavior:
    *   If a user blocks `https://example.com/*` using `excludeMatches`, the extension's content script *still runs* on `https://example.com/page` if an embedded iframe loads content from a *different*, non-blocked domain (assuming `all_frames: true`).
    *   Conversely, if a user visits `https://anothersite.com/*` which embeds an iframe from the blocked `https://example.com/*`, the extension *is blocked* from running within that embedded `example.com` frame, even though the user likely only intended to block the extension when visiting `example.com` directly as the main page.

2.  **Security:** As highlighted in [#117](https://github.com/w3c/webextensions/issues/117), restricting content scripts based on the top-level frame's origin enhances security. For scripts registered with `all_frames: true`, developers can ensure they only execute when the main page's origin is one they expect, preventing accidental injection into sensitive contexts or reducing the impact of potential vulnerabilities.

3.  **Performance:** By preventing script injection at the browser level based on top-frame origin criteria, extensions avoid the performance implications of the [current workaround](#alternatives).


### Known Consumers

Developer interest is evident in the related GitHub and Chromium discussion ([#117](https://github.com/w3c/webextensions/issues/117), [#668](https://github.com/w3c/webextensions/issues/668), [40202338](https://issues.chromium.org/issues/40202338)). This feature addresses a common pattern (site blocking/allowing by origin) that currently requires less secure and efficient workarounds.

## Specification

This proposal expands the definition of content scripts in both the `manifest.json` and the scripting API (`scripting.registerContentScripts`).

### Schema

#### Manifest `content_scripts` Entry

The object definition within the `content_scripts` array in `manifest.json` is expanded to include two new optional properties accepting arrays of match patterns. 

```json5
{
  // If specified: Only inject if the top-level frame's origin matches at least one of these patterns. 
  "top_frame_matches": ["MatchPattern"], 

  // If specified: Only inject if the top-level frame's origin isn't a match for any pattern. 
  "exclude_top_frame_matches": ["MatchPattern"], 
```
*Where `MatchPattern` is a string conforming to the standard [Extension Match Pattern syntax](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns).*

#### `scripting.RegisteredContentScript` Type

The `RegisteredContentScript` type used by `scripting.registerContentScripts()` and `scripting.updateContentScripts()` is expanded similarly:

```typescript
dictionary RegisteredContentScript {

  // If provided, only inject if the top-level frame's origin matches at least one of these patterns. 
  MatchPattern[]? topFrameMatches;

  // If provided, Only inject if the top-level frame's origin isn't a match for any pattern. 
  MatchPattern[]? excludeTopFrameMatches;
}
```

### Behavior / Implementation 

1.  **Validation:** When processing `content_scripts` from `manifest.json` or a call to `scripting.registerContentScripts` / `scripting.updateContentScripts`:
    *   The browser must validate all patterns provided in `topFrameMatches` and `excludeTopFrameMatches`.
    *   If any pattern contains a path component other than the wildcard path `/*` (i.e., it specifies a specific path like `/foo` or `/bar/*`), the browser must treat this as an error. Patterns without an explicit path or those explicitly using `/*` are considered valid.
        *   For static declarations in `manifest.json`, this should likely result in a manifest parsing error, preventing the extension from loading.
        *   For dynamic API calls (`registerContentScripts`, `updateContentScripts`), the promise **must** be rejected with an appropriate error (e.g., `Match patterns must not specify a path other than '/*'.`).

2.  **Injection Logic:** Assuming validation passes, a content script will be injected into a frame if and only if *all* the following conditions are met:
    *   All existing checks based on the frame's own URL and context are satisfied.
    *   And if `topFrameMatches` was specified, the origin of the top-level frame's URL matches at least one pattern in `topFrameMatches`.
    *   And if `excludeTopFrameMatches` was specified, the origin of the top-level frame's URL does *not* match any validated pattern in `excludeTopFrameMatches`.

**Origin Definition:** The origin consists of the scheme, host, and port (e.g., `https://www.example.com:443`). Match patterns are compared against this origin. The path component of the top-level URL is ignored during matching, as enforced by the validation rule disallowing specific paths in the patterns.

**Example** An extension that applies a dark theme to all sites and frames is active globally, except for https://www.example.com, where the user has disabled it.

```json
{
   "matches": ["https://*/*"],
   "exclude_top_frame_matches": ["https://www.example.com/*"],
   "all_frames": true,
   "js": ["force_dark_theme.js"]
}
```

### New Permissions

No new permissions are required. The `topFrameMatches` and `excludeTopFrameMatches` properties only serve to *restrict* where a content script can run, based on the host permissions already requested by the `matches` property. Existing host permission warnings remain appropriate and sufficient.


## Security and Privacy

### Exposed Sensitive Data

This API does not expose any new data to the extension. It uses the origin of the top-level frame, which is generally less specific than the full URL and already implicitly available by content scripts within that frame.

### Additional Security Considerations

This feature enhances the principle of least privilege by allowing developers to be more specific about the top-level origins in which their scripts should operate.

## Alternatives

### Existing Workarounds

Developers can achieve similar *behavior* (but not with same performance or security) by:

1.  Registering a content script with broad `matches` (e.g., `<all_urls>`).
2.  Inside the content script, determine the top-level frame's origin `location.ancestorOrigins` or by messaging the background script. 
3.  Asynchronously fetch the user's blocklist/allowlist (likely stored by origin) from `browser.storage`.
4.  Compare the top-level origin against the list.
5.  If the origin is blocked (or not allowed), exit early. 

**Limitations of Workarounds:**

1.  **Inefficiency:** The content script still must be injected, potentially across dozens or hundreds of tabs. Even though it exits immediately without further logic, the effect of having these scripts loaded may have significant performance implications.
3.  **Asynchronous:** Checking `browser.storage` is asynchronous. Scripts needing synchronous initialization (e.g., modifying the DOM early via `run_at: document_start`) cannot reliably block themselves before potentially executing some code.
4.  **Attack Surface:** The content script still must be injected, potentially in sensitive sites that the user intended to block. Vulnerabilities in the script or its dependencies could theoretically be exploited.
5.  **Conflicts:** The mere act of injecting a script (especially via the `MAIN` content script world) can cause conflicts with website code, potentially due to polyfills, bundler runtime code, etc. 

### Open Web API

N/A. *This feature is specific to the WebExtensions model.*
