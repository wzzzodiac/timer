# Timer

A countdown and stopwatch with a lavender field, clear type and quiet controls.

## Use

Open `index.html`, or serve this folder with `python -m http.server 8786 --bind 127.0.0.1`.
No build, dependencies or external assets are required.

- Editable hours (0–99), minutes and seconds (0–59).
- Eight presets, running time adjustments, pause/resume, reset and clear.
- Remaining time in the tab title; absolute deadlines avoid interval drift.
- Stopwatch with lap totals and split times. Both modes can run concurrently.
- Original repeating alarm melodies through Web Audio; a visual dialog remains available without audio support.
- Keyboard: Space starts/pauses, R resets, L records a stopwatch lap. Enter, Escape or Space dismisses the alarm.
- SVG favicon, PNG fallback and Apple touch icon.

The original timing, lap and alarm engine is preserved in `engine.js`.
`presentation.js` reflects progress and selected presets, manages pressed states and contains alarm focus.
System fonts only. Responsive layout and reduced-motion support.

## GitHub Pages

The publication files live at repository root. Keep the existing Pages configuration: `main`, `/(root)`.
Canonical URL: https://wzzzodiac.github.io/timer/
The current branch is a local release candidate, not publication approval.
