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

It is noted that filtering rule type #2 should only be supported by this proposal
as it applies to calculating the registrable domain of an incoming web request,
and using that registrable domain to compare against filtering rules to find a match.
Other than this, there is also a declarative use case that entails auto-generating
all filtering rules for every possible known eTLD that could be matched by
an input filtering rule such as `myorg.*`. This kind of declarative use case is
out of scope, and will not be enabled by this proposal.

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

  // Determines if the given hostname is itself a known eTLD (i.e. in the PSL).
  export function isKnownPublicSuffix(
    hostname: string,
  )
  : boolean;

  // Gets the known eTLD, if any, of a given hostname.
  export function getKnownPublicSuffix(
    hostname: string,
  )
  : string | null;

  // Gets the registrable domain of a given hostname.
  export function getRegistrableDomain(
    hostname: string,
    options?: RegistrableDomainOptions,
  )
  : string | null;

  // Gets the value of the VERSION metadata field in the PSL dataset if available
  export function getVersion(): string | null;


  // INTERFACES

  // Options that may be passed to the API method to control its behaviour.
  interface RegistrableDomainOptions {
    // If true, the resulting registrable domain should be encoded as Unicode.
    // Default = false (Punycode)
    unicode?: boolean,
    // If true, an IP address is a registrable domain.
    // Default = false
    allowIP?: boolean,
    // If true, a known eTLD is a registrable domain.
    // Default = false
    allowPlainSuffix?: boolean,
    // If true, a hostname that lacks a known eTLD is a registrable domain.
    // Default = false
    allowUnknownSuffix?: boolean,
  }

}
```

### Behaviours

#### 1. PSL Algorithm

The major browsers currently have their own implementations of the PSL-handling logic,
and attempts to standardise the various implementations across browsers have thus-far been unsuccessful. A possible [PSL algorithm](https://github.com/publicsuffix/list/wiki/Format#formal-algorithm)
is available, but this may not be authoritative. Therefore it is proposed
that the browsers should follow their existing PSL-handling logic when implementing
this proposal's API. Key features of the algorithm are highlighted here
for informational purposes.

##### 1.1 PSL Sections

Lookups of the PSL dataset should **include** all eTLDs from both PSL sections,
i.e. both ICANN-section and Private-section eTLDs.

##### 1.2 Multiple eTLDs per Domain

Lookups of the PSL dataset should always select the **longest** matching eTLD
when determining the registrable domain.

###### Example

`domain` = foo.bar.lib.de.us

|  Matching eTLDs |
|----------------:|
|       lib.de.us |
|           de.us |

The longest is lib.de.us, so the API's methods yield the following:

|        eTLD | Registrable Domain |
|------------:|-------------------:|
|   lib.de.us |      bar.lib.de.us |

##### 1.3 eTLD vs Registrable Domain

According to the [URL specification](https://url.spec.whatwg.org/#host-registrable-domain),
any domain that is itself an eTLD in the PSL cannot have a registrable domain.
However, reviewers of this proposal have noted that some PSL eTLDs do have their own websites,
e.g. github.io and blogspot.com. Therefore it may be worthwhile updating the PSL algorithm
to allow registrable domains to be obtained from known eTLDs, and browsers would subsequently
need to update their implementations.

Given this proposal's API exposes the host browser's existing PSL-handling logic,
by default this API should treat known eTLDs as not having registrable domains.

##### 1.4 PSL Special Rules

Entries in the PSL dataset include instances of 'wildcard' and 'exception' rules,
whose effects are demonstrated using the following examples.

###### Examples

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

#### 2. API Methods

##### 2.1 Public Suffix

Method `getKnownPublicSuffix()` returns the input hostname's known eTLD (i.e. in the PSL)
if it has one, otherwise `null`.

Method `isKnownPublicSuffix()` returns `true` if and only if the input hostname is itself
a known eTLD. In other words, this method returns `true` if calling `getKnownPublicSuffix()`
with the input hostname returns the input hostname itself.

These methods are included in the API because the PSL algorithm returns the longest eTLD,
but sometimes one may be interested in knowing whether there is any other shorter eTLD
that might have matched the input hostname in theory. E.g. 'github.io' is a
public suffix itself, but could also be interpreted as a registrable domain
whose public suffix is 'io'.

###### Examples

| Input hostname | Public Suffix |
|----------------|--------------:|
|      github.io |     github.io |
|  foo.github.io |     github.io |
| facebook.co.uk |         co.uk |
|    192.168.2.1 |          null |
|   green.banana |          null |

##### 2.2 Registrable Domain

Method `getRegistrableDomain()` returns the input hostname's registrable domain,
as determined by running the PSL algorithm, otherwise `null`.

By default, this method returns `null` if the input hostname:

* lacks a known eTLD (i.e. in the PSL)
* is itself a known eTLD
* is an IP address - IPv4 or IPv6

##### 2.2.1 Options: Registrable Domain

In order to support different use cases including those that need to determine
a hostname's "site", additional options are provided, allowing a more
general-purpose interpretation of what constitutes a registrable domain
that includes IP addresses and unknown eTLDs.

Options `allowIP`, `allowPlainSuffix` and `allowUnknownSuffix` each target
a specific kind of input hostname lacking a registrable domain
in the strictest sense (i.e. having a known eTLD as stipulated by
the PSL algorithm), as follows:

| Option             | Kind of Input Hostname Targetted |
|--------------------|---------------------------------:|
| allowIP            | IP Address (IPv4 of IPv6)        |
| allowPlainSuffix   | is itself a known eTLD           |
| allowUnknownSuffix | lacks a known eTLD               |

The effect of each option when applied to an input hostname of the
kind targetted by the option is to change the registrable domain
from being `null` to being instead *the full input hostname itself*.

###### Examples

| Input hostname    | Option = true      | Registrable domain |
|-------------------|--------------------|-------------------:|
| 192.168.2.1       | allowIP            |        192.168.2.1 |
| github.io         | allowPlainSuffix   |          github.io |
| apple.pear.banana | allowUnknownSuffix |  apple.pear.banana |

##### 2.2.2 Options: Justification

Option `allowUnknownSuffix` supports use cases that need to target
not only domains on the internet having known eTLDs, but also
intranet hostnames having non-public (i.e. unknown) suffixes, or no suffix.

Reviewers of this proposal note that if it were the case that non-domains
were included by default, `getRegistrableDomain()` would effectively
return a string for almost every input.

As a result of the inclusion of unknown suffixes, the API implementation must
take care to ensure input hostnames that are IP addresses (IPv4 or IPv6) are detected
*before* running the algorithm. IP addresses must be treated differently,
otherwise it would be possible for `100.200.30.2` and `100.200.31.2` to be
mistakenly interpreted as belonging to the same organization (i.e. with unknown eTLD `.2`).

Option `allowIP` supports use cases needing to obtain a hostname's site,
which may be an IP address or a domain name.

An example of such a use case is Firefox's [Search vs Navigate](#4-search-vs-navigate),
which involves determining if an entry in the URL bar is a navigable site,
or a search term. If this functionality was based purely on the return value
of `getRegistrableDomain()`, i.e. navigate if nonnull or search if null,
then IP addresses would incorrectly cause a search. By using the `allowIP` option,
the return value for an input IP address would be the IP address itself instead of null,
thereby causing the desired result of navigating instead of searching.

Option `allowPlainSuffix` only exists because there are domains that do not have
a registrable domain, due to themselves being PSL eTLDs, but can still be
navigated to, such as github.io and blogspot.com.

##### 2.2.3 Options: Discussion

The effect of the options is that `getRegistrableDomain()` may return values
that are not registrable domains in the strictest sense, e.g. they may
be IP addresses.

The author of this proposal is of the view that:

1. Any method named `getXYZ()` should return a value of type `XYZ`. Therefore
`getRegistrableDomain()` may not be the most suitable name, since it does
not always return true registrable domains. Reviewers of this proposal
feel this is not a significant enough issue to warrant alternative naming.

2. This API should provide a way not just to get a hostname's
registrable-domain-like value, but also to know what kind of value that is,
be it an IP address, a domain name, or an intranet hostname lacking a known eTLD.
Reviewers of this proposal are of the view that no compelling use case has been
identified to support the need for such additional functionality. However,
reviewers have conceded that IP addresses have to be special-cased, because for
most domain inputs, one could split at dots to try and get a different domain level,
but that logic does not make sense for IP addresses. By not providing a way of
knowing whether the return value of `getRegistrableDomain()` is an IP address
or a domain name, it is more difficult for users of this API to implement
the special-casing that the reviewers have identified.

#### 3. IDN

All API methods should accept hostnames passed as input parameters using either
Unicode or Punycode encoding.

Methods that return registrable domains or eTLDs should encode them using Punycode
encoding by default, unless an `options` object is passed as an input parameter
with key `unicode` set to `true`, in which case they should be encoded
using Unicode encoding.

##### Example

`domain` = foo.bar.example.مليسيا

| Option                     |     Registrable Domain |
|----------------------------|-----------------------:|
| unicode == false (default) | example.xn--mgbx4cd0ab |
| unicode == true            |         example.مليسيا |

#### 4. Invalid hostname

The promises returned by this API's methods should reject with an error if a hostname
passed as an input parameter meets any of the following criteria:

* Contains a character that is invalid in an Internationalized Domain Name (IDN) - e.g. symbols, whitespace
* Is an empty string
* Is equal to `'.'`
* Contains empty domain labels (i.e. any occurrences of `'..'`)

#### 5. Summary of behaviours

The following table sets out the eventual settled state of the promise returned by
`getRegistrableDomain()` for different classes of input `hostname` parameter:

| Input hostname     | Description                                      | Registrable domain     |
|:-------------------|:-------------------------------------------------|-----------------------:|
| example.net        | eTLD+1                                           | example.net            |
| www.example.net    | eTLD+2                                           | example.net            |
| net                | is an eTLD itself, single-label                  | null                   |
| net                | as above, with `allowPlainSuffix = true`         | net                    |
| github.io          | is an eTLD itself, multi-label                   | null                   |
| github.io          | as above, with `allowPlainSuffix = true`         | github.io              |
| foobar             | no matching eTLD in PSL, single-label            | null                   |
| foobar             | as above, with `allowUnknownSuffix = true`       | foobar                 |
| my.net.foobar      | no matching eTLD in PSL, multi-label             | null                   |
| my.net.foobar      | as above, with `allowUnknownSuffix = true`       | my.net.foobar          |
| foobar.net         | has an eTLD in the ICANN section                 | foobar.net             |
| foobar.github.io   | has an eTLD in the Private section               | foobar.github.io       |
| 127.0.0.1          | IP address, IPv4                                 | null                   |
| 127.0.0.1          | as above, with `allowIP = true`                  | 127.0.0.1              |
| [::1]              | IPv6 address                                     | null                   |
| [::1]              | as above, with `allowIP = true`                  | [::1]                  |
| EXAMPLE.NET        | uppercase                                        | example.net            |
| .example.net       | dot in front                                     | example.net            |
| example.net.       | dot in the end, this is an FQDN                  | example.net.           |
| مليسيا             | this is an IDN that is also an eTLD              | null                   |
| xn--mgbx4cd0ab     | as above, but Punycode                           | null                   |
| foo.مليسيا         | this is an IDN                                   | foo.xn--mgbx4cd0ab     |
| foo.مليسيا         | as above, with `unicode = true`                  | foo.مليسيا             |
| foo.xn--mgbx4cd0ab | this is an IDN, but Punycode                     | foo.xn--mgbx4cd0ab     |
| foo.xn--mgbx4cd0ab | as above, with `unicode = true`                  | foo.مليسيا             |
| *.com              | contains invalid character `'*'`                 | Error                  |
|                    | empty string                                     | Error                  |
| .                  | no domain labels                                 | Error                  |
| example..com       | contains an empty domain label                   | Error                  |

#### 6. Sync vs Async

Browser extension APIs are most commonly async, with API methods returning Promises.
Earlier versions of this proposal set out an async API, with `getRegistrableDomain()`
returning a `Promise<String>`. However, some use cases require getting lists of
registrable domains all in one go. In theory, this could be achieved by simply calling
`getRegistrableDomain()` multiple times.

The problem with this approach is that there is overhead associated with an extension
calling an async function on the parent browser. For example, obtaining the registrable domains
of a list of 50 domains would involve making 50 async calls to the parent browser.
A batching method would allow the same result to be obtained with a single async call.

For this reason, batching method `getRegistrableDomains()` was added to this API.
The method accepted an array of hostnames as input and returning a promise resolving to
an array of registrable domains. A quick mockup of the two approaches was built using
a simplified implementation of this proposal's API in a modified Firefox, and the
batching approach was about 2-3 times faster for 50 domains.

Unfortunately, while this offered a solution to the performance problem,
it added additional complexity to the API. To resolve this issue, the API
has now been changed to being synchronous, which has allowed the batching method
to be removed, thereby making the API more ergonomic.

A high level analysis of the implementations of the major browser engines
(Firefox, Chromium, Webkit) indicates that the synchronous approach is feasible,
since the required functionality is already available in each browser engine's
content/render process.

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

### 1. Registrable Domains of Registrars

In the case where a domain has multiple matching eTLDs in the PSL and therefore
more than one possible registrable domain, this proposal's API always selects
the longest one. In other words, the API only provides the registrable domain
of the domain's content-owning organization, and not that of any
associated registrars.

Theoretically, there may be cases where all organizations using a certain
registrar are behaving similarly (e.g. distributing malware), and therefore
extensions may want to provide support for carrying out some action
(e.g. malware blocking) against the shared registrar itself, rather than against
each individual content-owning organization. More explicit support for such
use cases could be handled in a future update to this API.

### 2. Change Notifications

The PSL dataset, used by the browsers to determine registrable domains,
is a dynamic dataset that can change at any time. Although this API provides a function
for retrieving the current version of the PSL dataset used by the browser, no mechanism
is provided for notifying extensions when the host browser's PSL dataset changes. It is
understood that such changes are only made currently when a new browser version
is released, however this may not always be the case.

It may be useful to implement a notification mechanism so that extensions can take
appropriate action when the host browser's PSL dataset changes, to avoid having to
poll the `getVersion()` function provided by this API.
