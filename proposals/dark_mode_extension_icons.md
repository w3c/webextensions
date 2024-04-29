# Dark Mode Extension Icons

**Summary**

Feature to enable developers to enhance extension icon visibility in dark mode.

**Document Metadata**

**Author:** solomonkinard

**Sponsoring Browser:** Chromium

**Contributors:** oliverdunk, xeenon, carlosjeurissen, hanguokai

**Created:** 2024-04-05

**Related Issues:**
* https://crbug.com/893175
* https://github.com/w3c/webextensions/issues/229

## Motivation

### Objective

Extension developers will be able to supply and define a set of icons to be used
in the event that user has expressed the preference for a page that has a dark
theme.

#### Use Cases

1. Improved icon visibility in the extension toolbar.
1. Improved icon visibility on the management and shortcuts pages.
1. Dark mode icon declarations made possible through the extension manifest.
1. `setIcon()` will allow setting of dark and/or light mode specific icons.
1. Improved icon visibility on context menu (Chrome relies on default
icons, only Firefox and Safari can specify menu icons).
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
  `icon_variants` requires an array with a set of icon groups objects. Each icon
group consists of a set of icon paths and icon group matching criteria.

  The icon paths are set using the size as key and/or the keyword `"any"`.

  Optionally the `color_scheme` matching criterium which can either be an string or
array of color schemes.

Setting `icon_variants` dynamically:
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
const createProperties = {variants: exampleProperties};
action.setIcon(createProperties);

// menus.*(), for supporting browsers.
const menusProperties = {icon_variants: exampleProperties};
menus.create(menusProperties);
menus.update(id, menusProperties);
```

A benefit of this new structure is that it's more resiliant to future changes,
thus allowing for more keys such as density (e.g. 2dppx), purpose (e.g.
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

Existing manifest key. The behavior of the icons manifest key will remain
unchanged.
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

The `dark` icon variant can be used by browsers to improve readability of the
icon. Often this will be when the OS or browser color scheme is dark (often
referred to as "dark mode") but also when the browser uses a darker shade theme
which has a background on which the dark icon variant would be more readable.
The `light` icon variant is used otherwise.

### New Permissions

N/A.

### Manifest File Changes [And API]

`icon_variants` is offered as a replacement for `icons`. `icon_variants` aims
to be more flexible than pre-existing keys, allowing for unexpected declarations
without causing errors that prevents extension installation. Absent
`color_scheme` declaration, any matching individual `icon_variants` group will
effectively have a wild-card `color_scheme`.

**Misc**
1. If the top-level `icon_variants` key is provided, the top level `icons` key
will be ignored.
1. `icon_variants` will not cause an error in the event that it is invalid.
Instead, only the faulty icon group(s) will be ignored, with an optional
warning. Warnings are preferred over errors because they're more adaptable to
changes in the future.
1. `color-scheme`. Any icon group that does not contain a "`color_scheme`" key
will apply to all available options, e.g. both "light" and "dark".
1. **Group**. If only one icon group is supplied, it will be used as the
default, i.e. any of its matching conditions will be ignored.

**Matching**
1. If `icon_variants` contains an icon group with matching conditions, the icon
(s) specified in the first matching icon group based on insertion order will be
used. The other icon groups after that match will be ignored.
1. If there is more than one matching icon object, any without `color_scheme`
will be applied to every possible color scheme. Therefore, a subsequent matching
icon object with a `color_scheme` will not be used.
1. Incorrectly typed `color_scheme` values will be ignored, with an optional
warning. For example, `color_scheme: ["unknown"]` will be treated as an empty
array. An empty array means the browser should mark the icon group as invalid
and ignore it.
1. If only one icon object is defined with a specific color scheme, that icon
object will be applied to all color schemes. It will be the icon used.

**Size**
1. The `"16"` is a size in `{"16": "icon.png"}` and any number can be used as a
size, per the browser’s icon requirements. The word `"any"` can also be used in
place of a number to represent an icon that can be shown at any size (usually
vector images). The icon size used by the browser will be determined as follows:
1. **Raster images**: Sizes are in pixels. For high-density devices (2x, 3x,
etc.), the browser looks for double or triple the desired point size (e.g., 32
or 48 pixels for a 16 point request). If the exact pixel size is unavailable,
the next largest pixel size or `"any"` will be used.
1. **Vector images**: Sizes are in points, ensuring device independence. If the
exact point size is unavailable, an integer multiple (e.g. 32, 48, etc.) or
`"any"` will be used.
* If none of the specified icon groups have matching criteria, browsers should
drop matching criteria in a specified order until it finds a group which results
in a match. It will start by dropping any matching criteria which are
unsupported/unknown. If still no match could be made, it will drop known
matching criteria in a future agreed upon order.

**action**
1. Any icons set programmatically using `action.setIcon()` would override
manifest-defined icons.
1. For `”action”` icons, the browser first checks for `icon_variants` in the
action. If not specified, it falls back to default_icon, then to the top-level
`icon_variants` or icons.
1. `action.setIcon({variants})` will not throw when giving it icon groups with
properties it does not understand. Those icon groups will simply be ignored for
making matches. If however none of the icon groups are supported, an exception
will be thrown allowing both feature detection and specifying fallbacks without
requiring feature detection.

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
dynamically set the icon to a dark mode icon using `action.setIcon()`. That
wouldn't change the management page icon.
2. A developer could change icons dynamically to dark mode icons if this is
true: `window.matchMedia('(prefers-color-scheme: dark)')`.

### Open Web API

As stated in the workarounds section, the following is already an option to
consider: `window.matchMedia('(prefers-color-scheme: dark)')`. However, that
wouldn't automatically set icons dynamically, as it would require subsequent
calls to `action.setIcon()`. It also wouldn't update the icon on the management
pages.

## Implementation Notes

N/A.

## Future Work

N/A.