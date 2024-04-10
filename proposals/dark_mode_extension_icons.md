# Dark Mode Extension Icons

**Summary**

Feature to enable developers to enhance extension icon visibility in dark mode.

**Document Metadata**

**Author:** &lt;solomonkinard>

**Sponsoring Browser:** Chromium.

**Contributors:** &lt;oliverdunk>

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
1. Improved icon visibility on management the management and shortcuts pages.
1. Dark mode icon declarations made possible through the extension manifest.
1. setIcon() will allow setting of dark and/or light mode specific icons.
1. Improved icon visibility on context menu (Chrome and Safari reply on default
icons, only Firefox can specify icons).
1. Improved icon visibility on side panel (Chrome replies on default icons,
Firefox can specify icons).

### Known Consumers

The Chromium bug has a significant amount of developer interest.

## Specification

### Schema

Common
```
// `Mode` is dark or light (if either is used, both are expected).
const Modes: string[] = ["dark", "light];
const Mode = Modes[Math.floor(Math.random() * Modes.length())];

// Primitive type declaration.
type Size = string;
type Path = string;

// Map icon size to path.
const IconSizeToPath: map<Size, Path>;
```

manifest.json
```
// Map mode to a string path or a dictionary mapping icon size to a string path.
const IconVariants: map<Mode, IconSizeToPath | Path>;

{
  ...
  "icon_variants": IconVariants;
  "action": {
    ...
    "icon_variants": IconVariants
  },
};
```

action.setIcon()
```
// ImageData is an interface representing canvas element pixels.
const IconSizeToImageData: map<Size, Path>;
const IconVariantsWithImageData:
  map<Mode, IconSizeToPath | IconSizeToImageData | ImageData | Path>;
const ImageDataDictionary: map<Size, ImageData>;

action.setIcon(
  ...
  icon_variants?: IconVariantsWithImageData,
);
```

### Examples

manifest.json
```
{
  "icon_variants": {
    "dark": {
      "128": "128_dark.png"
    },
    "light": {
      "128": "128_light.png"
    }
  },
  "action": {
    "default_icon": {
      "128": "128_action.png"
    },
    "icon_variants": {
      "dark": {
        "128": "128_action_dark.png"
      },
      "light": {
        "128": "128_action_light.png"
      }
    }
  }
}
```

Action
```
action.setIcon({
  variants: {
    "dark": {
      "128": "128_action_dark.png"
    },
    "light": {
      "128": "128_action_light.png"
    }
  },
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

#### Optional or required?
`icon_variants` is an optional key of the top level manifest dictionary.
`icon_variants` is also an optional sub-key in the action key dictionary.

#### Fallback
* `icon_variants` will be used if they're supplied. Otherwise `default_icon`
will be used if it's supplied. If neither are supplied, then `icons` will be
used.

* icon_variants or variants in action.setIcon() must provide both dark and light
icon, if they occur.

* Order of precedence for action:
<api>.action.setIcon() -> action.icon_variants -> action.default_icon ->
icon_variants -> icons

* Order of precedence for non-action:
icon_variants -> icons

### FAQ
* What happens if you specify icon_variants.dark but not icon_variants.light,
and also icons?

If either is provided, both are expected.

* Do we use the dark mode icon from icon_variants for light as well, or fallback
to icons?

Both are expected if either "light" or "dark" are supplied.

* What happens if you specify icon_variants.dark but not icon_variants.light, and
you don't have icons?

This could be a warning and a silent fallback to "icons", as the goal is to try
to reduce errors as much as possible.

* Do we use the dark mode icon from icon_variants or show an auto-generated icon?

The dark mode icon from variants will be shown if supplied and the user is
currently in dark mode.

#### Warning or error?
The new `icon_variants` key (or sub-key) will not cause an error in the event
that it is invalid. Instead, either ignore it altogether, or emit a warning.
Warnings are preferred over errors as they're future-resilient.

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