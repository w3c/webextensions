# Proposal: Update Extensions to interact with Partitioned Cookies containing Cross-Site Ancestor Chain Bit values

**Summary**

Allow extensions to utilize a hasCrossSiteAncestor boolean value when interacting with partitioned cookies that include a cross-site ancestor chain bit in their partiton key.

#### Background information: Description of Cross-site Ancestor Chain Bit in partitioned cookies

The cross-site ancestor chain bit is a component of the cookie partition key that is set by the browser when keys are created. If the bit indicates true, it means the cookie has been set in a third-party context.

A third-party context occurs when any parent frame, in the frame tree, is cross-site with the frame or subresource the cookie is being set on. If one site of the frame tree is third-party, then all children frames of that frame are also third-party and have a cross site ancestor. Third-party contexts also occur when the top-level frame makes a third-party subresource request and when a first-party request is redirected to a thrid-party URL (even if it is subsequently redirected back to a first-party request after, that subsequent first-party request is now considered an ABA request).

Note: In the table below, sites A1, A2 and A3 are all first-party to each other.
| Site frame tree |Site cookie is set on| hasCrossSiteAncestor value of cookie|
|---|---|--|
| A1         |A1| false         | 
| A1->A2      |A2 | false          | 
| A1->A2->A3   |A3   | false          | 
| A1->B       |B| true          |
| A1->B->A2    |A1   | false          |
| A1->B->A2 |B    | true          |
| A1->B->A2 |A2   | true          |

**Document Metadata**

**Author:** [aselya](https://github.com/aselya) 

**Sponsoring Browser:** Chrome

**Contributors:** [DCtheTall](https://github.com/Dcthetall)

**Created:** 2024-04-01

**Related Issues:** [PrivacyCG/CHIPS issue 6 - How do Partitioned cookies interact with browser extensions?](https://github.com/privacycg/CHIPS/issues/6)

## Motivation
https://github.com/privacycg/CHIPS/issues/40 is adding a cross-site ancestor bit value to partitioned cookies.

### Objective
To interact with partitioned cookies containing a cross-site ancestor chain bit correctly, extensions will need to have the ability to to specify a value (hasCrossSiteAncestor) that corresponds to the value of the cross-site ancestor chain bit in partitioned cookies.

#### Use Cases

#### Cookie Manager:
Let's say a cookie manager extension (with host permissions) is used by users to get/set/remove their cookies. As browsers include the cross-site ancestor chain bit in their implementation of partitioned cookies, the extension will need the ability to use the `hasCrossSiteAncestor` parameter to give full insight into the existing cookies and allow the user to set new cookies that include the cross-site ancestor bit correctly.

#### Password Manager:
Let’s say a password manager extension (with host permissions) is used by users to access their login information by setting a cookie that stores their usernames and passwords in an encrypted partitioned cookie. To protect their users against clickjacking, the extension adds a setting that prevents their cookies from being accessed, by default, in embeds that have cross site ancestors without triggering a user prompt. If permission is given through the prompt, the extension sets a cookie with a `hasCrossSiteAncestor` value of true. Upon subsequent visits, the extension checks the cookie store for the presence of a cookie with a `hasCrossSiteAncestor` value of true to determine whether the prompt needs to be rendered.

To allow for this protection and UX flow to work, the extension would need to have the ability to set/get cookies with specific hasCrossSiteAncestor values. 

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

### New Permissions
No new permissions are required.

### Manifest File Changes
No new manifest fields are required.

## Security and Privacy
Privacy: The hasCrossSiteAncestor boolean value does not reveal private information.

Security: The hasCrossSiteAncestor boolean value does not impact security.

### Exposed Sensitive Data
No sensitive data is associated with the cross-site ancestor chain bit.

### Abuse Mitigations
A cookie may only have no cross-site ancestor when the topLevelSite in the partitionKey and the URL with which the cookie is associated with are first-party to each other. To prevent the creation of cookies that violate this, the set method will return an error if the URL and the topLevelSite are not first-party for cookies that are set with no-cross site ancestor.

### Additional Security Considerations
None

## Alternatives
The hasCrossSiteAncestor value could be a value that is not exposed to extensions at all. Browsers that choose to include a cross-site ancestor chain bit in their partitioned cookies, could calculate the expected value of the cross-site ancestor chain bit from the URL associated with the cookie and the topLevelSite in the partitionKey. However, this could cause extensions to be unable to correctly set or get cookies (in an A1->B->A2 situation) as the browser may calculate the incorrect value for hasCrossSiteAncestor since it would not be explicitly provided by the extension.

### Existing Workarounds
To access cookies with the same `topLevelSite` but different `hasCrossSiteAncestor` values (A1->B->A2 context), developers can remove the `Partitioned` attribute from the cookie and use the Storage Access API in the context of web pages.

### Open Web API
The APIs being expanded to include the hasCrossSiteAncestor boolean are specific to extensions.

## Implementation Notes

### Populating hasCrossSiteAncestor when not provided
When no value has been provided for `hasCrossSiteAncestor`, if the `domain` associated with the `cookie` is same-site to the value of the `topLevelSite`, the `hasCrossSiteAncestor` value will be set to false otherwise the value will be set to true.

### APIs affected by the change and the behavior assoicated with the change:

- `cookies.get()`:
If no `hasCrossSieAncestor` value is provided it will be populated using the algorithim described above. If a `hasCrossSiteAncestor` value is provided without a corresponding `topLevelSite` value, an error will be returned.

- `cookies.getAll()`: 
If no value is set for hasCrossSiteAncestor cookies with both true and false values for hasCrossSiteAncestor will be returned. Otherwise, cookies will be returned that match the topLevelSite and the passed value for hasCrossSiteAncestor.

- `cookies.set()`: 
As described the Abuse Mitigations section, this method will not allow a hasCrossSiteAncestor value of false, if the URL associated with the cookie and the topLevelSite in the partitionKey are not first-party. If this is attempted, an error will be returned. If a `hasCrossSiteAncestor` value is provided without a corresponding `topLevelSite` value, an error will be returned. Additionally, if no `hasCrossSieAncestor` value is provided it will be populated using the algorithim described above.

- `cookies.remove()`:
If no `hasCrossSieAncestor` value is provided it will be populated using the algorithim described above when determing the cookie to remove. If a `hasCrossSiteAncestor` value is provided without a corresponding `topLevelSite` value, an error will be returned.

