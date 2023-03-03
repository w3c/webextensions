Chromium extension interface data was collected at 2023-03-03T19:05:00.000Z.

URLs

* https://chromium.googlesource.com/chromium/src/+archive/HEAD/extensions/common/api.tar.gz
* https://chromium.googlesource.com/chromium/src/+archive/HEAD/chrome/common/extensions/api.tar.gz
* https://chromium.googlesource.com/chromium/src/+archive/HEAD/chrome/common/apps/platform_apps/api.tar.gz


Bash command to delete all files other than those with JSON or IDL extensions.

```bash
find -E . -type f ! -iregex ".*\.(json|idl)" -exec rm {} \;
```

