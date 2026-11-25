# Galton Board

## Project overview

An interactive Galton board (quincunx) in a single `index.html` file. Balls fall through a pin field, and the landing counts are checked against the exact binomial distribution (χ²) and a Gaussian fit (KS test). There are two physics modes (`P.physics`): `true` (default) counts the bin where the ball really lands, and `statistical` forces one fair ±1-lane Bernoulli step per row.

**Stack:** vanilla JavaScript, Canvas 2D, CSS. No dependencies, no build step. Node runs the tests and the benchmark.

- Live on GitHub Pages: https://ludecan.github.io/galton_board/
- [README.md](README.md) has the features, controls and physics notes.

This AGENTS.md file is kept intentionally lean. Avoid cluttering with instructions and use progressive disclosure when context starts to grow.

## Repo map

```
index.html          the whole app: <style>, markup, one <script> in banner-comment sections
                    (math, themes, state, layout, physics, stats, drawing, main loop, UI, hash, boot)
tests/harness.js    runs the inline <script> in node:vm with DOM/canvas stubs; exposes app internals
tests/app.test.js   node:test tests: geometry, statistics, hash parsing, collisions, both physics modes, energy
perf/bench.js       headless benchmark of the simulation and draw loop (own stubs, seeded random)
perf/sweep.js       parameter sweep for the true-physics Gaussian layout
perf/README.md      benchmark options and output
package.json        npm scripts only, no dependencies
```

## Repo map updates

Whenever a substantial code modification has been implemented, or an outdated repo map is detected while exploring the codebase, edit the repo map for review. Put the repo map edit in its own final commit, so it does not hide the real change.

## Commands

```
python3 -m http.server 8000    # run, then open http://localhost:8000/ (or open index.html directly)
npm test                       # node --test tests/app.test.js
npm run perf                   # seeded stochastic 60 s run at 120 balls/s
npm run perf:deterministic     # constant random stream, to compare two code versions
npm run perf:sweep             # parameter sweep of the true-physics Gaussian layout
```

There is no install, build or lint step.

## Search scope

None.

## Gotchas

- The bin of a ball depends on the mode. In `true` mode it is the real landing position (`b.x`), so a biased board makes χ² reject. In `statistical` mode it is the forced lane state (`landX`), and pin physics and ball collisions change only the visible path.
- Tests that check the exact binomial distribution set `P.physics = 'statistical'` first, because `true` is the default.
- `QUAL` (canvas quality) starts at `devicePixelRatio`, capped at 2. A quality change must keep the counts and the piles (there is a test).
- The benchmark stubs canvas rasterization, so it measures the JavaScript pipeline only. Real frame rate comes from the FPS HUD in a browser.
- There is no license file yet.
