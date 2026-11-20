# Proposal: `SecurityInfo` in `webRequest`

**Summary**

An API proposal to extend the `webRequest` API with the TLS/QUIC connection state, parameters and server certificates of a request.

**Document Metadata**

**Author:** [Vlad Krot](https://github.com/vkrot-cell)

**Sponsoring Browser:** Google Chrome

**Created:** 2025-11-05

**Related Issues:**
* [WECG issue #882](https://github.com/w3c/webextensions/issues/882)
* [Mozilla Bug 1322748](https://bugzilla.mozilla.org/show_bug.cgi?id=1322748)
* [Previous abandoned Chromium Proposal](https://github.com/EFForg/webrequest-tlsinfo-api/blob/master/proposal.md)
* [Chromium Feature Request: webRequest.getSecurityInfo()](https://g-issues.chromium.org/issues/40754456)
* [Chromium Feature Request: Extend webRequests onCompleted callback to include information about TLS connections](https://g-issues.chromium.org/issues/41264310)

## Motivation

### Objective

Give extensions the TLS facts the browser already has for each request, which developers have requested for years (see Related Issues).

#### Use Cases

This API would enable extensions to:
* Replicate the functionality of security scoring tools.
* Provide more granular or prominent certificate chain introspection than the browser's built-in UI.
* Attempt to detect Man-in-the-Middle (MITM) attacks, e.g. a trust anchor that does not ship with the browser.
* Assist in debugging TLS deployment and configuration issues.
* Enforce custom security policies by blocking requests with insecure or non-compliant certificates (where `webRequestBlocking` is available).

### Known Consumers

Existing Firefox extensions could move to Chrome and other browsers that adopt this specification:
* A notable example is [IndicateTLS](https://addons.mozilla.org/en-US/firefox/addon/indicatetls/), which relies on similar functionality.
* 54 extensions call Firefox's `webRequest.getSecurityInfo()`, and 36 of them pass `certificateChain: true`.

## Specification

### Schema

New `extraInfoSpec` values (in `OnHeadersReceivedOptions`, `OnCompletedOptions`, `OnErrorOccurredOptions`) and a new optional `securityInfo` field in those events' details.

Firefox's `onErrorOccurred` has no `extraInfoSpec` parameter today, so it would gain one.

```typescript
export enum SecurityInfoOptions {
  /** Include details.securityInfo. */
  SecurityInfo = "securityInfo",
  /** Also include CertificateInfo.rawDER. Implies "securityInfo". */
  SecurityInfoRawDer = "securityInfoRawDer",
  /** Include the validated chain; see Certificates. Implies "securityInfo". */
  SecurityInfoCertificateChain = "securityInfoCertificateChain",
}

export interface Fingerprint {
  /** SHA-256 of the DER certificate, uppercase colon-separated hex ("AB:CD:..."). */
  sha256: string;
}

export interface CertificateInfo {
  fingerprint: Fingerprint;
  /** DER bytes. */
  rawDER?: ArrayBuffer;
  /** True if the trust anchor ships with the browser. Only with "securityInfoCertificateChain", only on the last certificate. */
  isBuiltInRoot?: boolean;
}

export enum ConnectionState {
  /** The request did not use TLS (e.g. http://). */
  Insecure = "insecure",
  /** TLS connection with a weakness listed in weaknessReasons. */
  Weak = "weak",
  /** TLS handshake or certificate verification failed. onErrorOccurred only. */
  Broken = "broken",
  /** TLS handshake and certificate verification succeeded. */
  Secure = "secure",
}

export enum TransportWeaknessReason {
  /** See "Overridden certificate error". */
  DistrustOverriddenByUser = "distrustOverriddenByUser",
}

export enum OverridableErrorCategory {
  /** The chain is not trusted or fails a trust requirement (e.g. unknown issuer, self-signed, weak key). */
  TrustError = "trust_error",
  /** The certificate does not match the host name. */
  DomainMismatch = "domain_mismatch",
  /** Outside the certificate's validity period. */
  ExpiredOrNotYetValid = "expired_or_not_yet_valid",
}

export interface SecurityInfo {
  state: ConnectionState;

  /** The fields below are present only when state is "secure" or "weak". */
  certificates?: CertificateInfo[];
  protocolVersion?: "TLSv1" | "TLSv1.1" | "TLSv1.2" | "TLSv1.3";
  cipherSuite?: string;
  keaGroupName?: string;
  secretKeyLength?: number;
  usedEch?: boolean;
  weaknessReasons?: TransportWeaknessReason[];
  /** See "Overridden certificate error". */
  overridableErrorCategory?: OverridableErrorCategory;
}

export interface DetailsWithSecurityInfo {
  /** ... existing fields */
  securityInfo?: SecurityInfo;
}
```

### Behavior

#### Opt-in and events

* An extension receives `securityInfo` only if its listener passes one of the three values in `extraInfoSpec`. It needs the `webRequest` permission and host permissions, but not `webRequestBlocking`.
* The data comes in the event details, not through a separate method like Firefox's `getSecurityInfo(requestId)` ([WECG review](https://github.com/w3c/webextensions/pull/899#discussion_r2621147426)).
  * Non-blocking listeners: in Chrome, Manifest V3 extensions can't use blocking webRequest; only policy-installed extensions keep `webRequestBlocking` ([Chrome docs](https://developer.chrome.com/docs/extensions/reference/api/webRequest)). A method called after a non-blocking event can't hold the request, so the browser would have to keep every request's certificate data until each interested extension asks, or block the request.
  * Performance: the browser keeps a request's certificate data and builds `securityInfo` only for such listeners, once per event. This matters most for raw DER, which grows with post-quantum signatures ([FIPS 204](https://csrc.nist.gov/pubs/fips/204/final)).

| Event | `securityInfo` describes |
| --- | --- |
| `onHeadersReceived` | The connection that delivered this response. |
| `onCompleted` | The connection that delivered the final response. |
| `onErrorOccurred` | See [onErrorOccurred](#onerroroccurred). |

For a response served from the HTTP cache, the connection is the one that originally fetched it.

#### `state`

`ConnectionState` in the schema defines each value.

**Overridden certificate error.** When the browser lets a request continue despite a certificate error (e.g. the user proceeded through a certificate warning, or a flag such as Chrome's `--ignore-certificate-errors` is set):
* `state` is `"weak"`, and `weaknessReasons` contains `"distrustOverriddenByUser"`.
* `overridableErrorCategory` names the error (`OverridableErrorCategory` in the schema).
* If several errors apply, the first in that order wins (Firefox's order): `trust_error`, then `domain_mismatch`, then `expired_or_not_yet_valid`.
* A certificate error that fits none of the categories leaves `overridableErrorCategory` unset.

#### Fields

| Field | Value |
| --- | --- |
| `protocolVersion` | QUIC reports `"TLSv1.3"`. Omitted if unknown. |
| `cipherSuite` | IANA name, e.g. `"TLS_AES_128_GCM_SHA256"`. |
| `keaGroupName` | Firefox's names, e.g. `"x25519"`, `"P256"`, `"mlkem768x25519"`. |
| `secretKeyLength` | Symmetric key length in bits, e.g. 128 for AES-128. |
| `usedEch` | `true` if the connection used Encrypted Client Hello. |

#### Certificates

* **Default:** `certificates` is `[leaf]`.
* **With `"securityInfoCertificateChain"`:** the path the browser built and validated, leaf first, trust anchor last. This is the meaning of Firefox's `certificateChain: true`.
  * The trust anchor is not always a self-signed root. The Chrome Root Store marks some intermediates as trust anchors ([example entry](https://chromium.googlesource.com/chromium/src/+/5b301efcac4f5881eebda429845b1de916fd8bf3/net/data/ssl/chrome_root_store/root_store.textproto#1711)), so the path ends there. Example (2026-11): www.google.com gives 2 certificates in Chromium's verifier and 3 in Firefox.
  * The chain is browser-specific and may change over time, e.g. after a root store update. Extensions must not assume a chain length.
* **After an overridden certificate error:** `certificates` is `[leaf]`, even with `"securityInfoCertificateChain"`, because the browser has no validated path. In Chromium the chain is then [a copy of what the server sent](https://chromium.googlesource.com/chromium/src/+/5b301efcac4f5881eebda429845b1de916fd8bf3/net/socket/ssl_client_socket_impl.cc#1105) after a click-through, or a path that failed validation with a flag. `isBuiltInRoot` is absent.
* **The list the server sent is not exposed.** Chromium does not keep it for HTTP/3 connections or for responses from the HTTP cache, and no Chrome UI uses it.

#### onErrorOccurred

* **`"broken"`:** `securityInfo` is `{state: "broken"}`.
  * Why no certificates: exposing certificates the browser rejected effectively invites extensions to trust them. An extension may check only the part it cares about (e.g. a root it recognises) and ignore why the browser rejected the certificate, which gives the appearance of security without real security. Tools that debug a failed handshake can fetch the server's certificates out of band.
  * Why no `errorMessage`: `details.error` already carries the error, and Chrome documents that this string must not be parsed ([web_request.json](https://chromium.googlesource.com/chromium/src/+/5b301efcac4f5881eebda429845b1de916fd8bf3/extensions/common/api/web_request.json#718)). `state: "broken"` is the stable signal.
* **The request failed for another reason after a successful handshake:** the same `securityInfo` as in `onHeadersReceived`, including certificates, when available.
  * Chromium has it when the error occurred after response headers were received, e.g. the connection dropped while reading the body, or an extension cancelled the request in `onHeadersReceived`.
  * Chromium has nothing when the error occurred before response headers, e.g. a connection reset right after the handshake. `securityInfo` is then omitted.
* **The request did not use TLS** (e.g. `http://`): `{state: "insecure"}`.
* **A TLS request failed before any handshake** (e.g. DNS failure, connection refused): `securityInfo` is omitted.

#### Feature detection

For an `extraInfoSpec` value it doesn't know, Chrome's `addListener` throws a `TypeError` and Firefox's throws an `Error`. Safari doesn't throw ([WECG minutes, 2025-10-09](https://github.com/w3c/webextensions/blob/4d082136528cc59a685cb0d230be720211ac11d1/_minutes/2025-10-09-wecg.md#L159-L160)). The portable check is `"securityInfo" in details`.

### Example

Log the negotiated parameters and the chain, and flag overridden certificate errors and TLS failures.

```javascript
const filter = { urls: ["https://*/*", "wss://*/*"] };

chrome.webRequest.onCompleted.addListener((details) => {
  const info = details.securityInfo;
  if (!info || info.state === "insecure") return;

  if (info.weaknessReasons?.includes("distrustOverriddenByUser")) {
    console.warn(`${details.url}: certificate error overridden (${info.overridableErrorCategory ?? "other"})`);
    return;
  }

  const [leaf] = info.certificates;
  const anchor = info.certificates.at(-1);
  console.log(`${details.url}: ${info.protocolVersion} ${info.cipherSuite} ${info.keaGroupName}`);
  console.log(`leaf ${leaf.fingerprint.sha256}, anchor built-in: ${anchor.isBuiltInRoot}`);
}, filter, ["securityInfoCertificateChain"]);

chrome.webRequest.onErrorOccurred.addListener((details) => {
  if (details.securityInfo?.state === "broken") {
    console.warn(`${details.url}: TLS handshake or certificate verification failed`);
  }
}, filter, ["securityInfo"]);
```

### New Permissions

None.

### Manifest File Changes

None.

## Security and Privacy

### Exposed Sensitive Data

* The server sends its certificates in every TLS handshake, so any client connecting to it can obtain them. The TLS parameters describe the browser's own connection.
* With `"securityInfoCertificateChain"`, a connection that chains to a locally installed root (e.g. a corporate TLS-inspecting proxy) reveals that root. It does not enumerate the trust store: a local root only shows up when a visited site chains to it.
* `overridableErrorCategory` reveals that a certificate error was overridden for the host.
* Certificates from a failed TLS handshake are never exposed (see [onErrorOccurred](#onerroroccurred)).

Firefox already exposes all of the above.

### Abuse Mitigations

Only listeners that opt in receive the data, under existing permissions ([Opt-in and events](#opt-in-and-events)).

### Additional Security Considerations

* The API cannot change any trust decision; it only reports the browser's.
* Certificates are delivered as DER bytes and fingerprints. Extensions that parse them do so in their own process.

## Alternatives

### Existing Workarounds

Currently, extensions can only approximate this functionality by capturing a request's URL and sending it to a separate backend service. This service must then perform its own TLS handshake with the destination server to retrieve the certificate. This approach has significant drawbacks:

* **Inaccuracy**: It does not guarantee that the extension sees the same certificate the browser saw. This can be caused by load balancing, geographic routing, or a Man-in-the-Middle (MITM) attack.
* **Performance**: It introduces significant latency and network overhead for both the user and the extension's backend.
* **Privacy**: It requires sending the user's browsing-related URLs to a third-party server, which is a privacy concern.

### Open Web API

This proposal extends the `webRequest` API, which is not available on the open web.

The [Controlled Frame API](https://wicg.github.io/controlled-frame/) for Isolated Web Apps already exposes a `SecurityInfo` dictionary (`state` and `certificates`) on its `headersreceived` event. This proposal's object is a superset of it, except for overridden certificate errors (see Chromium status).

## Implementation Notes

* **Relation to Firefox:** field names and value formats follow Firefox's [`webRequest.getSecurityInfo()`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/getSecurityInfo). Deliberate differences:

| Difference | Firefox today | Reason |
| --- | --- | --- |
| `rawDER` type | Array of integers | `ArrayBuffer` is compact; it's what Chrome's binary schema type produces. |
| `isBuiltInRoot` | On every certificate (`false` except possibly the last), also without the chain option | Absence means "not applicable" instead of a misleading `false`. |
| `weaknessReasons: "cipher"` | The only value. Nothing sets the [`STATE_USES_WEAK_CRYPTO`](https://searchfox.org/mozilla-central/search?q=STATE_USES_WEAK_CRYPTO) flag it reads; the [handshake code](https://github.com/mozilla-firefox/firefox/blob/deb2f407762a61a775f79b4dbe605f95c92e9d6d/security/manager/ssl/nsNSSCallbacks.cpp#L1179-L1190) marks a connection broken only for TLS < 1.2 or unsafe renegotiation. | Dropped as dead. |
| Overridden certificate error | `"secure"` + `overridableErrorCategory` | A connection whose certificate failed verification should not read as `"secure"` ([details](#state)). |
| `protocolVersion` unknown | `"unknown"` | Absence is how every optional field signals "no data". |
| Chain after an overridden error | `[]` ([bug 1678492](https://bugzilla.mozilla.org/show_bug.cgi?id=1678492)) | See [Certificates](#certificates). |
| `onErrorOccurred` | `getSecurityInfo()` returns `undefined` ([bug 1474657](https://bugzilla.mozilla.org/show_bug.cgi?id=1474657)) | See [onErrorOccurred](#onerroroccurred). |

* **Chromium status:**
  * Controlled Frame: on by default since Chrome 145. Controlled Frame needs Isolated Web Apps, which are enabled by default only on ChromeOS.
  * Extensions: behind `chrome://flags/#web-request-security-info` (off by default, desktop only). With the flag off, Chrome accepts the new `extraInfoSpec` values but logs a console error and drops the listener.
  * Implemented for extensions: `onHeadersReceived` with `state`, the leaf and `rawDER`. [CL 8637229](https://chromium-review.googlesource.com/c/chromium/src/+/8637229) adds `onCompleted`, `protocolVersion` and `cipherSuite`.
  * Not yet implemented: `keaGroupName` (mapped from BoringSSL's names `"X25519"`, `"P-256"`, `"X25519MLKEM768"`), `secretKeyLength`, `usedEch`, `weaknessReasons`, `overridableErrorCategory`, the chain and `onErrorOccurred`.
  * Chromium currently reports an overridden certificate error as `"broken"`, in extensions and Controlled Frame; this proposal changes that to `"weak"`.
* **Chromium `overridableErrorCategory` mapping** (`cert_status` flags; Firefox's categories are in [`CategorizeCertificateError`](https://github.com/mozilla-firefox/firefox/blob/deb2f407762a61a775f79b4dbe605f95c92e9d6d/security/manager/ssl/SSLServerCertVerification.cpp#L247-L280)):
  * `trust_error`: `CERT_STATUS_AUTHORITY_INVALID`, `CERT_STATUS_WEAK_KEY`, `CERT_STATUS_WEAK_SIGNATURE_ALGORITHM`, `CERT_STATUS_CERTIFICATE_TRANSPARENCY_REQUIRED`, `CERT_STATUS_KNOWN_INTERCEPTION_BLOCKED`.
  * `domain_mismatch`: `CERT_STATUS_COMMON_NAME_INVALID`.
  * `expired_or_not_yet_valid`: `CERT_STATUS_DATE_INVALID`.
  * No category: Chromium errors with no Firefox equivalent, e.g. `CERT_STATUS_NAME_CONSTRAINT_VIOLATION`, `CERT_STATUS_NON_UNIQUE_NAME`, `CERT_STATUS_VALIDITY_TOO_LONG`.
* **Firefox fields left out:**

| Field | Reason |
| --- | --- |
| `subject`, `issuer`, `validity`, `serialNumber`, `fingerprint.sha1`, `subjectPublicKeyInfoDigest` | Derivable from `rawDER`. |
| `isUntrusted`, `isDomainMismatch`, `isNotValidAtThisTime` | Deprecated in favour of `overridableErrorCategory` (see the note below). |
| `usedDelegatedCredentials`, `usedOcsp`, `usedPrivateDns` | Not exposed by Chromium's network stack: [`SSLInfo`](https://chromium.googlesource.com/chromium/src/+/5b301efcac4f5881eebda429845b1de916fd8bf3/net/ssl/ssl_info.h) has no such data. |
| `hpkp` | HPKP headers are obsolete; Firefox reports only its built-in pin list, which is browser-specific. |

**Note on MDN:** MDN's `SecurityInfo` page doesn't list `overridableErrorCategory` and still shows [`isDomainMismatch`, `isNotValidAtThisTime` and `isUntrusted`](https://github.com/mdn/content/blob/09109b6f9444d22215ba330ec1e64e73980b2a6c/files/en-us/mozilla/add-ons/webextensions/api/webrequest/securityinfo/index.md#L38-L45) as regular fields. Firefox has shipped `overridableErrorCategory` since Firefox 106 (2022): [commit](https://github.com/mozilla-firefox/firefox/commit/2e8528c351e8429cc1a59243981988d1f8d23c47) for [bug 1781104](https://bugzilla.mozilla.org/show_bug.cgi?id=1781104), and the current schema has [the field](https://github.com/mozilla-firefox/firefox/blob/deb2f407762a61a775f79b4dbe605f95c92e9d6d/toolkit/components/extensions/schemas/web_request.json#L303-L312) and [marks the three booleans deprecated](https://github.com/mozilla-firefox/firefox/blob/deb2f407762a61a775f79b4dbe605f95c92e9d6d/toolkit/components/extensions/schemas/web_request.json#L313-L329). The change landed in a Core :: Security: PSM bug with no `dev-doc-needed` keyword.

## Future Work

* **Porting the new fields to Controlled Frame:** a separate effort.
* **Possible additions if there is demand:** `signatureSchemeName`, `certificateTransparencyStatus`, `hsts`, `isExtendedValidation`.
