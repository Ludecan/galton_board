'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./harness');

function approx(actual, expected, eps = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} != ${expected}`);
}

test('pmfBinned sums to 1 and is symmetric', () => {
  const { app } = createHarness();
  app.P.rows = 8;
  app.P.bins = 9;
  app.layout();
  app.reset();

  const pm = app.pmfBinned();
  assert.equal(pm.length, 9);
  approx(pm.reduce((a, b) => a + b, 0), 1, 1e-9);
  for (let i = 0; i < pm.length; i++) {
    approx(pm[i], pm[pm.length - 1 - i], 1e-12);
  }
});

test('bins = rows + 1 recovers the exact binomial pmf', () => {
  const { app } = createHarness();
  app.P.rows = 8;
  app.P.bins = 9;
  app.layout();
  app.reset();

  const pm = app.pmfBinned();
  let c = 1;
  const total = 2 ** 8;
  for (let k = 0; k <= 8; k++) {
    if (k > 0) c = c * (8 - k + 1) / k;
    approx(pm[k], c / total, 1e-12);
  }
});

test('lane centers map to their own bins and pin count is triangular', () => {
  const { app } = createHarness();
  app.P.rows = 8;
  app.P.bins = 9;
  app.layout();
  app.reset();

  for (let k = 0; k <= 8; k++) {
    assert.equal(app.binOfX(app.laneX(k)), k);
  }
  assert.equal(app.pins.length, (8 * 9) / 2);
});

test('resize/reset clears dynamic state', () => {
  const { app } = createHarness();
  app.P.rows = 6;
  app.P.bins = 7;
  app.P.rate = 0;
  app.layout();
  app.reset();

  app.spawnBall();
  app.spawnBall();
  app.step(app.SUB);
  assert.equal(app.balls.length, 2);
  assert.equal(app.spawned, 2);

  app.reset();
  assert.equal(app.balls.length, 0);
  assert.equal(app.spawned, 0);
  assert.equal(app.settledN, 0);
  assert.equal(app.counts.reduce((a, b) => a + b, 0), 0);
});

test('core statistics functions are finite and sane', () => {
  const { app } = createHarness();
  approx(app.normCdf(0), 0.5, 1e-7);
  approx(app.chiSquareP(0, 1), 1, 1e-12);
  assert.ok(Number.isFinite(app.erf(1)));
  assert.ok(Number.isFinite(app.normPdf(0, 0, 1)));
});

test('expected pmf cache stays valid and refreshes on geometry change', () => {
  const { app } = createHarness();
  app.P.rows = 8;
  app.P.bins = 9;
  app.layout();
  app.reset();

  const first = app.getPmf();
  assert.equal(app.getPmf(), first);
  assert.equal(first.length, 9);

  app.P.rows = 10;
  app.P.bins = 11;
  app.layout();
  const second = app.getPmf();

  assert.notEqual(second, first);
  assert.equal(second.length, 11);
});

test('valid stats are finite', () => {
  const { app } = createHarness();
  app.P.rows = 8;
  app.P.bins = 9;
  app.layout();
  app.reset();

  app.counts[0] = 10;
  app.counts[4] = 40;
  app.counts[8] = 10;
  app.settledN = 60;

  const s = app.computeStats();
  assert.ok(s);
  assert.equal(s.n, 60);
  assert.ok(Number.isFinite(s.mu));
  assert.ok(Number.isFinite(s.sd));
  assert.ok(Number.isFinite(s.skew));
  assert.ok(Number.isFinite(s.ksP));
  assert.ok(Number.isFinite(s.chiP));
});

// Regression: changing draw quality must not erase the settled histogram.
test('quality change preserves counts and piles', () => {
  const { app } = createHarness();
  app.P.rows = 8;
  app.P.bins = 9;
  app.layout();
  app.reset();

  app.counts[0] = 5;
  app.counts[1] = 3;
  app.settledN = 8;
  app.pile[0] = 5;
  app.pile[1] = 3;
  app.binRows[0].push(5);
  app.binRows[1].push(3);

  app.QUAL = 1;
  app.layout();

  assert.equal(app.counts[0], 5);
  assert.equal(app.counts[1], 3);
  assert.equal(app.settledN, 8);
  assert.equal(app.pile[0], 5);
  assert.equal(app.binRows[0].length, 1);
});

// Regression: stats must not build a NaN sample from empty bins.
test('stats with empty bins but nonzero settled count returns null', () => {
  const { app } = createHarness();
  app.P.rows = 8;
  app.P.bins = 9;
  app.layout();
  app.reset();

  app.settledN = 100;
  assert.equal(app.computeStats(), null);
});

// Regression: URL values that are not integers must not create a fractional board.
test('hash parser rejects fractional rows, bins and balls', () => {
  const h = createHarness();
  const { app } = h;

  h.location.hash = '#rows=3.5&bins=15.5&balls=150.5';
  app.readHash();

  assert.ok(Number.isInteger(app.P.rows));
  assert.ok(Number.isInteger(app.P.bins));
  assert.ok(Number.isInteger(app.P.balls));
  assert.ok(app.P.rows >= 2 && app.P.rows <= 40);
  assert.ok(app.P.bins >= 2 && app.P.bins <= 48);
  assert.ok(app.P.balls >= 100 && app.P.balls <= 20000);
});

// Regression: clicking share must copy the settings that are in the UI now.
test('share link includes current settings synchronously', () => {
  const h = createHarness();
  const { app } = h;

  app.P.rows = 20;
  app.P.bins = 30;
  app.P.balls = 1000;

  const click = h.elements.get('bShare').listeners.click;
  assert.ok(click && click.length === 1);
  click[0]();

  assert.match(h.copied.text, /rows=20/);
  assert.match(h.copied.text, /bins=30/);
  assert.match(h.copied.text, /balls=1000/);
});

// Regression: a divider with a small radius must use divider/floor response,
// not the pin response.
test('divider collision is not classified as a pin by radius', () => {
  const { app } = createHarness();
  app.P.rows = 8;
  app.P.bins = 9;
  app.layout();
  app.reset();

  app.L.pinR = 1.5; // cr = 2.0 satisfies the old pin heuristic
  app.P.rest = 0.25;
  app.P.grav = 3000;

  const b = { x: 2.5, y: 0, vx: 100, vy: 100, w: 0, r: 2 };
  app.resolve(b, 3, 0, 2.0, false, undefined);

  // General (divider/floor) response: normal rebound + Coulomb friction.
  approx(b.vx, -25, 1e-6);
  approx(b.vy, 71.428571, 1e-5);
  approx(b.w, -35.714285, 1e-5);
});

// Regression: a re-dropped ball must clear its stuck/landing state.
test('re-drop resets stuck counter and landing target', () => {
  const { app } = createHarness();
  app.P.rows = 4;
  app.P.bins = 5;
  app.P.rate = 0;
  app.P.grav = 3000;
  app.P.speed = 200;
  app.layout();
  app.reset();

  app.spawnBall();
  const b = app.balls[0];
  b.x = app.L.binsLeft + 2 * app.L.ballR;
  b.y = app.L.padTop + 5;
  b.vx = 0;
  b.vy = 0;
  b.w = 0;
  b.dec = 1;
  b.stuck = 3;
  b.slow = 0.3;
  b.landX = 123;

  app.step(app.SUB);

  assert.equal(b.stuck, 0);
  assert.equal(b.landX, undefined);
});

// Behavioral guard: the forced fair-coin walk still produces the binned binomial.
test('simulated run preserves the binned binomial distribution', () => {
  const { app } = createHarness({ seed: 42 });
  app.P.rows = 6;
  app.P.bins = 7;
  app.P.balls = 400;
  app.P.rate = 0;
  app.P.grav = 3000;
  app.P.rest = 0.25;
  app.P.jit = 0.25;
  app.P.speed = 200;
  app.layout();
  app.reset();

  for (let i = 0; i < 400; i++) app.spawnBall();

  let steps = 0;
  while (app.balls.length && steps < 20000) {
    app.step(app.SUB);
    steps++;
  }

  assert.equal(app.balls.length, 0);
  assert.equal(app.settledN, 400);
  assert.equal(app.counts.reduce((a, b) => a + b, 0), 400);

  const s = app.computeStats();
  assert.ok(s);
  assert.ok(s.chiP > 0.01, `chi-square p was ${s.chiP}`);
});

// Regression: particle spawning must not overspend the per-frame budget.
test('particle budget is not overspent', () => {
  const { app } = createHarness();
  app.P.rows = 8;
  app.P.bins = 9;
  app.layout();
  app.reset();

  app.pBudget = 1;
  app.spawnP(0, 0, 800, '#fff', false);

  assert.equal(app.pBudget, 1);
  let active = 0;
  for (const p of app.parts) if (p.a) active++;
  assert.equal(active, 0);
});
