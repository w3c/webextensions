# Proposal: browser.secureStorage

A WebExtension proposal to allow the secure storage of data such as sensitive key material, in platform-agnostic way without relying on native installations.

**Author:**

- Ben Greenberg (Aglide) - [@nebbles](https://github.com/nebbles), [email](mailto:ben@aglide.com)

**Sponsoring Browser:** Google Chrome

**Contributors:**

- Christian R. (1Password) - [@simpleplaces](https://github.com/simpleplaces/), [email](mailto:smp@pengin.systems)
- Oliver Dunk (1Password) - [@oliverdunk](https://github.com/oliverdunk), [email](mailto:oliver@1password.com)

**Created:** 2026-06-04

**Related Issues:** &lt;urls>

## Champions

## Motivation

### Objective

Extensions such as credential/password managers, messaging apps, and cryptocurrency wallets handle sensitive user data, that are commonly encrypted. A common choice is to only persist encrypted versions of the data to places like localStorage and IndexedDB, or persist to a server after encrypting using a key that is only ever available client-side. The decryption keys needed to use this data at runtime are stored only in extension memory, meaning that to access the data after a browser restart, the user must be prompted for whatever the key is derived from, usually a long and hard-to-type password.

Users understandably prefer not to type this, so in desktop applications, a common pattern is to store the decryption key in a system store (like macOS keychain). The system can be told to [only reveal the secret after user verification have been performed](https://developer.apple.com/documentation/security/keychain_services/keychain_items/restricting_keychain_item_accessibility?language=objc#2974973), meaning the application can request the secret but access is only granted if the user that stored it is physically present. This pattern is good for users but currently only possible in extensions by communicating with a native application over [Native Messaging](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging). This is because access to both hardware-based key stores and user verification prompts are not exposed by existing web APIs.

Therefore, a Web Extension API that exposes the ability to retrieve and store sensitive material (e.g. encryption keys, passwords, certificates) in a way assuring it is hardware-backed, and protected with user verification, is proposed.

#### Use Cases

This API would most commonly be used for storing key material or certificates for the purposes of encryption, signing, or authentication.

A common approach with credential managers for native applications, which extensions could adopt, is to generate a device-specific key upon installation.

User data could then be encrypted with this key, and the ciphertext stored in conventional web storage APIs (e.g. localStorage, IndexedDB, `browser.storage`).

When the user interacts with the extension, the extension could (optionally) wait for user verification (e.g. biometric authentication by the platform) and then automatically use the key to decrypt the user's data, reducing the friction of high frequency interactions that span the extensions in-memory lifetime.

Additionally, an extension could store an authentication token, a key, or certificate, and following a pairing mechanism with the user's account, be able to authenticate requests.

### Known Consumers

Earlier versions of this proposal were drafted by the team at 1Password. The [1Password extension] is available for Chrome, Firefox, Safari and Edge and has more than 2M weekly active users in the Chrome Web Store alone. 1Password would be quick to implement this in conjunction with or in place of the current Native Messaging solution.

[1Password extension]: https://chrome.google.com/webstore/detail/1password-%E2%80%93-password-mana/aeblfdkhhhdcdjpifhhbdiojplfjncoa?hl=en

The Dashlane browser extension, also a password manager with over 4M weekly active users in the Chrome Web Store, currently provides a 'remember me' and biometric authentication feature in its extension to make repeated authentication easier. They would likely also be very quick to implement this in place of their solution which requires a network connection, as they don’t leverage a native application to interface with native storage.

The [Keeper Security extension] would also immediately use this API for storage of client-side generated encryption keys. Even though a desktop app is optionally provided to users, Keeper does not wish to use native app dependencies for biometric authentication and key storage. Keeper would also prefer to prompt users in the browser extension directly for biometric authentication instead of relying on a desktop app.

[Keeper Security extension]: https://chrome.google.com/webstore/detail/keeper%C2%AE-password-manager/bfogiafebfohielmmehodmfbbebbbpei?hl=en&authuser=0

The [MetaMask extension], a crypto wallet and a gateway to blockchain applications with over 30 million monthly active users, would also greatly benefit from using this API as a more secure way to store a user's private keys while their wallet is locked. They would also likely be interested in offering users the choice to use biometrics as a simpler way to unlock their wallet.

[MetaMask extension]: https://metamask.io/

The API would likely benefit a wide range of extensions far beyond password management. If you'd like to add your extension, feel free to open a PR.

## Specification

### Proposed API Schema

```ts
interface SecureStorageInfo {
  uvAvailable: boolean;
}

interface SecureStorage {
  /**
   * Gets information about the secure storage implementation.  This can also
   * be used to determine whether the API is available.
   */
  getInfo(): Promise<SecureStorageInfo>;

  /**
   * Stores a key-value pair in secure storage.
   *
   * If the ID has already been used, the value will be overwritten.
   *
   * If `uvRequired` is set, the user will be required to verify their identity
   * before the value can be retrieved.
   *
   * The value will be encrypted and persisted until the extension is
   * uninstalled. The ID must only be unique within the extension.
   */
  set(
    id: string,
    value: string,
    options?: { uvRequired?: boolean },
  ): Promise<void>;

  /**
   * Retrieves IDs of all stored values.
   *
   * If no values are stored, this will return an empty array.
   */
  getIds(): Promise<string[]>;

  /**
   * Retrieves a value from secure storage. If the value does not exist, this
   * will reject with an error.  If `uvRequired` was set when the value was
   * stored, this will prompt the user for verification before returning the
   * value.
   *
   * If the value was stored with `uvRequired: true`, user verification will be
   * will be applied, regardless of the `options.uvRequired` value.
   *
   * If user verification fails, this will reject with an error.
   */
  get(id: string, options?: { uvRequired?: boolean }): Promise<string>;

  /**
   * Deletes one or more values from secure storage.
   *
   * If the value does not exist, the promise will resolve successfully.
   */
  remove(id: string | string[]): Promise<void>;

  /**
   * Deletes all values from secure storage.
   *
   * If there are no values stored, this will resolve successfully without
   * doing anything.
   */
  clear(): Promise<void>;
}

interface Browser {
  secureStorage: SecureStorage;
}
```

Example usage:

```ts
const keyMaterial = crypto.getRandomValues(new Uint8Array(32));
const encoded = Uint8Array.from(keyMaterial).toBase64();

await browser.secureStorage.set("userkey", encoded, {
  uvRequired: true,
});

// This will await until the user is verified by the platform
const userKey = await browser.secureStorage.get("userkey");

// Imported for use in a WebCrypto operation
const userCryptoKey = await crypto.subtle.importKey(
  "raw",
  Uint8Array.fromBase64(userKey),
  "AES-GCM",
  false,
  ["encrypt", "decrypt"],
);

// etc...
```

### Behavior

#### Persistence Guarantees

The `browser.secureStorage` API provides best-effort persistence guarantees. Data stored using this API should persist across browser restarts and crashes, and should only be removed when the extension is uninstalled or when the user explicitly removes it.

However, there may be edge cases where data could be lost (e.g. due to hardware failure, or if the user clears their browser data), and extensions should be designed with this in mind.

#### Context Availability

The `browser.secureStorage` API is only available in the background (service worker) context. This reduces the attack surface of the API, and is sufficient for the most common use cases of securely storing sensitive data such as encryption keys.

#### browser.secureStorage.getInfo()

This method gets information about the secure storage implementation.

#### browser.secureStorage.set()

Stores a key-value pair in secure storage.

If the ID has already been used, the value will be overwritten.

If `uvRequired` is set, the user will be required to verify their identity before the value can be retrieved. If user verification is not available, this will reject with an error.

The value will be stored securely and persisted until the extension is uninstalled. The ID is unique to the scope of the extension, since extensions do not share secure storage.

#### browser.secureStorage.getIds()

Retrieves the list of IDs of all stored values.

If no values are stored, this will return an empty array.

#### browser.secureStorage.get()

Retrieves a value from secure storage. If the value does not exist, this will reject with an error.

If `options.uvRequired` is set to `true`, or if `uvRequired` was set when the value was stored, then user verification will be required before the value can be retrieved. If user verification is not available, this will reject with an error.

If the value was stored with `uvRequired: true`, user verification will be will be applied, regardless of the `options.uvRequired` value.

If user verification fails, this will reject with an error.

#### browser.secureStorage.remove()

Deletes one or more values from secure storage.

If the value does not exist, the promise will resolve successfully.

#### browser.secureStorage.clear()

Deletes all values from secure storage.

If there are no values stored, this will resolve successfully without doing anything.

### New Permissions

The secureStorage API uses the existing "storage" permission, as the sematic meaning to an end-user is the same, whereas the API difference is a technical one.

Introducing a new permission scope (e.g. "secureStorage") was considered, but was discarded to avoid confusing users about the difference which is largely technical.

### Manifest File Changes

No new manifest fields are required for this API.

## Security and Privacy

### Exposed Sensitive Data

The API does not expose any new sensitive data or personally-identifiable information to the extension, that wasn't already previously known since this is a storage API. The API does not allow for cross-extension storage.

### Abuse Mitigations

As with standard storage APIs, there could be a limit imposed by browsers on the maximum amount of data that can be stored on a per-ID basis, and/or a maximum total storage limit for the API.

### Additional Security Considerations

This API is designed to enable extensions to store the most sensitive information they may handle, such as encryption keys. As such, it is critical that browser implementations handle this data with the utmost care, and the best guarantees available. Browsers should not implement this API if they cannot provide strong guarantees around the security of the stored data, and the user verification process (e.g. where platform/hardware-backed options are not available).

## Alternatives

### Existing Workarounds

A common approach to securely storing sensitive data today is to use the Native Messaging API to communicate with a native application that has access to the platform APIs for secure storage. This allows extensions to leverage platform-specific secure storage solutions, such as the macOS Keychain or Windows Credential Manager.

However, this approach requires users to install a separate native application, which can be a barrier to adoption and adds complexity to the extension's architecture.

### Open Web API

This API could belong on the open web. However, the most common use cases in practice today are for applications that need to store an encryption key.

Since these keys are particularly sensitive, application developers are likely to continue using an extension-based approach to minise the exposure of these keys to more hostile environments.

Practically, a Web Extension API is the highest leverage point to introduce such an API.

## FAQ

### How large could the stored data be?

The expectation is that implementation specific limits would be set. Only a very small allowance per value (e.g. ~5 KB for ML-DSA private key) is needed for the known use cases.

### Why not use a Web API?

There have been proposals in the past which are now stale/abandoned, including:

- A [WebKit feature request (October 2020)](https://bugs.webkit.org/show_bug.cgi?id=217929) for the ability to store secrets protected by Face ID and Touch ID.
- A “[Web API For Accessing Secure Element (Global Platform, September 2016)](https://globalplatform.github.io/WebApis-for-SE/doc/)”, which seems to have been abandoned.
- A [Hardware Based Secure Service](https://github.com/w3c/websec/blob/gh-pages/hbss.html) proposal, which is [no longer active](https://lists.w3.org/Archives/Public/public-hb-secure-services/2018Mar/0001.html).

The authors believe that introducing this capability as a Web Extension API is the most pragmatic approach as it would be adopted nearly immediately by numerous extensions as a direct alternative to improve the product experience and reduce complexity for their users.

Additionally, the Web Extension API surface is more appropriate for the use cases of securely storing sensitive data such as encryption keys. Extensions are much easier to secure, and remain a reasonably low barrier to entry to users of these types of applications.

Application developers would probably choose to use an extension-based approach event if these capabilities were available on the web, to minimise the exposure of these keys to more hostile environments.

### Why not use WebAuthn?

Whilst WebAuthn with the addition of the PRF extension does provide a faster mechanism for authenticating a user and retrieving a secret, than passwords, and support for PRF is improving (see [WebAuthn PRF Support by Corbado]). It is insufficient for two reasons:

[WebAuthn PRF Support by Corbado]: https://www.corbado.com/blog/passkeys-prf-webauthn

1. It relies on a more complicated user flow with no control over user
   verification. Passkeys trigger the browser, or operating system, to request
   the user verifies themselves. The application developer has no ability to
   avoid user verification where it is not necessary (e.g. for less sensitive
   data, or background tasks).

2. In some use cases, application developers generate client-specific keys that
   are then used during a pairing process to become 'trusted'. From that point
   on, the key can be used as a form of encryption and authentication
   deliberately to avoid other forms of user authentication.

   For example, a product that relies on the OIDC/SAML protocol for
   authentication requires the user has a 'trusted device' (with a unique
   durable encryption key). For this model to work, there must be:

   (a) strong guarantees that the key material that the 'trusted client' is
   storing is not accessible to other applications (as such, standard web
   storage APIs are not suitable for this use case since they are not encrypted
   at rest), and

   (b) no dependence on deriving a key from other material provided by the user,
   since they can only provide an assertion which is unsuitable for key
   derivation.

   In these systems, after the user has completed SAML authentication, and the
   assertion has been verified, the client-unique encryption key can be used to
   decrypt the end-to-end encrypted data.

Additionally, it is worth noting that certain enterprises ban the use of passkeys as an authentication method.

### Could Device-Bound Session Credentials (DBSC) be used?

Device Bound Session Credentials (DBSC) ([DBSC Draft]; [DBSC, Google]) is a proposed API that would allow the browser to handle secure storage and refreshing of cookies on behalf of websites.

Unfortunately, DBSC is not a suitable alternative as it does not expose the primitives necessary for application developers to implement the use cases outlined in this proposal, specifically the combination of authentication and encryption at the application layer.

[DBSC Draft]: https://w3c.github.io/webappsec-dbsc/
[DBSC, Google]: https://developer.chrome.com/docs/web-platform/device-bound-session-credentials

### What’s the plan for durability on Linux?

Linux is one of the platforms where this API would be most beneficial. However, it’s less clear which API would be appropriate here. APIs such as the [FreeDesktop Secure Storage API] exist, but not all of the available APIs are guaranteed to be hardware backed, restricted by user verification, and other options have different limitations. Feedback is welcome on what options may be suitable to increase usability on Linux.

As per the specification, browsers should not implement this API on platforms where they cannot provide the security guarantees of the API.

[FreeDesktop Secure Storage API]: https://www.gnu.org/software/emacs/manual/html_node/auth/Secret-Service-API.html

### Why is it useful to allow storing secrets without biometric authentication?

Millions of users use devices without the hardware for biometric authentication, but install extensions which would be likely to implement this API. User verification is not strictly a requirement for all the use cases of securely storing secrets, and that determination falls with the application developer to decide based on their requirements.

### Are there any alternatives? How do vendors like 1Password implement biometrics today?

1Password currently use a solution based on Native Messaging where the extension communicates with a native app. This pattern is also reused by other credential management apps. These app is able to use system APIs to request biometrics and access hardware based storage. This has limitations, however. Not all users have the native application (users of Chromebooks and iOS Safari, to name a few) and implementing reliable cross-process messaging is a challenge compared to simple JavaScript API patterns that don't require bridging processes from different app vendors.

### Could secrets be stored in localStorage, IndexedDB, or Web Extension Storage instead?

Credential managers have historically chosen not to do this because it makes the secrets too easy to access. While a compromised machine is hard to protect against, data in these APIs can be trivially accessed with a terminal and no authentication, or by another application without any user interaction. These other storage mechanisms allow an “evil maid” attack if a computer is left unlocked, or for another application to read the secret from disk independently of the browser.

While the secret must be in memory while the extension is in use, extensions like password managers aggressively enter a “locked state” after inactivity where secrets are cleared from memory. This means that after only a short period of idle time such an attack would require biometric authentication.

`storage.session` does not provide the durability guarantees necessary to be a viable option for securely storing secrets, particularly ones go through a pairing process to be recognised as trusted to avoid further authentication in future.

### Why not use the StorageArea interface for the schema specification?

There are concerns specific to secure storage that are not supported by the more generic `StorageArea` interface, (e.g. user verification).

Additionally, the StorageArea interface carries baggage unnecessary for the bespoke requirements of handling secure materials (e.g. getting/setting multiple keys at once, support for callbacks).

Following the reasons outlined above as to why the StorageArea API is not suitable for this use case, it is also helpful and educational for application developers to see the distinction between the two.

### Why string values instead of bytes?

Application developers on the web are routinely used to working with strings, and existing Web Extension APIs set the precedence for string storage.

Whilst this does mean that application developers will need to encode data when working with the [Web Crypto API], this is standard practice when working with those APIs specifically.

[Web Crypto API]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API

## References

- The issue that initiated this proposal:
  https://github.com/w3c/webextensions/issues/154
- Discussion at TPAC November 2025:
  https://github.com/w3c/webextensions/blob/main/_minutes/2025-11-13-wecg-tpac.md#secure-storage
- An updated proposal in April 2026:
  https://github.com/simpleplaces/webextensions/blob/secure-key-cache-revamp/proposals/secure-cache.md
- Discussion at WECG Face-to-Face Meeting 7 April 2026:
  https://github.com/w3c/webextensions/blob/main/_minutes/2026-04-07-london-f2f.md#secure-storage-api

## Remaining Work

This proposal outlines the full expected behaviour and interface that application developers would rely on.

Remaining work includes the implementation of the API by browsers, and possibly a formalised specification document (WEWG dependent).
