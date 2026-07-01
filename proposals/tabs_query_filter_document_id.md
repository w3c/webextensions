# Proposal: &lt;API>

** How to Use This Template **

See [Proposal Process](proposal_process.md) for the detailed process on how to
propose new APIs and use this template.  Each section includes instructions on
what to include.  Delete the instructions for a given section once it's filled
out.  Remove this section once the template is filled out.

**Summary**

Extend `tabs.query()` first (filter) argument with `documentId` attribute.

**Document Metadata**

**Author:** @bershanskyi

**Sponsoring Browser:** Chromium

**Contributors:** 

**Created:** 2024-04-08

**Related Issues:**
https://github.com/w3c/webextensions/issues/553
https://issues.chromium.org/issues/326749718
https://chromium-review.googlesource.com/c/chromium/src/+/5318738

## Motivation

### Objective

Extension interact with tabs in an explicitly asynchroneous manner, so every
interaction is fundmentally prone to race conditions and
time-of-check-time-of-use bugs. Currently extension may query tabs based on
only incidental identifiers like `windowId`, `index`, and if extension has
powerful `"tabs"` permission, then also `title` and `url`. Such checks are
inherintly cumbersome for the extension developer, may lead to extension
wrongfully assuming that a page navigation has occured when the page just
changed its title or url programmatcally or extension may fail to detect page
reload.
This proposal aims to permit extension to query tabs directly by document id
which is garanteed to persist across tab moves and guaranteed to change on page
loads. This filter should be accessible without `"tabs"` permission to enable
extensions to run without `"tabs"` permission.

#### Use Cases

Any use cases which use `tabs.query()` in cases when document navigation or
load is likely.

### Known Consumers

Dark Reader would benefit from better availability of `documentId`. Dark Reader
relies on `documentId` extensively on Chromium MV3 and emulates it if it is not
availabke natively (Firefox, Chromium MV2) by creating an identifier in content
script world and passing it everywhere.

## Specification

### Schema

Extend `QueryInfo` argument passed to
`tabs.query(queryInfo: QueryInfo, callback?: function)` with `documentId`
which is a `string`.

### Behavior

1. If `documentId` is omitted, then `tabs.query()` behaves as before.
2. If `documentId` is provided to `tabs.query()`, it is validated as any
   other filter attribute and if provided value is malformed (not a `string`
   or can not be parsed into proper document id), an error is thrown. If the
   format of id is valid, but browser does not have a corresponding tab, then
   `tabs.query()` succeeds with an empty response, since the id may represent
   a tab not currently visible in the tab strip or a tab belonging to past
   browsing session.
3. If `documentId` is provided and valid, then `tabs.query()` returns only the
   tab which hosts the corresponding document in a top-level context and
   matching all other filters. (In particular, if `documentId` corresponds to
   sub-frame, an empty list is returned, matching current implementation.)

### New Permissions

No changes.

### Manifest File Changes

No changes.

## Security and Privacy

### Exposed Sensitive Data

Document ids correspond to unique page loads, so a compromised or malicious
extension could infer page navigations by polling `tabs.query()` untill a
particular document appears or disappers to conclude back-forth navigation.
This is not a major consiredation, however, since `tabs` already provides
a number of events exposing even more information.

### Abuse Mitigations

No special miigations are needed.

### Additional Security Considerations

None.

## Alternatives

### Existing Workarounds

Extensions can ping-pong a message and check `MessageSender.documentId` to assertain
(with some confidence) that the document has not been navigated at some point.

### Open Web API

None, this is an extension to WebExtensions API.

## Implementation Notes

None.

## Future Work

1. Consider adding `pendingDocumentId` to `QueryInfo`.
2. Consider adding `documentId` to `Tab` object, as discussed in a [separate issue](https://github.com/w3c/webextensions/issues/496).
