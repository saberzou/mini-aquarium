# Koi Pond

A quiet, interactive pond with 18 koi varieties, feeding, rain, music, and guided breathing. Built with native JavaScript modules and Canvas 2D, with an optional Three.js water layer. No build step or package installation is required.

## Run

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080` in a browser. Serve over HTTP; ES modules do not run reliably from `file://`.

## Interactions

- Tap to make ripples; drag to disturb the water.
- Hold briefly to feed. After feeding starts, move your finger to scatter food.
- Choose koi with the + button; select an existing variety to remove it.
- Use the breathing button for a repeating 4-second inhale / 6-second exhale.
- Switch weather, music, and English/Chinese with the edge controls.
- Press Escape to close the koi picker. Its cards support keyboard selection.

Fish choices, weather, music preference, and language are saved locally on the device when browser storage is available. No account or backend is involved.

## Implementation

`js/pond.js` coordinates the scene. `js/clock.js` runs physics at 60 steps/second independently of display refresh rate. `js/fish.js` draws both swimming koi and picker previews. `js/audio.js` manages cancelable music transitions. `js/storage.js` provides best-effort local preferences. `pond.css` contains the current visual and responsive overrides.

The CSS water background remains usable if the optional external liquid renderer cannot load. Canvas resolution is capped at 2×. Reduced-motion mode removes liquid rendering and decorative shimmer and reduces repaint frequency; the interactive fish still move. The main simulation and audio pause when the document is hidden.

## Regression checks

```sh
node --experimental-vm-modules tests/regression.cjs
```

Covers script syntax, equivalent simulation timing across refresh rates, fish identity and persistence, feeding jitter/cancellation, rapid breathing reversals, background lifecycle, and unavailable storage. These logic checks do not replace browser validation.

## Publish

The existing GitHub Pages integration builds and deploys `main`. Check the repository's **Actions → pages build and deployment** after pushing. Update module query-string versions together when changing browser-cached modules.
