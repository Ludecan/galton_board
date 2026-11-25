# Testing a no-build web page

## The headless harness

A page without a build step has no modules to import. To test it in Node:

1. Read `index.html` and extract the inline `<script>`.
2. Run that code in `node:vm` with a context that holds small stubs for `document`, `window`, canvas contexts, `requestAnimationFrame` and `location`.
3. Get the app functions and state out of the context, and test them with `node:test` and `node:assert/strict`.

[The harness template](../assets/harness.js) does steps 1 and 2. Copy it to `tests/harness.js` and add the element ids that the page looks up. Tests then look like this:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./harness');

test('closing angle of a closed curve', () => {
  const { app } = createHarness();
  assert.equal(app.lapsToClose(96, 36), 3);
});
```

Run all tests with `node --test "tests/*.test.js"`. Add a `package.json` with only a `scripts` block (`"test": "node --test tests/*.test.js"`), so `npm test` works. It has no dependencies.

Rules for the harness:

- The stubs must be small and dumb: they record calls or do nothing. Put no app logic in them.
- A stub that the code calls but the harness does not have must fail loudly. A `Proxy` that returns a no-op for every unknown property hides typos in the app.
- Give the context only what the page needs. Fake time: `requestAnimationFrame` stores the callback, and the test calls it with a timestamp it chooses.
- Expose app internals to the tests by name in the harness (for example `vm.runInContext('({ state, step, parseHash })', ctx)`), not by adding test hooks to the page.
- When you add a control to the page, add its id to the harness and add a test for its behavior.

## Other checks

- Parse check of the inline script: `node --check <extracted.js>`. The harness also fails on a syntax error.
- Open the page in a browser before you finish UI work: `python3 -m http.server 8000`, then `http://localhost:8000/`. Look at the console. If you cannot open a browser, say so to the user: the headless tests do not check layout, CSS or real rendering.
- A page that uses `fetch`, ES modules or `localStorage` can fail from `file://`. Test it from a local server.
