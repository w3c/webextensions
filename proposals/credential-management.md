# browser.credentials

WebExtension proposal to allow interfacing with the [Credential Management API](https://w3c.github.io/webappsec-credential-management)

## Motivation

Password manager extensions currently rely on a mixture of heuristics and API overriding to detect and store credentials.
To fill credentials they also rely on DOM APIs to detect relevant input fields to display UI (or autofill).

Browsers have APIs for interaction with various credential types, most notably PublicKey and Password (Chromium only). However, these aren't exposed to browser extensions.

## Proposal

We propose a new browser.credentials API that would allow extensions to integrate with these existing web APIs.

A mock for this proposal is available [here](credential-management-mock.js) and the corresponding web_accessible_resource that's required is [here](credential-management-mock-pagescript.js).

## Types

```ts
interface ExtensionCredentialsContainer {
    create(options?: CredentialCreationOptions): Promise<Credential | null>;
    get(options?: CredentialRequestOptions): Promise<Credential | null>;
    store(credential: Credential): Promise<void>;
}

// Type of browser.credentials
interface ExtensionCredentialManagement {
	registerContainer(credentialsContainer: ExtensionCredentialsContainer): Promise<void>;
	isActiveContainer(): boolean;
}
```

### API

**browser.credentials.registerContainer**

First, the registerContainer function allows you to register your extensions implementation of ExtensionCredentialsContainer interface.

Request:

```js
const credentialsContainer = {
    create(options) {
        console.log("Demo Extension: credentials.create");
        return Promise.resolve(null);
    },
    get(options) {
        console.log("Demo Extension: credentials.get");
        return Promise.resolve(null);
    },
    store(credential) {
        console.log("Demo Extension: credentials.store");
        return Promise.resolve();
    }
}

browser.credentials.registerContainer(credentialsContainer);
```

**browser.credentials.isActiveContainer**

This retrieves a boolean indicating if this extension is the active credential manager.

```js
browser.credentials.isActiveContainer();
```

## Manifest

To make use of the browser.credentials namespace a new `credentials` key would be required inside of the extension manifest.

```json
{
  "credentials": {
    "supportedTypes": [
      "password",
      "publicKey"
    ]
  }
}
```

## FAQ

**Why is it useful to allow supporting multiple credential types?**

The majority of websites today that use authentication use passwords. However, in the future sites will make use of new technology such as passkeys (PublicKey credentials), and password manager extensions will want to support these new credentials.

**Are there any alternatives?**

Today password manager extensions use a signals such as heuristics for detecting login forms as well as signals such as a page navigation to determine successful login. Along with overriding of navigator.credentials to intercept requests for Passkeys.

The first one is susceptible to false results, single page applications lack the conventional navigation on success. Some sites also navigate on error which extensions could misinterpret as a success.

**Are there any extensions that would use this?**

Any conventional password manager extension would benefit from this API. However, those looking to support Passkeys would particularly benefit.

The Dashlane browser extension, a password manager with over 4M weekly active users in the Chrome Web Store, currently provides functionality to create and retrieve Passkey credentials.

The 1Password password manager also looks set to support Passkeys soon.

**Would this API encourage use of passwords which are bad for security?**

While it could be seen to be encouraging password authentication, this API (and its Web API sibling) on its own wouldn't change the fact that the vast majority of websites use passwords.
This API would help to encourage best practices such as strong, unique per site passwords by making them more ergonomic to use.

This API would also help extensions and in turn websites embrace the passwordless future.

**Only Chromium implements the password credential type. Would this limit the usefulness of this API?**

The passkey use case would still be addressed by this API even if the conventional password one wasn't.

While it's a product decision whether to support specific credential types, this API could potentially allow extensions to support types not natively supported by the browser. Feature detection would need to be considered with this.

## Custom credential types

Custom credential types could be a useful extension to this API.
Allowing more niche credential types to be supported without needing to be fully specified and implemented by browser vendors.

They could also address the lack of password credential support.

These would probably require a change to the [Credential Management API](https://w3c.github.io/webappsec-credential-management) to provide a way to check supported credential types.

## Remaining Work

Remaining work is tracked in the WECG [issue tracker](https://github.com/w3c/webextensions/issues).
