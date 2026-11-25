'use strict';
// Runs the inline <script> of index.html in a Node vm context with small DOM and canvas stubs.
// Copy this file to tests/harness.js. Add the element ids of the page to ELEMENT_IDS, and
// the names the tests need to EXPOSED. Unknown properties on the stubs throw, so a stub that is
// missing shows as an error and not as a silent no-op.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const HTML_FILE = path.resolve(__dirname, '..', 'index.html');
const ELEMENT_IDS = ['stage'];
const EXPOSED = ['state'];

function strict(name, target) {
  return new Proxy(target, {
    get(t, key) {
      if (key in t || typeof key === 'symbol' || key === 'then') return t[key];
      throw new Error(`stub ${name} has no property ${String(key)}: add it to the harness`);
    },
  });
}

function makeContext2D() {
  const noop = () => {};
  const methods = ['setTransform', 'resetTransform', 'clearRect', 'fillRect', 'strokeRect', 'beginPath',
    'closePath', 'moveTo', 'lineTo', 'arc', 'quadraticCurveTo', 'bezierCurveTo', 'fill', 'stroke', 'save',
    'restore', 'translate', 'scale', 'rotate', 'setLineDash', 'clip', 'drawImage', 'fillText'];
  const ctx = Object.fromEntries(methods.map((m) => [m, noop]));
  Object.assign(ctx, {
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    measureText: () => ({ width: 10 }),
    globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '', strokeStyle: '',
    lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', font: '', textAlign: 'left',
  });
  return strict('CanvasRenderingContext2D', ctx);
}

function makeElement(id) {
  const listeners = {};
  const classes = new Set();
  return strict(`#${id}`, {
    id, value: '', checked: false, disabled: false, textContent: '', innerHTML: '', title: '',
    width: 800, height: 600, clientWidth: 800, clientHeight: 600, dataset: {},
    style: { setProperty() {} },
    classList: {
      add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c),
      toggle: (c, on = !classes.has(c)) => (on ? classes.add(c) : classes.delete(c), on),
    },
    addEventListener: (type, fn) => (listeners[type] ||= []).push(fn),
    dispatch: (type, event = {}) => (listeners[type] || []).forEach((fn) => fn({ target: null, preventDefault() {}, ...event })),
    getContext: () => makeContext2D(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    querySelectorAll: () => [],
    appendChild() {},
  });
}

function extractScript(html) {
  const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
  if (blocks.length !== 1) throw new Error(`expected 1 inline script in ${HTML_FILE}, found ${blocks.length}`);
  return blocks[0][1];
}

/** Evaluates the page script and returns the exposed names, the elements and a frame driver. */
function createHarness({ hash = '' } = {}) {
  const elements = Object.fromEntries(ELEMENT_IDS.map((id) => [id, makeElement(id)]));
  let frameCallback = null;
  const document = {
    getElementById: (id) => elements[id] ?? null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
    createElement: (tag) => makeElement(tag),
    body: makeElement('body'),
  };
  const context = {
    document, console, Math, Date, JSON, Number, String, Array, Object, Map, Set, Error,
    location: { hash, href: `file:///index.html${hash}` },
    history: { replaceState() {} },
    devicePixelRatio: 1,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    requestAnimationFrame: (fn) => { frameCallback = fn; return 1; },
    cancelAnimationFrame: () => { frameCallback = null; },
    setTimeout, clearTimeout,
    ResizeObserver: class { observe() {} disconnect() {} },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(extractScript(fs.readFileSync(HTML_FILE, 'utf8')), context, { filename: 'index.html' });
  const app = vm.runInContext(`({ ${EXPOSED.join(', ')} })`, context);
  // Runs one animation frame at the timestamp the test chooses.
  const frame = (timestampMs) => { const fn = frameCallback; frameCallback = null; if (fn) fn(timestampMs); };
  return { app, elements, frame, context };
}

module.exports = { createHarness };
