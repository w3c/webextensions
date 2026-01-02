# Proposal: `SecurityInfo` in `webRequest` 

**Summary**

An API proposal to extend the `webRequest` API to provide TLS/QUIC certificate information and connection state for a given request.

**Document Metadata**

**Author:** [Vlad Krot](https://github.com/vkrot-cell)

**Sponsoring Browser:** Google Chrome

**Contributors:** <other contributors emails or GitHub handles>

**Created:** 2025-11-05

**Related Issues:**
* [Mozilla Bug 1322748](https://bugzilla.mozilla.org/show_bug.cgi?id=1322748)
* [Previous abandoned Chromium Proposal](https://github.com/EFForg/webrequest-tlsinfo-api/blob/master/proposal.md)

## Motivation

### Objective

This API enables extensions to inspect the server certificate of a web request after a secure connection (TLS/QUIC) has been established. This fulfills a long-standing developer need for TLS introspection, allowing for the creation of advanced security and debugging tools.

#### Use Cases

The lack of TLS introspection prevents the development of a number of security-focused browser extensions. This API would enable extensions to:
* Replicate the functionality of security scoring tools.
* Provide more granular or prominent certificate chain introspection than the browser's built-in UI.
* Attempt to detect Man-in-the-Middle (MITM) attacks.
* Assist in debugging TLS deployment and configuration issues.
* Enforce custom security policies by blocking requests with insecure or non-compliant certificates.

### Known Consumers

This API would facilitate the migration of existing Firefox extensions to Chrome and other browsers that adopt this specification. 
A notable example is [IndicateTLS](https://addons.mozilla.org/en-US/firefox/addon/indicatetls/), which relies on similar functionality.

## Specification

### Schema

This proposal introduces a new optional field, `securityInfo`, to the details object of the `webRequest.onHeadersReceived` event. Its presence is controlled by new `OnHeadersReceivedOptions`.

```typescript

export enum OnHeadersReceivedOptions {
   // .. old fields,

   // If used, then securityInfo will be provided.
   "securityInfo",
   // The option is used to provide securityInfo with raw bytes of a server certificate.
   "securityInfoRawDer"
}

export interface Fingerprint {
    /**
     * SHA-256 hash of the certificate.
     */ 
    sha256: string;
}

export interface CertificateInfo {
    fingerprint: Fingerprint;
    // Only included if "securityInfoRawDer" is passed to extraInfoSpec
    rawDER?: Uint8Array;
}

/**
 * Represents the state of the network connection.
 */
export enum ConnectionState {
    /**
     * The TLS handshake failed (for example, the certificate has expired).
     */
    Broken = "broken",

    /**
     * The connection is not a TLS connection.
     */
    Insecure = "insecure",

    /**
     * The connection is a secure TLS connection.
     */
    Secure = "secure"
}

export interface SecurityInfo {
    /**
     * The array contains a single CertificateInfo object, for the server certificate, or empty in case 
     * the connection state is "insecure" (http).
     */
    certificates: CertificateInfo[];
    /**
     * State of the connection.
     */
    state: ConnectionState;
}

export interface OnHeadersReceivedDetails {
    // ... existing fields
    /**
     * Information about the security of the connection. This is only
     * present if "securityInfo" is passed in the extraInfoSpec parameter
     * and the request used a secure connection.
     */
    securityInfo?: SecurityInfo;
}

```

### Behavior

* New `onHeadersReceivedOptions` are necessary for performance reasons. They specify whether ssl data must be kept for as long as the web request is alive. Without them, unnecessary data can be kept for longer. Which is very undesirable especially in post quantum cryptography, since certificates can take a significant amount of memory space. 
Note that Firefox has no such an option, because it only supports blocking web requests call while there’s still ssl data.

* A new `securityInfo` object can be obtained in the `onHeadersReceived` event listener.

* To receive this information, an extension **must** include `"securityInfo"` or `"securityInfoRawDer"` in the `extraInfoSpec` array when calling `addListener`. This opt-in design prevents performance overhead for the majority of extensions that don't need this data.

* The `securityInfo` object will only be populated for requests made over a secure protocol (e.g., HTTPS, WSS) where the TLS/QUIC handshake has successfully completed or also in case of certificate errors.
Browsers interrupt connections when there's a certificate error, unless user has explicitely allowed it in the browser UI, only in this case it is possible to have SecurityInfo with `state = "broken"`.

* `certificates` - will contain only the leaf server certificate. This is done for future extensibility and Firefox API compatibility, because there they also provide a leaf if [certificateChain](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/getSecurityInfo#certificatechain) is not included in getSecurityInfo options.

* `state` - State of the connection. One of:
    * `"broken"`: the TLS handshake failed (for example, the certificate has expired)
    * `"insecure"`: the connection is not a TLS connection
    * `"secure"`: the connection is a secure TLS connection
    * Note that Firefox extension API has a `“weak”` state of connection, which does not exist in Chrome.

* The `CertificateInfo.rawDER` field contains the raw certificate bytes in DER format, which can be parsed by the extension using a third-party library. This field is only provided if `extraInfoSpec` array includes `"securityInfoRawDer"`. The reason for it is a performance optimization to not pass raw bytes when
it is not necessary, and compatibility with Firefox extensions API.

### Example

Here is an example of an extension listening for web requests to log the server's certificate fingerprint.

```javascript
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.securityInfo && details.securityInfo.state == "secure") {
      console.log(`Received certificate for ${details.url}. The fingerprint is ${details.securityInfo.certificates[0].fingerprint.sha256}`);
    }
  },
  // Filter for requests.
  { urls: ["<all_urls>"] },
  // Opt-in to receive the security info.
  ["securityInfo"]
);
```

## Security and Privacy

### Exposed Sensitive Data

This API exposes the server's leaf certificate for a given connection. This is public information that is exchanged as part of any standard TLS handshake.
So, no sensitive data is exposed.

## Alternatives

### Existing Workarounds

Currently, extensions can only approximate this functionality by capturing a request's URL and sending it to a separate backend service. This service must then perform its own TLS handshake with the destination server to retrieve the certificate. This approach has significant drawbacks:

* **Inaccuracy**: It does not guarantee that the extension sees the same certificate the browser saw. This can be caused by load balancing, geographic routing, or a Man-in-the-Middle (MITM) attack.
* **Performance**: It introduces significant latency and network overhead for both the user and the extension's backend.
* **Privacy**: It requires sending the user's browsing-related URLs to a third-party server, which is a privacy concern.

This API resolves all three issues by providing the exact, browser-verified information directly.

### Open Web API

This proposal extends Web Request API which is not available on Open Web.
However, the Open Web has [Controlled Frame API](https://wicg.github.io/controlled-frame) which includes WebRequest as well. It is planned to extend Controlled Frame API, although in a separate web proposal.

## Implementation Notes

This proposal is heavily inspired by Firefox's `webRequest.getSecurityInfo()` to promote cross-browser compatibility. However, it adapts the design to fit Chrome's non-blocking, event-driven architecture (Manifest V3):

* **Event-Based vs. Function Call**: Instead of a separate `getSecurityInfo(requestId)` function (as in Firefox), this API injects the data into the existing `onHeadersReceived` event.
* **Rationale**: In a non-blocking model, the internal network and certificate data associated with a request is often discarded immediately after the request pipeline advances. A separate asynchronous getSecurityInfo call would be racy and unreliable. By "opting in" with extraInfoSpec, the extension signals the browser to hold onto this data just long enough to deliver it with the onHeadersReceived event, ensuring data availability without blocking.


## Future Work

This proposal focuses on the most critical and high-priority data (the leaf certificate). The `SecurityInfo` object can be extended in the future to include:

* The full certificate chain (`CertificateInfo[]`).
* Specific TLS parameters (e.g., protocol version, cipher suite).
* Additional properties like `isDomainMismatch` or `isEV`.