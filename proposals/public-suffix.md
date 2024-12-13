# Proposal: Public Suffix API

**Summary**

API to obtain the *registrable domain / eTLD+1 (effective Top Level Domain+1)*
from a domain name.

**Document Metadata**

**Author:** [Francis McKenzie](https://github.com/mckenfra)

**Sponsoring Browser:** Mozilla Firefox

**Contributors:** N/A

**Created:** 2024-08-19

**Related Issues:** [#231](https://github.com/w3c/webextensions/issues/231)

## Motivation

### Objective

This API enables developers to obtain the *registrable domain / eTLD+1*
from a domain name. This functionality is already implemented for internal
use by all the major browsers. Therefore the effect of this API is to expose
existing built-in browser functionality to extensions developers.

The primary objective of this API is to eliminate the possibility of inconsistencies
between the host browser and hosted extensions when deriving
*registrable domain / eTLD+1*s from domain names.

Secondary objectives of this API are to:

1. Improve extension developer experience by reducing complexity and maintenance overhead,
since developers will no longer need to roll their own solutions for obtaining and parsing
the [Public Suffix List (PSL)](https://publicsuffix.org/list/).
2. Reduce extensions' resource usage (CPU, memory, disk space), since extensions
will no longer be duplicating work already done by the host browser.

### Features of the PSL

In order to set out the use cases fully, it is first necessary to describe certain
relevant features of the PSL.

#### 1. ICANN vs Private

The PSL it is divided into two sections: ICANN suffixes and Private (i.e. non-ICANN)
suffixes.

##### Examples

| ICANN Suffixes                | Private Suffixes (Non-ICANN)  |
|-------------------------------|------------------------------ |
| com                           | blogspot.com                  |
|                               | members.linode.com            |
|                               | simplesite.com                |
|                               |                               |
| co.uk                         | blogspot.co.uk                |
|                               | wellbeingzone.co.uk           |
|                               | vm.bytemark.co.uk             |

The suffixes in the PSL represent boundaries between registrar-type organizations
and their clients. The "owner" of the suffix is one organization, and the "owner"
of a domain label immediately preceeding the suffix is a different organization.

In the case of suffixes in the ICANN section, the "owner" of a suffix is ICANN /
an affiliated registrar. In the case of suffixes in the Private section, the
"owner" of a suffix is a private organization offering a service for clients
to take ownership of subdomains underneath its own ICANN-suffixed domain.

#### 2. Multiple Suffixes per Domain

If a domain name ends with a suffix listed in the Private section of the PSL,
then it must also end with a shorter suffix in the ICANN section. The question
of which one should be taken to be the domain's public suffix depends on the
specific use case.

##### Example

| Domain name         | Private suffix  | ICANN suffix |
|:-------------------:|:---------------:|:------------:|
| foo.bar.wixsite.com | wixsite.com     | com          |

#### 3. Known vs Unknown

If a domain name does not match any suffix in the PSL, it is considered to have
an unknown suffix. Depending on the use case, the public suffix could be taken
by default to be the last domain label of the domain name, or alternatively
the domain name could be considered invalid.

**Note:** it may be more performant to allow unknown suffixes and assume a single-label
suffix by default, because it allows the following optimisation of the lookup algorithm:
all single-label suffixes in the PSL can be excluded from the lookup, since they do not
need to be matched specifically.

#### 4. IDN

The PSL uses Unicode, and contains International Domain Name (IDN) suffixes. Depending
on the use case, when returning the *registrable domain / eTLD+1* for a domain name,
either Unicode or Punycode may be preferred.

**Note:** the [PSL algorithm](https://github.com/publicsuffix/list/wiki/Format#formal-algorithm)
requires Punycode for the matching logic. Therefore a requirement to convert Punycode
back to Unicode involves extra work. It may be preferable to avoid this in
performance-sensitive use cases.

#### Use Cases

#### 1. Filter Requests by Organization

This API is relevant to any extension that does both of the following:

* acts on web requests automatically while the user browses
* allows the user to choose which domain names the extension should act on,
and which should be ignored by the extension

In effect, such extensions allow users to create request filtering rules that
restrict the extension to acting on only web requests having specific domain names.

When choosing domain names for the request filter, users may want to be able to choose
all domain names for an organization without having to enter them each in individually.
The user may want to specify request filtering rules as follows:

| # | Filtering rule type | User value | Examples of domains affected |
|:-:|---------------------|:----------:|-----------------------------:|
| 1 | organizational base domain and all possible subdomains | myorg.co.uk | myorg.co.uk<br>subdomain1.myorg.co.uk<br>subdomain2.myorg.co.uk |
| 2 | organization name and all possible suffixes | myorg | myorg.co.uk<br>myorg.com<br>myorg.net |

To support this use case, such extensions may:

* automatically calculate the set of organization names and *registrable domain / eTLD+1*s
from a user-specified set of domain names, and propose these as filtering rules for
the user to choose
* prevent users from mistakenly specifying a *public suffix / eTLD* as a filtering rule,
believing it to be a *registrable domain / eTLD+1*, e.g. `co.uk` instead of `myorg.co.uk`
* apply the users' filtering rules automatically while the user browses by determining
the *registrable domain / eTLD+1* of each web request, and testing this using appropriate
regexes to decide whether or not to act on the request

##### PSL Requirements

| PSL Feature            | Requirement | Discussion |
|------------------------|-------------|------------|
| Allow Private Suffixes | Yes & No    | some filters may require private suffixes, others ICANN-only |
|                        |             | preventing user mistake may require both types of suffix |
| Allow Unknown Suffixes | Yes         | provides better performance |
| Preserve IDN Unicode   | Yes & No    | Unicode when viewing filters in UI, Punycode when implementing filtering logic for better performance |

#### 2. Group Domains in UI

Where extensions present lists of domain names to users, it can be beneficial
from a UX perspective to group them by their *registrable domain / eTLD+1*s.

##### Example

| No grouping           | ---------> | With grouping     |                       |
|-----------------------|------------|-------------------|-----------------------|
| example.co.uk         |            | **example.co.uk** |                       |
| example2.com          |            |                   | example.co.uk         |
| foo.bar.example.co.uk |            |                   | foo.bar.example.co.uk |
| foo.bar.example2.com  |            |                   | www.example.co.uk     |
| www.example.co.uk     |            |                   |                       |
| www.example2.com      |            | **example2.com**  |                       |
|                       |            |                   | example2.com          |
|                       |            |                   | foo.bar.example2.com  |
|                       |            |                   | www.example2.com      |

##### PSL Requirements

| PSL Feature            | Requirement | Discussion |
|------------------------|-------------|------------|
| Allow Private Suffixes | Yes & No    | optimal grouping may require either private (more groups, fewer domains per group) or ICANN-only (fewer groups, more domains per group) |
| Allow Unknown Suffixes | Yes         | grouping behaviour is the same regardless of whether suffixes are known/unknown |
| Preserve IDN Unicode   | Yes         | better UX, because users may be unfamiliar with Punycode |

#### 3. Detect Third-Party Requests

Some ad-blocker extensions allow users to create request-blocking rules that only
apply to *[third-party requests](https://help.adblockplus.org/hc/en-us/articles/360062733293-How-to-write-filters#party-requests)*. Additionally, tracker-blocking extensions
typically exclude requests from tracking detection unless they are third-party requests.

In order to determine if a request is a third-party request, such extensions lookup
the *registrable domain / eTLD+1* of the request and of the parent document using the PSL.
If the *registrable domain / eTLD+1* of the request is different to that of the parent
document, then the request is considered third-party.

##### Example of Determining if Requests are Third-Party

| Req. | Domain                      | Registrable Domain          | PSL Section | Third-party? |
|:----:|----------------------------:|----------------------------:|:-----------:|:------------:|
| #1   | foo.com                     | foo.com                     | ICANN       |              |
| #2   | bar.com                     | bar.com                     | ICANN       | Yes          |
|      |                             |                             |             |              |
| #1   | foo.amazonaws.com           | amazonaws.com               | ICANN       |              |
| #2   | bar.amazonaws.com           | amazonaws.com               | ICANN       | No           |
|      |                             |                             |             |              |
| #1   | foo.amazonaws.com           | amazonaws.com               | ICANN       |              |
| #2   | bar.us-east-1.amazonaws.com | bar.us-east-1.amazonaws.com | Private     | Yes          |

##### PSL Requirements

| PSL Feature            | Requirement | Discussion |
|------------------------|-------------|------------|
| Allow Private Suffixes | Yes         | including all suffixes in PSL means more information about third-party boundaries |
| Allow Unknown Suffixes | Yes         | provides better performance |
| Preserve IDN Unicode   | No          | provides better performance |

### Known Consumers

Mozilla intends to make use of this API in its [multi-account-containers](https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/)
extension to allow users to create containers that isolate organizational base domains:
[PR #2352](https://github.com/mozilla/multi-account-containers/pull/2352).
Currently, users must manually curate their containers to capture all anticipated subdomains
of an organization's base domain, and this manual approach is cumbersome and error-prone.

In addition to this, an analysis has been done of the relevant use cases of a selection of
other extensions that currently roll their own solutions in order to parse the PSL, and the
use cases are set out in the [Use Cases](#use-cases) section. Although the extension
authors have not been consulted directly, it is assumed that they would stand to benefit
from this API due to the reasons stated in the [Objective](#objective) section.

| Extension | Relevant use cases | Description |
|-----------|--------------------|-------------|
| [multi-account-containers](https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/) | #1, #2 | isolate requests into containers by organizational base domain, view all domains grouped by organization |
| [uBlock Origin](https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/) | #1, #2, #3 | create organization/3rd-party request-blocking rules, view request blocking status by organization, create blocking rules for specifically 3rd-party requests |
| [adblock-plus](https://addons.mozilla.org/en-US/firefox/addon/adblock-plus/) | #1, #3 | create organization/3rd-party request-blocking rules |
| [duckduckgo-for-firefox](https://addons.mozilla.org/en-US/firefox/addon/duckduckgo-for-firefox/) | #3 | exclude requests from tracking detection unless they are 3rd-party |
| [violentmonkey](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/) | #1 | run scripts automatically for requests having a specific organization name plus any suffix |

## Specification

### Schema

A new API `publicSuffix` is added as follows:

```ts
namespace publicSuffix {
  //
  // Object containing both registrable domains (i.e. ICANN/unknown, Private)
  // for a domain.
  //
  interface RegistrableDomains {
    // The original domain whose registrable domain we want
    domain: string,
    // The ICANN-suffixed or unknown-suffixed registrable domain.
    // Null if an error occurred.
    base?: string,
    // The Private-suffixed registrable domain.
    // Null if an error occurred, or if the domain has no matching Private suffix.
    private?: string,
    // Error thrown during lookup, if any.
    error?: Error,
  }

  //
  // Options that may be passed to getRegistrableDomain() to control its behaviour.
  //
  interface RegistrableDomainOptions {
    // If true, exclude private (non-ICANN) suffixes from the lookup algorithm
    excludePrivateSuffixes: boolean,
    // If true, use Punycode instead of Unicode when returning the registrable domain
    punycode: boolean,
  }

  //
  // Gets the longest registrable domain for a specified domain.
  //
  // Example:
  //
  // let domain = await browser.publicSuffix.getRegistrableDomain("www.example.co.uk");
  // ==> "example.co.uk"
  //
  export function getRegistrableDomain(
    // The domain name whose registrable domain we want to find
    domain: string,
    // Options that control the behaviour of the lookup algorithm
    options?: RegistrableDomainOptions,
  )
  // Resolves to the longest registrable domain of the input domain name
  : Promise<string>;

  //
  // Gets both registrable domains (i.e. ICANN/unknown, Private) for each domain name
  // in an array of domain names.
  //
  // Example:
  //
  // let domains = await browser.publicSuffix.getRegistrableDomains([
  //   "foo.bar.wixsite.com",
  //   "www.example.net",
  //   "a..b",
  // ]);
  // ==> [
  //   { domain: "foo.bar.wixsite.com", base: "wixsite.com", private: "bar.wixsite.com" },
  //   { domain: "www.example.net",     base: "example.net",                            },
  //   { domain: "a..b",                error: "Invalid domain name",                   },
  // ]
  //
  export function getRegistrableDomains(
    // The domain names whose registrable domains we want to find
    domains: Array<string>,
    // Options that control the behaviour of the lookup algorithm
    options?: RegistrableDomainOptions,
  )
  // Resolves to the registrable domains of each input domain name
  : Promise<Array<RegistrableDomains>>;

  //
  // Gets the PSL dataset version if available
  //
  export function getVersion(): string?;
}
```

### Behaviours

#### 1. Private Suffixes

By default, the lookup performed by `getRegistrableDomain()` should **include** all
suffixes in the PSL dataset, i.e. both ICANN and Private (non-ICANN) suffixes.

However, if an `options` object is passed to `getRegistrableDomain()` with key
`excludePrivateSuffixes` set to `true`, then Private (non-ICANN) suffixes should be
**excluded** from the lookup algorithm.

##### Example

`domain` = foo.bar.wixsite.com

| Option                                   |   Registrable Domain | PSL Section |
|------------------------------------------|:--------------------:|:-----------:|
| excludePrivateSuffixes = false (default) |      bar.wixsite.com | Private     |
| excludePrivateSuffixes = true            |          wixsite.com | ICANN       |

#### 2. Multiple Suffixes per Domain

The lookup performed by `getRegistrableDomain()` should select the **longest** matching
suffix (unless specifically excluded using the `excludePrivateSuffixes` option).

##### Example

`domain` = foo.bar.lib.de.us

| Candidate Suffix | PSL Section |
|-----------------:|:-----------:|
|            de.us | ICANN       |
|        lib.de.us | Private     |

The longest is lib.de.us, so `getRegistrableDomain()` resolves to bar.lib.de.us

#### 3. PSL Special Rules

The lookup performed by `getRegistrableDomain()` should adhere to the
[PSL algorithm](https://github.com/publicsuffix/list/wiki/Format#formal-algorithm).
In particular, it should apply the 'wildcard' and 'exception' rules in the PSL.

##### Examples

| Domain                   | Public suffix | Matched PSL rule | Explanation    | Registrable Domain |
|-------------------------:|--------------:|-----------------:|:--------------:|-------------------:|
| sub.domain.com           | com           | com              | Simple rule    | domain.com         |
| sub.domain.co.uk         | co.uk         | co.uk            | Simple rule    | domain.co.uk       |
| sub.domain.gov.ck        | gov.ck        | *.ck             | Wildcard rule  | domain.gov.ck      |
| sub.domain.any.ck        | any.ck        | *.ck             | Wildcard rule  | domain.any.ck      |
| sub.sub.domain.any.ck    | any.ck        | *.ck             | Wildcard rule  | domain.any.ck      |
| www.ck                   | ck            | !www.ck          | Exception rule | www.ck             |
| sub.www.ck               | ck            | !www.ck          | Exception rule | www.ck             |
| sub.sub.www.ck           | ck            | !www.ck          | Exception rule | www.ck             |

#### 4. Unknown Suffixes

If no matching suffix is found in the PSL for a `domain` parameter, then unless it is determined
to be specifically [invalid](#6-invalid-domain-parameter), it should be assumed the domain has a
single-label suffix.

##### Example

| Domain parameter       | Registrable domain | PSL Section |
|-----------------------:|-------------------:|:-----------:|
| www.example.foobar     | example.foobar     | n/a         |
| www.example.co.foobar  | co.foobar          | n/a         |

#### 5. IDN

The `domain` parameter passed to `getRegistrableDomain()` may be either Unicode
or Punycode.

When settling the promise returned by `getRegistrableDomain()`, the resulting
domain name should be converted to Unicode from Punycode by default.

However, if an `options` object is passed to `getRegistrableDomain()` with key
`punycode` set to `true`, then Punycode should be used instead.

##### Example

`domain` = foo.bar.example.مليسيا

| Option                     |     Registrable Domain |
|----------------------------|-----------------------:|
| punycode = false (default) |         example.مليسيا |
| punycode = true            | example.xn--mgbx4cd0ab |

#### 6. Invalid domain parameter

The promise returned by `getRegistrableDomain()` should reject if the `domain` parameter
meets any of the following criteria:
* Contains a character that is invalid in an Internationalized Domain Name (IDN) - e.g. symbols, whitespace
* Is an IP address - IPv4 or IPv6
* Is a public suffix itself - including the case of it being a single-label suffix not explicitly matched in the PSL
* Is an empty string
* Is equal to `'.'`
* Contains empty domain labels (i.e. any occurrences of `'..'`)

#### 7. Summary of behaviours

The following table sets out the eventual settled state of the promise returned by
`getRegistrableDomain()` for different classes of input `domain` parameter:

| Domain parameter   | Description                                      | Registrable domain     |
|:-------------------|:-------------------------------------------------|:-----------------------|
| example.net        | eTLD+1                                           | example.net            |
| www.example.net    | eTLD+2                                           | example.net            |
| net                | is a public suffix itself                        | Error                  |
| foobar             | no matching suffix in PSL, assume 1-label suffix | Error                  |
| net.foobar         | no matching suffix in PSL, assume 1-label suffix | net.foobar             |
| 127.0.0.1          | IP address, IPv4                                 | Error                  |
| [::1]              | IPv6 address                                     | Error                  |
| EXAMPLE.NET        | uppercase                                        | example.net            |
| .example.net       | dot in front                                     | example.net            |
| example.net.       | dot in the end, this is an FQDN                  | example.net.           |
| *.com              | contains invalid character `'*'`                 | Error                  |
| github.io          | is a public suffix in the Private section        | Error                  |
| github.io          | as above, with `excludePrivateSuffixes = true`   | github.io              |
| foobar.github.io   | has a public suffix in the Private section       | foobar.github.io       |
| foobar.github.io   | as above, with `excludePrivateSuffixes = true`   | github.io              |
| مليسيا             | this is an IDN that is also a public suffix      | Error                  |
| xn--mgbx4cd0ab     | as above, but Punycode                           | Error                  |
| foo.مليسيا         | this is an IDN                                   | foo.مليسيا             |
| foo.مليسيا         | as above, with `punycode = true`                 | foo.xn--mgbx4cd0ab     |
| foo.xn--mgbx4cd0ab | this is an IDN, but Punycode                     | foo.مليسيا             |
| foo.xn--mgbx4cd0ab | as above, with `punycode = true`                 | foo.xn--mgbx4cd0ab     |
|                    | empty string                                     | Error                  |
| .                  | no domain labels                                 | Error                  |
| example..com       | contains an empty domain label                   | Error                  |

#### 8. Batching

For [Use Case #2](#2-group-domains-in-ui), function `getRegistrableDomains()` enables
extensions to get multiple registrable domains with a single API call.

The returned promises's resolved array should contain a `RegistrableDomains` object
for each item in the input `domains` parameter, with the same ordering.

An error during the lookup of any of the domain names does not cause the returned promise
to be rejected. Instead, each such error is stored in the `error` key of the corresponding `RegistrableDomains` object for the domain name in question.

### New Permissions

| Permission Added | Suggested Warning |
| ---------------- | ----------------- |
| publicSuffix     | N/A               |

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
logic that parses and interprets the dataset in order to determine the
*registrable domain / eTLD+1* for a domain name. There are several drawbacks to
this approach:

1. Potential for inconsistencies in the determination of *registrable domain / eTLD+1*
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
*registrable domain / eTLD+1*s, it is hoped that the implementation will
largely involve providing the relevant mechanism for exposing these same methods
to extensions:

| Browser | Registrable Domain Method |
| ------- | ------------------------- |
| Chrome  | [GetDomainAndRegistry](https://source.chromium.org/chromium/chromium/src/+/main:net/base/registry_controlled_domains/registry_controlled_domain.h;l=182;drc=4f516be19f2c1d35dc3240d050d84d10f0d6f726) |
| Firefox | [getBaseDomain](https://searchfox.org/mozilla-central/rev/e9f9bf31d1c0057a1cd339b5a853a75d1b16db39/netwerk/dns/nsIEffectiveTLDService.idl#94) |
| Safari  | [topPrivatelyControlledDomain](https://github.com/WebKit/WebKit/blob/01eba7c416725cfd4eec57ab16daffa25b8124b4/Source/WebCore/platform/PublicSuffixStore.h#L43) |

However, differences may exist in the implementations of these internal methods. Therefore
there may be additional effort involved in testing that the existing internal methods
conform to the expected behaviours of the API in this proposal.

## Future Work

### 1. Extend the API

The major browsers provide additional methods/parameters internally for getting
information related to the *registrable domain / eTLD+1*. The API could be extended
to expose more of these internal methods/parameters, if relevant use cases for such
additional functionality are identified. For example:

1. Provide method `getPublicSuffix()` to get the *public suffix / eTLD*.
2. Provide methods `isRegistrableDomain()` and/or `isPublicSuffix()` for possibly improved
efficiency in certain use cases.
3. Provide an option to require that `getRegistrableDomain()` must explicitly match a
public suffix in the PSL (i.e. the domain must have a "known" suffix).

### 2. Change Notifications

The PSL dataset, used by the browsers to determine *registrable domain / eTLD+1*s,
is a dynamic dataset that can change at any time. Although this API provides a function
for retrieving the current version of the PSL dataset used by the browser, no mechanism
is provided for notifying extensions when the host browser's PSL dataset changes. It is
understood that such changes are only made currently when a new browser version
is released, however this may not always be the case.

It may be useful to implement a notification mechanism so that extensions can take
appropriate action when the host browser's PSL dataset changes, to avoid having to
poll the `getVersion()` function provided by this API.
