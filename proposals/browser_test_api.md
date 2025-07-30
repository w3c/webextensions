# Proposal: browser.test API

**Summary**

Enable testing using the `browser.test` runner and assertion API.

**Document Metadata**

**Authors:** @kiaraarose and @zombie

**Sponsoring Browser:** Mozilla Firefox

**Created:** 2025-07-17

**Related Issues:** web-platform-tests/rfcs/pull/219

## Motivation

### Objective

This API provides utilities for writing and running tests for WebExtensions.
It includes assertion functions and a test harness to facilitate structured
and reliable testing.

#### Use Cases

The primary use case is testing WebExtensions implementations using
Web Platform Tests.  Secondary use case is enabling developers to
write and run a cross-browser test suite for their own extensions.

### Known Consumers

All browsers already have this API namespace, and the goal of specifying it
here is to align existing implementations around common behaviors.

## Specification

### Schema

**`browser.test.assertTrue(condition, message)`**
Asserts that a given condition is `true`. If the condition is `false`, the test fails.

**Parameters**
- `condition` (boolean) – The condition to assert.
- `message` (string, optional) – A message describing the assertion.

**`browser.test.assertFalse(condition, message)`**
Asserts that a given condition is `false`. If the condition is `true`, the test fails.

**Parameters**
- `condition` (boolean)
- `message` (string, optional)

**`browser.test.assertEq(actual, expected, message)`**
Throws an assertion error and fails the test if the actual value is not logically equal to the
expected value. Rules:
1) _Plain arrays_ (`Array.isArray()` returns true) are compared for _deep_ equality.
    1.1) Their `length` and all items are recursively compared by these same rules.
2) _Plain objects_ (with prototype `Object.prototype` or `null`) are also compared recursively.
    2.1) Only enumerable _own_ properties are considered, unordered.
3) Everything else is compared using `Object.is()` [same value algorithm](https://tc39.es/ecma262/#sec-samevalue).

We start with support for a minimal set of compound types and plan to expand to include
`ArrayBuffer`s, `Map`s, `Set`s, etc., in line with Node’s `assert.deepStrictEqual()`.

**Parameters**
- `actual` (any)
- `expected` (any)
- `message` (string, optional)

**`browser.test.assertThrows(fn, expectedError, message)`**
Asserts that a given function throws an error. If it does not, or if the thrown error doesn't
match `expectedError` (if defined), the test fails.

**Parameters**
- `fn` (function)
- `expectedError` (string | RegExp, optional)
- `message` (string, optional)

**`browser.test.runTests(tests)`**
Queues test functions to run sequentially and returns a promise that resolves or rejects based
on the outcome.

Each test function is treated as an individual test case. Tests run in order. When one completes,
the next begins. If a test fails (by throwing or rejecting), execution of that test stops and the
next one begins.

The promise:
- **Resolves** if all tests pass.
- **Rejects** if any fail.

Tests pass when they either return `undefined` or when a promise returned by the test resolves.  They fail if they:
- Throw an exception
- Return a promise that rejects
- Trigger an assertion failure

**Parameters**
- `tests` (array of functions)

### Methods for Test Harness Pages

**`browser.test.onTestStarted(listener)`**
Event listener that runs when a test starts.

**Parameters**
- `listener` (function)

**Listener receives:**
- `data.testName` (string)

**`browser.test.onTestFinished(listener)`**
Event listener that runs when a test finishes.

**Parameters**
- `listener` (function)

**Listener receives:**
- `data.testName` (string)
- `result` (boolean)
- `remainingTests` (number)
- `message` (string, optional)
- `assertionDescription` (string)

### New Permissions

No new permissions are necessary.
[This API is only available in test modes](#implementation-notes).

### Manifest File Changes

No manifest file changes are necessary.

## Security and Privacy

### Exposed Sensitive Data

This does not expose any additional sensitive data.

### Abuse Mitigations

This API does not provide any additional avenue for abuse because
[it's only available in test mode](#implementation-notes).

## Alternatives

### Existing Workarounds

Current ways of testing extensions use proprietary methods and non-standard
protocols like CDP.  As a result, testing extensions is hard and especially,
automated testing of extensions across browsers is very rare.

### Open Web API

This API's main purpose is to enable testing of extensions and implementations,
and would not be appropriate as a public web API.

## Implementation Notes

This API namespace SHOULD only be available in extension contexts while
running under WPT or other test modes.

## Future Work

Existing implementation have additional methods with different names and
behaviors, and we plan to align and specify more of them, for example:

 - `assertRejects`
 - `log`
 - `sendMessage`
 - `withHandlingUserInput`

This list non-exhaustive, and future methods might be specified under
different names.
