# Proposal: privacy.websites.thirdPartyCookiesAccessible

**Summary**

This API will be used to allow extensions to determine if a frame has access to third-party cookies.

**Document Metadata**

**Author:** [aselya](https://github.com/aselya)

**Sponsoring Browser:** Chrome

**Contributors:** 

**Created:** 2025-05-05

**Related Issues:** [https://github.com/w3c/webextensions/issues/821](https://github.com/w3c/webextensions/issues/821)

## Motivation

While third-party cookies can be disabled at a browser level setting, there exists mechanisms that allow individual frames to regain access to their third-party cookies. The existing API [privacy.websites.thirdPartyCookiesAllowed()](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/privacy/websites#thirdpartycookiesallowed) exposes the state of the browser setting and not an individual frame and is causing developer confusion. Since some extensions still rely on third-party cookies to work, providing an API that can be used to determine if an embed has access to third party cookies would allow developers to accurately handle cases where third-party cookies are blocked globally by the browser but made available to an individual embed.

### Objective

This API will enable an extension to determine if an embed has access or would be eligible to access third-party cookies.

#### Use Cases

[Salesforce Interaction SDK Launcher](https://chromewebstore.google.com/detail/salesforce-interactions-s/mhmpepeohaddbhkhecaldflljggicedf?hl=en)  
The Visual Editor component of this extension requires access to third-party cookies and it uses websites.thirdPartyCookiesAllowed() to check for this access. If that API call doesn’t return true, then the extension displays an error popup that requests the user to enable third-party cookies.  Even if third-party cookies are made available through [Storage Access API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_Access_API) or other means, the result of the API return doesn’t change, requiring the user to change their browser settings to utilize the extension.

### Known Consumers

Salesforce and users of the Salesforce Interaction SDK Launcher Extension

## Specification

### Schema

Adds a new API, websites.thirdPartyCookiesAccessible() which retrieves an object that indicates the state of third-party cookie accessibility for the frame indicated. This is an asynchronous function that returns a promise.

**Syntax**

```javascript
browser.privacy.websites.thirdPartyCookiesAccessible(
	details // object)
.then((result) => {
 console.log('State of third party cookie accessibility:  ${result.state}');
});
```

**Parameters**

* SitePair object: Information for a top-level and embedded site.  
  * topLevelSite: url for top-level site
    * string
  * embeddedSite: url for the embedded site  
      * string
        
* Details object: Information about the frame to retrieve information about.  
  * tabId: The ID of the tab in which the frame is.  
    *  Optional integer  
  * frameId: The ID of the frame in the given tab.  
    * Optional integer  
  * documentId: A UUID of the document.  
    * Optional string  
  * sitePair:  Top-level site and embedded site  
    * Optional Object 

| Required Combinations | Notes |
| :---- | :---- |
| tabId \+ frameId | frameId can be 0 |
| tabId | Will-use the top-level frame (frameId 0\) |
| frameId | frameId must not be 0, when specified without tabId |
| documentId | tabId/frameId are not required but permitted |
| sitePair | Prefer other combinations. This should be used when a frame hasn’t been created yet. |

**Return Value**

* result object:   
  * state: string that reflects the state of the indicated frame’s access to third-party cookies

* state string:  
  One of the following   
  * Granted: The frame has been given express permission to access third-party cookies by the user or the user agent on the user's behalf.  
  * Retry: The frame has been explicitly denied access to third-party cookies by the user or the user agent on the user's behalf.  
  * Eligible: The frame has not been expressly given or denied permission to access third-party cookies by the user or the user agent on the user's behalf. 

A promise that will be fulfilled with a result object that contains a state corresponding to if third party cookies are accessible for the indicated frame. 

**Permissions required to use**  
Privacy and Host

**Error conditions**

* If sitePair is not used, when the parameters passed do not correspond to an existing frame, an error will be returned.

### New Permissions

No new permissions are required.

### Manifest File Changes

No new manifest fields are required.

## Security and Privacy

### Exposed Sensitive Data

The API will expose if a frame has access to third-party cookies.

### Abuse Mitigations

The API is limited to returning an existing state. To change the state, other mechanisms would need to be utilized which would be available regardless of the results returned by this API.

### Additional Security Considerations

To utilize this API, the extension must be given “Privacy” permission to access the API. 

## Alternatives

### Existing Workarounds

Developers could attempt to set an unpartitioned cookie and then check for the existence of the cookie in the frame but this requires additional permissions and requires extensions to create frames for the cookies.

### Open Web API

This API should be limited to extensions because it could silently expose information that might be exploited by a malicious actor to coerce the user into allowing third-party cookies. By requiring additional permissions to utilize this functionality, the user is given the opportunity to deny the usage of this API.

## Implementation Notes

* A call made on a top-level frame or a sitePair that is Same-Site will always result in a state of granted.  
* When using sitePair as the parameter, there are possible edge cases (such as browser specific heuristics) that could cause the result to be incorrect. Whenever possible, prefer using an existing frame instead of passing a sitePair.

## Future Work

The [privacy.website.thirdPartyCookiesAllowed()](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/privacy/websites#thirdpartycookiesallowed) API no longer provides an accurate view of the state of third-party cookie access. In the future, we would like to deprecate this API in favor of the one proposed in the document.  
