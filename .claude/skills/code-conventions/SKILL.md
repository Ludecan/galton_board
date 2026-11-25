---
name: code-conventions
description: Galton Board coding rules that add to or override write-good-code and html-conventions. Use whenever you write, fix, refactor or review code in this repo.
---

# Galton Board code conventions

- Keep the banner-comment sections of the `<script>` in `index.html`, in this order: `math`, `themes`, `state`, `layout`, `physics`, `stats`, `drawing`, `main loop`, `UI`, `hash`, `boot`. Put new code in the section that owns it.
- Settings live in `P`. A new setting gets a key in `buildHash` and `readHash`. `readHash` checks each value: integers where the slider is integer, and the slider range. Never rename or remove a key: old share links must still load.
- The counted distribution must stay the exact binned binomial. Visual physics (gravity, restitution, jitter, ball collisions, trails) must not change which bin a ball is counted in. The test `simulated run preserves the binned binomial distribution` guards this.
- Pin ricochets must not add kinetic energy. The test `pin ricochet does not increase mechanical energy` guards this.
- The tests and the benchmark have separate stubs: `tests/harness.js` and `perf/bench.js`. When you add an element id, add it to the `ids` list (and to `ranges` for a slider) in both files. When a test needs an app function, add it to the `hooks` object in `tests/harness.js`.
- A physics or performance change gets a before and after run of `npm run perf:deterministic`. Give both numbers to the user.
