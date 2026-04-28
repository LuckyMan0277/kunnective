# Cup Drop - Web Prototype

A Phaser 3 web prototype of Cup Heroes' signature "Cup Drop" mechanic. Drop cups through pegs, bounce them off pins, and multiply your balls through slot multipliers.

## Play on iPhone (Quick Start)

### Method A: Vercel Deployment (Recommended - Fastest)

1. Push this repository to GitHub (already done)
2. Go to https://vercel.com/new and click "Import Git Repository"
3. Select this repository
4. **Set Root Directory to `web`** (important!)
5. Click Deploy → wait 1-2 minutes for URL
6. Open URL on iPhone Safari → tap Share → "Add to Home Screen"

### Method B: Local Development Server

Requires PC and iPhone on same Wi-Fi:

```bash
cd web
npm install
npm run dev
```

Open the `http://192.168.x.x:5173` address from your iPhone's Safari.

## Game Controls

- **Drag horizontally** to aim the dropper (green arrow at top)
- **Tap/Release** to drop a cup
- Cups bounce through pegs and drop into slots
- Earn balls = 100 × slot multiplier (2, 3, 5, or 10)
- Complete 3 drops per round → see your score → restart

## Tech Stack

- **Phaser 3.80+** – Game framework with Matter.js physics
- **Vite 5** – Lightning-fast build tool
- **TypeScript** – Type-safe development
- **Mobile-optimized** – Viewport scaling, touch-action none, PWA manifest

## Project Structure

```
web/
├── src/
│   ├── main.ts          # Phaser config & game instance
│   └── scenes/
│       └── GameScene.ts # All game logic (pins, cups, slots, HUD)
├── index.html           # Entry point (mobile viewport meta tags)
├── vite.config.ts       # Build configuration
├── tsconfig.json        # TypeScript strict mode
├── package.json         # Dependencies (Phaser, Vite, TypeScript)
├── vercel.json          # Vercel deployment config
└── README.md            # This file
```

## Local Development

```bash
cd web
npm install
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build locally
```

## Next Steps

- Add ball counter persistence / leaderboard
- Implement multiple rounds with difficulty scaling
- Add visual effects (particle burst on collision, score popups)
- Sound effects and background music
- Animation polish (cup rotation, bounce tweens)
- Haptic feedback on mobile (vibration)
