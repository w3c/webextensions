# Dark Mode Extension Icons

**Summary**

Feature to enable developers to enhance extension icon visibility in dark mode.

**Document Metadata**

**Author:** &lt;solomonkinard>

**Sponsoring Browser:** Chromium.

**Contributors:** &lt;oliverdunk>

**Created:** 2024-04-05

**Related Issues:** &lt;https://crbug.com/893175>

## Motivation

### Objective

Extension developers will be able to supply and define a set of icons to be used
in the event that browser system settings are set to dark mode. The set of dark
mode icons can and will be made automatically visible once the system setting is
in dark mode, thereby enhancing the overall browser experience.

#### Use Cases

1. Improved icon visibility in the extension toolbar.
2. Improved icon visibility on management the management and shortcuts pages.
1. Dark mode icon declarations made possible through the extension manifest.
3. setIcon() will allow storage of dark mode specific icons.

### Known Consumers

The associated and linked bug has 48 stars and 31 comments.

## Specification

### Schema

manifest.json
```
{
  "icon_variants": {
    "dark": {
      "128": "icons/128_dark.png"
    },
    "light": {
      "128": "icons/128_light.png"
    }
  },
  "action": {
    "default_icon": {
      "128": "icons/128.png"
    },
    "icon_variants": {
      "dark": {
        "128": "icons/128_action_dark.png"
      },
      "light": {
        "128": "icons/128_action_light.png"
      }
    }
  }
}
```

Browser action.
```
action.setIcon({
  imageData?: ImageData | object,
  path?: string | object,
  tabId?: number,
  mode?: string
});
```

### Behavior

Existing manifest key. The behavior of the icons manifest key will remain unchanged.
```
{
  "icons": {
    "64": "icon_64.png"
  },
  "action": {
    "default_icon": {
      "64": "action_64.png"
    }
  }
}
```

Order of precedence. The new `icon_variants` keys and subkeys will take
precedent, followed by the incumbent `icons` key.

### New Permissions

N/A.

### Manifest File Changes

A new icon_variants key and sub-key will be added. The schema is listed in the
schema section. Failure to parse this key and/or subkey will prevent the
extension from loading. `icon_variants` are required in the manifest and there
will be no warning whether they're present or not. If one or both
`icon_variants` keys are present, they must include at least a "dark" or "light"
sub-key. Failure to do so will result in an error. Any of those theme keys must
have at least one size key as a string, containing the path to the icon as the
value. Failure to find any file at the specified path will result in an error.
Such errors prevent the extension frm loading.

## Security and Privacy

### Exposed Sensitive Data

N/A.

### Abuse Mitigations

N/A.

### Additional Security Considerations

N/A.

## Alternatives

### Existing Workarounds

1. A developer could ask the user to specify what mode they're in and then
dynamically set the icon to a dark mode icon using action.setIcon(). That
wouldn't change the management page icon.
2. A developer could change icons dynamically to dark mode icons if this is
true: `window.matchMedia('(prefers-color-scheme: dark)')`.

### Open Web API

As stated in the workarounds section, the following is already an option to consider: `window.matchMedia('(prefers-color-scheme: dark)')`. However, that
wouldn't automatically set icons dynamically, as it would require subsequent
calls to action.setIcon(). It also wouldn't update the icon on the management
pages.

## Implementation Notes

N/A.

## Future Work

#comment13 in the linked bug asks for the action popup background color to be
changed [to become become dark] along with the icon in dark mode. That is out of
scope for this proposal as it would require rethinking the blank page in a
normal browser tab, in addition to what happens when loading an iframe on top of
the dark background. Also, which color should be chosen for the background.
Perhaps to seed the idea, one of these colors could be analyzed and compared to
others not included here: #202124, #2D2E2F.
