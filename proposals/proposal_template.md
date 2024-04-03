# Proposal: &lt;API>

** How to Use This Template **

See [Proposal Process](proposal_process.md) for the detailed process on how to
propose new APIs and use this template.  Each section includes instructions on
what to include.  Delete the instructions for a given section once it's filled
out.  Remove this section once the template is filled out.

**Summary**

An API proposal for your new API.  Describe in **one sentence** what it will be
used for.

**Document Metadata**

**Author:** &lt;your Github handle>

**Sponsoring Browser:** The browser vendor committed to implementing this API
if approved.

**Contributors:** &lt;other contributors emails or GitHub handles>

**Created:** YYYY-MM-DD

**Related Issues:** &lt;urls>

## Motivation

### Objective

What does this API enable?  Why do we need it?

#### Use Cases

Describe the use cases for this API.  There may be multiple.

### Known Consumers

APIs should, ideally, have significant adoption once they are complete.
Highlight any extensions that have committed to using this API.

## Specification

### Schema

Include your API schema here (preferably with a TypeScript interface).  If you
are adding new functionality or fields to an existing method, please be sure to
call out explicitly what has changed.

A few notes:

*   Extension APIs are almost always asynchronous.  In most browsers, extensions
    run in a separate child process for security purposes.  Anything that cannot
    be resolved directly in a child process must be asynchronous, and even if
    something can be done in a child process today, it should frequently be
    asynchronous to prevent future breakage if we move something to the parent
    process.
*   Failures should be indicated by either synchronously throwing an error
    (rare) or rejecting the returned promise.  (Note that in legacy versions,
    this will populate
    [chrome.runtime.lastError](https://developer.chrome.com/extensions/runtime#property-lastError).)
    Do not provide another mechanism of indicating failure (e.g., don't accept
    a failure callback).
*   When practical, prefer accepting objects for input parameters.  This allows
    us to expand APIs in the future in a non-breaking change by adding
    additional optional properties.  Even if you currently only accept one
    property, it often makes sense to wrap this in an object.

### Behavior

Describe the behavior of the new API if there is anything that is not
immediately obvious from the schema above. Include descriptions of:

*   Behavior on the newly-introduced types and methods.
*   Impacted behavior on existing API methods and surfaces, if any.

This does not (yet) need to follow strict spec language; however, the more clear
you can be the better. This helps reduce the number of questions that may arise
during the API review as well as ensure browsers are able to align with one
another.

You may add subsections (e.g., `#### Behavior Section 1` and
`#### Behavior Section 2`) as appropriate to aid in readbility.

### New Permissions

| Permission Added | Suggested Warning |
| ---------------- | ----------------- |
| New Permission 1 | Add a proposed warning string for the permission.  If there should be no warning, provide justification as to why. Browser vendors can ultimately choose if there should be a warning and what it should be independently, but this can be useful to define especially if it has implications for the likelihood this proposal will succeed or be useful to developers. |

Document any new permission added by this API.  Permissions are frequently the
same as the API itself, e.g. the `browser.storage` API has the permission
"storage".

If this is a new API, it should add a new permission.  A new permission does
_not_ always require a new permission warning (though it should frequently have
one).  Adding a permission allows us to statically analyze extensions with
greater accuracy, and avoid exposing unnecessary APIs.

If this is a modification to an existing API, it _may_ require a new permission
if the capabilities it adds are significantly different than the existing
functionality in the API, and not already covered by the permission warning.
Note that this is generally an indication that this might be better as a new
API than a modification to an existing API.  If no new permission is needed,
note why this falls within the current bounds of the API's capabilities.

### Manifest File Changes

Document if your API will require additional manifest fields to be added or
modified (other than a new permission), and what they will do.  If non-trivial,
describe the validation and error handling.  When a failure is not critical,
prefer a soft warning over a hard error.  Hard errors will prevent the extension
from loading, which makes it more challenging to change or expand behavior in
the future.

If there are no new manifest fields, indicate so here.

## Security and Privacy

### Exposed Sensitive Data

Document any sensitive data or personally-identifiable information the API
exposes to the extension.

### Abuse Mitigations

Extension APIs are very frequently powerful and scary (which is one of the
primary reasons they cannot be exposed to the open web).  Highlight any ways
this API could be abused by extensions using it.  These should describe ways
that the API could be potentially abused that are _not_ bugs in the browser.
(For instance, stealing PII that is provided through the API is not a bug in
the browser, but is an avenue for abuse.)

Describe how these scenarios will be mitigated.  Examples include restricting
based on user action, increased attribution, visual disclosure to the user,
etc.

### Additional Security Considerations

Highlight any additional security considerations in the design of this API.
Consider process sandboxing, any input that needs to be sanitized, what can
happen in the case of a compromised process, and other potential attack
vectors.

## Alternatives

### Existing Workarounds

Describe any workarounds that exist today.  If this API did not exist, what
approach could developers take to solve the same use cases?

### Open Web API

Extensions are designed to be "The Web + More", not an alternative to the web.
Additionally, an Open Web API is generally preferred when possible, because
they allow the utility to be shared by extensions, websites, Progressive Web
Apps, and more.

Describe why this API does not belong on the open web.

## Implementation Notes

If there are any significant notes on implementation that are relevant across
browsers, please indicate them here.  (Feel free to add more sections.)

## Future Work

Highlight any planned or prospective future work.
