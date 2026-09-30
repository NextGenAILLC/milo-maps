# Milo Maps design system

Source of truth: Stitch `amber_trail/DESIGN.md` in `NextGenAILLC/stitch_amber_trails`.

## Creative north star
"The Sun-Drenched Sunroom" — organic editorialism. Warm, reliable, like a conversation over a garden fence. No clinical high-tech look.

## Colors (tonal landscape)
- Base: `surface` #fff8f6
- Secondary sections: `surface-container-low` #fff1ed
- Cards: `surface-container` #ffe9e3
- Highlighted: `surface-container-highest` #ffdbd0
- Primary CTA gradient: `primary` #904e00 → `primary-container` #ffb06b at 45°
- Nature/safety success: `tertiary` #386b02
- Text: `on-surface` #4f271a (never pure black), muted `on-surface-variant` #845343

## The no-line rule
Borders are prohibited for sectioning. Define space with background tone shifts. Ghost border fallback only if accessibility requires: `outline-variant` #e1a491 at 15% opacity.

## Typography
- Display & headlines: Plus Jakarta Sans — `display-lg` 3.5rem, tight letter-spacing -0.02em
- Body & labels: Be Vietnam Pro — `body-md` 0.875rem
- High-contrast scale jump between headlines and body

## Elevation
- Layering: place a white card on a `surface-container-low` background for paper-like lift
- Ambient shadows only: `0 20px 40px rgba(79, 39, 26, 0.06)`
- No standard Material elevated shadows

## Components
- Primary button: gradient primary→primary-container, radius full, no border
- Cards: `roundness-lg` (2rem), no 1px dividers between list items — use spacing or tone shifts
- Inputs: `surface-container-low` fill; active shifts to `surface-container-highest` + 2px ghost border in primary
- Signature: Walk-Card — asymmetrical dog profile, photo overlaps top-left edge of card

## Do's and don'ts
- Do use intentional asymmetry and generous white space
- Don't use pure black text or zero-radius corners
