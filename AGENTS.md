# Galton Board

## Project overview

An interactive Galton board (quincunx) in a single `index.html` file. Balls fall through a pin field. Each row is a fair ±1-lane Bernoulli step, and the landing counts are checked against the exact binomial distribution (χ²) and a Gaussian fit (KS test).

**Stack:** vanilla JavaScript, Canvas 2D, CSS. No dependencies, no build step. Node runs the tests and the benchmark.

- Live on GitHub Pages: https://ludecan.github.io/galton_board/
- [README.md](README.md) has the features, controls and physics notes.

This AGENTS.md file is kept intentionally lean. Avoid cluttering with instructions and use progressive disclosure when context starts to grow.

## Repo map

```
index.html          the whole app: <style>, markup, one <script> in banner-comment sections
                    (math, themes, state, layout, physics, stats, drawing, main loop, UI, hash, boot)
tests/harness.js    runs the inline <script> in node:vm with DOM/canvas stubs; exposes app internals
tests/app.test.js   node:test tests: geometry, statistics, hash parsing, collisions, distribution, energy
perf/bench.js       headless benchmark of the simulation and draw loop (own stubs, seeded random)
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
```

There is no install, build or lint step.

## Search scope

None.

## Gotchas

- The bin of a ball comes from its forced lane state and `landX`, not from the collision outcome. Ball collisions and pin physics change only the visible path.
- `QUAL` (canvas quality) starts at `devicePixelRatio`, capped at 2. A quality change must keep the counts and the piles (there is a test).
- The benchmark stubs canvas rasterization, so it measures the JavaScript pipeline only. Real frame rate comes from the FPS HUD in a browser.
- There is no license file yet.
