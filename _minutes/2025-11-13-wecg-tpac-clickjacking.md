This content was presented on 2025-11-13 at TPAC:

* Minutes: "Click-jacking protections" at [2025-11-13-wecg-tpac.md](https://github.com/w3c/webextensions/blob/main/_minutes/2025-11-13-wecg-tpac.md)
* [Issue 235](https://github.com/w3c/webextensions/issues/235): Discuss allowing extensions to reliably draw over pages
* The content below is captured from the original presentation at: https://docs.google.com/presentation/d/1PxQSCcX91hdhY5Yag5QToWnAHGtnQxhrUaa6WDN_cXo/edit

# Clickjacking and Extensions	

Presented by 1Password

## Why does this matter?

 * Credential Managers that operate as browser extensions draw inside the DOM/untrusted content space with UI that performs “sensitive actions”
 * Extensions lack privileged control over the visual layer, which allows web content to race and compete with the extension's drawing to abuse various tricks like:
   * Z-index overlaying
   * Diverting click events to bypass user consent for autofill

## Root of the problem

**The browser security model does not provide extensions with an isolated, authoritative channel for user interaction.**

 * Rendering model flaw: Page content and extension UI share the same top layer system.
 * Event model flaw: Pages get the first chance to intercept user input.
 * Detection flaw: Extensions cannot reliably observe or block overlays,
   * shadow DOM,
   * separate realms,
   * isolated worlds,
   * legitimate pages use the same APIs.
 * Trust boundary collapse: There is no signal that tells the user whether the UI is going to an extension context or to the web page's context

## Web Page controls

 * When an extension inserts its UI into the DOM, it enters the same rendering stack as page-controlled elements.
 * Modern HTML specifications provides primitives to create overlays that are always on top
   * `<dialog>`
   * `showModal()`
   * `[popover]:popover-open`
 * Assigning a large z-index value such as `2147483647` does not guarantee an element to be in the highest stacking order.
 * By design, pages can still display above extension UI.

## Overlay detection is difficult and fragile

 * **IntersectionObserver (v2)** provides signals about element visibility and occlusion.
   * There are false positives
   * Expensive to performance when run continuously
 * **MutationObservers** can detect DOM insertions or changes.
   * Pages can insert malicious overlays in shadow DOMs
 * **Monkey patching of DOM APIs** in the main world is brittle.
   * Extensions can attempt to wrap or hook functions
   * Page scripts run in the same JavaScript realm

## Comprehensive suppression breaks legitimate pages

 * In theory, an extension could aggressively suppress the use of dialogs, popovers, or other overlays whenever its UI is open.
 * In practice, this strategy disrupts normal page behavior.
   * Login forms,
   * payment dialogs,
   * cookie consent notices
   * accessibility features
