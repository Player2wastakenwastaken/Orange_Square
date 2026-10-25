# Orange Square

Playable browser game: dodge slate shards, collect warm sparks, stay orange.

## Play in Safari (no clone)

**Play now (works today):**  
https://htmlpreview.github.io/?https://github.com/Player2wastakenwastaken/Orange_Square/blob/cursor/orange-square-game-0e67/game/index.html

**Canonical GitHub Pages URL** (after Pages is enabled on this repo):  
https://player2wastakenwastaken.github.io/Orange_Square/game/

Repo path: [`game/index.html`](game/index.html)

### Enable GitHub Pages (repo owner, once)

1. Open **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` (or re-run the **Deploy GitHub Pages** workflow) — see [`.github/workflows/pages.yml`](.github/workflows/pages.yml)

Then open: https://player2wastakenwastaken.github.io/Orange_Square/game/

Local fallback:

```bash
python3 -m http.server 8080
# http://localhost:8080/game/
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
| `game/` | **Orange Square** game |
| `index.html` | Title screen (separate work, if present) |
