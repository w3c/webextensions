# The WebExtensions Community and Working Groups

## Summary

This is an initial proposal of how the WebExtensions Community Group (WECG) and WebExtensions Working Group (WEWG), collectively the WebExtensions Groups, should organize their work and collaborate on the advancement of a common browser extension platform. It details what work happens in each group, how proposals move from WECG incubation or other groups into spec text, and how we plan to publish the resulting specifications. This document is a working draft that is meant to drive discussion. Several items below are explicitly flagged as needing group agreement before we treat them as settled process.

## Background and Motivation

The WEWG was chartered in May 2026 to give the WECG's years of API design discussion a path to formal specification. The first WEWG meeting identified a need to clarify the relationship between the two groups. Specific areas in need of clarification included repository governance, proposal terminology, and how to avoid perceptions that the WEWG only rubber-stamps WECG-incubated work (see [_minutes/2026-06-25-wewg.md](_minutes/2026-06-25-wewg.md)). This document is one of the action items identified during that discussion.

## Goals

- Establish a shared vocabulary for the stages a piece of work passes through, from initial idea to published spec text.
- Clarify which group is responsible for which kind of work, so contributors know where to bring a given discussion.
- Define how proposals move from WECG incubation into WEWG consideration, including the possible outcomes of that review.
- Define how the WEWG receives specifications or artifacts from groups other than the WECG.
- Lay out a concrete plan for how, where, and when we publish specifications, from Editor's Draft through Candidate Recommendation Snapshot.
- Surface the open questions and outstanding implementation work this plan depends on, so they can be resolved deliberately rather than by accident.

## Non-Goals

