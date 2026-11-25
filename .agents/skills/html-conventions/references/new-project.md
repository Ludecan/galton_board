# New no-build web project

1. Ask the user if the app must stay one file. If yes, use this layout:

   ```
   index.html        the whole app: <style>, markup, one <script>
   tests/harness.js  copy of the harness template
   tests/*.test.js   node:test files
   package.json      only {"private": true, "scripts": {"test": "node --test tests/*.test.js"}}
   README.md
   .gitignore        node_modules/
   ```

   If not, put the styles in `style.css`, the DOM code in `app.js`, and the pure logic in modules that do not touch the DOM (for example `logic.js`). Load the script with `<script type="module" src="app.js">`, and add `"type": "module"` to `package.json`. Tests then `import` the logic modules directly, with no harness.
2. Start `index.html` from this shell:

   ```html
   <!doctype html>
   <html lang="en">
   <head>
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1">
   <title>App name</title>
   <style>
     /* tokens, layout, components */
   </style>
   </head>
   <body>
   <main id="app"></main>
   <script>
   'use strict';
   // ---- state ----
   // ---- setup ----
   // ---- logic ----
   // ---- rendering ----
   // ---- UI ----
   // ---- boot ----
   </script>
   </body>
   </html>
   ```

3. Copy [the harness](../assets/harness.js) to `tests/harness.js`, and write the first test as soon as there is logic to test.
4. To publish, GitHub Pages serves `index.html` from the root of `main` with no build.
5. Create `AGENTS.md` with the `project-instructions` skill.
