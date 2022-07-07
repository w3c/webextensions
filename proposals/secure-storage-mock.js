let global;

if (globalThis.browser?.runtime.id) {
  global = browser;
} else if (globalThis.chrome?.runtime.id) {
  global = chrome;
} else {
  throw new Error(
    "browser.secureStorage mock must be run in extension contexts"
  );
}

if (!global.storage?.local) {
  throw new Error("Using this mock requires the 'storage' permission");
}

// Existing browser APIs don't give us access to the system's secure storage,
// meaning all data in this mock is stored in less secure mechanisms.
console.warn(
  "Warning: browser.secureStorage mock loaded. This proof of concept stores data insecurely and should not be used in production."
);

const RECOGNISED_AUTH_METHODS = [
  "PIN",
  "PASSWORD",
  "BIOMETRY_FACE",
  "BIOMETRY_FINGERPRINT",
];

const secureStorage = {
  getInfo: async () => {
    return {
      type: "MACOS_KEYCHAIN",
      availableAuthentication: RECOGNISED_AUTH_METHODS,
    };
  },
  store: async (request) => {
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

    return new Promise((resolve) =>
      global.storage.local.set({ [id]: data }, resolve)
    );
  },
  retrieve: async (request) => {
    if (typeof request !== "object")
      throw new Error("secureStorage.retrieve takes an object");

    const { id } = request;

    if (typeof id !== "string") throw new Error("id must be a string");

    return new Promise((resolve) => {
      global.storage.local.get(id, (result) => resolve(result[id]));
    });
  },
  remove: async (request) => {
    if (typeof request !== "object")
      throw new Error("secureStorage.remove takes an object");

    const { id } = request;

    if (typeof id !== "string") throw new Error("id must be a string");

    return new Promise((resolve) => global.storage.local.remove(id, resolve));
  },
};

// Attach to browser namespace in Firefox/Safari
if (globalThis.browser?.runtime?.id) {
  browser.secureStorage = secureStorage;
}

// Attach to chrome namespace in all browsers
if (globalThis.chrome?.runtime?.id) {
  chrome.secureStorage = secureStorage;
}
