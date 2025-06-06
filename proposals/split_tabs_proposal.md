# Proposal: Exposing split IDs for tabs

**Summary**

Expose a unique identifier for split tabs, similar to the identifier used for
tab groups.

**Document Metadata**

**Author:** agale123@

**Sponsoring Browser:** Google Chrome

**Contributors:** N/A

**Created:** 2025-06-06

**Related Issues:** N/A

## Motivation

### Objective

When extensions manipulate tabs, we want them to be able to take into
consideration how a user has grouped and organized their tabs. If two tabs are
part of a split and an extension is not aware of it, then the extension may
attempt to move tabs in invalid ways which might cause user confusion.

#### Use Cases

* An extension wants to move a tab within the tab strip. With this API, it can
detect if the moved tab is part of a split and can move the split together or
choose not to move the tab.
* An extension wants to close a tab within the tab strip. With this API, it can
detect that the closed tab was part of a split and can decide to close
everything in the split or not to close the tab to preserve the split.


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
            "description": "The ID of the split that the tab belongs to."
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
       "description": "The ID of the split that the tabs are in, or $(ref:tabs.SPLIT_TAB_ID_NONE) for unsplit tabs."
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
                "description": "The tab's new split."
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

If a tab isn’t currently in a split, the splitId will be -1, otherwise it will
have a unique value that represents the split. All tabs in the split will have
the same identifier.

When split tabs are visible to the user, one of the tabs will be denoted as
active with a unique visual treatment. That is the only tab that will return
as active, even if the other half of the split is visible.

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
inconsistent with a current split, we plan to fail gracefully by unsplitting
the tab. So if a tab is moved in between two tabs in a split, that split will
be removed and the two tabs will be separated. If one tab in a split is
closed, the split will be removed and the one tab will be closed.

## Future Work

In the future, it would be nice to have an API to create, update, and remove
splits. It would also be helpful to have an API to query/update details of a
split like whether it is a vertical or horizontal.
