'use strict';

/*
 * Headless pipeline benchmark.
 *
 * This drives the real simulation/render loop for a simulated minute at a fixed
 * frame rate. Canvas operations are stubbed, so the result measures the JS
 * pipeline cost (physics, layout, draw-loop iteration, stats), not GPU
 * rasterization. The browser HUD remains the source of truth for real FPS.
 *
 * Usage:
 *   node perf/bench.js
 *   node perf/bench.js --seconds 60 --fps 60 --rate 120
 */

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function arg(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  const value = Number(process.argv[idx + 1]);
  return Number.isFinite(value) ? value : fallback;
}

function makeContext2D(metrics) {
  const noop = () => {};
  return {
    setTransform: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    fillRect: noop,
    strokeRect: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    fill: noop,
    stroke: noop,
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    clip: noop,
    drawImage: () => { metrics.drawImageCalls++; },
    fillText: () => { metrics.fillTextCalls++; },
    measureText: () => ({ width: 10 }),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    font: '',
    textAlign: 'left',
    shadowBlur: 0,
    shadowColor: '',
  };
}

function makeElement(id) {
  return {
    id,
    value: '',
    min: 0,
    max: 100,
    disabled: false,
    checked: false,
    textContent: '',
    innerHTML: '',
    style: {},
    dataset: {},
    offsetWidth: 130,
    offsetHeight: 40,
    clientWidth: 800,
    clientHeight: 600,
    listeners: Object.create(null),
    classList: { toggle: () => {}, add: () => {}, remove: () => {} },
    appendChild: () => {},
    addEventListener(type, fn) {
      (this.listeners[type] ||= []).push(fn);
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 800, height: 600 };
    },
  };
}

function makeCanvas(metrics) {
  const ctx = makeContext2D(metrics);
  return {
    width: 800,
    height: 600,
    getContext() { return ctx; },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 800, height: 600 };
    },
    addEventListener: () => {},
  };
}

function makeRandom(seed) {
  let s = seed >>> 0;
  return function random() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function createHarness(seed = 12345678, constantRandom = false) {
  const metrics = { drawImageCalls: 0, fillTextCalls: 0 };
  const elements = new Map();
  const ids = [
    'cv', 'stage', 'hFps', 'hAct', 'hSet', 'hDone', 'toast', 'tip',
    'rows', 'o_rows', 'bins', 'o_bins', 'balls', 'o_balls',
    'rate', 'o_rate', 'speed', 'o_speed', 'grav', 'o_grav',
    'rest', 'o_rest', 'jit', 'o_jit', 'slow', 'trails',
    'binsync', 'endless', 'bPlay', 'bReset', 'bBurst', 'bShare',
    'stats', 'verdict', 'statNote', 'chips', 'r_bins', 'app', 'panel',
  ];
  const ranges = {
    rows: [2, 40], bins: [2, 48], balls: [100, 20000],
    rate: [1, 120], speed: [0, 300], grav: [200, 3000],
    rest: [0, 0.85], jit: [0, 1],
  };
  for (const id of ids) elements.set(id, makeElement(id));
  elements.set('cv', makeCanvas(metrics));
  for (const [id, [min, max]] of Object.entries(ranges)) {
    const el = elements.get(id);
    el.min = min;
    el.max = max;
  }
  elements.get('stage').clientWidth = 800;
  elements.get('stage').clientHeight = 600;

  const location = { href: 'http://localhost/', hash: '' };
  const history = {
    replaceState(_state, _title, url) {
      if (url.startsWith('#')) {
        location.hash = url;
        location.href = 'http://localhost/' + url;
      } else {
        location.href = url;
        location.hash = url.includes('#') ? '#' + url.split('#')[1] : '';
      }
    },
  };
  const navigator = {
    clipboard: {
      writeText() { return Promise.resolve(); },
    },
  };
  const document = {
    body: makeElement('body'),
    documentElement: makeElement('html'),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement(id));
      return elements.get(id);
    },
    querySelectorAll() { return []; },
    createElement(tag) {
      return tag === 'canvas' ? makeCanvas(metrics) : makeElement(tag);
    },
    addEventListener: () => {},
  };
  document.body.style = {};
  document.documentElement.style = { setProperty: () => {} };

  const window = { devicePixelRatio: 1, addEventListener: () => {} };
  const seededMath = Object.create(Math);
  seededMath.random = constantRandom ? () => 0.3 : makeRandom(seed);

  const context = vm.createContext({
    document,
    window,
    location,
    history,
    navigator,
    requestAnimationFrame: () => 0,
    setTimeout,
    clearTimeout,
    getComputedStyle: () => ({ fontFamily: 'monospace' }),
    console,
    URLSearchParams,
    Math: seededMath,
  });

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('No inline script found in index.html');

  const hooks = `
    globalThis.__app = {
      P, L,
      get balls(){ return balls; },
      get counts(){ return counts; },
      get settledN(){ return settledN; },
      get spawned(){ return spawned; },
      get paused(){ return paused; },
      set paused(v){ paused = v; },
      layout, reset, frame, draw,
      get SUB(){ return SUB; },
    };
  `;

  vm.runInContext(match[1] + hooks, context, { filename: 'index.html' });
  return { app: context.__app, metrics };
}

function main() {
  const seconds = arg('--seconds', 60);
  const fps = arg('--fps', 60);
  const rate = arg('--rate', 120);
  const frames = Math.round(seconds * fps);
  const deterministic = process.argv.includes('--deterministic');

  const { app, metrics } = createHarness(12345678, deterministic);
  app.P.rows = 40;
  app.P.binsync = false;
  app.P.bins = 15;
  app.P.balls = 20000;
  app.P.rate = rate;
  app.P.speed = 200;
  app.P.grav = 3000;
  app.P.rest = 0.25;
  app.P.jit = 0.25;
  app.P.slow = false;
  app.P.endless = false;
  app.layout();
  app.reset();
  app.paused = false;

  let ts = 0;
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < frames; i++) {
    ts += 1000 / fps;
    app.frame(ts);
  }
  const t1 = process.hrtime.bigint();

  const wallMs = Number(t1 - t0) / 1e6;
  const wallFps = frames / (wallMs / 1000);

  console.log(JSON.stringify({
    kind: 'headless-pipeline-benchmark',
    simulatedSeconds: seconds,
    simulatedFps: fps,
    randomMode: deterministic ? 'constant' : 'seeded',
    frames,
    wallMs: Number(wallMs.toFixed(1)),
    pipelineFps: Number(wallFps.toFixed(1)),
    spawned: app.spawned,
    settled: app.settledN,
    active: app.balls.length,
    countsSum: app.counts.reduce((a, b) => a + b, 0),
    drawImageCalls: metrics.drawImageCalls,
    fillTextCalls: metrics.fillTextCalls,
  }, null, 2));
}

main();
