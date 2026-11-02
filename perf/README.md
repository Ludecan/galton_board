# Headless pipeline benchmark

`node perf/bench.js` drives the real simulation/render loop for one simulated
minute at 60 frames per second with a 120 balls/s drop rate.

It stubs canvas rasterization, so it measures the JavaScript pipeline (physics,
layout, draw-loop iteration, stats) rather than GPU painting. Use the browser
HUD for real visual FPS.

Example:

```bash
node perf/bench.js --seconds 60 --fps 60 --rate 120
```

The output includes elapsed wall time, pipeline frames/s, settled/active counts,
and canvas draw-call counts.
