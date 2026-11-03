# Galton Board — physics quincunx

An interactive, single-page Galton board simulation: balls fall through a pin
field, each row applies a fair ±1-lane Bernoulli step, and the landing counts
are validated against the exact binomial distribution and a Gaussian
approximation.

**Live demo:** https://ludecan.github.io/galton_board/

## Features

- Physics-driven balls with pin ricochets, active-ball collisions, dividers,
  floor impacts, restitution, rolling friction, trails, impact sparks, and
  bin landing effects.
- Exact binned binomial expectation (`B(rows, ½)`) overlaid with observed
  counts and a Gaussian fit.
- χ² test against the board's binned binomial PMF and a KS test for
  Gaussianity.
- Six themes: neon, wood, metal, gems, elemental, and vaporwave.
- Adjustable rows, bins, drop rate, gravity, restitution, pin jitter, and
  slow motion.
- Shareable settings via URL hash.
- `SHOWCASE` and `STAT RUN` presets.
- Responsive layout, reduced-motion support, and mobile pointer tooltips.

## Run locally

Open `index.html` directly in a browser, or serve it:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Tests

```bash
npm test
```

The test harness runs the inline app against a stub DOM/canvas and checks
board geometry, statistics, hash parsing, collision classification, share-link
behavior, and the simulated binomial distribution.

## Performance benchmark

```bash
npm run perf                 # seeded stochastic 60s run at 120 balls/s
npm run perf:deterministic   # reproducible constant-random comparison
```

The benchmark drives the real simulation/render loop for a simulated minute at
60 fps. Canvas rasterization is stubbed, so it measures the JavaScript pipeline
rather than GPU painting; use the in-app FPS HUD for real browser FPS.

## Controls

- **Rows (floors):** each row is one fair coin flip.
- **bins = rows + 1:** one counting bin per landing lane.
- **Balls / Rate:** total balls and release throughput.
- **Gravity / Restitution / Pin jitter:** visual physics; the fair lane choice
  and resulting distribution are unchanged.
- **Trails / Slow motion:** visual and playback settings.
- **Endless bins:** old pile rows scroll off while cumulative stats remain.

## License

No license file is included yet; add one before redistributing.
