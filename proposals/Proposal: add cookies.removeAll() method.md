**Summary**

Adds a new API `cookies.removeAll()` to allow for the removal of multiple cookies with a single call.

**Document Metadata**

**Author:**  [aselya](https://github.com/aselya)

**Sponsoring Browser:**  Chrome

**Contributors:**  

**Created:**  2024-09-18

**Related Issues:**  [PrivacyCG/CHIPS issue 6 - How do Partitioned cookies interact with browser extensions?](https://github.com/privacycg/CHIPS/issues/6)

## Motivation

Prior to the introduction of [partitioned cookies](https://github.com/privacycg/CHIPS), the required parameters (`url` and `name`) used by the existing `cookies.remove()` api would be unique to a single cookie. The inclusion of an optional `partitionKey` means that there can be more than one cookie that matches the currently required parameters for `cookies.remove()`. Because of this, handling partitioned cookies with `cookies.remove()` requires additional steps which can be simplified by the inclusion of this new API.

### Objective

This new API addresses two workflows for developers:
##### Removal of cookies with the same url and name combination but different partitionKey values:
Since the introduction of partitioned cookies, to remove all the cookies with the same `url` and `name` a developer must first call `cookies.getAll()` to get all of the partitioned and unpartitioned cookies associated with the values. Then use the results of that call to make individual calls to `cookies.remove()` to delete each cookie. 

##### Removal of cookies associated with a topLevelSite:
To remove all the cookies associated with a `topLevelSite`, a developer must first call `cookies.getAll({})` to retrieve all partitioned and unpartitioned cookies. Then filter the results to identify  cookies that have a value for `topLevelSite` of their `partitionKey` match the desired `topLevelSite`. Finally the developer will need to make individual calls to `cookies.remove()` to delete each cookie. 

#### Use Cases

##### Cookie Manager:

Let's say a cookie manager extension (with host permissions) is used by users to remove their cookies. Using `cookies.removeAll()` would ensure that the cookie manager extension is removing all the cookies associated with a `topLevelSite` correctly. Instead of relying on the developer of the extension to make a call to `cookies.getAll()` followed by call(s) to `cookies.remove()`. Reducing complexity for the developers while improving performance of the extension.

### Known Consumers

All extensions that access and/or modify cookies with awareness of partitioned cookies, through the use of the `partitionKey`  property  in  the  `cookies` extension API.

## Specification


### Schema

##### Syntax

```
let removed = await browser.cookies.removeAll(
details // object
)
```
##### Parameters
An `object` containing information to identify the cookie(s) to remove. It contains the following properties, based on the properties recognized by `cookies.remove`:

>[`name`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/cookies/remove#name) optional:
>
>A  `string`  representing the name of the cookie to remove.
>
>[`partitionKey`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/cookies/remove#partitionkey)  optional:
>
>An object representing the storage partition containing the cookie.
>
>[`topLevelSite`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/cookies/remove#toplevelsite)  optional:
>
>A  `string`  representing the first-party URL of the top-level site storage partition containing the cookie.
>
>[`storeId`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/cookies/remove#storeid)  optional:
>
>A  `string`  representing the ID of the cookie store to find the cookie in. If unspecified, the cookie is looked for by default in the current execution context's cookie store.
>
>[`url`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/cookies/remove#url) optional:
>
>A  `string`  representing the URL associated with the cookie.

### Behavior

The API will remove all cookies that match the `details` object parameter with the exception of the cases outlined in the implementation details.
If the extension does not have  [host permissions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions#host_permissions)  for this URL, the API call will fail.

### New Permissions
No  new  permissions  are  required.

### Manifest File Changes
No new manifest fields are required.

## Security and Privacy
Incorrect usage can lead to the removal of cookies that are not intended.

### Exposed Sensitive Data
None

### Abuse Mitigations
To remove a cookie, the extension must have host permissions for the `url` associated with the cookie.


## Alternatives
None

### Existing Workarounds

The behavior introduced by this API can be replicated by using a combination of `cookies.getAll()` and `cookies.remove()`.

### Open Web API

The cookies API is specific to extensions

## Implementation Notes

Host permissions are required for this API.
#### Special cases:
```cookies.removeAll({})```

>An empty details object will result in all cookies being removed. 

```
cookies.removeAll({
    partitionKey:{}})
```

>An empty `partitionKey` object as the only value in the details object, will result in all partitioned cookies being removed.

```
cookies.removeAll({
    name: “example”,
    url: “https://example.com”,
    partitionKey:{}
})
```

>An empty `partitionKey` object with other values populated, will result in both unpartitioned and partitioned cookies that also match the other values provided will be removed.

```
cookies.removeAll({
    topLevelSite: “https://example.com”
})
```

>If `topLevelSite` is the only argument, it will result in all cookies that have that value as the `topLevelSite` in their `partitionKey` being removed.

```
cookies.removeAll({
    topLevelSite: “https://example.com”,
    partitionKey:{topLevelSite: “https://foo.com”}
})
```

>If the `topLevelSite` differs from the `topLevelSite`, if present, in the `partitionKey` an error will be returned.
