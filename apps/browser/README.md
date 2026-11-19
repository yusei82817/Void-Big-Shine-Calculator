# Void Browser

Integrated into Void Big Shine at `apps/browser/`.

Features: multi-provider search, Open-Meteo weather, YouTube search and embedded playback, HRTF spatial audio for shared-tab audio, utility calculator, and a sandboxed HTML/CSS/JavaScript playground.

Architecture:
- `core/`: UI-independent search and hybrid DOM engine modules
- `features/`: feature-specific UI behavior
- `index.html`, CSS, `app.js`: application interface
- `sw.js`: app-scoped offline cache

Browser Core remains independent from the interface for future reuse across Void apps.
