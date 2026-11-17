# Proposal: Custom Bookmark Favicons in `browser.bookmarks.update()`

**Summary**

Extend the `changes` parameter of `browser.bookmarks.update(id, changes)` with an optional `iconDataUrl` string property (`data:` URL representing a custom favicon image) so extensions with the `"bookmarks"` permission can set custom favicons on bookmarks.

**Document Metadata**

**Author:** [S. Ganesh (Google)](https://github.com/GitHubGanesh)

**Sponsoring Browser:** Chromium

**Contributors:** [Tim Judkins (Google)](https://github.com/tjudkins), Brandon Wylie (Google), Mikel Astiz (Google)

**Created:** 2026-10-28

**Related Issues:** [#1200](https://github.com/w3c/webextensions/issues/1200) ([WECG PR #1201](https://github.com/w3c/webextensions/pull/1201)), [crbug.com/41244345](https://issues.chromium.org/issues/41244345) ([Prototype CL](https://chromium-review.googlesource.com/c/chromium/src/+/8668246))

## Motivation

### Objective

Allowing extensions to customize bookmark favicons is one of the longest-standing, highest-voted extension developer requests ([crbug.com/41244345](https://issues.chromium.org/issues/41244345), 240+ votes). Today, `browser.bookmarks.update()` only supports modifying `title` and `url`, leaving extensions with no mechanism to set or customize the icon displayed for a bookmark in the browser's native bookmarks UI.

#### Use Cases

1. **Bookmarklets & Internal/Synthetic URLs:** Bookmarklets (`javascript:...`) and internal pages do not fetch remote favicons, leaving the bookmarks bar cluttered with identical default globe icons.
2. **Multiple Bookmarks on the Same Domain:** Users frequently bookmark multiple dashboards, docs, or issue trackers hosted on the same origin and want distinct visual icons on the bookmarks bar (especially for icon-only bookmarks with empty titles).
3. **Bookmark Managers & Favicon Customizers:** Bookmark organization extensions cannot persist custom icons into the browser's native bookmark/favicon storage, forcing them to build custom replacement bookmark bars instead of integrating with the browser UI.

### Known Consumers

Over 240 developers and users have starred [crbug.com/41244345](https://issues.chromium.org/issues/41244345), including authors of bookmark manager extensions, bookmarklet managers, and favicon customizer extensions (such as Bookmark Favicon Changer and Tab Modifier).

## Specification

### Schema

This proposal expands the `changes` parameter of `browser.bookmarks.update`:

```ts
export function update(
  id: string,
  changes: {
    title?: string;
    url?: string;
    iconDataUrl?: string;
  },
): Promise<BookmarkTreeNode>;
```

Corresponding WebExtensions JSON schema (`bookmarks.json`):

```json
{
  "name": "update",
  "type": "function",
  "description": "Updates the properties of a bookmark or folder. Specify only the properties that you want to change; unspecified properties will be left unchanged.",
  "parameters": [
    {
      "type": "string",
      "name": "id"
    },
    {
      "type": "object",
      "name": "changes",
      "properties": {
        "title": {
          "type": "string",
          "optional": true
        },
        "url": {
          "type": "string",
          "optional": true
        },
        "iconDataUrl": {
          "type": "string",
          "optional": true,
          "description": "A data URL (e.g. 'data:image/png;base64,...') representing the new custom favicon for the bookmark."
        }
      }
    }
  ]
}
```

#### Usage Example

```js
await browser.bookmarks.update(bookmarkId, {
  iconDataUrl:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
});
```

### Behavior

* **Valid `iconDataUrl`:** Must be a valid `data:` URL containing encoded image bytes within a reasonable size limit (e.g., 128 KB maximum string length). The browser decodes the image in an isolated/sandboxed image decoder, resizes it if necessary (e.g., up to `64x64` px), persists it in the browser's local favicon storage, and notifies bookmark UI observers so the icon updates immediately.
* **Folders:** Calling `bookmarks.update(folderId, {iconDataUrl})` rejects with an error (`"Can't set favicon of a bookmark folder."`), matching the existing behavior when attempting to set `url` on a folder (`"Can't set URL of a bookmark folder."`).
* **Invalid `iconDataUrl`:** Non-`data:` URLs (such as `https://...`), empty strings, oversized `data:` URLs, or corrupted/undecodable image bytes reject with `"Invalid favicon."` without mutating `title` or `url`.
* **Static Icons / Rate Limiting:** Custom bookmark favicons are intended to be static icons persisted to disk. Animated favicons or rapid updates to simulate animation are not supported, and browsers may throttle or rate-limit frequent `iconDataUrl` updates to avoid excessive image-decoder and disk I/O churn.

### New Permissions

None. This addition uses the existing `"bookmarks"` permission required by `browser.bookmarks.update()`. Setting a bookmark's icon falls within the existing scope and user expectations of managing bookmarks.

### Manifest File Changes

There are no changes to `manifest.json`.

## Security and Privacy

### Exposed Sensitive Data

This API is write-only (`iconDataUrl` in `bookmarks.update`) and does not expose any existing favicon or browsing history data to the extension.

### Abuse Mitigations

* **No Remote Network Fetches:** Accepting only `data:` URLs (rather than remote `http:`/`https:` URLs) avoids browser-initiated network requests on behalf of the extension and prevents server-side tracking beacons triggered when bookmarks are rendered.
* **Payload & Storage Bounds:** Enforcing an upfront string length cap on `iconDataUrl` (e.g., 128 KB) prevents accidental or malicious multi-megabyte IPC payloads, and downscaling decoded icons to standard favicon dimensions (e.g., `16x16`–`64x64` px) ensures each persisted icon occupies only a few kilobytes in local favicon storage.
* **Rate Limiting / No Animation:** Because bookmark favicons are persisted to disk rather than held purely in memory, browsers may rate-limit or coalesce rapid `iconDataUrl` updates to prevent disk I/O thrashing and distracting animated icons on the bookmarks bar.
* **User Attribution & Control:** Requires the `"bookmarks"` permission, which already displays a clear install-time permission warning (`"Read and change your bookmarks"`).

### Additional Security Considerations

* **Rule of Two / Untrusted Image Decoding:** Image bytes supplied by an extension via `iconDataUrl` are untrusted input. In Chromium, decoding is performed out-of-process in the sandboxed `data_decoder` utility service (`data_decoder::DecodeImage`) prior to resizing and persisting the icon locally (e.g., via `FaviconService` in the prototype).

## Alternatives

### Existing Workarounds

Currently, there is no workaround for setting favicons on the browser's native bookmarks bar or bookmark menus—extensions must either inject content scripts when a user visits the bookmarked page (which does not work for `javascript:` bookmarklets, unvisited pages, or differentiating multiple bookmarks to the same URL) or replace the browser's bookmark UI entirely with a custom page or popup.

### Open Web API

Bookmarks management (`browser.bookmarks`) is a browser UI capability privileged to extensions and is not exposed to the open web.

### Alternative API Shapes & Storage Designs

1. **Dedicated `browser.bookmarks.setFavicon(id, details)` method:**
   * *Pros:* Keeps `bookmarks.update` limited to core `BookmarkTreeNode` properties (`title` and `url`), and aligns with existing precedent like [`action.setIcon()`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/action/setIcon) (which accepts `imageData` or `path`).
   * *Cons:* Updating a bookmark's title, URL, and icon together requires two API calls instead of one atomic `bookmarks.update` call. Extending `bookmarks.update` keeps all mutable bookmark modifications in one entry point (though we welcome WECG feedback on `bookmarks.update` vs. `bookmarks.setFavicon`).
2. **Accepting remote icon URLs (`iconUrl: "https://..."`) or `ImageData`:**
   * *Pros:* Convenient when an extension has a remote URL or canvas `ImageData`.
   * *Cons:* Remote URLs introduce privacy/fetching questions (when to fetch, CORS/credentials, offline behavior). Extensions can easily `fetch()` a remote image in their own context or call `OffscreenCanvas.convertToBlob()` / `FileReader` to produce a `data:` URL.
3. **Storing custom favicons directly in `BookmarkNode` meta-info:**
   * *Pros:* Allows distinct icons for two bookmarks pointing to the exact same URL and syncs across devices automatically.
   * *Cons:* Serializes base64 image data into the `Bookmarks` JSON file and bookmark sync payloads, and requires the core bookmark model to handle image decoding. Persisting custom icons in a separate local store (such as `FaviconService` in the prototype) keeps bookmark storage lightweight and decouples image data from the core bookmark model.

## Implementation Notes

* **Cross-Device Sync:** Custom bookmark favicons set via this API are stored locally by the browser (e.g., via `FaviconService` in the prototype; exact Chromium storage layer TBD) and are **not synced** across devices via `BookmarkSpecifics` or `BookmarkNode` meta-info. This avoids bloating Bookmark Sync payloads and the local `Bookmarks` JSON file with arbitrary encoded image blobs. When the same extension is installed across a user's synced profiles, the extension can apply its custom icons locally on each device.
* **Desktop Android (Aluminium), Mobile (Clank), and High-DPI Resolution:** On high-DPI desktop displays and mobile platforms (such as Desktop Android / Aluminium, where `chrome.bookmarks` is supported via `ENABLE_EXTENSIONS_CORE`, or Clank in the future), bookmark UI surfaces often render favicons at higher resolutions (e.g., `24dp`–`32dp` at 2x–3x scale factors, up to `64x64` px) than the traditional `16x16` DIP desktop bookmarks bar icon. Rather than unconditionally downscaling images to `16x16` px at write time, implementations can store higher-resolution bitmaps (e.g., up to `64x64` px) locally and let the browser UI or icon service downscale as needed for the target surface.

## Future Work

* Support resetting a custom bookmark favicon back to the default page favicon (e.g., by passing an empty string `""` or `null`), or supporting `ImageData` / multi-resolution icon dictionaries similar to `action.setIcon()` if desired by browser vendors.
