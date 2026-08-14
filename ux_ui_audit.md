# ODHYAY UX/UI upgrade audit

## Baseline findings — 2026-08-13

The Quiet Editorial foundation is consistent: the charcoal reading-room palette, warm display typography, chapter-mark motif, and restrained rules communicate the intended calm editorial character. The upgrade should preserve those core cues rather than replace the design language.

The catalogue needs a stronger small-collection composition. With one or only a few books, the library leaves large inactive areas and loud user-uploaded covers can overpower the brand. Book art should sit in a more restrained, consistent editorial frame, while sparse shelves should remain intentional and useful.

The reading path needs special attention. Navigation must become easier to reach on small screens, reader controls must clearly surface document state and recovery actions, and non-essential motion must respect `prefers-reduced-motion`. The responsive audit will also check the public routes independently from authenticated administrator views.

## Upgrade objectives

- Preserve Quiet Editorial typography, dark surfaces, warm ivory text, and amethyst as a selective action/state cue.
- Improve mobile navigation, touch targets, layout density, empty/loading/error feedback, and keyboard focus visibility.
- Compose limited catalogues as curated editorial shelves instead of a sparse generic grid.
- Make the reader more interruption-free with clear progress, theme, zoom, navigation, and document-availability feedback.
- Use brief transform/opacity motion only, with a reduced-motion fallback.

## Verification results

- Desktop and mobile public routes now use a consistent sticky navigation pattern, visible keyboard focus treatment, touch-sized actions, responsive search/filter overflow, and editorial framing for uploaded covers.
- The administrator workspace now has a mobile navigation strip, mobile book-management cards, and responsive access records instead of forcing narrow-screen users through wide data tables.
- The focused reader was verified against the stored `AI for Student` PDF. The PDF canvas completed rendering after its explicit loading state, while the visible toolbar exposed page navigation, theme selection, bookmark, zoom, and fullscreen controls.
- The authenticated administrator book workspace was also verified after the responsive refactor: persistent book records, the add-book action, navigation, protected-session indicator, and per-book management control all rendered correctly.
- Automated validation passed: 23 test files and 38 tests, TypeScript validation, and the production build.
