const code = document.currentScript.getAttribute("credentialsContainer");
const supportedTypes = JSON.parse(document.currentScript.getAttribute("supportedTypes"));
document.currentScript.remove();

const extensionCredentialsContainer = JSON.parse(code);

extensionCredentialsContainer.create = eval(`(function ${extensionCredentialsContainer.create})`);
extensionCredentialsContainer.store = eval(`(function ${extensionCredentialsContainer.store})`);
extensionCredentialsContainer.get = eval(`(function ${extensionCredentialsContainer.get})`);

function getTypeFromOptions(options) {
    // Perhaps there's a better way to determine this type
    let type = "";
    if ("password" in options) {
        type = "password";
    } else if ("publicKey" in options) {
        type = "publicKey";
    } else {
        throw new Error("Unsupported credential type");
    }

    return type;
}

const credentialsContainer = {
    _internal: navigator.credentials,
    create(options) {
        // Browser would validate options to make sure it exists and is an expected shape (how could custom types work with this?)
        if (!options) {
            return Promise.reject(new DOMException());
        }

        const type = getTypeFromOptions(options);

        if (supportedTypes.includes(type)) {
            return extensionCredentialsContainer.get(options);
        }
        return this._internal.get(options);
    },
    get(options) {
        // Browser would validate options to make sure it exists and is an expected shape (how does custom work with this?)
        if (!options) {
            return Promise.reject(new DOMException());
        }

        const type = getTypeFromOptions(options);

        if (supportedTypes.includes(type)) {
            return extensionCredentialsContainer.get(options);
        }
        return this._internal.get(options);
    },
    store(credential) {
        // Browser would validate credential to make sure it exists and is an expected shape (how does custom work with this?)
        if (!credential) {
            return Promise.reject(new DOMException());
        }

        if (supportedTypes.includes(credential.type)) {
            return extensionCredentialsContainer.store(credential);
        }

        return this._internal.store(credential);
    },
    preventSilentAccess() {
        // This would be something the browser handles and the extension wouldn't need to worry about this
        return this._internal.preventSilentAccess();
    },
}

Object.defineProperty(navigator, 'credentials', {
    value: credentialsContainer,
});

