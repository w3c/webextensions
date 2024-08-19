# Proposal: Public Suffix API

**Summary**

API to obtain the topmost *registrable domain / eTLD+1 (effective Top Level Domain+1)*
from a domain name or URL.

**Document Metadata**

**Author:** [Francis McKenzie](https://github.com/mckenfra)

**Sponsoring Browser:** Mozilla Firefox

**Contributors:** N/A

**Created:** 2024-08-19

**Related Issues:** [#231](https://github.com/w3c/webextensions/issues/231)

## Motivation

### Objective

This API enables developers to obtain the topmost *registrable domain / eTLD+1*
from a domain name or URL. This functionality is already implemented for internal
use by all the major browsers. Therefore the effect of this API is to expose
existing built-in browser functionality to extensions developers.

The primary objective of this API is to eliminate the possibility of inconsistencies
between the host browser and hosted extensions when deriving topmost
*registrable domain / eTLD+1*s from domain names / URLs.

Secondary objectives of this API are to:

1. Improve extension developer experience by reducing complexity and maintenance overhead,
since developers will no longer need to roll their own solutions for obtaining and parsing
the [Public Suffix List (PSL)](https://publicsuffix.org/list/).
2. Reduce extensions' resource usage (CPU, memory, disk space), since extensions
will no longer be duplicating work already done by the host browser.

#### Use Case #1: Wildcard Domains

This API is relevant to any extension that gives the user control over which
domain names / URLs the extension's functionality should apply to. For example,
Mozilla's [multi-account-containers](https://github.com/mozilla/multi-account-containers)
extension allows users to create containers for web pages as they visit them.

Users may want the ability to apply the extension's functionality to a
*wildcard domain*, such that all subdomains of some base domain are
automatically included.

This API allows the extension to automatically propose the topmost *registrable domain / eTLD+1*
as a possible *wildcard domain* for the user to choose. It also allows the
extension to prevent the user from accidentally choosing a *public suffix / eTLD*
as a wildcard domain, e.g. `*.com`.

#### Use Case #2: Grouping Domains in UI

Where extensions present lists of domain names / URLs to users, it can be beneficial
from a UX perspective to group them by their topmost *registrable domain / eTLD+1*s.

##### Ungrouped domains

|                       |
| --------------------- |
| example.co.uk         |
| example2.com          |
| foo.bar.example.co.uk |
| foo.bar.example2.com  |
| www.example.co.uk     |
| www.example2.com      |

##### Grouped domains

| example.co.uk  |                       |
| -------------- | --------------------- |
|                | example.co.uk         |
|                | foo.bar.example.co.uk |
|                | www.example.co.uk     |

| example2.com   |                       |
| -------------- | --------------------- |
|                | example2.com          |
|                | foo.bar.example2.com  |
|                | www.example2.com      |

### Known Consumers

Mozilla intends to make use of this API in its [multi-account-containers](https://github.com/mozilla/multi-account-containers) extension to allow users to create containers
that include wildcard domain names: [PR #2352](https://github.com/mozilla/multi-account-containers/pull/2352). Currently, users must manually curate their containers to capture all
anticipated subdomains of a base domain, and this manual approach is cumbersome and
error-prone.

Apart from this, any other extension that already rolls its own solution in order to parse
the PSL could potentially benefit from this API, for example [uBlock Origin](https://github.com/gorhill/uBlock).

## Specification

### Schema

A new API `publicSuffix` is added as follows:

```ts
//
// Example:
//
// let domain = await browser.publicSuffix.getRegistrableDomain("www.example.co.uk");
// ==> 'example.co.uk'
//
Promise<string> browser.publicSuffix.getRegistrableDomain(
  // The domain name or URL whose registrable domain we want to find
  domainNameOrUrl: string,
)
```

### Behavior #1: Returned Promise

The promise returned by `getRegistrableDomain()` method will either:

1. Resolve with the topmost *registrable domain / eTLD+1* if it can be determined from
the `domainNameOrUrl`.
2. Reject with an `Error` / populate `browser.runtime.lastError`.

### Behavior #2: Private Domains

By default, the lookup performed by `getRegistrableDomain()` should **exclude** private domains
contained in the PSL dataset.

See [Future work](#1-extend-the-api).

### New Permissions

| Permission Added | Suggested Warning |
| ---------------- | ----------------- |
| publicSuffix     | Read the public suffix list |

### Manifest File Changes

There are no changes to the manifest.

## Security and Privacy

### Exposed Sensitive Data

The only data exposed by this API is the [public suffix list](https://publicsuffix.org/list/).

### Abuse Mitigations

This does not expose any new non-public data so there are no new abuse vectors.

### Additional Security Considerations

N/A

## Alternatives

### Existing Workarounds

Developers can download the PSL dataset, bundle it with their extensions, and implement
logic that parses and interprets the dataset in order to determine the topmost
*registrable domain / eTLD+1* for a domain name. There are several drawbacks to
this approach:

1. Potential for inconsistencies in the determination of topmost *registrable domain / eTLD+1*
by the extension and the host browser, due to differences in the version
of the PSL dataset used, and differences in the implementations that the host
browser and the extension use in order to interpret this dataset.
2. Increased complexity and maintenance costs of extensions.
3. Increased performance overhead of extensions due to bundling of bulky
PSL dataset, leading to increase in memory, disk usage and increase in CPU usage
due to possibly suboptimal extension implementations and repeating work already
done by the host browser.

### Open Web API

The purpose of this API is to eliminate the potential for inconsistency between
the host browser and its hosted extensions. The simplest way of achieving this
is for extensions to access this functionality via the host browser itself rather
than via some external source, such as an Open Web API.

It is then a determination for the host browser itself as to whether
the functionality (used by both the host browser and its extensions)
should ultimately be obtained by means of an Open Web API.

## Implementation Notes

Since the major browsers all already implement internal methods for determining
topmost *registrable domain / eTLD+1*s, it is hoped that the implementation will
involve little more than providing the relevant mechanism for exposing these same methods
to extensions:

| Browser | Registrable Domain Method |
| ------- | ------------------------- |
| Chrome  | [GetDomainAndRegistry](https://source.chromium.org/chromium/chromium/src/+/main:net/base/registry_controlled_domains/registry_controlled_domain.h;l=182;drc=4f516be19f2c1d35dc3240d050d84d10f0d6f726) |
| Firefox | [getBaseDomain](https://searchfox.org/mozilla-central/rev/e9f9bf31d1c0057a1cd339b5a853a75d1b16db39/netwerk/dns/nsIEffectiveTLDService.idl#94) |
| Safari  | [topPrivatelyControlledDomain](https://github.com/WebKit/WebKit/blob/01eba7c416725cfd4eec57ab16daffa25b8124b4/Source/WebCore/platform/PublicSuffixStore.h#L43) |

## Future Work

### 1. Extend the API

The major browsers provide additional methods/parameters internally for getting
information related to the *registable domain / eTLD+1*. The API could be extended
to expose more of these internal methods/parameters, for example:

1. Provide an option to include private domains when getting the *registrable domain / eTLD+1*.
2. Provide method `getPublicSuffix()` to get the *public suffix / eTLD*.
3. Provide methods `isRegistrableDomain()` and/or `isPublicSuffix()` for possibly improved
efficiency in certain use cases.

### 2. Batching

Extensions may want to obtain *registrable domain / eTLD+1*s for large numbers of
domain names / URLs at once. A possible enhancement to the API would be to
provide a method that performed a lookup on multiple domain names / URLs with a
single method call.

### 3. Change Notifications

The PSL dataset, used by the browsers to determine *registrable domain / eTLD+1*s,
is a dynamic dataset that can change at any time. This API proposal currently provides no
mechanism for notifying extensions when the host browser's PSL dataset changes.
It is understood that such changes are only made currently when a new browser version
is released, however this may not always be the case.

It may be useful to implement a notification mechanism so that extensions can take
appropriate action when the host browser's PSL dataset changes.
