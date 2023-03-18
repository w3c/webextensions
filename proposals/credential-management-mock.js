let global;

if (globalThis.browser?.runtime.id) {
	global = browser;
} else if (globalThis.chrome?.runtime.id) {
	global = chrome;
} else {
	throw new Error(
		"browser.credentials mock must be run in extension contexts"
	);
}

const credentials = {
	registerContainer(credentialsContainer) {
		const credentialsManifest = global.runtime.getManifest();

		if (!credentialsManifest.credentials)
			throw new Error("browser.credentials requires a credentials declaration in the manifest.");

		if (!credentialsManifest.credentials.supportedTypes)
			throw new Error("browser.credentials requires a supportedTypes declaration in the credentials section in the manifest.");

		credentialsContainer.create = credentialsContainer.create.toString();
		credentialsContainer.get = credentialsContainer.get.toString();
		credentialsContainer.store = credentialsContainer.store.toString();

		const scriptUrl = global.runtime.getURL('/credential-management-mock-pagescript.js');
		let script = document.createElement('script');
		script.setAttribute("credentialsContainer", JSON.stringify(credentialsContainer));
		script.setAttribute("supportedTypes", JSON.stringify(credentialsManifest.credentials.supportedTypes));
		script.src = scriptUrl;
		document.documentElement.insertBefore(script, document.head);

		return Promise.resolve();
	},
	isActiveContainer() {
		const credentialsManifest = global.runtime.getManifest();

		if (!credentialsManifest.credentials)
			throw new Error("browser.credentials requires a credentials declaration in the manifest.");

		if (!credentialsManifest.credentials.supportedTypes)
			throw new Error("browser.credentials requires a supportedTypes declaration in the credentials section in the manifest.");


		return true;
	},
}

// Attach to browser namespace in Firefox/Safari
if (globalThis.browser?.runtime?.id) {
	browser.credentials = credentials;
}

// Attach to chrome namespace in all browsers
if (globalThis.chrome?.runtime?.id) {
	chrome.credentials = credentials;
}
