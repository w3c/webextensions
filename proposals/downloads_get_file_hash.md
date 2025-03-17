# Proposal: `downloads.getFileHash()`

**Summary**

Allow extensions to query hashes of contents of downloaded files
programmatically.

**Document Metadata**

**Author:** @bershanskyi

**Sponsoring Browser:** Chromium

**Contributors:** @Rob--W

**Created:** 2024-04-08

**Related Issues:** [WECG GitHub issue 401](https://github.com/w3c/webextensions/issues/401)

## Motivation

### Objective

This API will enable extensions to privately and efficiently scan user
downloads for "Known Unsafe" contents and validate the integrity of "Known Safe"
files without exposing the raw content of the files.

#### Use Cases

##### Filtering for unwanted downloads

Many antivirus products detect previously seen "safe" and "unsafe" files by
computing a file content hash and checking it against a set of known hashes.
These checks require minimal effort on the client side, yet are powerful
enough to limit the spread of known malware downloads since effectively every
client gets "inoculated" against a particular download as soon as a single
antivirus detects a malicious file.
User-Agents may store file hashes even after the original file is deleted to
facilitate tracing of malware exposure even if the file is deemed to be
dangerous after the user initially downloads it.

##### Download integrity assurance

Files can get damaged while they are shared on a file hosting server or NAS.
While some file formats explicitly support integrity checks like embedded
checksums or even cryptographic signatures, other files do not. This API
would allow file managers or extensions to programmatically check the
integrity of downloaded files if the file source elects to provide them.

### Known Consumers

None at the moment.

## Specification

### Schema

Schema in Chromium-style IDL:
```idl
namespace downloads {
    callback GetFileHashCallback = void(DOMString hash);

    [supportsPromises, permissions="downloads.getFileHash"]
    static void getFileHash(
        long downloadId,
        [legalValues=("SHA-256")] DOMString algorithm,
        GetFileHashCallback callback);
}
```

Schema in TypeScript:
```ts
namespace downloads {
  enum FileHashAlgorithm {
    SHA256 = "SHA-256"
  }

  getFileHash: (
    downloadId: number,
    algorithm?: keyof downloads.FileHashAlgorithm)
      => Promise<string>;
}
```

### New Permissions

No new permission. `downloads.getFileHash()` is honored only if extension has
`"downloads"` permission and the host access for `DownloadItem.finalUrl`. For
`data:`-URLs, host permissions are not required, because the content of the
file is already fully visible through the URL.

### Manifest File Changes

No changes.

## Security and Privacy

### Exposed Sensitive Data

Hashes (cryptographic) are considered one-way operations, but they can easily
be reversed to the original input when the number of possible inputs is
sufficiently small. So extension may be able to infer the raw contents of the
file if the possible space of file contents is small.
A malicious extension could:
 - Observe hashes of downloaded files and send them to a home server
 - Initiate a download with an arbitrary URL and obtain a hash of the response
 - Initiate a download for a ranged HTTP request and obtain a hash of the
   corresponding portion of the response

### Abuse Mitigations

The API method requires host access to the `DownloadItem.finalUrl`.

### Additional Security Considerations

User Agents must not provide obsolete hash algorithms (like MD5 and SHA-1).
User Agents must expose only hashes of complete files and never provide
partial hash results while the file is being downloaded. This is necessary to
prevent malicious or compromised extensions from calculating incremental hashes
and constructing a "hash oracle" to infer file contents one byte (or just a few
bytes) at a time.

## Alternatives

### Existing Workarounds

As of writing, extensions can calculate the digest of a download by
implementing a native host component that would read the desired file from the
disc directly. This approach is a significant elevation of privileges (requires
unsandboxed application), largely expands the complexity of implementing such
an extension (since the extension has to listen for download completion, notify
the native component, and ensure that the file does not change or move before
the hash is calculated) and raises friction for users (due to the complexity of
installation). Additionally, calculating file content hash separately is
slightly less efficient since it requires reading it back into memory.

### Open Web API

There are no equivalent APIs on the Open Web. Open Web has the concept of
subresource integrity, but it applies only to page resources like images and
other media and does not apply to downloaded files.

## Implementation Notes

 1. Hash algorithm descriptor matching must be case-sensitive (which differs
    from some other Open Web APIs).
 2. User Agent may throw an error upon a call to `downloads.getFileHash()`
    if the required hash is not available. User Agent may compute the hash on
    the fly if the original file is still available.
 3. User Agents must not support obsolete hash algorithms, see "Additional
    Security Considerations" for more details.
 4. User Agents must encode (binary) hash digest into a hex string, using
    lower-case letters.

## Future Work

In theory, some use cases could be served via a declarative API. For example,
an antivirus extension could provide a set of hashes of known bad content for
the browser to use directly. However, the development of such a schema is
outside of the scope of this proposal.
