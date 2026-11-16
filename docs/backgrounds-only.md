# Backgrounds Only beta

This fork builds on hyungchulc's DuoWide 2.0.11, commit `46bfb0c8920f97f60dc96a0c25cdd6a7a9721ab6`. The MIT licence and original attribution are retained.

## Install on iPhone

Install the free [Userscripts Safari extension](https://apps.apple.com/us/app/userscripts/id1463298887). Use these two files from this fork's `backgrounds-only` branch.

- [DuoWide.user.js](https://raw.githubusercontent.com/MRKMKR/duowide/backgrounds-only/DuoWide.user.js)
- [DuoWide-Frames.user.js](https://raw.githubusercontent.com/MRKMKR/duowide/backgrounds-only/DuoWide-Frames.user.js)

Save both files in your Userscripts directory, replacing the existing copies. Alternatively open each raw link in Safari and use the Userscripts extension's install prompt. Enable Userscripts in Settings → Apps → Safari → Extensions and allow it on the websites you want to use. Reload the page. Safari's Preload Top Hit can load a page before extensions run, so reload if the script did not activate.

The Frames helper retains upstream behaviour. The optional WideText helper is unnecessary for Backgrounds Only and its setting is ignored in that mode. Keep only one copy of the main script enabled. The original README's upstream download links install the original version.

## Choose a mode

Edit `CONFIG` near the top of `DuoWide.user.js`, save, then reload the website.

```js
mode: "backgrounds",
siteModes: {
  "example.com": "normal",
  "reading.example.com": "backgrounds",
},
```

`"backgrounds"` selects Backgrounds Only and is this fork's default. `"normal"` selects the upstream full-width behaviour. Domain overrides include subdomains and the most specific matching domain wins. Use lowercase domain names without protocols or paths. `skip` still disables widening for a domain and its subdomains. Editing the settings requires a plain-text editor that saves the script in place. Updating the script replaces these settings.

No native application development, build system or runtime dependency is added. The main script's update URL points to this fork's beta branch.

## What upstream does

DuoWide measures the difference between the visible Safari viewport and the physical display, accounting for page zoom, orientation and split view. It changes the viewport metadata to the measured full width and visible height, with initial/minimum scale 1. This lets Safari paint the website beneath its right-hand strip. Its CSS viewport-unit rewriting and page-world width bridge align website calculations with the widened layout.

The existing protections include text wrapping, control fitting, fixed-bar sizing and colour continuation, carousel scroll padding, video interaction handling, frame touch coordination, horizontal scroll pinning, keyboard and zoom handling, viewport restoration, and throttled layout updates. Its edge guard also prevents fixed elements from making Safari colour the strip opaquely. Headings and foreground pictures can still occupy the wider layout in Normal mode.

Upstream already reserves foreground space in split view. It walks full-width containers and places transparent borders or padding where they can preserve the layout. Their CSS backgrounds still paint through that reserved area. It moves media-query thresholds and rewrites viewport-relative widths to retain the safe-width responsive layout. If a container cannot hold the space, it moves that responsibility to an ancestor, ultimately the document root.

## Implementation

Backgrounds Only enables that existing framing path on the outer display. The reserved space follows the measured strip side and width. Split view retains its two-sided geometry. Normal mode keeps the upstream calculations.

The change reuses viewport detection, widening, edge guards, fixed/sticky handling, restoration and the existing mutation scheduling. It adds no observers. It keeps responsive media-query and viewport-unit calculations tied to the safe content width, and avoids the Normal-mode JavaScript width enlargement.

Whole foreground elements, including full-width anchor controls, scrolling widgets and absolutely positioned media, remain inside a safe containing block. Backgrounds Only disables upstream's foreground photo-edge synthesis. For containers with a transparent reserved border at the safe viewport edge, horizontal overflow is clipped at the padding edge. This reproduces the original viewport boundary for intentionally overflowing artwork while the container's own background paints through its border. It creates no additional scroll container.

CSS colours, gradients and background images extend where their containers can safely receive the reserved space. Complex sections may show an ancestor's background in the strip. Background image sizing such as `cover` can change its crop when the painting area grows.

## Limitations

This is an experimental beta. Desktop Chrome checks use upstream's debug strip hook. They do not verify Safari's actual strip transparency, Userscripts isolation, touch gestures, zoom, keyboard transitions, folding or iPhone Duo performance. Physical-device verification remains required before calling this ready for everyday use.

A userscript cannot universally distinguish decorative imagery from meaningful imagery, rewrite every cross-origin or closed-shadow stylesheet, or guarantee arbitrary scripts' geometry calculations. CSS background images are treated as decorative. Foreground images remain constrained, including artwork that a website deliberately positions beyond its container. Such overflow meets the original viewport edge and can be cropped there, as in an ordinary narrow viewport.

Fixed bars retain upstream fitting and background continuation. Complex fixed image/gradient layers, CSS masks, unusual containment, inaccessible stylesheets and script-measured layouts may use an ancestor-colour fallback or retain visual differences. If the layout cannot safely accommodate widening, the existing fallback can return it to Safari's native width, including the native sidebar. Use `skip` for a site that still misbehaves. Landscape remains unsupported by default.

## Verification

On 16 November 2026, isolated desktop Chrome tests used a 466 × 678 viewport and a simulated 84 px right strip, leaving a 382 px safe area.

The fixture covers solid colours, CSS gradients, a tiled CSS image, foreground images/video/forms, absolute media, full-width anchor controls, fixed navigation, a sticky action, a responsive menu, a horizontal carousel and dynamic content. Both modes were exercised in light and dark themes, including menu clicks, anchor scrolling, page navigation, back navigation and stable viewport metadata. The 420 px media breakpoint retains the mobile layout in Backgrounds Only.

Live quiver.coach measurements put the heading's right edge at 423 px in Normal and 362 px in Backgrounds Only. The fixed navigation ends at 382 px. Screenshots were inspected, including the continuing dark background and the foreground artwork's original content-edge clipping. The live mobile disclosure menu opened, Support navigation succeeded, and a 900 px vertical scroll retained horizontal position 0. These are simulated desktop results.

To run the fixture checks with an existing Chrome and a separate Playwright installation, use the following command. `CHROME_PATH` can override the executable path.

```sh
NODE_PATH=/path/to/playwright-install/node_modules node tests/backgrounds.cjs
```

The test dependencies are only for development. Install the two userscripts above on the phone.
