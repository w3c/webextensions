
# Proposal: Content Script Top Frame Origin Matching

**Summary**

API proposal to allow content script registration (both static and dynamic) to be restricted based on the origin of the top-level frame using standard match patterns ([Mdn](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns), [Chrome Docs](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns)), enabling more intuitive and secure site blocking/allowing functionality for extensions.

**Document Metadata**

*   **Author:** [Polywock](https://github.com/polywock)
*   **Sponsoring Browser:** *(Seeking browser sponsorship)*
*   **Status:** Draft *(Seeking feedback and browser interest)*
*   **Proposal Champions:** [Dave Vandyke](https://github.com/kzar), [Carlos Jeurissen](https://github.com/carlosjeurissen), [Raymond Hill](https://github.com/gorhill), [Polywock](https://github.com/polywock)
*   **Created:** 2025-03-30
*   **Related Issues:**
    *   [w3c/webextensions#763](https://github.com/w3c/webextensions/issues/763)
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

2.  **Security:** Restricting content scripts based on the top-level frame's origin enhances security. For scripts registered with `all_frames: true`, developers can ensure they only execute when the main page's origin is one they expect, preventing accidental injection into sensitive contexts or reducing the impact of potential vulnerabilities.

3.  **Performance:** By preventing script injection at the browser level based on top-frame origin criteria, extensions avoid the performance implications of the [current workaround](#alternatives).


### Known Consumers
Developer interest is evident in the related GitHub and Chromium discussion ([#763](https://github.com/w3c/webextensions/issues/763), [#117](https://github.com/w3c/webextensions/issues/117), [#668](https://github.com/w3c/webextensions/issues/668), [40202338](https://issues.chromium.org/issues/40202338)). This feature addresses a common pattern (site blocking/allowing by origin) that currently requires less secure and efficient workarounds.

## Specification

This proposal expands the definition of content scripts in both the `manifest.json` and the scripting API (`scripting.registerContentScripts`).

### Schema

#### Manifest `content_scripts` Entry

The object definition within the `content_scripts` array in `manifest.json` is expanded to include two new optional properties accepting arrays of match patterns.

```json5
{
  // ... existing content_script properties like "matches", "exclude_matches", etc.

  // If specified: Only inject if the top-level frame's origin matches at least one of these patterns.
  "top_frame_matches": ["MatchPattern"],

  // If specified: Only inject if the top-level frame's origin isn't a match for any pattern.
  "exclude_top_frame_matches": ["MatchPattern"]
}
```

*Where `MatchPattern` is a string containing a single match pattern. 


#### `scripting.RegisteredContentScript` Type

The `RegisteredContentScript` type used by `scripting.registerContentScripts()` and `scripting.updateContentScripts()` is expanded similarly:

```typescript
dictionary RegisteredContentScript {
  // ... existing RegisteredContentScript properties like "matches", "excludeMatches", etc.
  
  // If provided, only inject if the top-level frame's origin matches at least one of these patterns.
  MatchPattern[]? topFrameMatches;

  // If provided, Only inject if the top-level frame's origin isn't a match for any pattern.
  MatchPattern[]? excludeTopFrameMatches;
}
```


### Behavior / Implementation

1.  **Validation:** When processing `content_scripts` from `manifest.json` or a call to `scripting.registerContentScripts` / `scripting.updateContentScripts`:
    *   The browser must first validate all patterns provided in `topFrameMatches` and `excludeTopFrameMatches` as they would validate patterns provided through `matches` and `excludeMatches`. That includes validating that all provided patterns are not malformed. If malformed URL patterns are found, the browser must treat this as an error.
    *   Empty arrays are valid values for both `topFrameMatches` and `excludeTopFrameMatches`. 
    *   Additionally, if any pattern contains a path component other than the wildcard path `/*` (i.e., it specifies a specific path like `/foo` or `/bar/*`), the browser must treat this as an error. Patterns without an explicit path or those explicitly using `/*` are considered valid. This restriction ensures these patterns are intended to match origins.
    *   Handling validation errors: 
         * For static declarations in `manifest.json`, validation errors should result in a manifest parsing error, preventing the extension from loading.
         * For dynamic API calls (`registerContentScripts`, `updateContentScripts`), validation errors results in the promise being rejected with an with an appropriate error (e.g., `Match patterns for top_frame_matches must not specify a path.` or `One or more match patterns in top_frame_matches weren't able to be parsed`). 

3.  **Injection Logic:** Assuming validation passes, a content script will be injected into a frame if and only if *all* the following conditions are met:
    *   All existing checks based on the frame's own URL and context are satisfied (e.g., `matches`, `excludeMatches`).
    *   And if `topFrameMatches` was specified, the **top-level document's origin** must match at least one pattern in `topFrameMatches`. If `topFrameMatches` is an empty array, the content script will effectively never run.
    *   And if `excludeTopFrameMatches` was specified, the **top-level document's origin** must *not* match any pattern in `excludeTopFrameMatches`. If `excludeTopFrameMatches` is an empty array, the property will be ignored and not considered when injecting content scripts.



The **Top-level document's origin** is determined as follows:

1.  First, obtain the "URL for matching" for the top-level document by applying the "Determine the URL for matching a document" algorithm, as specified in the W3C WebExtensions specification ([section 18.1](https://w3c.github.io/webextensions/specification/index.html#determine-the-url-for-matching-a-document)). The `match_origin_as_fallback` parameter of this algorithm must be interpreted as `true`.

2.  If the W3C algorithm returns a "URL for matching":
    *   This URL is then canonicalized to its origin part for the purpose of this matching. This means retaining the scheme and authority (hostname and port, if specified or non-default), while any path, query, or fragment components are discarded.
    *   The resulting string is the "top-level document's origin" that is compared against the patterns in `top_frame_matches` and `exclude_top_frame_matches`.

**Handling Undeterminable Origins for Matching**

If the top-level document’s origin cannot be determined and either (a) `topFrameMatches` is specified, or (b) a non-empty `excludeTopFrameMatches` is specified, the browser MUST NOT inject the content script. This prevents accidental execution in ambiguous or sensitive contexts. 


**Static Usage Example:** An extension that applies a dark theme to all frames except for when the top frame's origin matches `https://www.example.com/*`. 

```json
{
   "matches": ["<all_urls>"],
   "exclude_top_frame_matches": ["https://www.example.com/*"],
   "all_frames": true,
   "js": ["force_dark_theme.js"]
}
```

### New Permissions

No new permissions are required. The `topFrameMatches` and `excludeTopFrameMatches` properties only serve to *restrict* where a content script can run, based on the host permissions already requested by the `matches` property. Existing host permission warnings remain appropriate and sufficient.


## Security and Privacy

### Exposed Sensitive Data

This API does not expose any new data to the extension. It uses the top-level document's origin which is generally less specific than the full URL and already implicitly available to content scripts running within frames of that top-level document.

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
5.  **Conflicts:** The mere act of injecting a script (especially via the MAIN content script world) can cause conflicts with website code that are often hard to diagnose, potentially due to factors outside an extension developer's immediate control like polyfills, bundler runtime code, etc. 

### Open Web API

N/A. *This feature is specific to the WebExtensions model.*
