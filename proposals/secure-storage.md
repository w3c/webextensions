# browser.secureStorage

WebExtension proposal to allow the secure storage of data in platform specific locations.

## Champions

- Oliver Dunk (1Password) - [@oliverdunk](https://github.com/oliverdunk), [email](mailto:oliver@1password.com)

## Motivation

Extensions such as password managers, messaging apps, and crypto wallets handle sensitive user data. Therefore, a common choice is to only persist this data to places like localStorage and IndexedDB in an encrypted form. The decryption keys needed to use this data at runtime are stored only in memory, meaning that to access the data after a browser restart, the user must be prompted for whatever the key is derived from, usually a long and hard to type password.

Users understandably prefer not to type this, so in desktop applications, a common pattern is to store the decryption key in a system store (like macOS keychain). The system can be told to [only reveal the secret after biometrics have been provided](https://developer.apple.com/documentation/security/keychain_services/keychain_items/restricting_keychain_item_accessibility?language=objc#2974973), meaning the application can request the secret but access is only granted if the user that stored it is physically present. This pattern is good for users but currently only possible in extensions by communicating with a native application over [Native Messaging](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging). This is because access to both hardware based key stores and biometrics are not exposed by existing web APIs.

## Proposal

We propose a new browser.secureStorage API that would use platform-dependent APIs for storing sensitive data:

- macOS: [Keychain](https://developer.apple.com/documentation/security/keychain_services)
- Windows: [Trusted Platform Module (TPM)](https://docs.microsoft.com/en-us/windows/security/information-protection/tpm/trusted-platform-module-overview)
- Android: [Keystore](https://source.android.com/security/keystore)
- Linux: See FAQ

### API

**browser.secureStorage.getInfo**

First, the getInfo function allows you to determine what implementation you are using. This is useful if you trust one implementation but not another. It also tells you which methods of authentication are available to protect the secret.

Request:

```
browser.secureStorage.getInfo();
```

Response:

```
{
  type: "MACOS_KEYCHAIN",
  availableAuthentication: [
    "PIN",
    "PASSWORD",
    "BIOMETRY_FACE",
    "BIOMETRY_FINGERPRINT"
  ]
}
```

**browser.secureStorage.store**

This stores the provided string.

```
browser.secureStorage.store({
  id: "example-data"
  authentication: ["BIOMETRY_FACE", "BIOMETRY_FINGERPRINT"],
  data: JSON.stringify({ password: "!72AH8d_.-*gFgNFPUFz2" })
});
```

**browser.secureStorage.retrieve**

This retrieves the stored data. The browser will only provide it if the user authenticates with one of the allowed mechanisms for this secret, and will throw an error otherwise.

```
browser.secureStorage.retrieve({ id: "example-data" });
```

**browser.secureStorage.remove**

Removes an entry from secureStorage given an ID. No biometrics are required.

```
browser.secureStorage.remove({ id: "example-data" });
```

## FAQ

**How large could the stored data be?**

The expectation is that implementation specific limits would be set. Only a very small allowance (< 1KB) is needed for the known use cases.

**Are there any extensions that would use this?**

This proposal is drafted by the team at 1Password. Our [extension](https://chrome.google.com/webstore/detail/1password-%E2%80%93-password-mana/aeblfdkhhhdcdjpifhhbdiojplfjncoa?hl=en) is available for Chrome, Firefox, Safari and Edge and has more than 2M weekly active users in the Chrome Web Store alone. We would be quick to implement this in conjunction with or in place of our current Native Messaging solution.

The Dashlane browser extension, also a password manager with over 4M weekly active users in the Chrome Web Store, currently provides a remember me and biometric authentication feature in its extension to make repeated authentication easier. They would also be very quick to implement this in place of their solution which requires a network connection, as they don’t leverage a native application to interface with native storage.

The Keeper Security [browser extension](https://chrome.google.com/webstore/detail/keeper%C2%AE-password-manager/bfogiafebfohielmmehodmfbbebbbpei?hl=en&authuser=0) would also immediately use this API for storage of client-side generated encryption keys. Even though a desktop app is optionally provided to users, Keeper does not wish to use native app dependencies for biometric authentication and key storage. Keeper would also prefer to prompt users in the browser extension directly for biometric authentication instead of relying on a desktop app.

The [MetaMask](https://metamask.io/) browser extension, a crypto wallet and a gateway to blockchain applications with over 30 million monthly active users, would also greatly benefit from using this API as a more secure way to store a user's private keys while their wallet is locked. They would also be interested in offering users the choice to use biometrics as a simpler way to unlock their wallet.

We expect that the API would benefit a wide range of extensions, providing value far beyond password management. If you'd like to add your extension, feel free to open a PR.

**Could a web API like WebAuthn cater for this use case?**

There’s a lot of existing work here, including [feature requests](https://bugs.webkit.org/show_bug.cgi?id=217929) we’ve opened in the past.

Some of this work includes a proposal for a “[Web API For Accessing Secure Element](https://globalplatform.github.io/WebApis-for-SE/doc/)”, which seems to have been abandoned, and a proposal for [Hardware Based Secure Service](https://rawgit.com/w3c/websec/gh-pages/hbss.html) features which is [no longer active](https://lists.w3.org/Archives/Public/public-hb-secure-services/2018Mar/0001.html).

The most promising work at the moment is WebAuthn’s new [large blob storage extension](https://www.w3.org/TR/webauthn-2/#sctn-large-blob-extension), but this seems to be unimplemented in all browsers except Chrome where it’s behind a flag and unsupported by the built-in authenticator. The spec also seems to provide few guarantees about how this data should be stored, with implementers saying it is [unsuitable for sensitive data](https://developers.yubico.com/libfido2/Manuals/fido_dev_largeblob_get.html#CAVEATS). If this was widely implemented and platform authenticators reached a consensus on storing this data in places like the keychain, that could make this a suitable alternative to this proposal.

In the future, there is also a [PRF extension](https://github.com/w3c/webauthn/issues/1462), initially planned for WebAuthn Level 2 but later removed. This could be promising but appears to be distant at the moment.

We’d love to see these capabilities available to the web as a whole, so I think figuring out if browser vendors intend to implement WebAuthn features that would make this proposal redundant is an important first step.

However, it may turn out that this API is still worth pursuing because of the lower barrier to entry for extension APIs and speed with which this could be introduced. Having an API designed specifically for these extension use cases also ensures the UI and implementation details will be best suited to the UI and security needs of its consumers.

**What’s the plan for Linux?**

Linux is one of the platforms where this API would be most beneficial, so we’d love to support it. However, it’s less clear which API would be appropriate here. APIs such as the [FreeDesktop Secure Storage API](https://www.gnu.org/software/emacs/manual/html_node/auth/Secret-Service-API.html) exist, but not all of the available APIs are guaranteed to be hardware backed and other options have different limitations. Feedback is welcome on what should be done here.

**Why is it useful to allow storing secrets without biometric authentication?**

Millions of users use devices without the hardware for biometric authentication, but install extensions which would be likely to implement this API. Ensuring the API is still available would allow us to implement things like PIN code unlock more securely. This wouldn’t be quite as secure as a biometric approach, but on other platforms we’ve found that this fits within our threat model and drastically improves user experience with very little effort.

**Are there any alternatives? How does 1Password implement biometrics today?**

We currently use a solution based on Native Messaging where the extension communicates with a native app. This app is able to use system APIs to request biometrics and access hardware based storage. This has limitations, however. Not all users have the native application (users of Chromebooks and iOS Safari, to name a few) and implementing reliable cross-process messaging is a challenge.

**Could secrets be stored in localStorage, IDB or the new storage.session instead?**

We’ve historically chosen not to do this because it makes the secrets too easy to access. While a compromised machine is hard to protect against, data in these APIs can be trivially accessed with a console command and no authentication. This allows an “evil maid” attack if a computer is left unlocked, or for another application to read the secret from disk independently of Chrome. While the secret must be in memory while the extension is in use, extensions like password managers aggressively enter a “locked state” after inactivity where secrets are cleared from memory. This means that after only a short period of idle time such an attack would require biometric authentication.

## Remaining Work

Remaining work is tracked in the WECG [issue tracker](https://github.com/w3c/webextensions/issues).
