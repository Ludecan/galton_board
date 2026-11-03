'use strict';

/*
 * Parameter sweep for the true-physics Gaussian board.
 * Run: node perf/sweep.js
 */

const { createHarness } = require('../tests/harness');

const CANDIDATES = [
  { name: 'default',                 rowAspect: 0,              ballScale: 0.12, pinRatio: 0.62, pinTangent: 0.45, spawnSpread: 0.4, spawnVxScale: 1 },
  { name: 'triangular-small',        rowAspect: Math.sqrt(3)/2, ballScale: 0.12, pinRatio: 0.62, pinTangent: 0.45, spawnSpread: 0.4, spawnVxScale: 1 },
  { name: 'triangular-medium',       rowAspect: Math.sqrt(3)/2, ballScale: 0.18, pinRatio: 1.0,  pinTangent: 0.75, spawnSpread: 0.5, spawnVxScale: 2 },
  { name: 'triangular-large',        rowAspect: Math.sqrt(3)/2, ballScale: 0.20, pinRatio: 1.0,  pinTangent: 0.85, spawnSpread: 0.6, spawnVxScale: 3 },
  { name: 'compressed-medium',       rowAspect: 0,              ballScale: 0.20, pinRatio: 1.0,  pinTangent: 0.75, spawnSpread: 0.6, spawnVxScale: 2 },
  { name: 'compressed-large',        rowAspect: 0,              ballScale: 0.25, pinRatio: 1.2,  pinTangent: 0.60, spawnSpread: 0.5, spawnVxScale: 2 },
  { name: 'triangular-wide-spawn',   rowAspect: Math.sqrt(3)/2, ballScale: 0.15, pinRatio: 0.8,  pinTangent: 0.60, spawnSpread: 0.7, spawnVxScale: 4 },
  { name: 'triangular-high-tangent', rowAspect: Math.sqrt(3)/2, ballScale: 0.12, pinRatio: 0.62, pinTangent: 0.85, spawnSpread: 0.8, spawnVxScale: 5 },
];

function runCandidate(c) {
  const { app } = createHarness({ seed: 1 });
  app.P.rows = 20;
  app.P.binsync = true;
  app.P.bins = 21;
  app.P.balls = 3000;
  app.P.rate = 50;
  app.P.grav = 900;
  app.P.rest = 0.35;
  app.P.jit = 0.35;
  app.P.speed = 200;
  app.P.physics = 'true';
  app.P.ballCollisions = false;
  app.P.trails = 'off';
  Object.assign(app.P, c);

  app.layout();
  app.reset();
  app.paused = false;

  let ts = 0;
  for (let i = 0; i < 3600; i++) {
    ts += 1000 / 60;
    app.frame(ts);
  }

  const s = app.computeStats();
  const n = app.settledN;
  const counts = app.counts.slice();
  const edge = n ? (counts[0] + counts[counts.length - 1]) / n : 0;
  let asym = 0;
  for (let i = 0; i < counts.length; i++) asym += Math.abs(counts[i] - counts[counts.length - 1 - i]);
  asym /= Math.max(1, n);

  return {
    name: c.name,
    S: app.L.S,
    vs: app.L.vs,
    ballR: app.L.ballR,
    pinR: app.L.pinR,
    n,
    edge,
    asym,
    mu: s ? s.mu : null,
    sd: s ? s.sd : null,
    chiP: s ? s.chiP : null,
    ksP: s ? s.ksP : null,
    counts,
  };
}

const rows = CANDIDATES.map(runCandidate);
for (const r of rows) {
  console.log(JSON.stringify({
    name: r.name,
    S: Number(r.S.toFixed(2)),
    vs: Number(r.vs.toFixed(2)),
    ballR: Number(r.ballR.toFixed(2)),
    pinR: Number(r.pinR.toFixed(2)),
    n: r.n,
    edge: Number(r.edge.toFixed(3)),
    asym: Number(r.asym.toFixed(3)),
    mu: r.mu === null ? null : Number(r.mu.toFixed(2)),
    sd: r.sd === null ? null : Number(r.sd.toFixed(2)),
    chiP: r.chiP === null ? null : Number(r.chiP.toExponential(2)),
    ksP: r.ksP === null ? null : Number(r.ksP.toExponential(2)),
    counts: r.counts,
  }));
}
