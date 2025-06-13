# Proposal: Exposing split IDs for tabs

**Summary**

Expose a unique identifier for Split Views (a view where two tabs can be viewed
at the same time within a single browser window), similar to the identifier
used for tab groups.

**Document Metadata**

**Author:** agale123@

**Sponsoring Browser:** Google Chrome

**Contributors:** N/A

**Created:** 2025-06-06

**Related Issues:** https://github.com/microsoft/MicrosoftEdge-Extensions/issues/296

## Motivation

### Objective

When extensions manipulate tabs, we want them to be able to take into
consideration how a user has grouped and organized their tabs. If two tabs are
part of a Split View and an extension is not aware of it, then the extension
may attempt to move tabs in invalid ways which might cause user confusion.

Note that this change is experimental and we may remove this field in a future
Chrome release. So even if tabs are in a Split View, it isn't guarenteed that a
split id will be returned.

#### Use Cases

* An extension wants to move a tab within the tab strip. With this API, it can
detect if the moved tab is part of a Split View and can move the tabs within a
Split View together or choose not to move the tab.
* An extension wants to close a tab within the tab strip. With this API, it can
detect that the closed tab was part of a Split View and can decide to close
everything in the Split View or not to close the tab to preserve the Split
View.


### Known Consumers

We don’t have specific known consumers but we expect any consumers of the
“groupId” property would also be interested in this new property.

## Specification

### Schema

We will add a new property called “splitId” to the Tab object. This will behave
similarly to the “groupId” field that already exists.

```
[
  {
    "namespace": "tabs",
    "description": "Use the <code>chrome.tabs</code> API to interact with the browser's tab system. You can use this API to create, modify, and rearrange tabs in the browser.",
    "types": [
      {
        "id": "Tab",
        "type": "object",
        "properties": {
          ...
          "splitId": {
            "type": "integer",
            "minimum": -1,
            "optional": "true",
            "description": "The ID of the Split View that the tab belongs to."
          },
          ...
        }
      }
    ]
    ...
    "functions": [
      {
        "name": "query",
        "type": "function",
        "description": "Gets all tabs that have the specified properties, or all tabs if no properties are specified.",
        "parameters": [{
   "type": "object",
   "name": "queryInfo",
   "properties": {
     ...
     "splitId": {
       "type": "integer",
       "minimum": -1,
       "optional": true,
       "description": "The ID of the Split View that the tabs are in, or $(ref:tabs.SPLIT_TAB_ID_NONE) for tabs that aren't in a Split View."
          },
          ...
        }]
      }
    ]
    "events": [
      ...
      {
        "name": "onUpdated",
        "type": "function",
        "description": "Fired when a tab is updated.",
        "parameters": [
          {"type": "integer", "name": "tabId", "minimum": 0},
          {
            "type": "object",
            "name": "changeInfo",
            "description": "Lists the changes to the state of the tab that was updated.",
            "properties": {
              ...
              "splitId": {
                "type": "integer",
                "minimum": -1,
                "optional": true,
                "description": "The tab's new Split View."
              }
              ...
            }
          }
        ]
        ...
      }
    ]
  }
]
```

### Behavior

If a tab isn’t currently in a Split View, the splitId will be -1, otherwise it
will have a unique value that represents the Split View. All tabs in the Split
View will have the same identifier.

When Split Views are visible to the user, one of the tabs will be denoted as
active with a unique visual treatment. That is the only tab that will return
as active, even if the other half of the Split View is visible.

### New Permissions

N/A. This is just updating existing tab permissions.

### Manifest File Changes

No new manifest fields.

## Security and Privacy

### Exposed Sensitive Data

These unique identifiers should not encode any information about the contents
of the tab itself. The information exposed here is similar to what is exposed
when providing the tab group ID.

### Abuse Mitigations

I’m not able to think of ways this particular API can be abused.

### Additional Security Considerations

N/A

## Alternatives

### Existing Workarounds

The only existing workarounds would be to have extensions attempt to manipulate
elements of the tab strip and then verify if their actions worked as expected
or handle any errors thrown when attempting to do things like move or close
tabs.

### Open Web API

This isn’t adding a new API method, just updating an existing one to be more
complete.


## Implementation Notes

Within Chrome, when extensions make updates to tabs in the tab strip that are
inconsistent with a current Split View, we plan to fail gracefully by
unsplitting the view. So if a tab is moved in between two tabs in a Split View,
that Split View will be removed and the two tabs will be separated. If one tab
in a Split View is closed, the Split View will be removed and the one tab will
be closed.

## Future Work

In the future, it would be nice to have an API to create, update, and remove
Split Views. It would also be helpful to have an API to query/update details of
a Split View like whether it is a vertical or horizontal.
