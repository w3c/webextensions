# Proposal: Update Extensions to interact with Partitioned Cookies containing Cross-Site Ancestor Chain Bit values>


**Summary**

Allow extensions to utilize a hasCrossSiteAncestor boolean value when interacting with partitioned cookies.

**Document Metadata**

**Author:**  aselya 

**Sponsoring Browser:** Chrome

**Contributors:** DCtheTall

**Created:** 2024-03-29

**Related Issues:** [How do Partitioned cookies interact with browser extensions?](https://github.com/privacycg/CHIPS/issues/6)

## Motivation
Chrome is adding a cross-site ancestor bit value to partitioned cookies.
[https://github.com/privacycg/CHIPS/issues/40]([https://github.com/privacycg/CHIPS/issues/40](https://github.com/privacycg/CHIPS/issues/40#issuecomment-1883726735))

### Objective
To interact with partitioned cookies in containing a cross-site ancestor chain bit correctly, extensions will need to have the ability to interact with the cross-site ancestor chain bit.

#### Use Cases

The methods used to get, set, remove and getAll cookies.

### Known Consumers
All adopters of partitioned cookies
## Specification

### Schema

Addition of a new optional boolean value hasCrossSiteAncestor to the details partitionKey of cookies
```json
details {
  "partitionKey": {
    "hasCrossSiteAncestor" : boolean
  }
}
```
The partitionKey is part of the existing object Cookie details which is used by the methods cookies.get(), cookies.set(), cookies.remove() and cookies.getAll().

### New Permissions

None

### Manifest File Changes

No new manifest fields

## Security and Privacy
The cross-site ancestor chain bit does not reveal private information and the inclusion of the value helps protect against clickjacking attacks.

### Exposed Sensitive Data
No sensitive data is associated with the cross-site ancestor chain bit.

### Abuse Mitigations

A cookie may only have no cross-site ancestor when the topLevelSite in the partitionKey and the URL with which the cookie is associated with are first party to each other. To prevent the setting of cookies that violate this, the set method will return an error if the URL and the topLevelSite are not first party for cookies that are set with no-cross site ancestor.

### Additional Security Considerations

## Alternatives

### Existing Workarounds

Developers could allow browsers to deduce the value of the cross-site ancestor chain bit from the URL associated with the cookie and the topLevelSite in the partitionKey but that would not always be accurate. Those inaccuracies could lead to some cookies being inaccessible in an A1->B->A2 situation.

### Open Web API

The APIs being expanded to include the hasCrossSiteAncestor boolean are specific to extensions.

## Implementation Notes

cookies.get()
If there is a partitionKey present and it has a value for topLevelSite but no value for hasCrossSiteAncestor, the get method will try to deduce what the value for hasCrossSiteAncestor is likely to be when getting the cookie. In the event that the value is incorrect, developers can either pass the correct value for hasCrossSiteAncestor or use cookies.getAll() with no hasCrossSiteAncestor value set.

cookies.getAll()
If no value is set for hasCrossSiteAncestor cookies with both true and false values for hasCrossSiteAncestor will be returned.

cookies.set()
As described the Abuse Mitigations section, this method will not allow a hasCrossSiteAncestor value of false, if the URL associated with the cookie and the topLevelSite in the partitionKey are not first party.

cookies.remove()
If no value is set for hasCrossSiteAncestor, cookies.remove() will remove cookies with both true and false values. If no topLevelSite value is included in the partitionKey object, no cookies will be removed and an error will be returned.

