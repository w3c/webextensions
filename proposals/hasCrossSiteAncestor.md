# Proposal: Update Extensions to interact with Partitioned Cookies containing Cross-Site Ancestor Chain Bit values

**Summary**

Allow extensions to utilize a hasCrossSiteAncestor boolean value when interacting with partitioned cookies that include a cross-site ancestor chain bit in their partiton key.

#### Brackground information: Description of Cross-site Ancestor Chain Bit in partitioned cookies

A cross-site ancestor chain bit is a value that is set by the browser when a paritioned cookie is created. The value is used as part of the key in the partition key to determine access to a partitioned cookie. If the bit indicates true, if the cookie has been set in a third third party context.  

A third party context occurs when any parent frame, in the frame tree, is cross-site with the frame the cookie is being set on. If one site of the frame tree is third party, then all children frames of that frame are also third party and have a cross site ancestor.


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

**Author:**  aselya 

**Sponsoring Browser:** Chrome

**Contributors:** DCtheTall

**Created:** 2024-04-01

**Related Issues:** [PrivacyCG/CHIPS issue 6 - How do Partitioned cookies interact with browser extensions?](https://github.com/privacycg/CHIPS/issues/6)

## Motivation
https://github.com/privacycg/CHIPS/issues/40 is adding a cross-site ancestor bit value to partitioned cookies.

### Objective
To interact with partitioned cookies containing a cross-site ancestor chain bit correctly, extensions will need to have the ability to to specify a value (hasCrossSiteAncestor) that corresponds to the value of the cross-site ancestor chain bit in partitioned cookies.

#### Use Cases

#### Password Manager:
Let’s say a password manager extension (with host permissions) is used by users to access their login information by setting a cookie that stores their usernames and passwords in an encrypted partitioned cookie. To protect their users against clickjacking, the extension adds a setting that prevents their cookies from being accessed, by default, in embeds that have cross site ancestors without triggering a user prompt. If permission is given through the prompt, the extension sets a cookie with a hasCrossSiteAncestor value of true. Upon subsequent visits, the extension checks the cookie store for the presence of a cookie with a hasCrossSiteAncestor value of true to determine whether the prompt needs to be rendered.

To allow for this protection and UX flow to work, the extension would need to have the ability to set/get cookies with specific hasCrossSiteAncestor values. 

### Known Consumers
All extensions that access and/or modify cookies with awareness of partitioned cookies, through the use of the `partitionKey` property in the `cookies` extension API.

## Specification

### Schema

Adds a new boolean property `hasCrossSiteAncestor` to the `partitionKey` property of the `cookies.Cookie` type.

Adds a new optional boolean property `hasCrossSiteAncestor` to the `partitionKey` property of the details object. Which is the parameter used in the methods `cookies.get()`, `cookies.set()`, `cookies.remove()` and `cookies.getAll()`.

```
//Cookie details object with partitionKey containing hasCrossSiteAncestor value of true.
"details" {
  "partitionKey": {
    "topLevelSite" : "https://example.com"
    "hasCrossSiteAncestor" : true
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
A cookie may only have no cross-site ancestor when the topLevelSite in the partitionKey and the URL with which the cookie is associated with are first party to each other. To prevent the creation of cookies that violate this, the set method will return an error if the URL and the topLevelSite are not first party for cookies that are set with no-cross site ancestor.

### Additional Security Considerations
None

## Alternatives
The hasCrossSiteAncestor value could be a value that is not exposed to extensions at all. Browsers that choose to include a cross-site ancestor chain bit in their partitioned cookies, could calculate the expected value of the cross-site ancestor chain bit from the URL associated with the cookie and the topLevelSite in the partitionKey. However, this could cause extensions to be unable to correctly set or get cookies (in an A1->B->A2 situation) as the browser may calculate the incorrect value for hasCrossSiteAncestor since it would not be explicitly provided by the extension.

### Existing Workarounds
To access cookies with the same `topLevelSite` but different `hasCrossSiteAncestor` values (A1->B->A2 context), developers can remove the `Partitioned` attribute from the cookie and use the Storage Access API in the context of web pages.

### Open Web API
The APIs being expanded to include the hasCrossSiteAncestor boolean are specific to extensions.

## Implementation Notes
APIs affected by the change and the behavior assoicated with the change:

- `cookies.get()`:
If there is a partitionKey present and it has a value for topLevelSite but no value for hasCrossSiteAncestor, the get method will try to deduce what the value for hasCrossSiteAncestor is likely to be when getting the cookie. In the event that the value is incorrect, developers can either pass the correct value for hasCrossSiteAncestor or use cookies.getAll() with no hasCrossSiteAncestor value set.

- `cookies.getAll()`: 
If no value is set for hasCrossSiteAncestor cookies with both true and false values for hasCrossSiteAncestor will be returned. Otherwise, cookies will be returned that match the topLevelSite and the passed value for hasCrossSiteAncestor.

- `cookies.set()`: 
As described the Abuse Mitigations section, this method will not allow a hasCrossSiteAncestor value of false, if the URL associated with the cookie and the topLevelSite in the partitionKey are not first party. If this is attempted, an error will be returned. If no topLevelSite is provided and a hasCrossSiteAncestor value is provided, the cookie will not be set and an error will be returned.

- `cookies.remove()`:
If no value is set for hasCrossSiteAncestor, cookies.remove() will not consider the hasCrossSiteAncestor value when determing the cookie to remove. If no topLevelSite value is included in the partitionKey object and a value is set for hasCrossSiteAncestor, no cookie will be removed and an error will be returned.

