# Galton Board — physics quincunx

An interactive, single-page Galton board simulation: balls fall through a pin
field, each row applies a fair ±1-lane Bernoulli step, and the landing counts
are validated against the exact binomial distribution and a Gaussian
approximation.

**Live demo:** https://ludecan.github.io/galton_board/

## Features

- Physics-driven balls with energy-preserving pin ricochets, gentle active-ball
  collisions, dividers, floor impacts, restitution, rolling friction, trails,
  impact sparks, and bin landing effects.
- Balls mostly drop: upward pin rebound is capped, and lateral deflection is
  limited to a fraction of the ball's existing speed.
- Physics mode toggle: **true physics** (default) counts actual landings;
  **statistical** mode enforces one fair Bernoulli step per row.
- Optional active-ball collisions, off by default in true-physics mode.
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
behavior, the statistical-mode binomial distribution, true-physics completion,
and that pin ricochets do not increase mechanical energy.

## Performance benchmark

```bash
npm run perf                 # seeded stochastic 60s run at 120 balls/s
npm run perf:deterministic   # reproducible constant-random comparison
```

The benchmark drives the real simulation/render loop for a simulated minute at
60 fps. Canvas rasterization is stubbed, so it measures the JavaScript pipeline
rather than GPU painting; use the in-app FPS HUD for real browser FPS.

## Physics notes

- **True physics** is the default: counts come from the actual landing bin.
  The ideal binomial is still shown for comparison, so χ² can reject when the
  physical board is biased.
- **Statistical** mode forces one fair Bernoulli step per row and counts from
  the forced lane state, yielding the exact binned binomial expectation.
- Each release has a tiny symmetric lateral velocity, so a ball never travels
  perfectly vertically into a pin apex.
- Pin ricochets redirect a limited fraction of the ball's existing speed, so
  they do not add kinetic energy.
- Upward rebound is capped, and lateral speeds are bounded, so balls mostly
  fall rather than fly sideways or upward.
- Active-ball collisions are optional; when enabled they add visual
  interaction and can increase χ² bias in true-physics mode.

## Controls

- **Rows (floors):** each row is one fair coin flip.
- **bins = rows + 1:** one counting bin per landing lane.
- **Balls / Rate:** total balls and release throughput.
- **True physics / statistical steering:** default true physics counts actual
  landings; statistical mode enforces the fair Bernoulli contract.
- **Active ball collisions:** optional; off by default for a cleaner billiard.
- **Gravity / Restitution / Pin jitter:** gravity is acceleration in `px/s²`;
  `0` gives no acceleration, so use a positive drop speed to keep balls falling.
  In statistical mode the fair lane choice is unchanged.
- **Trails / Slow motion:** visual and playback settings.
- **Endless bins:** old pile rows scroll off while cumulative stats remain.

## License

No license file is included yet; add one before redistributing.
