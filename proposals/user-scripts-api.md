# User Scripts API

## Background

### User Scripts and User Scripts Managers

[User scripts](https://en.wikipedia.org/wiki/Userscript) are (usually relatively small) snippets of code that are injected into web pages in order to modify the page's appearance or behavior.  User script managers are a type of extension that is used to manage the collection of these user scripts, determining when and how to inject them on web pages.

User scripts can be created directly by the user or found in a number of different user script repositories around the web.

### Manifest V3

Manifest Version 3 (MV3) restricts the ability for extensions to use remotely-hosted code since it is a major security risk (cannot review or audit code that isn't in the extension package).  This is directly at odds with user script managers, which fundamentally require the execution of arbitrary code (the user scripts themselves).  This creates a feature gap between MV2 and MV3.

## Goal

User scripts satisfy an important use case for power users, allowing them to quickly and easily tweak the functionality of a web page.  Therefore, we propose adding a **new API to register user scripts with arbitrary code** targeted specifically for user scripts.  However, we will also take a number of steps to help reduce the abuse-ability of this API and ensure we don't lose the benefits of the remotely-hosted code restrictions from MV3.

### Multi-phase design

User script support will have a multiphase design and implementation process. The initial implementation has the following goals:

- Achieving functional parity with MV2 for user scripts managers
- Setting the foundations needed for future enhancements
- Limiting abusability

### Initial Requirements

The rest of this proposal focuses on the first iteration with the following requirements:

- **(A)** A mechanism to execute code in the main world 
- **(B)** The ability to execute code (with a separate CSP) in a world different from the main world and the extension's isolated world
- **(C)** A separate user script permission
- **(D)** Communication between JavaScript worlds

## Proposal

### New Namespace

User scripting related features will be exposed in a new API namespace, tentatively named "userScripts". The proposal authors favor the use of a new namespace for several reasons.

1. **Better set developer expectations.**  The clear separation between user and content scripts will reduce confusion for developers for which API methods to use and what the capabilities / restrictions of each are.  This naming also more clearly communicates that this capability is not meant as a general purpose way to inject arbitrary scripts.

2. **Stronger enforcement of remotely hosted code abuse.**  A distinct namespace allows people to more clearly see where user scripts features are being used and more easily spot abuse patterns.

3. **Easier engineering implementation.**  Browser vendors should be able to restrict the execution world and different API methods behind features.

4. **Introduce a user script world with custom CSP.**  Allow user scripts to opt-in to a more secure world that is only available in this namespace.

### API Schema

#### Types
