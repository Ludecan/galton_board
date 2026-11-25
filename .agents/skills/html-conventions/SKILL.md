---
name: html-conventions
description: Rules for web pages and apps written as plain HTML, CSS and JavaScript with no build step, including single-file `index.html` apps. Use whenever you start one, or write, fix, refactor or review `.html`, `.css` or browser `.js` files in a repo without a bundler. Not for React, TypeScript or other projects with a build step.
---

# HTML conventions

These rules add to `write-good-code`. The repo's own `code-conventions` skill, if it has one, wins where they disagree.

- **New project:** follow [the new-project procedure](references/new-project.md).
- Keep the shape the repo has: a single-file app stays one `index.html` with one `<style>` and one `<script>`. No framework, bundler, transpiler or runtime dependency unless the user asks. A dev-only test tool that Node already has (`node:test`, `node:vm`) is not a dependency.
- Write modern JavaScript that current browsers run as is: `const` by default, `let` when the value changes, never `var`. Use `===`. Start a classic script with `'use strict';`, or use `<script type="module">`.
- Keep one state object (for example `const state = {...}`) as the single source of truth. The UI reads from it and writes to it. Do not keep a second copy of a value in the DOM.
- Group the script in sections with banner comments, in the order that the data flows (state, setup, logic, rendering, UI, boot). Keep pure logic (math, parsing, simulation) in functions that do not touch the DOM, so tests can call them.

## DOM and input

- Look up each element once, at boot. A missing element is a bug: fail loudly (`throw new Error('missing #id')`) instead of `?.` chains that hide it.
- Set text with `textContent`. Use `innerHTML` only with markup the code writes itself, never with data from the URL, storage, files or the user.
- Validate everything read from `location.hash`, query strings, `localStorage` or files: parse numbers with `Number()` and check `Number.isFinite` and the range, check colors and enum values against a pattern or list, and fall back to the default for that one field.
- Attach event listeners in code (`addEventListener`), not in HTML attributes.

## Accessibility

- Use real controls: `<button>` for actions, `<input>` with a `<label>` for values. A `<div>` with a click handler is not a button.
- Every control works with the keyboard, and has a visible focus style. An icon-only button has an `aria-label`.
- Respect `prefers-reduced-motion`: reduce or stop large animations when it is set.
- Set `lang` on `<html>`, a `<title>`, and `<meta name="viewport" content="width=device-width, initial-scale=1">`.

## Canvas and animation

- Animate with `requestAnimationFrame`, and scale every rate by the real elapsed time (`dt` from the timestamp), never by frame count. The result must look the same at 30, 60 or 144 fps. Clamp `dt` after a tab comes back from the background.
- Size a canvas for `devicePixelRatio`: set `canvas.width` and `canvas.height` to the CSS size times the ratio, and give the canvas an explicit CSS `width` and `height`. Recompute on resize (`ResizeObserver`).
- Do not read layout (`offsetWidth`, `getBoundingClientRect`) inside the frame loop after you write styles. Read first, then write.
- Use a seedable random number generator for anything that a test or a benchmark must repeat.

## Errors and logs

- Do not leave `console.log` debugging in committed code. Use `console.error` only for real errors.
- Open the page and check the browser console: an uncaught error in a single-script page stops everything after it.

## Check your work

Use the repo's test command (`npm test`, `node scripts/smoke.js` or a `make` target). [Testing](references/testing.md) explains the headless test harness that runs the inline script in Node, and how to check parse errors and open the page.
