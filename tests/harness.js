'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

function makeContext2D() {
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
    drawImage: noop,
    fillText: noop,
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
    classList: {
      toggle: () => {},
      add: () => {},
      remove: () => {},
    },
    appendChild: () => {},
    addEventListener(type, fn) {
      (this.listeners[type] ||= []).push(fn);
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 800, height: 600 };
    },
  };
}

function makeCanvas() {
  const ctx = makeContext2D();
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

function createHarness(options = {}) {
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
    rows: [2, 40],
    bins: [2, 48],
    balls: [100, 20000],
    rate: [1, 120],
    speed: [0, 300],
    grav: [200, 3000],
    rest: [0, 0.85],
    jit: [0, 1],
  };
  for (const id of ids) elements.set(id, makeElement(id));
  elements.set('cv', makeCanvas());
  for (const [id, [min, max]] of Object.entries(ranges)) {
    const el = elements.get(id);
    el.min = min;
    el.max = max;
  }
  elements.get('stage').clientWidth = 800;
  elements.get('stage').clientHeight = 600;

  const copied = { text: '' };
  const location = {
    href: 'http://localhost/',
    hash: '',
  };
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
      writeText(text) {
        copied.text = text;
        return Promise.resolve();
      },
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
      return tag === 'canvas' ? makeCanvas() : makeElement(tag);
    },
    addEventListener: () => {},
  };
  document.body.style = {};
  document.documentElement.style = { setProperty: () => {} };

  const window = {
    devicePixelRatio: 1,
    addEventListener: () => {},
  };

  const seededMath = Object.create(Math);
  seededMath.random = makeRandom(options.seed ?? 12345678);

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
    const __app = {
      P, L,
      get balls(){ return balls; },
      get counts(){ return counts; },
      get binVis(){ return binVis; },
      get binRows(){ return binRows; },
      get pile(){ return pile; },
      get pins(){ return pins; },
      get grid(){ return grid; },
      get parts(){ return parts; },
      get SPR(){ return SPR; },
      get bgLayer(){ return bgLayer; },
      get pinHit(){ return pinHit; },
      get binHit(){ return binHit; },
      get settledN(){ return settledN; },
      set settledN(v){ settledN = v; },
      get spawned(){ return spawned; },
      set spawned(v){ spawned = v; },
      get paused(){ return paused; },
      set paused(v){ paused = v; },
      get simClock(){ return simClock; },
      get lastFx(){ return lastFx; },
      set lastFx(v){ lastFx = v; },
      get pBudget(){ return pBudget; },
      set pBudget(v){ pBudget = v; },
      get spawnAcc(){ return spawnAcc; },
      set spawnAcc(v){ spawnAcc = v; },
      get QUAL(){ return QUAL; },
      set QUAL(v){ QUAL = v; },
      get SUB(){ return SUB; },
      spawnBall, spawnP, step, settle, resolve, layout, reset, structural,
      computeStats, pmfBinned, getPmf, laneX, binOfX, stackTop, rowHasSpace, rotateRows,
      readHash, writeHash, syncUI, applyTheme, frame, draw,
      normCdf, normPdf, erf, chiSquareP, ksNormal, kolmogorovQ,
    };
    __app.writeHashNow = typeof writeHashNow === 'function' ? writeHashNow : null;
    __app.syncZoom = typeof syncZoom === 'function' ? syncZoom : null;
    globalThis.__app = __app;
  `;

  vm.runInContext(match[1] + hooks, context, { filename: 'index.html' });

  return {
    app: context.__app,
    context,
    elements,
    copied,
    location,
    history,
  };
}

module.exports = { createHarness, makeRandom };
