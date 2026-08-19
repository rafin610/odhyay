# Premium UI Refresh Audit

## Verified baseline

Desktop review shows a thoughtful editorial foundation—large serif type, chapter labels, hairline rules, and the ODHYAY four-line mark—but primary actions currently feel flat and utilitarian. The public surface has generous whitespace but needs tighter action hierarchy, more purposeful framing around book covers, and a stronger dark editorial opening spread. The reader already has a restrained reading-room mood but the toolbar needs more tactile, marginalia-like controls. The guest admin state is clear but visually sparse.

## Design decision

The refresh will preserve the semantic theme system and move the interface toward a **minimal premium editorial** language: ink-like dark hero surfaces, warm-paper content fields, amethyst as a precise signal rather than a block color, tactile 44px minimum controls, and short transform/opacity-based micro-interactions. Mobile will use larger tap areas, compact action labels, balanced horizontal rhythm, and a persistent low-friction reader control bar.

## Guardrails

- Preserve chapter marks, section numbering, typography, routes, persisted data, and reader functionality.
- Retain light and dark theme support; use dark surfaces deliberately for editorial emphasis rather than removing warm-paper mode.
- Respect `prefers-reduced-motion`; keyboard focus remains distinct and visible.
