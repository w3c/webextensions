# WECG Proposal Process

## Summary

This document outlines a new proposal process for making changes to public
extension APIs.  This process should be used for all future changes to public
extension APIs.

## Background and Motivation

Historically, different browsers had (very) different forms of "web extension"
(also known as "browser extension") platforms, including Chrome Extensions and
Firefox Add-ons.  Over the past several years, browser vendors have aligned on
a common set of WebExtension APIs and all major browser vendors (including
Google Chrome, Mozilla Firefox, and Apple Safari, along with the majority of
other Chromium-based browsers such as Microsoft Edge, Opera, Brave, and more)
support the same general API and behavior.

With this convergence on a common platform, browser vendors and developers have
been working to ensure better cross-browser alignment on new and existing APIs,
along with future API changes.  This is the primary purpose of the
[WebExtensions Community
Group](https://github.com/w3c/webextensions/blob/main/charter.md), or WECG.

However, due to the previous history and implementation practices in which
every browser had complete autonomy over their own API design and
implementation, not all APIs and API changes have been brought to the WECG for
discussion.  At best, this results in a missed opportunity for broader
community discussion and creates more time between when browsers can support a
similar API; at worst, this results in significant platform fragmentation, to
the detriment of the ecosystem.

When changes and proposals have been brought to the WECG, they are frequently
presented in different formats and manners based on historical precedence for a
specific browser.  This makes it more difficult to review, as well as risking
the omission of important criteria or details.

In order to address these concerns, we use a defined and consistent
proposal process.

## Goals

**Provide a consistent path for proposing new APIs and API modifications.**
The new process should be scalable to be used for both entirely new APIs as
well as the introduction of new methods on an existing API namespace or
modifications to behavior of existing APIs.

**Include critical details in each API proposal.**  There are a set of common
concerns that should be addressed in any and all API additions and changes.
These include categories such as security, privacy, web compatibility, and
others.

**Ensure browsers can retain autonomy for certain APIs.**  The WECG outlines
that browsers always have the ability to innovate on their own or create
individual APIs that are not supported by other browsers (such as when an API
is for a browser-specific surface or feature that no other browser intends to
provide).  This proposal process should not hinder that.

**Supplement browser-specific proposal processes.**  We understand that
individual browser vendors will very likely have their own proposal processes
for these APIs (e.g. to do internal review, address UI elements, etc).  The
WECG proposal should serve as a productive supplement to those discussions,
ideally reducing or eliminating duplicate work.

## Non-Goals

**Replace issue reporting for suggested features or changes.**  The API
proposal should be viewed as a possible "next step" from a suggested change or
developer issue and should imply that one or more browser vendors are actively
or imminently going to begin implementation.  Most feature requests and bug
reports should continue to be reported as GitHub issues in the WECG repository
(or a browser's individual bug tracker).

**Address all implementation details.**  Due to the dramatically different
implementations in different browsers, the vast majority of implementation
details are out of scope for the API proposal.  These may still be included if
they have cross-browser implications (such as the use of a given technology
that will be tied to the capabilities of the API or algorithms that would
affect the developer-visible surface).

**Address all browser-specific considerations.**  Very likely, individual
browsers will have separate design docs detailing the browser-specific aspects
of the API.  These are out of scope of the WECG.  If appropriate, the author
may include browser-specific considerations as addenda or useful background.

**Replace a proper, detailed, web-style spec.**  While we do not currently have
complete specs for extension APIs, we intend to (gradually) produce them.
These API proposals should deal with higher-level discussion of the API as a
whole, and should not include exact spec language.

**Have API proposals be perennially "living" documents.**  An API proposal
should be kept up-to-date during the implementation period of the initial API
or change it proposes.  Once that initial version or change has been
implemented, the proposal is complete.  Any changes should have a separate
proposal.

## Prior Art

This proposal is heavily inspired by the existing
[Chrome Extension API Proposal Process](https://chromium.googlesource.com/chromium/src/+/HEAD/extensions/docs/new_api_proposal.md)
and [API Overview Document](https://docs.google.com/document/d/182XXEPwbh5dyMTO_Q3bZ9k4PYY19Woydu5b3XvPoSmc/edit#heading=h.x9snb54sjlu9)
(which has been used for many new extension APIs and has been a jumping off
point for some new proposals in the WECG).

## When to Use this Proposal

This proposal should be used for any significant new changes or additions to
public extension APIs.

## When to Not Use this Proposal

Browsers do not need to use this proposal for any APIs that will never become
public.  As an example, in Chrome, there is the concept of "private APIs" that
are used by [component extensions](https://chromium.googlesource.com/chromium/src/+/main/extensions/docs/component_extensions.md)
-- extensions that are built into the browser as an implementation detail.  In
these cases, browser vendors do not need to (and should not!) put forth an API
proposal in this forum.  (Though note that browsers may still have separate
processes for such APIs.)

## How to Use this Proposal

*   Find (or represent) a browser willing to implement the API imminently and
    propose the API.  We want to ensure these API proposals don't become a
    collection of "aspirational" APIs -- things that we would ideally like to
    get to at some point.  These proposals should have thorough (and thus,
    potentially costly) reviews, beyond what we expect for a general overview
    of a suggestion in a filed issue.  As such, these proposals should only be
    used for APIs that have support and commitment to implement from at least
    one browser.
*   Copy the [API Proposal template](proposal_template.md) and fill it out.  
    There are instructions in each section of the proposal template.  As you
    fill out each section, you may delete the instructions for that section.
    For any section that is not relevant, you may put "N/A" (likely with a
    brief summary of why the section is not relevant, if it is not immediately
    obvious).
*   Submit a pull request with the completed proposal to the
    [Proposals directory](https://github.com/w3c/webextensions/tree/main/proposals)
    of the WECG repository.
*   Receive and iterate on input from browser vendors and the community.
*   Once every browser vendor has indicated their support or opposition (see
    below) and all major comments are resolved, the proposal may be merged and
    considered "complete".

## Browser Vendor Support

Browser vendors should provide input on the proposal and indicate their level
of support with the existing browser-specific
[labels](https://github.com/w3c/webextensions/labels) or a new
"changes-requested" label.

*   **Supportive:** The browser vendor is supportive of the API design and may
    implement the API in the future.  Note that this is not a guarantee the
    browser _will_ add support at any given moment and time.
*   **Neutral:** The browser vendor neither supports nor opposes the API design
    and may implement the API in the future.
*   **Opposed:** The browser vendor is opposed to the API design at a
    fundamental level (that is, they do not believe such an API should exist on
    the extensions platform) and has no plans to implement the API in the
    future.
*   **Changes-Requested:** The browser vendor is potentially supportive (or at
    the very least, is not opposed) to the API, but would like to see
    non-trivial changes to the proposal before it moves forward, such as
    changing the API surface or types.

API proposals should not be considered "complete" until all major browser
vendors have entered a value other than "changes-requested".  Unanimous support
is _not_ required for API proposals to proceed, as a core tenant of the WECG is
that browsers may use extension APIs for browser-specific functionality.
Browser vendors should ensure reasonable response times; if a browser vendor
does not respond in a timely manner, the proposal may move forward.  There is
no strict definition of this; it is adhered to with good faith effort by the
participating browsers for the applicable APIs.  However, if we see this being
abused, we may reconsider this approach.

### Opposition

Browser vendors that are opposed to the API may still offer input on the API if
they desire (we fully acknowledge that everyone working in this space is
experienced and may have valuable input on API designs, even if they don't
agree with the functionality).

It may happen that the proposing browser vendor (again, every proposal must be
sponsored by a browser vendor) and a reviewing browser vendor are unable to
reach consensus (with regard to either the API's concept or an individual
aspect of it).  In this scenario, the reviewing vendor must choose a stance
(which will very likely be "Opposed") to allow the API to move forward.
