# Proposal: Update Extensions to interact with Partitioned Cookies containing Cross-Site Ancestor Chain Bit values

**Summary**

Allow extensions to utilize a `hasCrossSiteAncestor` boolean value when interacting with partitioned cookies that include a cross-site ancestor chain bit in their partiton key.

#### Background information: Description of Cross-site Ancestor Chain Bit in partitioned cookies

The cross-site ancestor chain bit is a component of the cookie partition key that is set by the browser when keys are created. If the bit indicates true, it means the cookie has been set in a third-party context.

A third-party context occurs when the subresource the cookie is being set on has a cross-site frame ancestor.
Once a frame is considered to be in a third-party context, all requests within that frame and its child frames are also third-party and have a cross site ancestor. Similarly, once a request redirects to a cross-site URL, it is considered third-party (even if it is subsequently redirected back to a first-party request after, that subsequent first-party request is now considered an ABA request), unless the request causes a navigation of the top-level site. Since top-level documents may have partitioned cookies (topLevelSite non-empty, i.e. set to the site of the top-level document), but `hasCrossSiteAncestor` is always false for top-level contexts by [design](https://github.com/explainers-by-googlers/CHIPS-spec/blob/main/draft-cutler-httpbis-partitioned-cookies.md). 

Unpartitioned cookies, indicated by a cookie not containing a `partitionKey` or an empty `topLevelSite`, always have a `hasCrossSiteAncestor` value of `false`. An unpartitioned cookie can also be indicated with an empty `partitionKey` which will not have a value for `hasCrossSiteAncestor` or `topLevelSite`.

A `hasCrossSiteAncestor` value can only be validated if the `partitionKey` has a `topLevelSite`. Any `partitionKey` with no `topLevelSite` and a value for `hasCrossSiteAncestor` is considered invalid and will result in an error being thrown by the API.

| Valid PartitionKeys | Description |
|---|---|
|`{topLevelSite : "https://example.com", hasCrossSiteAncestor: false}`| Partitioned cookie, set in a same-site context|
|`{topLevelSite : "https://example.com", hasCrossSiteAncestor: true}`| Partitioned cookie, set in a cross-site context|
|`{topLevelSite : "https://example.com"}`| Partitioned cookie, `hasCrossSiteAncestor` will be calculated by the browser|
|`{topLevelSite : "",  hasCrossSiteAncestor: false}`| Unpartitioned cookie|
|`{topLevelSite : ""}`| Unpartitioned cookie, `hasCrossSiteAncestor` will default to false|

Note: In the table below, sites A1, A2 and A3 are all first-party to each other.
| Site frame tree |Site cookie is set on| hasCrossSiteAncestor value of cookie| Nodes that can't access the cookie|
|---|---|--|--|
| A1         |A1| false         | |
| A1->A2      |A2 | false          | 
| A1->A2->A3   |A3   | false          |  
| A1->B       |B| true          | B|
| A1->B->A2 |A2   | true          | A1 and B

**Document Metadata**

**Author:** [aselya](https://github.com/aselya) 

**Sponsoring Browser:** Chrome

**Contributors:** [DCtheTall](https://github.com/Dcthetall)

**Created:** 2024-04-01

**Related Issues:** [PrivacyCG/CHIPS issue 6 - How do Partitioned cookies interact with browser extensions?](https://github.com/privacycg/CHIPS/issues/6)

## Motivation
https://github.com/privacycg/CHIPS/issues/40 is adding a cross-site ancestor bit value to partitioned cookies.

### Objective
To interact with partitioned cookies containing a cross-site ancestor chain bit correctly, extensions will need to have the ability to to specify a value (`hasCrossSiteAncestor`) that corresponds to the value of the cross-site ancestor chain bit in partitioned cookies.

#### Use Cases

#### Cookie Manager:
Let's say a cookie manager extension (with host permissions) is used by users to get/set/remove their cookies. As browsers include the cross-site ancestor chain bit in their implementation of partitioned cookies, the extension will need the ability to use the `hasCrossSiteAncestor` parameter to give full insight into the existing cookies and allow the user to set new cookies that include the cross-site ancestor bit correctly.

#### Password Manager:
Let’s say a password manager extension (with host permissions) is used by users to access their login information by setting a cookie that stores their usernames and passwords in an encrypted partitioned cookie. To protect their users against clickjacking, the extension adds a setting that prevents their cookies from being accessed, by default, in embeds that have cross site ancestors without triggering a user prompt. If permission is given through the prompt, the extension sets a cookie with a `hasCrossSiteAncestor` value of true. Upon subsequent visits, the extension checks the cookie store for the presence of a cookie with a `hasCrossSiteAncestor` value of true to determine whether the prompt needs to be rendered.

To allow for this protection and UX flow to work, the extension would need to have the ability to set/get cookies with specific `hasCrossSiteAncestor` values. 

### Known Consumers
All extensions that access and/or modify cookies with awareness of partitioned cookies, through the use of the `partitionKey` property in the `cookies` extension API.

## Specification

### Schema

Adds a new boolean property `hasCrossSiteAncestor` to the `partitionKey` property of the `cookies.Cookie` type.

Adds a new optional boolean property `hasCrossSiteAncestor` to the `partitionKey` property of the details object. Which is the parameter used in the methods `cookies.get()`, `cookies.set()`, `cookies.remove()` and `cookies.getAll()`.

```
// Cookie details object with partitionKey containing hasCrossSiteAncestor value of true.
"details": {
  "partitionKey": {
    "topLevelSite": "https://example.com",
    "hasCrossSiteAncestor": true
  }
}
```
#### Cookies.GetPartitionKey()
Adds a new API, `cookies.getPartitionKey()` which retrives a valid `partitionKey` for the indicated frame.

This is an asyncronus function that returns a promise.

##### Syntax
```
let key = cookies.getPartitionKey(
    details // object
)
```
##### Parameters
`details` object. Information about the frame to retrive information about.
>  `tabId`
integer. The ID of the tab in which the frame is.

> `frameId`
integer. The ID of the frame in the given tab.

##### Return value
A Promise that will be fulfilled with a `Cookie.partitionKey` object that matches the properties given in the details parameter and contains the `hasCrossSiteAncestor` value associated with the current cross-site status of the frame.
  
### New Permissions
No new permissions are required.

### Manifest File Changes
No new manifest fields are required.

## Security and Privacy
Privacy: The existing `cookies` API can result in partitioned cookies being associated with a different partition than the original setter of the cookie intended. This risk is not mitigated by this change.

Security: The `hasCrossSiteAncestor` boolean value does not impact security.

### Exposed Sensitive Data
No sensitive data is associated with the cross-site ancestor chain bit.

### Abuse Mitigations
A cookie may only have no cross-site ancestor when the `topLevelSite` in the `partitionKey` and the URL with which the cookie is associated with are first-party to each other. To prevent the creation of cookies that violate this, the set method will return an error if the URL and the `topLevelSite` are not first-party for cookies that are set with no-cross site ancestor.

There are situations that can occur (such as an update to the public suffix list) which can change the if the topLevelSite and the URL are first-party to each other. To accomidate this possibility, the value for `hasCrossSiteAncestor` for the get(), getAll() and remove() methods will not be restricted. This will allow for web extensions to migrate or remove cookies that have become invalid after they have been set.

### Additional Security Considerations
None

## Alternatives
The `hasCrossSiteAncestor` value could be a value that is not exposed to extensions at all. Browsers that choose to include a cross-site ancestor chain bit in their partitioned cookies, could calculate the expected value of the cross-site ancestor chain bit from the URL associated with the cookie and the `topLevelSite` in the `partitionKey`. However, this could cause extensions to be unable to correctly set or get cookies (in an A1->B->A2 situation) as the browser may calculate the incorrect value for `hasCrossSiteAncestor` since it would not be explicitly provided by the extension.

### Existing Workarounds
To access cookies with the same `topLevelSite` but different `hasCrossSiteAncestor` values (A1->B->A2 context), developers can remove the `Partitioned` attribute from the cookie and use the Storage Access API in the context of web pages.

### Open Web API
The APIs being expanded to include the `hasCrossSiteAncestor` boolean are specific to extensions.

## Implementation Notes

### Populating hasCrossSiteAncestor when not provided:
When no value has been provided for `hasCrossSiteAncestor`, if the `domain` associated with the `cookie` is same-site to the value of the `topLevelSite`, the `hasCrossSiteAncestor` value will be set to false otherwise the value will be set to true.

### Empty PartitionKey: `{}`
In `cookies.getAll()` an empty key `partitionKey = {}` will return both unpartitioned and partitioned cookies and `cookies.remove()` will remove both unpartitioned and partitioned cookies. For `cookies.get()` and `cookies.set()` an empty partitionKey will result in an error. 

### APIs affected by the change and the behavior assoicated with the change:

- `cookies.get()`:
If no `hasCrossSiteAncestor` value is provided it will be populated using the algorithim described above. If a `hasCrossSiteAncestor` value is provided without a corresponding `topLevelSite` value, an error will be returned.

- `cookies.getAll()`: 
If no value is set for hasCrossSiteAncestor cookies with both true and false values for `hasCrossSiteAncestor` will be returned. Otherwise, cookies will be returned that match the `topLevelSite` and the passed value for `hasCrossSiteAncestor`. When the `partitionKey` property is not specified, only unpartitioned cookies are returned. These cookies always have a `false` value for `hasCrossSiteAncestor`. If a `hasCrossSiteAncestor` value is provided without a corresponding `topLevelSite` value, an error will be returned.

- `cookies.set()`: 
As described the Abuse Mitigations section, this method will not allow a `hasCrossSiteAncestor` value of false, if the URL associated with the cookie and the `topLevelSite` in the `partitionKey` are not first-party. If this is attempted, an error will be returned. If a `hasCrossSiteAncestor` value is provided without a corresponding `topLevelSite` value, an error will be returned. Additionally, if no `hasCrossSiteAncestor` value is provided it will be populated using the algorithm described above.

- `cookies.remove()`:
If no `hasCrossSiteAncestor` value is provided it will be populated using the algorithm described above when determing the cookie to remove. If a `hasCrossSiteAncestor` value is provided without a corresponding `topLevelSite` value, an error will be returned. If `topLevelSite` and `hasCrossSiteAncestor` values are provided, they will be used by the method even if the combination of the values would be invalid.
