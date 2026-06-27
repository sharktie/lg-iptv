# Repository Guide

## Project Shape
- This is a webOS IPTV app for LG TVs.
- Runtime entry point is `index.html`, which loads built assets from `dist/`.
- Source code lives in `js/` and `api/`; static UI and styles live in `pages/` and `assets/`.
- `config/config.js` seeds `window.IPTV_CONFIG` for local configuration.
- `appinfo.json` and `manifest.json` define the webOS packaging metadata.

## Build And Packaging
- Install dependencies with `npm ci`.
- Build transpiled browser code with `npm run build`.
- The build uses Babel to emit `dist/js/` and `dist/api/`.
- `npm run clean` is Windows-specific as written (`rmdir /s /q dist`); on macOS or Linux use `rm -rf dist` if you need a manual clean.
- There is no dedicated test or lint script in `package.json`; use the build as the main verification step.

## Editing Rules
- Treat `js/` and `api/` as the source of truth for runtime logic.
- If you change source files that are consumed from `dist/`, rebuild so the checked-in output stays in sync.
- Do not introduce frameworks or module systems unless the task explicitly asks for them; the app is plain browser JavaScript with shared globals.
- Keep webOS compatibility in mind. Babel targets Chrome 38, so avoid relying on unsupported runtime behavior without confirming transpilation covers it.
- Preserve the remote-first UI patterns and direct DOM event handling that the app already uses.

## Practical Checks
- For playback or navigation changes, validate the relevant page path in `pages/` plus the corresponding script in `js/`.
- For packaging or release changes, check that `appinfo.json`, `manifest.json`, and `webosbrew/index.json` still agree on the app version and install metadata.
- Prefer small, focused edits and avoid reformatting unrelated files.