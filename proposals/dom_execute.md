# Proposal: browser.dom.execute()

**Summary**

This API allows an isolated world (such as a content script world or user
script world) to synchronously execute code in the main world of the document
its injected in.

**Document Metadata**

**Author:** rdcronin

**Sponsoring Browser:** Chrome

**Contributors:** Rob--W, ...

**Created:** 2024-06-24

**Related Issues:** <TODO>

## Motivation

### Objective

This allows isolated worlds to synchronously inject in the main world.  This is
both beneficial by itself and also a prerequisite for our current plan to
implement inter-world communication (the latter of which will be a separate
proposal).

#### Use Cases

##### Executing script in the main world

Today, extensions can execute script in the main world by:
* Leveraging scripting.executeScript() or registering content scripts or user
  scripts, or
* Appending a new script tag to the document

The former is heavily asynchronous or requires knowledge of whether to inject
beforehand (to register a script).  The latter is very visible to the site and
has more potential side effects, and is also asynchronous since inline scripts
are forbidden by the CSP applied in MV3 (to restrict remotely-hosted code
injection).  While there's no way to fully "hide" a script from a site, it is
desirable to avoid adding DOM elements (which could interfere with sites with
certain properties).

### Known Consumers

User script managers have expressed an interest in this API, but this is also
useful to any extension that wishes to execute script in the main world while
leveraging information from the isolated world.

## Specification

### Schema

```
declare namespace dom {
  interface ScriptInjection {
    func: () => any;
    args: any[];
  };

  export function execute(
      injection: ScriptInjection
  ): any
}
```

### Behavior

#### Function execution

The function is executed _synchronously_ in the main world.  The return value
is the serialized return value from the function execution.

#### Cross-world contamination

To prevent any "piercing" of the different worlds, all pieces are serialized in
their original world, then a copy is deserialized in the target world.
Otherwise, there would be a risk of sharing variables between worlds (even when
non-obvious, such as by accessing the prototype of an item).

##### Argument serialization

Arguments are serialized and deserialized using the Structured Cloning
algorithm.  This allows for more flexibility than simply JSON conversion.  In
the future, some arguments may have custom serialization.

##### Function serialization

The injected function is serialized to and parsed from a string.  Bound
parameters are not supported.  Arguments must be curried in through the `args`
key.

##### Return value serialization

Like arguments, the return value of the execution is serialized and
deserialized using the Structured Cloning algorithm.

##### Errors

Thrown errors are also serialized using the Structured Cloning algorithm.  When
an input parameter or return value cannot be serialized, an error is thrown
synchronously.  Notably, `Promise` instances such as returned by `async
function` cannot be serialized.

##### Injected script privileges

The injected script has the same privileges as other scripts in the main world.
This goes for API access, Content Security Policy, origin access, and more.

##### CSP Application

The injected script is not considered inline and does not have a corresponding
source; as such, CSP restrictions on script-src (including `script-src 'none'`)
and similar directives do not apply.

However, since the script executes in the main world, other CSP restrictions
(including connect-src and which sources may be added to the document, among
many others) *may* apply to the injected script.

### New Permissions

There are no new permissions for this capability.  This does not allow any new
data access, since it is only accessible once the extension has already
injected a script into the document.  Extensions can also already interact with
the main world of the document through either appending script tags or directly
injecting with registered content or user scripts, or the
scripting.executeScript() method.

### Manifest File Changes

There are no necessary manifest changes.

## Security and Privacy

### Availability

`dom.execute()` will only be available in isolated worlds (content script worlds
and user script worlds).

### Exposed Sensitive Data

This does not result in any new data being exposed.

### Abuse Mitigations

This doesn't enable any new data access.  To prevent any risk of cross-world
interaction, all data that passes between worlds is serialized in the original
world, then deserialized (creating a new copy) in the target world.  The
executed script has no additional capabilities or APIs; it has the same
privilege as the document's own main world code.

### Additional Security Considerations

N/A.

## Alternatives

### Existing Workarounds

Extension developers can inject in the main world through registered content or
user scripts, along with the scripting.executeScript() API.  They can also
inject code in the main world by adding a script tag to the DOM.  However, the
API-powered options are asynchronous, and a script tag is inherently visible to
other scripts running in the main world.

### Open Web API

The open web is unaware of the concept of multiple Javascript worlds, so this
wouldn't belong as an open web API.

## Implementation Notes

N/A.

## Future Work

### Inter-world communication

This API is a necessary first step before introducing inter-world communication
channels.  We plan to do that alongside the implementation for this API.

### Specifying a target world

For now, this API is intended to let scripts running in content or user script
worlds inject in the main world.  In the future, we will expand this to allow a
script to inject in additional other worlds, such as a content script injecting
in a user script world.

### Transferables

It would be nice to consider supporting [transferables](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
in the future. However, this has significant cost associated with it (and some
potential other considerations), and is left out of the initial version of the
API.

### Promise support

An injected function may evaluate to a promise. These cannot be serialized,
which would (with the current proposed behavior) throw an error. We could
instead add handling to wait for the promise to settle and return the result.
