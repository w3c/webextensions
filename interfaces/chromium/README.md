Chromium extension interface data was collected at 2023-03-03T19:05:00.000Z.

| Subdirectory | Chromium source view | Directory archive |
| --- | --- | --- |
[extensions-common-api](extensions-common-api) | [common/apps/platform_apps/api](https://source.chromium.org/chromium/chromium/src/+/main:extensions/common/api/) | [download](https://chromium.googlesource.com/chromium/src/+archive/HEAD/extensions/common/api.tar.gz) |
[chrome-common-extensions-api](chrome-common-extensions-api) | [chrome/common/extensions/api](https://source.chromium.org/chromium/chromium/src/+/main:chrome/common/extensions/api) | [download](https://chromium.googlesource.com/chromium/src/+archive/HEAD/chrome/common/extensions/api.tar.gz) |

Subdirectories of this folder contain the JSON and IDL files the Chromium project uses to define the extension platform APIs it exposes to developers. The names of these directories are based on where these files were located in the Chromium repository, where path separators (`/`) are replaced by dashes (`-`).

1. Download the `.tar.giz` archive for each directory.
2. Extract each `.tar.gz` file to the `interfaces/chromium` directory in this repo.
3. CD into the `interfaces/chromium` directory
4. Remove all files except those with a `json` or `idl` extension.
    * Use the following Bash command or appropriate equivalent

      ```bash
      find -E . -type f -not -iregex ".*\.(json|idl)" -exec rm {} \;
      ```
5. Remove all private and internal files.
    * Use the following Bash command or appropriate equivalent.

    ```bash
    find -E . -type f -iregex ".*_(private|internal)\.(json|idl)" -exec rm {} \;
    ```

For information on the Chromium project's extension interface definitions, see https://source.chromium.org/chromium/chromium/src/+/main:chrome/common/extensions/api/_features.md