- This document does not amend the WECG or WEWG charters; where it conflicts with either charter, the charter governs.
- This document does not attempt to resolve every open question in one pass. Several mechanisms are intentionally left as proposals for discussion.
- This document is not a legal or IPR determination. Where it touches Patent Policy reasoning (see [Publishing Plan](#publishing-plan)), that reasoning needs confirmation from the WG's W3C Team contact before anyone relies on it.
- This document does not restate the W3C Process Document, the [W3C CG Process guidance](https://www.w3.org/community/about/process/), or the existing [WECG Proposal Process](proposals/proposal_process.md). We try to reference those materials where appropriate rather than of duplicating them here.

## Terminology

- **CG** - a Community Group. Most commonly used to refer to either the WECG or W3C's [Community Group](https://www.w3.org/community/) program.
- **WG** - a Working Group. Most commonly used to refer to either the WEWG or a working group within a standards body (for example, the [WHATWG](https://whatwg.org/)).
- **WECG** — pronounced WEE-CEE-GEE. The WebExtensions Community Group. Created in June 2021 to facilitate open discussion of WebExtensions, a common extension model for web browsers.
- **WEWG** — pronounced WEE-WIG. The WebExtensions Working Group. First chartered in May 2026 to produce formal specifications related to WebExtensions.
- **CG proposal** — a proposal following the [WECG Proposal Process](proposals/proposal_process.md). Used to incubate a new or modified API in the WECG.
- **Champion** — a WEWG participant who represents a piece of work in group discussions on behalf of its originator and drives the group's progress on that work. Required to advance any significant change to the WebExtensions specification. See also [Receiving Work from Other Groups](#receiving-work-from-other-groups). [_**TODO**: Should this concept also apply to WECG?_]
- **Verdict** — a decision on a proposal under consideration by one of the groups. Possible outcomes are:
  - **Accept**: The proposal is accepted in its current form. Iteration may occur on the proposal's content as normative text is produced.
  - **Request Changes**: The proposal needs clarification, revision, or other additional work before it can be accepted. Direct feedback on the desired changes will be provided.
  - **Reject**: The group decides not to proceed with this proposal. Rejection may occur for a variety of reasons including: security concerns, implementation challenges, sustainability of the feature, unclear or insufficient need, etc. When rejecting a proposal, a rationale for the decision will be provided.
- **Spec text** — normative language added to a specification sources in [`specification/`](specification/).
- **Editor's Draft** — the continuously published, living draft of a specification. Auto-deployed on every merge to `main`.
- **CR Snapshot** — a [Candidate Recommendation Snapshot](https://www.w3.org/policies/process/#candidate-recommendation-snapshot). A formally published version of a specification in the W3C TR space. Per W3C process, this requires a Chair-initiated transition request.

## Scope of Work: What Happens Where

As a rule of thumb, work that is exploratory, incremental, or browser-specific takes place in the WECG while work that produces normative, public-facing spec commitments belongs in the WEWG. The WECG's basic unit of work is a loose API proposal or design discussion. The WEWG's basic unit of work is a substantive revision to the WebExtensions specification.

**WECG Work**

- Public discussion of developer feedback, community activity, and platform inconsistencies. Participation is free and does not require W3C membership (but a [W3C account](https://www.w3.org/account/) is strongly encouraged).
- Incremental API refinements, such as adding a `name` argument to `alarms.create()` ([#999](https://github.com/w3c/webextensions/issues/999)).
- Incubation of larger changes to WebExtensions features, capability, or design (see [Incubating Specifications in the WECG](#incubating-specifications-in-the-wecg)).
- Vendor-specific API design discussion, including cases where a vendor is seeking feedback on a proposed browser-specific API or working toward convergence with another vendor's existing API (for example, Chrome's `sidePanel` and Firefox's `sidebarAction`).

**WEWG Work**

- Creation and maintenance of specifications related to WebExtensions.
- Consideration of proposals incubated elsewhere (WECG or other standards bodies) and integration into WebExtensions specifications.
- Owns the maintenance of [WebExtensions tests in WPT](https://github.com/web-platform-tests/wpt/tree/master/web-extensions). WECG contributions welcome! (**Needs discussion**)
- W3C document review (horizontal/wide review of other groups' specs). This is a formal WG responsibility defined by the W3C Process Document.

**Spans both groups**

- Both groups will use GitHub Issues to track work and discussions. Items that fall under the W3C's WG IPR requirements will use the [`wewg`](https://github.com/w3c/webextensions/issues?q=label%3Awewg) label.
- Early shaping of proposals happen in the WECG, while normative changes to the specification happen in the WEWG.
- Non-normative deliverables (test suites, developer primers, threat model documentation). The WEWG charter formally lists these as deliverables, but nothing prevents earlier versions or discussion from starting in the WECG.

## Inputs to the Working Group

Work reaches the WEWG through two primary paths: proposals incubated in the WECG, and contributions from other groups or individuals that did not originate in the WECG. The following two sections describe each path.

### Incubating Specifications in the WECG

Most specification changes considered by the WEWG begin as [WECG Proposals](proposals/proposal_process.md), but not every proposal is destined for the WEWG. Some will be considered, discussed, and archived as part of the WECG's process. Others, such as browser-specific proposals, will stay scoped to the WECG (see [Scope of Work](#scope-of-work-what-happens-where)).

A WECG proposal is generally ready for WEWG consideration once it has cleared WECG review. Concretely, this means all major browser vendors have taken a position other than "Changes-Requested" and the proposal has secured implementation commitments from at least two browser vendors. This matches the WEWG charter's requirement for adequate implementation experience.

**Needs discussion:** the group hasn't yet agreed on the mechanism for raising a mature WECG proposal to the WEWG. As a starting point:

1. The proposal's author or a WEWG editor flags the proposal as ready by applying the [`wewg`](https://github.com/w3c/webextensions/issues?q=label%3Awewg) label and adding it to the next WEWG meeting agenda.
2. The WEWG reviews the proposal for integration with the existing specification, cross-browser interoperability, and any outstanding concerns from WECG review, then renders one of three verdicts:
   - **Accept** — a WEWG editor begins authoring the corresponding spec text informed by the WECG proposal.
   - **Request Changes** — the WEWG sends the proposal back with specific, actionable feedback. The proposal can be re-flagged for WEWG consideration once addressed.
   - **Reject** — the WEWG declines to adopt the proposal and records its rationale publicly in a comment on the original issue or proposal PR.

### Receiving Work from Other Groups

Not every proposal considered by the WEWG will originate in the WECG. Other W3C groups (for example, the [WICG](https://wicg.io/)), other standards groups (for example, the [Unicode Consortium](https://www.unicode.org/consortium/consort.html)), or individual contributors may bring a draft specification or other artifacts directly to the WEWG for consideration.

As with WECG-incubated proposals, external work should demonstrate implementation commitments from at least two browser vendors before the WEWG takes it up, matching the WEWG charter's adequate-implementation requirement.

**Needs discussion:** unlike WECG proposals, external artifacts may not have gone through a comparable incubation process or have IPR commitments. There's an open question on how the WEWG should handle eternal contributions without that scaffolding. Should external artifacts should be reformatted to follow the WECG's [proposal template](proposals/proposal_template.md) before WEWG review in order to give the WG a consistent baseline for evaluation?

As a starting point for the intake mechanism:

1. A WEWG participant agrees to champion the work. They will be responsible for presenting it to the group and answering implementation/design questions on the contributor's behalf. This is similar to how a WECG proposal requires a browser vendor sponsor.
2. The WEWG reviews the artifact and renders one of the same three verdicts used for WECG-incubated proposals: **Accept**, **Request Changes**, or **Reject**.

## Publishing Plan

The WEWG's specifications already have a continuous **Editor's Draft** pipeline: every push to `main` auto-builds and deploys the WebExtensions, window.browser, and WebDriver Classic specs to GitHub Pages via [`deploy.yml`](.github/workflows/deploy.yml). Editors can and should keep pushing to this without any formal process. What's missing is the plan for the next step: formally publishing **Candidate Recommendation (CR) Snapshots** to the W3C TR space, plus a way to publish drafts of proposals still incubating in the WECG.

**Publishing WECG proposal drafts**

Proposals incubating in the WECG currently live only as markdown files in [`proposals/`](proposals/). We should set up a lightweight rendering/publishing pipeline for these too, giving reviewers a readable, linkable snapshot of a proposal in progress, distinct from (and without the IPR weight of) a formal WG Editor's Draft.

**Converting the WebExtensions Editor's Draft into a WEWG artifact**

[`w3c.json`](w3c.json) currently declares `"repo-type": "cg-report"`, meaning the existing Editor's Draft is formally a CG report, not a WG artifact bound by the WG's Recommendation-track IPR commitments. Making the WebExtensions specification an actual WEWG deliverable requires updating this configuration (see [Outstanding Work](#outstanding-work)).

**Publishing CR Snapshots**

- **Who can publish:** a Chair must request the transition to the W3C Team (see [W3C Process](https://www.w3.org/policies/process/#transition-cr)). The Team's approval depends on the group demonstrating implementation experience, completed wide review, and consensus to advance. Editors drive revisions of the Editor's Draft day to day. Chairs drive the formal CR transition process.
- **Cadence:** due to the requirement to schedule reviews of CR Snapshots, the [Publishing a Candidate Recommendation Snapshot](https://www.w3.org/policies/process/#publishing-crrs) section states that they "should not be published more often than approximately once every 6 months." [_**TODO**: This reasoning should be confirmed with the WEWG's W3C Team contact before we treat it as settled._]
- **Independence:** the current set of deliverables (the WebExtensions, window.browser, and WebDriver Classic specifications) advance and snapshot independently, each on whatever cadence its own content warrants.

## Outstanding Work

- Update [`w3c.json`](w3c.json) (and any other WECG-specific config) so the WebExtensions Editor's Draft is recognized as a WEWG artifact rather than a WECG report.
- Build a publishing pipeline for WECG proposal drafts (rendering `proposals/` content into a reviewable, linkable format).
- Confirm the Patent Policy reasoning in [Publishing Plan](#publishing-plan) (CR Snapshot cadence vs. exclusion-opportunity burden) with the WEWG's W3C Team contact.
