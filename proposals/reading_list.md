# New API: browser.readingList()
Contributors: dljames@chromium.org

## Background

Chromium has a reading list feature which allows users to store websites / media they would like to consume or keep reference to in the future.

On Chromium this feature supports the following operations:
- Adding an entry to the ReadingList
- Remove an entry from the ReadingList
- Marking an entry as read / unread

At present, extensions developers are unable to read from and modify the reading list feature in the browser.

## Problem

The reading list feature on Chromium does not have an existing API which allows extensions developers the ability to read from or modify this feature. Additionally, the UI allotted to extensions within the browser is much smaller compared to that of the reading list and similar features housed in the browsers side panel.

## Solution

Considering the above situation, we'd like to propose a new extension API, `browser.readingList`, which will allow developers to read from and modify the reading list in any supported browser.

# API Proposal

The `browser.readingList` will introduce a few new types and functions. Below is the schema in the IDL format:

## Types
A ReadingListEntry is the extensions representation of a Reading List object. Where every URL stored in the Reading List must be unique.
```js
 dictionary ReadingListEntry {
        // The url of the entry. Must have a valid protocol (Ex: http, https)
	// and hostname (Ex: www.example.com). Can contain query parameters.
	DOMString url;
	// The title of the entry.
	DOMString title;
	// True if the entry has been read.
	boolean hasBeenRead;
	// The last update time of the entry.
	// Recorded in microseconds since Jan 1st 1970.
	double lastUpdateTime;
	// The creation time of the entry.
	// Recorded in microseconds since Jan 1st 1970.
	double creationTime;
 };
```

AddEntryOptions are the objects used to add entries into the Reading List.
```js
dictionary AddEntryOptions {
	// The url of the entry to add. Must have a valid protocol (Ex: http, https)
	// and hostname (Ex: www.example.com). Can contain query parameters.
	DOMString url;
	// The title of the entry.
	DOMString title;
	// True if the entry has been read.
	boolean hasBeenRead;
};

```

A QueryInfo is the object used to query for ReadingListEntries in the Reading List.
```js
dictionary QueryInfo {
	// The url of the entry to query for. Must have a valid protocol (Ex: http, https)
	// and hostname (Ex: www.example.com). Can contain query parameters.
	DOMString? url;
	// The title to query for.
	DOMString? title;
	// The read status to query for.
	boolean? hasBeenRead;
}
```

An UpdateEntryOptions is the object used to update a specific ReadingListEntry in the Reading List. A URL must be supplied.
```js
dictionary UpdateEntryOptions {
        // The url of then entry that will be updated. Must have a valid protocol (Ex: http, https)
	// and hostname (Ex: www.example.com). Can contain query parameters.
	DOMString url;
	// The updated title.
	DOMString? title;
	// The updated read status.
	boolean? hasBeenRead;
}
```

These callbacks are invoked when the appropriate action they are tied to are performed in the Reading List.
```js
 callback AddEntryCallback = void ();
 callback RemoveEntryCallback = void ();
 callback UpdateEntryCallback = void();
 callback QueryCallback = void(ReadingListEntry[] entries);
```

## Functions
The initially supported functions of the API.

### addEntry()
> Adds an entry to the reading list if it does not exist.
>
> | entry |: The entry to add to the reading list.
>
> | callback |: Invoked once the entry has been added.
```js
[supportsPromises] static void addEntry(ReadingListEntry entry, AddEntryCallback callback);
```

### removeEntry()
> Removes an entry from the reading list if it exists.
>
>  | info |: The properties of the entry we would like to remove.
>
>  | callback |: Invoked once the entry has been removed.

```js
[supportsPromises] static void removeEntry(QueryInfo info, RemoveEntryCallback callback);
```

### query()

> Retrieves all entries which match the QueryInfo properties. Properties which are not provided will not be matched. If no properties are provided, all entries are retrieved.
>
> | info |: The properties of the types of entries we are looking for.
>
> | callback |: Invoked once all entries matching the query are found.

```js
[supportsPromises] static void query(QueryInfo info, QueryCallback callback);
```

