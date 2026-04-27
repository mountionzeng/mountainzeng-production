---
name: home-layout-tuner
description: Tune homepage module layout with temporary slider controls, then freeze final position and scale values and remove debug UI. Use when iterating fast on visual placement for hero title, brand mark, icon cluster, tab/card block, dice block, and other homepage modules in React + Tailwind pages.
---

# Home Layout Tuner

## Goal
Tune homepage layout in real time without repeated hard-coded edits, then keep only final static values.

## Workflow
1. Identify all modules to tune and map each one to a transform target node.
2. Add a local-only debug panel with X/Y sliders per module and optional scale slider.
3. Bind slider state to inline `transform` styles on target nodes.
4. Tune values in browser and record final numbers.
5. Replace dynamic bindings with fixed static values.
6. Remove debug panel and all debug-only state/helpers.
7. Build and verify locally.

## Local-Only Guard
Use this guard so controls only appear in local development:

```ts
const showLayoutControls =
  import.meta.env.DEV ||
  (typeof window !== "undefined" && window.location.hostname === "localhost");
```

## Suggested State Shape
Use one object to keep all module values together.

```ts
type HomeLayoutDebugState = {
  mainX: number;
  mainY: number;
  brandX: number;
  brandY: number;
  titleX: number;
  titleY: number;
  titleScale: number;
  iconsX: number;
  iconsY: number;
  tabsX: number;
  tabsY: number;
  diceX: number;
  diceY: number;
  bottomX: number;
  bottomY: number;
};
```

## Binding Pattern
Apply transforms directly where movement is needed:

```tsx
style={{ transform: `translate(${layout.tabsX}px, ${layout.tabsY}px)` }}
style={{ transform: `scale(${layout.titleScale})`, transformOrigin: "center" }}
```

## Freeze Pattern
After values are confirmed, replace dynamic bindings with static strings:

```tsx
style={{ transform: "translate(6px, 0px)" }}
style={{ transform: "scale(1.13)", transformOrigin: "center" }}
```

Then delete all of:
- Debug type definitions
- Default debug object
- `showLayoutControls` guard
- Debug state (`useState`)
- `update/reset` handlers
- Slider panel JSX

## Validation
Run:

```bash
npx -y pnpm@10.4.1 run build
PORT=4010 NODE_ENV=production node dist/index.js
curl -I http://127.0.0.1:4010
```

Expect:
- Build succeeds.
- Local server returns HTTP 200.
- No debug panel in final version.

## Fast Cleanup Check
Use ripgrep to confirm debug code is gone:

```bash
rg -n "showLayoutControls|HomeLayoutDebugState|updateLayout|resetLayout|layout panel" client/src/pages/Home.tsx
```

