// Existing browser APIs don't give us access to the system's secure storage,
// meaning all data in this polyfill is stored in less secure mechanisms.
console.warn(
  "Warning: browser.secureStorage polyfill loaded. This proof of concept stores data insecurely and should not be used in production."
);

const RECOGNISED_AUTH_METHODS = [
  "PIN",
  "PASSWORD",
  "BIOMETRY_FACE",
  "BIOMETRY_FINGERPRINT",
];

const secureStorage = {
  getInfo: () => {
    return {
      type: "MACOS_KEYCHAIN",
      availableAuthentication: RECOGNISED_AUTH_METHODS,
    };
  },
  store: (request) => {
    if (typeof request !== "object")
      throw new Error("secureStorage.store takes an object");

    const { id, authentication, data } = request;

    if (typeof id !== "string") throw new Error("id must be a string");

    if (typeof authentication !== "undefined") {
      if (!Array.isArray(authentication))
        throw new Error("authentication must be an array");

      if (authentication.length === 0)
        throw new Error("authentication array must be non-empty if present");

      for (const method of authentication) {
        if (!RECOGNISED_AUTH_METHODS.includes(method)) {
          throw new Error(`unrecognised auth method: ${method}`);
        }
      }
    }

    if (typeof data !== "string") throw new Error("data must be a string");

    localStorage.setItem(id, data);
  },
  retrieve: (request) => {
    if (typeof request !== "object")
      throw new Error("secureStorage.retrieve takes an object");

    const { id } = request;

    if (typeof id !== "string") throw new Error("id must be a string");

    return localStorage.getItem(id);
  },
  remove: (request) => {
    if (typeof request !== "object")
      throw new Error("secureStorage.remove takes an object");

    const { id } = request;

    if (typeof id !== "string") throw new Error("id must be a string");

    return localStorage.removeItem(id);
  },
};

let isExtension = false;

if (window.browser?.runtime?.id) {
  window.browser.secureStorage = secureStorage;
  isExtension = true;
}

if (window.chrome?.runtime?.id) {
  window.chrome.secureStorage = secureStorage;
  isExtension = true;
}

if (!isExtension) {
  window.secureStorage = secureStorage;
}
