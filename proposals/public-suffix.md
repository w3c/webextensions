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
(henceforth *registrable domain*)
from a domain name. This functionality is already implemented for internal
use by all the major browsers. Therefore the effect of this API is to expose
existing built-in browser functionality to extensions developers.

The primary objective of this API is to eliminate the possibility of inconsistencies
between the host browser and hosted extensions when deriving
registrable domains from domain names.

Secondary objectives of this API are to:

1. Improve extension developer experience by reducing complexity and maintenance overhead,
since developers will no longer need to roll their own solutions for obtaining and parsing
the [Public Suffix List](https://publicsuffix.org/list/) (henceforth *PSL*).
2. Reduce extensions' resource usage (CPU, memory, disk space), since extensions
will no longer be duplicating work already done by the host browser.

### Features of the PSL

When determining the registrable domain of a candidate domain name, the major browsers
all make use of the PSL, which is a dataset containing known *public suffix / eTLD*
(henceforth *eTLD*) values.

The following sections set out the PSL's main characteristics and discusses how
they may be handled in the eventual API.

#### 1. ICANN vs Private

The eTLDs in the PSL are divided into two sections: an ICANN section and a Private
(i.e. non-ICANN) section.

##### Examples

| ICANN Section                 | Private Section               |
|-------------------------------|-------------------------------|
| com                           | blogspot.com                  |
|                               | members.linode.com            |
|                               | simplesite.com                |
|                               |                               |
| co.uk                         | blogspot.co.uk                |
|                               | wellbeingzone.co.uk           |
|                               | vm.bytemark.co.uk             |

In the case of eTLDs in the ICANN section, the "owner" of an eTLD is ICANN /
an affiliated registrar. In the case of eTLDs in the Private section, the
"owner" of an eTLD is a private organization offering a service for clients
to take ownership of subdomains underneath its own ICANN-suffixed domain.

At first glance, it might seem that knowing which section an eTLD is from
could give useful information as to whether or not it is an "official"
ICANN-designated eTLD. In practice, however, the distinction
between the two sections is somewhat arbitrary and not well-defined.
This is due to the inherent challenges in maintaining and curating the
PSL dataset, which relies on the cooperation of registrars.

##### 1.1 Issues

In order to construct the eTLD list in the ICANN section, the maintainers of
the PSL start by taking the "official" ICANN/IANA TLDs, which are only the
very last single-label suffixes. These are set out in the following lists:

* [IANA](https://www.iana.org/domains/root/db)
* [gTLD](https://www.icann.org/resources/registries/gtlds/v2/gtlds.json)

In addition to these two sources, the PSL maintainers try to get in touch with
the ICANN-affiliated registrars to get them to update their "official" subdomains
or to ask questions, but this is often unsuccessful.

Examples of issues with the supposedly "official" ICANN-section eTLDs are:

* while the `.au` entries in the PSL are in the ICANN section, the relevant parties
cannot agree what their "official" eTLDs are.
* `bd` has a wildcard `*.bd` entry in the ICANN section, meaning any domain label
can be prepended to `.bd` and it is automatically an "official" ICANN eTLD.
* `.co.uk` is in the ICANN section but the actual IANA TLD is still only `.uk`.

##### 1.2 Recommendation

Due to the ad hoc nature of the PSL sections, it is recommended that consumers of
the PSL should:

* treat the PSL dataset as a single eTLD list (i.e. both sections combined)
* not derive any significant meaning from the section in which an eTLD is located

For this reason, this proposal's API should use all of the PSL's eTLDs and
should not expose information about the specific section (ICANN vs Private)
eTLDs are assigned to.

#### 2. Multiple eTLDs per Domain

For any given domain name, there may be multiple matching eTLDs in the PSL.

##### Example

| Domain name          | Matching eTLDs in PSL | Implied registrable domain |
|----------------------|----------------------:|---------------------------:|
| foo.bar.wixsite.com  |           wixsite.com |            bar.wixsite.com |
|                      |                   com |                wixsite.com |
|                      |                       |                            |
| foo.bar.paris.eu.org |          paris.eu.org |           bar.paris.eu.org |
|                      |                eu.org |               paris.eu.org |
|                      |                   org |                     eu.org |

All of the identified use cases in this proposal make use of the
registrable domain in order to carry out some action (e.g. malware-blocking)
based on the organization responsible for the domain's content, not the
associated registrar(s). Of the possible registrable domains for a given
domain, the only one that designates the content-owning organization
is the *longest one*. All of the other registrable domains designate
the registrars, who play a passive role and are not responsible for the
full domain's content.

Therefore, in the case of a candidate domain having multiple eTLDs and consequently
multiple possible registrable domains, the API in this proposal will only calculate
the longest registrable domain, which designates the candidate domain's content owner.
The API will not provide a means of determining the registrable domain(s)
of the associated registrars.

#### 3. Known vs Unknown

If a domain name does not match any eTLD in the PSL, it is considered to have
an "unknown" eTLD.

##### 3.1 Non-public eTLDs

A specific situation where a valid domain name may legitimately have an
unknown eTLD is when an intranet has custom non-public hostnames.
E.g. `printer.homenet` and `backup.homenet` would not match any entry in the PSL,
but are likely part of the same internal structure having the non-public eTLD `homenet`.

##### 3.2 Incomplete / old PSL datasets

A candidate domain may have a known eTLD, but may still be incorrectly deemed
by the algorithm to have an unknown eTLD if the PSL dataset used by the algorithm
has not yet been updated to include that particular eTLD. As of the date of this
proposal, such an eventuality is somewhat likely because the major browsers only update
their PSL datasets when releasing new browser versions. This introduces a certain delay
between the time when new eTLDs are offered by registrars, and the time when
those same eTLDs are present in the PSL datasets stored in users' browsers.

##### 3.3 Algorithm performance

It may be more performant to allow unknown eTLDs and assume a single-label
eTLD by default. The PSL algorithm starts with a candidate domain name and
removes labels in turn until a matching eTLD is found. For any unknown-suffixed
candidate domain (regardless of how many labels it has), the algorithm will always
reach the final label without finding any matches in the PSL. At this point, if it
is allowable to assume that all unknown single-label eTLDs are valid, then
certain optimisations to the algorithm are possible as follows:

###### 3.3.1 Optimisation: fewer PSL searches

The algorithm can avoid doing the final search against the PSL using the final label.
This may save a few CPU cycles for every candidate domain lookup.

Example candidate domain: `foo.bar.baz`

| Step | Domain | Search in PSL? |
|:----:|:------:|:------:|
| 1 | `foo.bar.baz` | yes |
| 2 | `bar.baz` | yes |
| 3 | `baz` | no |

It is unclear how much of a performance benefit such an optimization would give
in practice.

###### 3.3.2 Optimisation: smaller browser footprint

The browser can avoid storing *any* single-label eTLDs on disk or in memory.
This allows a possible reduction in browser startup time, since it is loading fewer
PSL eTLDs into memory from disk, and thereafter lower browser memory usage due to
holding fewer PSL eTLDs in memory.

However, this is a moot point if browsers already need to distinguish known from
unknown eTLDs for the purposes of other browser functionality unrelated to this
proposal; in that case, the full PSL dataset (including all single-label eTLDs)
is already available and therefore this proposal would not be adding any overhead
in terms of browser footprint due to storing the entire PSL.

For example, Firefox *does* already need to distinguish known vs unknown eTLDs,
when determining whether to search or navigate upon receiving input into the url bar
(described in the [Use Cases](#use-cases) section).

##### 3.4 Recommendation

It is recommended that this API should provide the ability to determine whether
or not a candidate domain has a known eTLD.

#### 4. IDN

The PSL uses Unicode, and contains International Domain Name (IDN) eTLDs. Depending
on the use case, when returning the registrable domain for a domain name,
either Unicode or Punycode may be preferred.

According to a possible [PSL algorithm](https://github.com/publicsuffix/list/wiki/Format#formal-algorithm)
for interpreting the PSL dataset, candidate domains should be converted to Punycode
before matching against the PSL. Therefore, a requirement to convert Punycode
back to Unicode would involve extra work, and it may be preferable to avoid this in
performance-sensitive use cases. However, it has been suggested that this PSL algorithm
is not authoritative. Indeed, any algorithm used to interpret the PSL dataset is likely
to be fairly trivial, since it essentially involves comparing labels for equality.

Further points to consider in this context are:

* Punycode may be the most appropriate encoding to use, since a Punycode hostname is a
valid URL whereas a Unicode hostname is not. Therefore Punycode may be the most sane default.

* When this API is used to obtain registrable domains intended for display to the user,
it is likely that the end result will at some point need to be converted to Unicode,
since users may be less familiar with Punycode.

##### 4.1 Recommendation

It is recommended that registrable domains should be returned as Punycode by default,
but the API should also provide an option to convert these to Unicode.

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
| 2 | organization name and all possible eTLDs | myorg | myorg.co.uk<br>myorg.com<br>myorg.net |

To support this use case, such extensions may:

* automatically calculate the set of organization names and registrable domains
from a user-specified set of domain names, and propose these as filtering rules for
the user to choose
* provide a warning to users if they specify an eTLD as a filtering rule,
believing it to be a registrable domain, e.g. `co.uk` instead of `myorg.co.uk`
(however eTLDs *do* in fact sometimes have websites, therefore it would be a mistake
to entirely prevent a user from using an eTLD as a filter)
* apply the users' filtering rules automatically while the user browses by determining
the registrable domain of each web request, and testing this using appropriate
regexes to decide whether or not to act on the request

#### 2. Group Domains in UI

Where extensions present lists of domain names to users, it can be beneficial
from a UX perspective to group them by their registrable domains.

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

#### 3. Detect Third-Party Requests

Some ad-blocker extensions allow users to create request-blocking rules that only
apply to *[third-party requests](https://help.adblockplus.org/hc/en-us/articles/360062733293-How-to-write-filters#party-requests)*. Additionally, tracker-blocking extensions
typically exclude requests from tracking detection unless they are third-party requests.

In order to determine if a request is a third-party request, such extensions lookup
the registrable domain of the request and of the parent document using the PSL.
If the registrable domain of the request is different to that of the parent
document, then the request is considered third-party.

##### Example of Determining if Requests are Third-Party

| Req. | Domain                      | Registrable Domain          | Third-party? |
|:----:|----------------------------:|----------------------------:|:------------:|
| #1   | foo.com                     | foo.com                     |              |
| #2   | bar.com                     | bar.com                     | Yes          |
|      |                             |                             |              |
| #1   | foo.amazonaws.com           | amazonaws.com               |              |
| #2   | bar.amazonaws.com           | amazonaws.com               | No           |
|      |                             |                             |              |
| #1   | foo.amazonaws.com           | amazonaws.com               |              |
| #2   | bar.us-east-1.amazonaws.com | bar.us-east-1.amazonaws.com | Yes          |

#### 4. Search vs Navigate

Firefox makes use of the PSL in order to determine whether to issue a search query
or whether to try a navigation, when a user enters a domain-like string in the
url bar. In such instances, a PSL lookup is made and:

* If the domain has a known eTLD, attempt to navigate.
* If the domain has an unknown eTLD, use a search engine.

#### 5. Site-specific data

Extensions sometimes need to associate data with a hostname's "site", which may be:

* a registrable domain (i.e. with a known eTLD)
* an IP address
* an intranet hostname with a non-public (i.e. unknown) eTLD, or without any suffix

Examples of this kind of data include cookies and password autofill.

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
| [violentmonkey](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/) | #1 | run scripts automatically for requests having a specific organization name plus any eTLD |

## Specification

### Schema

A new API `publicSuffix` is added as follows:

```ts
namespace publicSuffix {


  // METHODS

  // Determines if the given hostnames have the same registrable domain.
  export function hasSameRegistrableDomain(
    hostname1: string,
    hostname2: string,
    options?: RegistrableDomainOptions,
  ) : Promise<boolean>;

  // Gets the registrable domain of a given hostname.
  export function getRegistrableDomain(
    hostname: string,
    options?: RegistrableDomainOptions,
  )
  : Promise<string | null>;

  // Gets the registrable domain of each hostname in a given list of hostnames.
  export function getRegistrableDomains(
    hostnames: Iterable<string>,
    options?: RegistrableDomainOptions,
  )
  : Promise<Array<RegistrableDomainResult>>;

  // Determines which one of the following kinds of value applies to each hostname
  // in a list of hostnames:
  //   RegistrableDomain
  //   PublicSuffix
  //   IPAddress
  //   Unknown
  //   Invalid
  export function parse(
    hostnames: Iterable<string>,
  )
  : Promise<Array<ParseResult>>

  // Gets the value of the VERSION metadata field in the PSL dataset if available
  export function getVersion(): string | null;


  // INTERFACES

  // Options that may be passed to the API's methods to control their behaviour.
  interface RegistrableDomainOptions {
    // If true, each resulting registrable domain should be encoded as Unicode.
    // Default = false (Punycode)
    unicode?: boolean,
    // If false, IP addresses and hostnames lacking a known eTLD are
    // treated as having registrable domains.
    // Default = true
    strict?: boolean,
  }

  // Object containing the result of calculating the registrable domain of one of
  // the hostnames in the input list.
  interface RegistrableDomainResult {
    // A string, either "fulfilled" or "rejected", indicating the eventual state of the promise.
    status: string,
    // Only present if status is "fulfilled". The resulting registrable domain.
    value?: string | null,
    // Only present if status is "rejected". The reason that the promise was rejected with.
    reason?: string,
  }

  // Object containing the result of parsing a hostname.
  interface ParseResult {
    // The value obtained from the hostname.
    value: string | null,
    // The kind of value obtained, which must be one of the following:
    //   RegistrableDomain
    //   PublicSuffix
    //   IPAddress
    //   Unknown
    //   Invalid
    kind: string,
  }
}
```

### Behaviours

#### 1. PSL Sections

Lookups of the PSL dataset should **include** all eTLDs from both PSL sections,
i.e. both ICANN-section and Private-section eTLDs.

#### 2. Multiple eTLDs per Domain

Lookups of the PSL dataset should always select the **longest** matching eTLD
when determining the registrable domain.

##### Example

`domain` = foo.bar.lib.de.us

|  Matching eTLDs |
|----------------:|
|       lib.de.us |
|           de.us |

The longest is lib.de.us, so `getRegistrableDomain()` resolves to bar.lib.de.us

#### 3. PSL Special Rules

It is noted that the major browsers currently have their own implementations
of the PSL-handling logic, and attempts to standardise the various implementations
across browsers have thus-far been unsuccessful. Therefore it is proposed that the
browsers should follow their existing PSL-handling rules when implementing this
proposal's API.

For informational purposes, examples of the 'wildcard' and 'exception' rules
in the PSL are given below. These are described in more detail in a possible
[PSL algorithm](https://github.com/publicsuffix/list/wiki/Format#formal-algorithm).

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

#### 4. Strict

By default, if a hostname lacks a known eTLD (i.e. in the PSL), its registrable domain
is `null`.

The same applies if the hostname is an IP address - IPv4 or IPv6. This avoids any
possibility of `100.200.30.2` and `100.200.31.2` being interpreted as belonging to the
same organization (i.e. with eTLD `.2`).

In order to support use cases that need to determine a hostname's "site",
a `strict` option is provided, allowing a more general-purpose interpretation of
what constitutes a registrable domain that includes IP addresses and unknown eTLDs.

If a hostname lacks a known eTLD, and the option `strict` is set to `false`,
then the registrable domain is determined by the type of hostname as follows:

| Input hostname     | Registrable domain                                  |
|--------------------|-----------------------------------------------------|
| IP address         | the input hostname itself (i.e. an IP address)      |
| Non IP-address     | the last domain label (i.e. an unknown TLD)         |

##### Examples: Registrable domains

| Input hostname         |  strict = true | strict = false |
|------------------------|---------------:|---------------:|
| 1.2.3.4                |           null |        1.2.3.4 |
| printer.homenet        |           null |        homenet |
| com                    |           null |            com |

#### 5. IDN

All API methods should accept domains passed as input parameters using either
Unicode or Punycode encoding.

Methods that return registrable domains should encode them using Punycode
encoding by default, unless an `options` object is passed as an input parameter
with key `unicode` set to `true`, in which case they should be encoded
using Unicode encoding.

##### Example

`domain` = foo.bar.example.مليسيا

| Option                     |     Registrable Domain |
|----------------------------|-----------------------:|
| unicode !== true (default) | example.xn--mgbx4cd0ab |
| unicode === true           |         example.مليسيا |

#### 6. Invalid hostname

The promises returned by this API's methods should reject with an error if a hostname
passed as an input parameter meets any of the following criteria:

* Contains a character that is invalid in an Internationalized Domain Name (IDN) - e.g. symbols, whitespace
* Is an empty string
* Is equal to `'.'`
* Contains empty domain labels (i.e. any occurrences of `'..'`)

#### 7. Summary of behaviours

The following table sets out the eventual settled state of the promise returned by
`getRegistrableDomain()` for different classes of input `hostname` parameter:

| Input hostname     | Description                                      | Registrable domain     |
|:-------------------|:-------------------------------------------------|-----------------------:|
| example.net        | eTLD+1                                           | example.net            |
| www.example.net    | eTLD+2                                           | example.net            |
| net                | is an eTLD itself, single-label                  | null                   |
| net                | as above, with `strict === false`                | net                    |
| github.io          | is an eTLD itself, multi-label                   | github.io              |
| foobar             | no matching eTLD in PSL, single-label            | null                   |
| foobar             | as above, with `strict === false`                | foobar                 |
| net.foobar         | no matching eTLD in PSL, multi-label             | null                   |
| net.foobar         | as above, with `strict === false`                | foobar                 |
| foobar.net         | has an eTLD in the ICANN section                 | foobar.net             |
| foobar.github.io   | has an eTLD in the Private section               | foobar.github.io       |
| 127.0.0.1          | IP address, IPv4                                 | null                   |
| 127.0.0.1          | as above, with `strict === false`                | 127.0.0.1              |
| [::1]              | IPv6 address                                     | null                   |
| [::1]              | as above, with `strict === false`                | [::1]                  |
| EXAMPLE.NET        | uppercase                                        | example.net            |
| .example.net       | dot in front                                     | example.net            |
| example.net.       | dot in the end, this is an FQDN                  | example.net.           |
| مليسيا             | this is an IDN that is also an eTLD              | null                   |
| xn--mgbx4cd0ab     | as above, but Punycode                           | null                   |
| foo.مليسيا         | this is an IDN                                   | foo.xn--mgbx4cd0ab     |
| foo.مليسيا         | as above, with `unicode === true`                | foo.مليسيا             |
| foo.xn--mgbx4cd0ab | this is an IDN, but Punycode                     | foo.xn--mgbx4cd0ab     |
| foo.xn--mgbx4cd0ab | as above, with `unicode === true`                | foo.مليسيا             |
| *.com              | contains invalid character `'*'`                 | Error                  |
|                    | empty string                                     | Error                  |
| .                  | no domain labels                                 | Error                  |
| example..com       | contains an empty domain label                   | Error                  |

#### 8. Comparing registrable domains

Method `hasSameRegistrableDomain(hostname1, hostname2)` is suited in particular to
[Use Case #3: Detect Third-Party Requests](#3-detect-third-party-requests),
since it provides a simple way of comparing registrable domains.

This method should resolve to `true` if and only if the computed registrable domains
are **equal and nonnull**.

The calculation of the registrable domains should apply the `strict` option if specified,
allowing IP addresses and unknown registrable domains to be compared.

##### Examples: Has same registrable domain

Given `homenet` and `mywork` are not eTLDs in the PSL:

| hostname1           | hostname2        |  strict === true | strict === false |
|---------------------|------------------|-----------------:|-----------------:|
| foo.example.com     | bar.example.com  | true             | true             |
| foo.example.com     | bar.example2.com | false            | false            |
| printer.homenet     | printer.mywork   | false            | false            |
| printer.homenet     | printer.homenet  | false            | true             |
| printer.homenet     | backup.homenet   | false            | true             |
| 1.2.3.4             | 1.2.3.4          | false            | true             |
| 1.2.3.4             | 2.2.3.4          | false            | false            |

#### 9. Parsing

Method `parse(hostnames)` is suited to use cases that need to determine the "site"
of a hostname. It is the counterpart to calling `getRegistrableDomain()` with the
`strict = false` option, in that it gets a hostname's registrable domain if possible,
or otherwise the most appropriate alternative value.

The key difference is that the `parse()` method also returns an indicator of the
kind of value that was returned, not just the value itself. In addition,
the `parse()` method does not throw an error if the hostname is invalid.

The `kind` value of the returned object must be one of the following:
`RegistrableDomain`, `PublicSuffix`, `Unknown`, `IPAddress`, `Invalid`.

##### Examples: parse result

| Input hostname  | Parse: value   | Parse: kind       | Explanation                       |
|-----------------|----------------|-------------------|-----------------------------------|
| foo.example.com |    example.com | RegistrableDomain | eTLD+1 with a known eTLD          |
| com             |    com         | PublicSuffix      | Known eTLD lacking a +1 label     |
| printer.homenet |    homenet     | Unknown           | Lacking a known eTLD              |
| 1.2.3.4         |    1.2.3.4     | IPAddress         | An IP address                     |
| *.com           |    null        | Invalid           | Contains invalid character '*'    |

##### 9.1 Justification for parsing

Some use cases may have need for the more fine-grained functionality offered by `parse()`
than that of the other API methods in this proposal. For example, if Firefox's
[Search vs Navigate](#4-search-vs-navigate) functionality was based purely on the return
value of `getRegistrableDomain()`, i.e. navigate if nonnull or search if null,
then IP addresses would incorrectly cause a search. However, it would be possible using
this `parse()` method to group IP addresses and known registrable domains together,
by checking the `kind` value of each parse result object.

#### 10. Batching

Method `getRegistrableDomains()` is suited in particular to
[Use Case #2: Group Domains in UI](#2-group-domains-in-ui), since it enables
extensions to get the registrable domains of multiple domains with a single API call.

This method is equivalent to calling `Promise.allSettled()` using the results of multiple
individual calls to `getRegistrableDomain()`. E.g. for three domains:

```
Promise.allSettled(
  publicSuffix.getRegistrableDomain(domain1),
  publicSuffix.getRegistrableDomain(domain2),
  publicSuffix.getRegistrableDomain(domain3),
)
```

The promise returned by `getRegistrableDomains()` mirrors that returned by `Promise.allSettled()`:
the fulfilment value is an array of `RegistrableDomainResult` objects, in the order of the
input domains passed, with the same fields as those of `Promise.allSettled()`. For each valid
input domain, the `status` field of the corresponding `RegistrableDomainResult` object is `fulfilled`
and the `value` field is the registrable domain, or `null` if the input domain has an unknown eTLD.

An error during the lookup of any of the domain names does not cause the returned promise
to be rejected. Instead, the corresponding fulfilment object has the `status` field
set to `rejected` and the `reason` field holds the error description.

##### 10.1 Justification for batching

As stated, the same information provided by `getRegistrableDomains()` could be obtained
by simply calling `getRegistrableDomain()` multiple times.

The problem with this approach is that there is overhead associated with an extension
calling an async function on the parent browser. For example, obtaining the registrable domain
for a list of 50 domains would involve making 50 async calls to the parent browser.
However, with the batching approach afforded by `getRegistrableDomains()`, only
a single async call to the parent browser would be made, passing all 50 domains at once.

A quick mockup of the two approaches was built using a simplified implementation
of this proposal's API in a modified Firefox, and the batching approach was
about 2-3 times faster for 50 domains.

#### 11. PSL Version

Versioning metadata was introduced into the PSL with [this commit](https://github.com/publicsuffix/list/issues/1808#issuecomment-2455793503).

Method `getVersion()` of this API should return the value of the
VERSION metadata field contained in the specific PSL dataset used by the browser.

### New Permissions

| Permission Added | Suggested Warning |
| ---------------- | ----------------- |
| publicSuffix     | N/A               |

Method `publicSuffix.getVersion()` may theoretically contribute to making the browser
fingerprintable. However, it is already possible for malicious sites to get the browser's
version, therefore this API does not introduce significant additional fingerprintability.

### Manifest File Changes

There are no changes to the manifest.

## Security and Privacy

### Exposed Sensitive Data

The only data exposed by this API is the [public suffix list](https://publicsuffix.org/list/).

### Abuse Mitigations

This does not expose any new non-public data, nor does it significantly increase
browser fingerprintability, so there are no new abuse vectors.

### Additional Security Considerations

N/A

## Alternatives

### Existing Workarounds

Developers can download the PSL dataset, bundle it with their extensions, and implement
logic that parses and interprets the dataset in order to determine the
registrable domain for a domain name. There are several drawbacks to
this approach:

1. Potential for inconsistencies in the determination of registrable domains
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
registrable domains, it is hoped that the implementation will
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
information related to the registrable domain. The API could be extended
to expose more of these internal methods/parameters, if relevant use cases for such
additional functionality are identified. For example:

1. Provide method `getPublicSuffix()` to get the eTLD as opposed to the registrable domain.
2. Provide method `isPublicSuffix()` and/or `isRegistrableDomain()` for possibly improved
efficiency in certain use cases.

### 2. Registrable Domains of Registrars

In the case where a domain has multiple matching eTLDs in the PSL and therefore
more than one possible registrable domain, this proposal's API always selects
the longest one. In other words, the API only provides the registrable domain
of the domain's content-owning organization, and not that of any
associated registrars.

Theoretically, there may be cases where all organizations using a certain
registrar are behaving similarly (e.g. distributing malware), and therefore
extensions may want to provide support for carrying out some action
(e.g. malware blocking) against the shared registrar itself, rather than against
each individual content-owning organization. Support for any such use case
could be handled in a future update to this API.

### 3. Change Notifications

The PSL dataset, used by the browsers to determine registrable domains,
is a dynamic dataset that can change at any time. Although this API provides a function
for retrieving the current version of the PSL dataset used by the browser, no mechanism
is provided for notifying extensions when the host browser's PSL dataset changes. It is
understood that such changes are only made currently when a new browser version
is released, however this may not always be the case.

It may be useful to implement a notification mechanism so that extensions can take
appropriate action when the host browser's PSL dataset changes, to avoid having to
poll the `getVersion()` function provided by this API.
