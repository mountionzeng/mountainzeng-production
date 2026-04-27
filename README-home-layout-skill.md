# Home Layout Tuner Skill

This repository now includes a reusable layout-tuning skill:

- `skills/home-layout-tuner/SKILL.md`

Use it when you need fast visual iteration on homepage module positions and scale, then a clean final code state without debug UI.

## What This Skill Solves

- Avoid repeated hard-coded edits for every position tweak.
- Tune multiple modules in one pass with sliders.
- Freeze final values safely.
- Remove all temporary tuning code after confirmation.

## Recommended Workflow

1. Add temporary local-only slider panel.
2. Tune module X/Y and scale values in browser.
3. Record final values.
4. Replace dynamic transforms with static values.
5. Remove all tuning state/panel code.
6. Build and verify locally.
7. Push to GitHub when approved.

## Prompt Template (Copy/Paste)

```text
Use the home-layout-tuner workflow.
Goal: tune homepage layout quickly, then remove all debug code.
Steps:
1) Add local-only slider controls for these modules: [list modules]
2) Bind each module to X/Y; add scale for title image
3) Tell me where to read the final values
4) After I confirm values, freeze them into static transforms
5) Remove slider panel and all debug state/helpers
6) Run local build and restart preview
Constraints:
- Only minimal changes
- Keep rollback-friendly edits
- Do not change unrelated sections
```

## Module Checklist You Can Reuse

- Main container
- Brand mark
- Title image container
- Title image scale
- Title-side icon cluster
- Tabs and card container
- Dice block
- Bottom decoration

## Current Frozen Values In This Project

These are the current values retained in `client/src/pages/Home.tsx`:

- Main container: `translate(0px, 44px)`
- Brand mark: `translate(7px, 0px)`
- Title container: `translate(-50%, -50%) translate(-105px, -212px)`
- Title scale: `scale(1.13)`
- Title-side icons: `translate(162px, -38px)`
- Tabs/card wrapper: `translate(6px, 0px)`
- Dice wrapper: `translate(76px, 29px)`

## Local Verification Commands

```bash
npx -y pnpm@10.4.1 run build
PORT=4010 NODE_ENV=production node dist/index.js
curl -I http://127.0.0.1:4010
```

## GitHub Sync

```bash
git add skills/home-layout-tuner/SKILL.md README-home-layout-skill.md
git commit -m "docs: add reusable home layout tuner skill"
git push origin main
```

