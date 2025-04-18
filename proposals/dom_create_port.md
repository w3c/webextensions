# Proposal: Inter (JS) World Communication

**Summary**

This introduces a special message port that can be passed and shared between different JS "worlds" (contexts) in the same document.

**Document Metadata**

**Author:** rdcronin

**Sponsoring Browser:** Chrome

**Contributors:** Rob--W, ...

**Created:** 2024-06-24

**Related Issues:** <TODO>

## Motivation

### Objective

This allows the ability to establish a communication channel between different
active JS worlds they may have.  This enables coordination between e.g. a main
content script and any scripts that may inject in the main world, or between a
content script and other user scripts.

#### Use Cases

The primary use case is coordinating work between different JS worlds in a way
that is more difficult for any other script in the main world to intercept.
This helps extensions avoid interacting with the existing page script, when
doing so is undesirable.  This also allows executing code based on data within
a content script without leaking the details of that content script to the main
world.  (Though we don't consider the isolated world boundary a security
boundary, it is useful isolation and can serve as a "first line of defense").

### Known Consumers

User script managers have expressed an interest in this API.  More broadly,
this would help any extension that needs to communicate between the main world
of a web page with a more trusted script.

## Specification

### Schema

```
declare namespace dom {
  interface PortProperties {
    world: ExecutionWorld;
    worldId?: string;
  };

  interface MessagePort {
    sendMessage(args?: any): void
    onMessage(args?: any): void
  };

  export function createPort(
      properties: PortProperties
  ): MessagePort;
}
```

### Behavior

#### Creating a Port

An extension can create a new message port using `dom.createPort()`.  This will
create and return a new message port according to the specifies `properties`
(see below).

#### Port Properties and World ID

A message port can only be used to communicate with a single other world.  This:
* Avoids the "many-to-one" opener-listener behavior that existing message ports
  (created by `runtime.connect()`) in extensions have.  This behavior has caused
  increased complexity and developer confusion.  A given port will have only one
  channel.
* Protects against accidentally sharing the port with another world.

The caller indicates which world it would like the port to be associated with
by specifying the `world` property to the appropriate type of execution world
and, if appropriate, the `worldId` (e.g. for specific user script worlds).

#### Passing a Message Port

A message port can be passed to another world (in order to establish a
connection) by leveraging the new `dom.execute()` API.  `dom.execute()` will be
expanded to have special serialization logic for the MessagePort type.

#### Example Usage

Script that executes in the main world:
```js
function getFoo() { ... }
function getBar() { ... }
// Other code dispatches 'foochanged' and 'barchanged' events.
```

Content script:
```js
// This function will execute in the main world.
function setUpMainWorld(port) {
  // This responds to a message received from the content script.
  port.onMessage = (message) => {
    if (message == 'getFoo') {
      const foo = getFoo();
      port.sendMessage({foo});
    } else if (message == 'getBar') {
      const bar = getBar();
      port.sendMessage({bar});
    }
  };

  // These notify the content script of changes.
  addEventListener('foochanged', () => {
    port.sendMessage({foo: getFoo()});
  });
  addEventListener('barchanged', () => {
    port.sendMessage({bar: getBar()});
  });
}

// The rest of this code executes in the content script world.
const mainWorldPort = browser.dom.createPort({world: 'MAIN'});

mainWorldPort.onMessage = (message) => {
  if (message.foo) {
    updateFoo(message.foo);
  } else if (message.bar) {
    updateBar(message.bar);
  }
};

browser.dom.execute(
    {
      func: setUpMainWorld,
      args: mainWorldPort,
    });

function fetchFoo() {
  mainWorldPort.sendMessage('getFoo');
}

function fetchBar() {
  mainWorldPort.sendMessage('getBar');
}
```

##### Message serialization

Message arguments are serialized and deserialized using the Structured Cloning
algorithm.  This allows for more flexibility than simply JSON conversion.
Message ports cannot pass other message ports in arguments.

### New Permissions

There are no new permissions for this capability.  This does not allow any new
data access, since it is only accessible once the extension has already
injected a script into the document.  Extensions can also already interact with
the main world of the document through either appending script tags or directly
injecting with registered content or user scripts, or the
scripting.executeScript() method.

### Manifest File Changes

There are no necessary manifest changes.

## Security and Privacy

### Exposed Sensitive Data

This does not result in any new data being exposed.

### Abuse Mitigations

This doesn't enable any new data access.  To reduce risk of cross-world
contamination, extensions must specify the world with which they want to
communicate, and all arguments are copied rather than directly shared.

### Additional Security Considerations

N/A.

## Alternatives

### Existing Workarounds

Today, to communicate between JS worlds, extensions can use custom events as
described in the [content script
documentation](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#host-page-communication).
This is fragile and hacky, and can lean to leaking more data to the embedding
page.

### Open Web API

The open web is unaware of the concept of multiple Javascript worlds, so this
wouldn't belong as an open web API.

## Implementation Notes

N/A.

## Future Work
