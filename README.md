# Orange Square

Playable browser game: dodge slate shards, collect warm sparks, stay orange.

## Play (no clone)

**Safari-friendly URL (GitHub Pages):**  
https://player2wastakenwastaken.github.io/Orange_Square/game/

Same path in the repo: [`game/index.html`](game/index.html)

If Pages is not live yet, open `game/index.html` locally, or serve the repo root:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/game/
```

## How to play

- **Goal:** Survive as the orange square. Collect sparks (+10). Avoid drifting slate shards.
- **Desktop Safari:** Arrow keys or WASD; click/drag on the field to steer. Enter/Space to start.
- **iOS / mobile Safari:** Tap **Play**, then drag on the field (or use the on-screen pad).

## Safari notes

- Vanilla HTML/CSS/Canvas 2D + classic DOM events (no Chrome-only APIs).
- Touch uses `touch-*` and Pointer Events with `touch-action: none` and `passive: false` where `preventDefault` is needed.
- Layout uses `dvh`, `-webkit-fill-available`, and `env(safe-area-inset-*)` for notched phones.
- High score uses `localStorage` (may be unavailable in Private Browsing).

## Project layout

| Path | Purpose |
|------|---------|
| `game/` | **Orange Square** game (this PR) |
| `index.html` | Title screen (separate work, if present) |