### updateEntry()

> Updates a reading list entries title and hasBeenRead status if it exists.
>
> | info |: The new properties of the entry we would like to update.
>
> | callback |: Invoked once the entry has been updated.

```js
[supportsPromises] static void updateEntry(UpdateEntryOptions info, UpdateEntryCallback callback);

```

## Events
The initially supported events this api will emit.

### onEntryAdded()
> Triggered when a ReadingListEntry was added to the reading list.
>
> |entry|: The entry that was added.
```js
static void onEntryAdded(ReadingListEntry entry);
```
### onEntryRemoved()
> Triggered when a ReadingListEntry is removed from the
> reading list.
>
> |entry|: The entry that was removed.
```js
static void onEntryRemoved(ReadingListEntry entry);
```

### onEntryUpdated()
> Triggered when a ReadingListEntry was updated in the reading list.
>
> |entry|: The entry that was updated.
```js
static void onEntryUpdated(ReadingListEntry entry);
```
### Additional Considerations

#### Incognito mode

The `browser.readingList` API can be available in incognito mode assuming the user explicitly allows the extension in incognito mode.

### Full Schema

```js
namespace readingList {
 dictionary ReadingListEntry {
	// The url of the entry. Must have a valid protocol (Ex: http, https)
	// and hostname (Ex: www.example.com). Can contain query parameters.
	DOMString url;
	// The title of the entry.
	DOMString title;
	// True if the entry has been read.
	boolean hasBeenRead;
      // The last update time of the entry.
      // Recorded in milliseconds since Jan 1st 1970.
	double lastUpdateTime;
      // The creation time of the entry.
      // Recorded in milliseconds since Jan 1st 1970.
	double creationTime;
 };

 dictionary AddEntryOptions {
      // The url of the entry to add. Must have a valid protocol (Ex: http, https)
	// and hostname (Ex: www.example.com). Can contain query parameters.
	DOMString url;
	// The title of the entry.
	DOMString title;
	// True if the entry has been read.
	boolean hasBeenRead;
 };

dictionary QueryInfo {
	// The url of the entry to query for. Must have a valid protocol (Ex: http, https)
	// and hostname (Ex: www.example.com). Can contain query parameters.
	DOMString? url;
	// The title to query for.
	DOMString? title;
	// The read status to query for.
	boolean? hasBeenRead;
};

dictionary UpdateEntryOptions {
        // The url of the entry to be updated. Must have a valid protocol (Ex: http, https)
	// and hostname (Ex: www.google.com). Can contain query parameters.
	DOMString url;
	// The updated title.
	DOMString? title;
	// The updated read status.
	boolean? hasBeenRead;
};

 callback AddEntryCallback = void ();
 callback RemoveEntryCallback = void ();
 callback UpdateEntryCallback = void(); 
 callback QueryCallback = void(ReadingListEntry[] entries);

 interface Functions {   
   // Adds an entry to the reading list if it does not exist.
   [supportsPromises] static void addEntry(ReadingListEntry entry, AddEntryCallback callback);
   
   // Removes an entry from the reading list if it exists.
   [supportsPromises] static void removeEntry(QueryInfo info, RemoveEntryCallback callback);

   // Retrieves all entries which match the QueryInfo properties. Properties which are not provided will not be matched. 
   [supportsPromises] static void query(QueryInfo info, QueryCallback callback);

   // Updates a reading list entries title and hasBeenRead status if it exists.
   [supportsPromises] static void updateEntry(UpdateEntryOptions info, UpdateEntryCallback callback);
 };

 interface Events {   
   // Triggered when a ReadingListEntry is added to the reading list.
   // |entry|: The entry that was added.
   static void onEntryAdded(ReadingListEntry entry);
   
   // Triggered when a ReadingListEntry is removed from the reading list.
   // |entry|: The entry that was removed.
   static void onEntryRemoved(ReadingListEntry entry);

   // Triggered when a ReadingListEntry was updated in the reading list.
   // |entry|: The entry that was updated.
   static void onEntryUpdated(ReadingListEntry entry);
 };
};


```

