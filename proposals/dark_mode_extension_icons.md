# Dark Mode Extension Icons

**Summary**

Feature to enable developers to enhance extension icon visibility in dark mode.

**Document Metadata**

**Author:** solomonkinard

**Sponsoring Browser:** Chromium, Safari, Firefox

**Contributors:** oliverdunk, xeenon, carlosjeurissen

**Created:** 2024-04-05

**Related Issues:**
* https://crbug.com/893175
* https://github.com/w3c/webextensions/issues/229

## Motivation

### Objective

Extension developers will be able to supply and define a set of icons to be used
in the event that user has expressed the preference for a page that has a dark
theme. The set of dark mode icons can and will be made automatically visible
once the system setting is in dark mode, thereby enhancing the overall browser
experience.

#### Use Cases

1. Improved icon visibility in the extension toolbar.
1. Improved icon visibility on the management and shortcuts pages.
1. Dark mode icon declarations made possible through the extension manifest.
1. setIcon() will allow setting of dark and/or light mode specific icons.
1. Improved icon visibility on context menu (Chrome and Safari rely on default
icons, only Firefox can specify icons).
1. Improved icon visibility on side panel (Chrome relies on default icons,
Firefox can specify icons).

### Known Consumers

The Chromium bug has a significant amount of developer interest.

## Specification

### Schema

manifest.json
```
"icon_variants": [
  {
    "any": "any.svg",
  },
  {
    "16": "16.png",
    "32": "32.png",
  },
  {
    "16": "dark16.png",
    "32": "dark32.png",
    "color_scheme": "dark",
  },
  {
    "16": "light16.png",
    "32": "light32.png",
    "color_scheme": ["dark", "light"]
  }
]
```

Set icon_variants dynamically.
```
const exampleProperties: {string: string | ImageData}[] = [
  {
    "any": "any.svg",
  },
  {
    "16": "16.png",
    "32": "32.png"
  },
  {
    "16": darkImageData16,
    "32": darkImageData32,
    "color_scheme": "dark"
  },
  {
    "16": lightImageData16,
    "32": lightImageData32,
    "color_scheme": "light"
  }
];

// action.setIcon().
const actionProperties = {variants: exampleProperties};
action.setIcon(createProperties);

// menus.*(), for supporting browsers.
const menusProperties = {icon_variants: exampleProperties}
menus.create(menusProperties);
menus.update(menusProperties);
```

A benefit of this new structure is that it's more resiliant to future changes, thus allowing for more keys such as density (e.g. 2dppx), purpose (e.g.
monochrome), and etc.

## setIcon()
Incumbent action.setIcon(), for reference.
```
action.setIcon({
  path,
  tabId
  imageData,
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

The `dark` icon variant is used when a dark color scheme is used for the
surrounding UI, often referred to as "dark mode".
The `light` icon variant is used otherwise.

### New Permissions

N/A.

### Manifest File Changes

1. If icon_variants are supplied, icons can be ignored.
1. If icon_variants contain an icon object duplicate, the first match will be
used.
1. Any icon object that does not contain a "color_scheme" key will apply to both
light and dark.
1. If only one icon object is supplied, it will be used for both light and dark.
1. icon_variants will not cause an error in the event that it is invalid
Instead, it can be ignored altogether or just emit a warning. Warnings are
preferred over errors because they're more adaptable to changes in the future.
1. Neither "dark" nor "light" color_scheme's are required.
1. Icon objects missing the color_scheme property will apply to light and dark
mode. It could also be explicity set using {"color_scheme": ["dark", "light"]}.
1. If icon_variants are provided, the top level icons key and
action.default_icon will be ignored. There is no fallback.

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

N/A.