# WebExtensions Community Group Charter

The WebExtensions Community Group defines [WebExtensions](#webextensions).

  * This Charter: https://github.com/w3c/webextensions/blob/main/charter.md
  * Previous Charter: None
  * Start Date: June 2021
  * Last Modified: This is the first version.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents

- [Goals](#goals)
- [Design Principles](#design-principles)
  - [User-centered](#user-centered)
  - [Compatibility](#compatibility)
  - [Performance](#performance)
  - [Security](#security)
  - [Privacy](#privacy)
  - [Portability](#portability)
  - [Maintainability](#maintainability)
  - [Well-defined Behavior](#well-defined-behavior)
  - [Autonomy](#autonomy)
- [Scope of Work](#scope-of-work)
  - [Out of Scope](#out-of-scope)
- [Deliverables](#deliverables)
  - [Specifications](#specifications)
    - [WebExtensions](#webextensions)
  - [Non-Normative Reports](#non-normative-reports)
  - [Test Suites and Other Software](#test-suites-and-other-software)
- [Dependencies or Liaisons](#dependencies-or-liaisons)
- [Chairs](#chairs)
- [Editors](#editors)
- [Process](#process)
  - [Community and Business Group Process](#community-and-business-group-process)
  - [Work Limited to Charter Scope](#work-limited-to-charter-scope)
  - [Contribution Mechanics](#contribution-mechanics)
  - [Transparency](#transparency)
  - [Decision Process](#decision-process)
  - [Chair Selection](#chair-selection)
  - [Amendments to this Charter](#amendments-to-this-charter)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Goals

We will specify a model, permissions, and a common core of APIs for web
browser extensions (hereafter WebExtensions). By specifying the APIs,
functionality, and permissions of WebExtensions, we can make it even
easier for extension developers to enhance end user experience, while
moving them towards APIs that improve performance and prevent abuse.

## Design Principles

Our principles are inspired by the [HTML Design
Principles](https://www.w3.org/TR/html-design-principles/) and the [W3C
TAG Ethical Web
Principles](https://www.w3.org/2001/tag/doc/ethical-web-principles/).

### User-centered

Browser extensions enable users to customize their web browsing experience
according to their preferences and needs. [[People should be able to render web
content as they
want](https://w3ctag.github.io/ethical-web-principles/#render)] [[The
Internet is for End
Users](https://intarchboard.github.io/for-the-users/draft-iab-for-the-users.html)]

We will specify extension APIs that enable developers to write a variety
of useful browser extensions.

In conflict, we will prioritize the needs of end users over the needs of
developers and implementers. [[Priority of
Constituencies](https://www.w3.org/TR/html-design-principles/#priority-of-constituencies)]

### Compatibility

We strive to maintain and improve compatibility with popular existing
extensions and extension APIs. [[Support Existing
Content](https://www.w3.org/TR/html-design-principles/#support-existing-content)]
This will enable developers to not have to completely rewrite their
extensions to work in different browsers, which can be error-prone. [[Do
Not Reinvent the
Wheel](https://www.w3.org/TR/html-design-principles/#do-not-reinvent-the-wheel)]

### Performance

We should enable developers to write extensions that do not negatively
impact web page or browser performance or power consumption. [[The web
must be an environmentally sustainable
platform](https://www.w3.org/2001/tag/doc/ethical-web-principles/#sustainable)]

### Security

When choosing extensions to use, users should not have to make tradeoffs
between functionality and security. We will specify new extension APIs,
make model changes, and improve permissions to promote good security
practices &amp; reduce the harm a compromised or malicious browser
extension can do. [[Security and privacy are
essential](https://w3ctag.github.io/ethical-web-principles/#privacy)]

### Privacy

Likewise, users should not have to make tradeoffs between functionality
and privacy. We will enable browser extensions to enhance the user’s
experience while requiring the minimum access necessary to the user’s
browsing data in order to reduce or eliminate the tradeoff end-users
must make between functionality and privacy. [[Security and privacy are
essential](https://w3ctag.github.io/ethical-web-principles/#privacy)]

### Portability

It should be relatively straightforward for developers to port
extensions from one browser to another, and for browsers to support
extensions on a variety of devices and operating systems. [[The web is
multi-browser, multi-OS, and
multi-device](https://w3ctag.github.io/ethical-web-principles/#multi)]
[[Media
Independence](https://www.w3.org/TR/html-design-principles/#media-independence)]

We will keep the number of UI entry points to a minimum to avoid locking
implementers into overly-limited UI patterns. This helps to ensure
extensions work across browsers, devices, and UI paradigms.

Our specifications should not make reference to or rely on specific
browser engine implementation details.

### Maintainability

We will strive for simplicity in our APIs, to enable the widest group of
developers to author extensions, and to make it easy for them to
maintain the extensions they author. We will keep the number of APIs
extensions must adopt to a minimum, and will only revise such APIs
infrequently, to keep the maintenance cost of extensions as low as we
can. [[The web must enhance individuals' control and
power](https://w3ctag.github.io/ethical-web-principles/#control)]
[[Avoid Needless
Complexity](https://www.w3.org/TR/html-design-principles/#avoid-needless-complexity)]

### Well-defined Behavior

We will rigorously define the behavior of extension APIs to enable
browser developers to best achieve interoperability. [[Well-defined
Behavior](https://www.w3.org/TR/html-design-principles/#well-defined-behavior)]

### Autonomy

We recognize that browser vendors need to provide functionality that is specific
to their browser and also need the ability to experiment with new features. Our
process embraces this and seeks to provide mechanisms for specifying
inconsistencies and working towards eventual unification where appropriate.
Given this, we expect browser vendors to offer APIs and capabilities beyond what's specified.

Of course, the need for autonomy must be balanced against the need to provide
developers with a consistent and interoperable platform. To that end, we seek to
specify a common platform that includes the base extension model, permissions
model, and a common core of APIs for web extensions that all browsers can build
upon.

## Scope of Work

The following things are in-scope for this Community Group:

  * An extensions model—the basic architecture of extensions and how the
    different pieces interrelate. This definition will include a
    description of the trust model, the differing trust between browsers
    and extensions and between extensions and web pages.
  * A permissions model—what sorts of powerful features extensions may
    access, and how extensions may request user consent to access them.
  * WebExtensions APIs—the interface extensions are built on.
  * A packaging format, including a manifest format and how extensions
    are localized.
  * Native Messaging—the API surface extensions use to exchange messages with native applications running on the host system.

### Out of Scope

The following things are out-of-scope:

* Deployment mechanisms, including but not limited to:
    * methods for signing extensions
    * file extensions
    * mime types
* WebDriver integration
* Extension stores

## Deliverables

### Specifications

#### WebExtensions

The group will produce a WebExtensions specification, including the Web
Extensions API and the extensions and permissions models it's based on.
This specification will be based on the existing extensions model and
API supported by Chrome and Firefox.

Note: There was an earlier attempt within the [Browser Extension
Community Group](https://www.w3.org/community/browserext/) to
standardize [Browser
Extensions](https://browserext.github.io/browserext/). Much good
progress was made, but unfortunately the spec did not gain sufficient
interest from implementers and work on it ceased.

### Non-Normative Reports

The group may produce other Community Group Reports within the scope of
this charter but that are not Specifications, for instance use cases,
requirements, or white papers.

### Test Suites and Other Software

The group MAY produce test suites to support the Specifications. Any
test suites produced by this group will be made available under [the
same license as
WPT](https://github.com/web-platform-tests/wpt/blob/master/LICENSE.md).

## Dependencies or Liaisons

We will seek wide review of our work, particularly in the areas of
architecture, accessibility, internationalization, privacy, and
security.

Should a Specification of ours mature sufficiently, we will pursue
standardization in an appropriate venue.

## Chairs

The Chairs of the WebExtensions Community Group are:

  * Simeon Vincent, Independent (and before at Google)
  * Timothy Hatcher, Apple

The Chairs are responsible for the day-to-day running of the group,
including:

  * ensuring the group adheres to its [Process](#process),
  * appointing [Editors](#editors) for [Deliverables](#deliverables),
  * focusing the group's limited time on the work most likely to
    positively advance WebExtensions via wide implementation and
    adoption,
  * managing the group's GitHub repositories, website, and online
    presence,
  * moderating the group's discussions, whatever the forum (GitHub,
    mailing lists, face to face, etc.),
  * running teleconferences and face-to-face meetings,
  * resolving conflicts between contributors,
  * encouraging participation in the group,
  * and keeping this Charter compliant with the [Community and Business
    Group Process](#community-and-business-group-process), [updating it
    as necessary](#amendments-to-this-charter).

The Chairs have a number of other powers and responsibilities which are
defined throughout this document.

## Editors

The Editors of the WebExtensions Community Group are:

  * Mukul Purohit, Microsoft
  * Tomislav Jovanovic, Mozilla
  * Oliver Dunk, Google

Each [Deliverable](#deliverables) has one or more Editors who are
appointed by the [Chairs](#chairs).

Editors are responsible for the technical content of their Deliverable
and have sole authority to modify it (though their decisions may be
overridden by the Chairs; [see below](#decision-process)).

Editors are responsible for

  * ensuring any applied changes fulfill the relevant criteria for
    changes,
  * reducing open issues,
  * helping to manage the corresponding tests,
  * ensuring (together with implementers) implementations follow the
    requirements and vice versa (The “don’t write fiction” rule.),
  * ensuring contributions to their Deliverable are only made by
    Community Group Participants who have agreed to the [W3C Community
    Contributor License Agreement
    (CLA)](https://www.w3.org/community/about/agreements/cla/), and
  * and ensuring that there are no unresolved substantive objections
    from Community Group Participants before merging contributions or
    otherwise modifying their Deliverable.

Changes of an editorial nature can be made, accepted, or rejected by
Editors without discussion.

Editors may solicit input from Community Group Participants, and may
consider and respond to comments, suggestions, and objections from
participants and the public.

Editors may commit changes to their Deliverable without further review,
provided they adhere to the requirements in this Charter.

## Process

### Community and Business Group Process

The group operates under the [Community and Business Group
Process](https://www.w3.org/community/about/agreements/). Terms in this
Charter that conflict with those of the Community and Business Group
Process are void.

As with other Community Groups, W3C seeks organizational licensing
commitments under the [W3C Community Contributor License Agreement
(CLA)](http://www.w3.org/community/about/agreements/cla/). When people
request to participate without representing their organization's legal
interests, W3C will in general approve those requests for this group
with the following understanding: W3C will seek and expect an
organizational commitment under the CLA starting with the individual's
first request to make a contribution to a group
[Deliverable](#deliverables). The section on [Contribution
Mechanics](#contribution-mechanics) describes how W3C expects to monitor
these contribution requests.

The [W3C Code of Ethics and Professional
Conduct](https://www.w3.org/Consortium/cepc/) applies to participation
in this group.

### Work Limited to Charter Scope

The group will not publish Specifications on topics other than those
listed under [Specifications](#specifications) above. See below for [how
to modify the charter](#amendments-to-this-charter).

### Contribution Mechanics

Substantive Contributions to Specifications can only be made by
Community Group Participants who have agreed to the [W3C Community
Contributor License Agreement
(CLA)](http://www.w3.org/community/about/agreements/cla/).

Specifications created in the Community Group must use the [W3C Software
and Document
License](http://www.w3.org/Consortium/Legal/2015/copyright-software-and-document).

All other documents produced by the group should use that License where
possible (except for tests; [see above](#test-suites-and-other-software).

Community Group participants agree to make all contributions in the
GitHub repo the group is using for the particular document. This may be
in the form of a pull request (preferred), by raising an issue, or by
adding a comment to an existing issue.

### Transparency

The group will conduct all of its technical work in public. All
technical work will occur in its GitHub repositories (and not in mailing
list discussions). This is to ensure contributions can be tracked
through a software tool.

Meetings may be restricted to Community Group participants, but a public
summary or minutes must be posted to GitHub.

### Decision Process

This group will seek to make decisions where there is consensus.
[Editors](#editors) assess consensus on issues related to their
[Deliverable](#deliverables). Where consensus isn't clear, or where
there is sustained, substantive disagreement with an Editor's decision,
the Editors and [Chairs](#chairs) may issue a Call for Consensus [CfC]
to allow multi-day online feedback for a proposed course of action.
After discussion and due consideration of different opinions, a decision
should be publicly recorded on GitHub.

If substantial disagreement remains (e.g. the group is divided) and the
group needs to decide an Issue in order to continue to make progress,
the Chairs will, in consultation with the Editors and group, choose an
alternative that had substantial support and which drew the weakest
objections.

Any decisions reached at any meeting are tentative and should be
recorded in a GitHub Issue. Any group participant may object to a
decision reached at an online or in-person meeting within 7 days of
publication of the decision provided that they include clear technical
reasons for their objection. The Chairs will facilitate discussion to
try to resolve the objection according to the [decision
process](#decision-process).

It is the Chairs' responsibility to ensure that the decision process is
fair, respects the consensus of the CG, and does not unreasonably favour
or discriminate against any group participant or their employer.

### Chair Selection

Additional [Chairs](#chairs) may be appointed by unanimous consent of
the then-current Chairs.

If 5 participants, no two from the same organisation, call for an
election, the group must use the following process to replace all of the
Chairs with a new Chair, consulting the Community Development Lead on
election operations (e.g., voting infrastructure and using [RFC
2777](https://tools.ietf.org/html/rfc2777)).

  * Participants announce their candidacies. Participants have 14 days
    to announce their candidacies, but this period ends as soon as all
    participants have announced their intentions. If there is only one
    candidate, that person becomes the Chair. If there are two or more
    candidates, there is a vote. Otherwise, nothing changes.

  * Participants vote. Participants have 21 days to vote for a single
    candidate, but this period ends as soon as all participants have
    voted. The individual who receives the most votes, no two from the
    same organisation, is elected chair. In case of a tie, RFC 2777 is
    used to break the tie.

Participants dissatisfied with the outcome of an election may ask the
Community Development Lead to intervene. The Community Development Lead,
after evaluating the election, may take any action including no action.

### Amendments to this Charter

The group can decide to work on a proposed amended charter, editing the
text using the [Decision Process](#decision-process) described above.
The decision on whether to adopt the amended charter is made by
conducting a 30-day vote on the proposed new charter. The new charter,
if approved, takes effect on either the proposed date in the charter
itself, or 7 days after the result of the election is announced,
whichever is later. A new charter must receive 2/3 of the votes cast in
the approval vote to pass. The group may make simple corrections to the
charter such as deliverable dates by the simpler group decision process
rather than this charter amendment process. The group will use the
amendment process for any substantive changes to the [goals](#goals),
[scope](#scope-of-work), [deliverables](#deliverables), [decision
process](#decision-process) or [rules for amending the
charter](#amendments-to-this-charter).

---

This charter was derived from the [Community and Business Group charter
template](https://w3c.github.io/cg-charter/CGCharter.html) which is both
[copyright](http://www.w3.org/Consortium/Legal/ipr-notice) © 2016, 2017,
2018 [World Wide Web Consortium](http://www.w3.org/), ([Massachusetts
Institute of Technology</a>](http://www.lcs.mit.edu/), [European
Research Consortium for Informatics and
Mathematics](http://www.ercim.org/), [Keio
University](http://www.keio.ac.jp/), [Beihang](http://ev.buaa.edu.cn/))
and available under the [W3C Software and Document
License](https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document).
