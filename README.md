# Mini Aquarium

A tiny ocean of your own: a tranquil, interactive tropical reef, adapted from [Koi Pond](https://github.com/saberzou/koi-pond).

- Nine individually illustrated reef fish, with animated fins and swimming behavior.
- Sea turtle, blue-spotted ray, moon jelly, octopus, and sea star companions.
- Coral gardens, swaying sea grass, anemones, sand shelves, and connected water caustics.
- Tap or drag for refractive ripples; hold to feed fish.
- Daylight / moonlight, optional music, guided breathing, and English / Chinese.
- Fixed-height companion sheet, keyboard-operable categories, and independent saved preferences.
- No framework, package installation, build step, external renderer, or WebGL dependency.

## Run

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080`. Native modules require HTTP, rather than opening the HTML file directly.

## Validate

```sh
node --experimental-vm-modules tests/regression.cjs
```

Checks include fixed-rate simulation, feeding/cancellation, fish and animal persistence, audio crossfade reversal, background pause/resume, breathing transitions, bounded water rendering, and unavailable storage.

## Structure

- `index.html`: controls, translations, accessible companion sheet.
- `aquarium.css`: sea-glass palette and responsive layout.
- `js/aquarium.js`: scene, pointer gestures, lifecycle, lighting.
- `js/fish.js`, `js/config.js`: shared species renderer and swimming behavior.
- `js/animals.js`: marine companion behavior and previews.
- `js/reef.js`: coral, sea grass, sand, and anemones.
- `js/caustics.js`, `js/ripple.js`: moving light and refractive wave fronts.
- `js/clock.js`, `js/audio.js`, `js/breathing.js`, `js/storage.js`: timing, sound, meditation, preferences.

Canvas resolution is capped at 2×; the water buffer is limited to a 320-pixel longest edge. Reduced motion keeps the water texture still and limits repainting; fish remain interactive. Animation and audio pause in the background. Aquarium settings use an independent `aquarium-` storage prefix.

## Hosting

This is a static site. In GitHub Settings → Pages, select **Deploy from a branch**, **main**, **/(root)**. Each push then updates the site. `.nojekyll` bypasses Jekyll.

The original ambient music files are retained from Koi Pond. Fish and reef artwork are drawn procedurally; no image downloads are needed. Species are stylized, and this is a relaxation experience rather than a realistic husbandry simulator.
