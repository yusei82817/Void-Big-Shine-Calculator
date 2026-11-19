# Void Browser Core

UI-independent modules for the Void Browser app.

- `search.js` exposes `globalThis.VoidSearch`: provider selection, URL validation, and query resolution.
- `engine.js` exposes `globalThis.VoidEngine`: hybrid HTML/CSS/JavaScript compilation and markup diagnostics.

These modules do not query page elements or depend on the Browser UI. Feature behavior lives in `../features/`; the interface and event wiring live in `../index.html` and `../app.js`.

The preview uses the browser's native DOM implementation inside a sandboxed iframe. It is an experimental hybrid engine, not a replacement for Chromium or WebKit.
