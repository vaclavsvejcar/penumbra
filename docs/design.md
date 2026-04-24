# Design

Penumbra's visual language is **editorial print UI** — every decision borrows from the grammar of printed matter. Type specimens, exhibition labels, museum wall text, photobook colophons, darkroom sleeves. Not SaaS dashboards. Not admin consoles. The interface should read like a well-set page.

The darkroom context (paper, ink, safelight, hairlines) is both the domain and the aesthetic metaphor — they reinforce each other on purpose.

---

## Palette: paper + ink + safelight

Tokens live in `src/styles.css` as OKLCH values and are exposed to Tailwind through an `@theme` block. Use the semantic names — **never hex or named colors**.

### Ink scale — foreground type and glyphs

| Token        | Light                       | Dark                        | Use                                   |
| ------------ | --------------------------- | --------------------------- | ------------------------------------- |
| `ink`        | `oklch(0.18 0.005 60)`      | `oklch(0.97 0.003 60)`      | primary text, active labels, headings |
| `ink-soft`   | `oklch(0.38 0.005 60)`      | `oklch(0.72 0.005 60)`      | body prose, secondary labels          |
| `ink-muted`  | `oklch(0.55 0.005 60)`      | `oklch(0.55 0.005 60)`      | metadata, kickers, inactive items     |

### Paper scale — surfaces

| Token           | Light                  | Dark                   | Use                              |
| --------------- | ---------------------- | ---------------------- | -------------------------------- |
| `paper`         | `oklch(0.99 0.002 60)` | `oklch(0.13 0.005 60)` | page background                  |
| `paper-raised`  | `oklch(1 0 0)`         | `oklch(0.20 0.005 60)` | dialogs, popovers, command palette |

Dark mode **inverts `paper` ↔ `ink`**. That is not a color tweak — it is the defining gesture: dark mode is *a black page with white ink*, a second conceptual bow to the negative and the darkroom print.

### Hairlines — depth

| Token              | Light                          | Dark                    | Use                            |
| ------------------ | ------------------------------ | ----------------------- | ------------------------------ |
| `hairline`         | `oklch(0.18 0.005 60 / 0.08)`  | `oklch(1 0 0 / 0.10)`   | page/section dividers, borders |
| `hairline-strong`  | `oklch(0.18 0.005 60 / 0.16)`  | `oklch(1 0 0 / 0.18)`   | raised surfaces, focused inputs |

### Safelight — the single editorial accent

| Token               | Light / Dark                    | Use                                      |
| ------------------- | ------------------------------- | ---------------------------------------- |
| `safelight`         | `oklch(0.58 0.22 27)` / `0.65`  | brand, active nav bar, commit action     |
| `safelight-soft`    | same / `0.18` alpha lifted      | selection highlight, subtle hero wash    |
| `safelight-strong`  | `0.50` / `0.72`                 | hover / pressed safelight                |

Safelight in dark mode is **slightly lifted** (higher lightness) to compensate for perceptual dimming on dark backgrounds.

---

## Typography

Three typefaces, three roles. Never mix them beyond their role.

| Family                        | Where                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| **Instrument Serif italic**   | display (hero `penumbra` wordmark, page titles, editorial placeholders like the search box hint)   |
| **Geist** (sans)              | everything UI: nav, forms, buttons, body text                                                      |
| **Geist Mono** + `tabular-nums` | numbers, edition IDs, versions, kbd shortcuts, identifier fields — anything that needs to align   |

### The `.kicker` class (`src/styles.css`)

Small-caps uppercase label, `font-size: 0.7rem`, `letter-spacing: 0.18em`, `color: var(--ink-muted)`. Use above section titles, above stat labels, as category markers, as prefix to catalog numbers. Editorial equivalent of a "kicker" or "lede" in journalism.

### Catalog numbering

Sections are numbered catalog-style in the kicker:

```
N° 01 · Dashboard
N° 02 · Colophon
N° 00 · About
```

Mono numeral, middle dot, small-caps section name.

---

## Structure: hairlines over shadows

Depth comes from **1-pixel rules**, not elevation. Never reach for `shadow-*`.

- Sections separate with `border-hairline border-t` or `border-b`, not card chrome.
- Dialogs and popovers use `border-hairline-strong border` — one tier up from body hairlines, still no shadow.
- Rounded corners are **conservative** (`rounded-sm` ≈ 4px). No `rounded-2xl`, no `rounded-full` pills except for genuine icons / avatars.
- Never wrap content in a styled card. If you feel you need a card, reach for a `border-hairline border-t` rule and a kicker.

---

## Safelight red: what it IS and ISN'T

Red is the **only non-B/W color** in the palette, and it is guarded.

### Reserved uses (the whole list)

1. The **brand monogram** — oversized italic "p" in `penumbra`.
2. The **active-nav signal** — a 2px vertical safelight bar at the left edge of the active sidebar item (plus `font-medium` on the label).
3. The **primary commit action** in forms (Save, Add) — via `variant="safelight"` on Button.
4. **Sold-out / archived state** indicators on editions and prints.
5. Subtle ambient **hero wash** via `safelight-soft` (the blurred radial behind the Dashboard brand).

### Never

- As a decorative accent, border, or divider.
- As a badge / chip background for neutral info.
- As a hover color on random elements.
- On destructive actions — those use **`variant="destructive-outline"`** (red border + red text on transparent bg, paired with confirmation dialog).
- As a colored gradient in type, glyphs, or icons.
- As a pulsing dot ("live indicator"). Tried, rejected — reads as gimmicky.
- As a red dot for active nav. Tried, rejected — use the vertical bar.

---

## Spacing & rhythm

- Content column `max-w-[1120px]`, horizontal padding `px-6 md:px-10 lg:px-16`.
- Page sections have generous vertical breathing (`py-16 sm:py-24`). Editorial prefers whitespace over density.
- Within a section, keep vertical gaps on **a single rhythm** (typically `space-y-3` = 12px). Inconsistent internal gaps (e.g., `pt-5` header above + `space-y-3` body) break the rhythm.
- Kicker → first content gap can differ from internal rhythm (section-level vs. body-level).
- Sidebar uniform padding: everything aligns on a 24px left column (brand, search box, nav text, footer trigger).

---

## Component patterns

### Sidebar nav item

- `text-ink-soft` inactive, `text-ink font-medium` active.
- Active: **2px `safelight` vertical bar** at left of the row, from ~28% to 72% of row height.
- Hover: `bg-muted/50` with text color lift to `text-ink`.
- Optional right-aligned mono count in `text-ink-muted` + `tabular-nums` for entity sections.

### Stat card (Dashboard)

- Three-column grid with `border-hairline border-t` on the container and `border-l` between columns.
- Kicker label + large `font-mono tabular-nums` value.
- When data doesn't exist yet, show `—` (em-dash). Never `0` for a non-existent table — `—` means "not applicable", `0` means "exists and is empty".

### Kicker + content

```
N° 02 · Colophon       ← kicker
─────────────────      ← border-hairline border-t
[content on uniform vertical rhythm]
```

### Segmented control

For mutually exclusive single-select (e.g., Appearance toggle):

- Outer `border-hairline border rounded-sm overflow-hidden inline-flex`.
- Vertical hairline dividers between segments (`[&>button+button]:border-l border-hairline`).
- Active segment: `bg-ink/10 text-ink` — 10% ink state layer overlay.
- Inactive: `text-ink-muted`, hover `bg-ink/5 text-ink`.
- `role="radiogroup"` with `role="radio"` + `aria-checked`.

Why `bg-ink/10` and not `bg-muted`: `bg-muted` in dark mode is `oklch(0.22)` — only 0.02 lightness apart from `paper-raised` (0.20). The active state is essentially invisible. `bg-ink/10` works as a **state layer** (Material 3 pattern) that flips naturally with the mode: 10% of the opposite-of-background color, always visible.

### Chip (for non-grouped picks)

Standalone pill-like buttons, used outside segmented-control contexts. `rounded-sm px-2.5 py-1 text-sm`, hairline border optional depending on context.

### Dialog / modal

- Radix `Dialog` primitives directly (not shadcn's wrapper).
- `bg-paper-raised border-hairline-strong border rounded-md` — no shadow.
- Overlay: `bg-ink/40 backdrop-blur-[1px]`.
- Kicker + X close button in a single `flex items-center justify-between` header row (don't absolute-position the X; it floats against the kicker baseline).
- Content below a `border-hairline border-t` separator, padded `pt-5`.

### Command palette

- `/cmd` scope shows action-kind items (separate from navigation / entity types).
- Commands with multiple sub-options use **drill-in**: parent Enter → sub-list of options, breadcrumb chip `[CMD] › [Parent]` appears in prompt, Backspace-on-empty exits.
- Parent commands show a trailing `›` glyph in the list as a sub-option cue — same glyph as the prompt breadcrumb, for visual consistency.

### Film-grain overlay

A subtle fractal-noise SVG at `opacity: 0.035` (light) / `0.06` (dark) painted over the body via `body::before`. Gives the whole UI the faint texture of ink on paper. Do not remove, do not intensify.

---

## State layers (hover / active bg)

When an element needs a bg change for state (hover, active, selected), prefer **ink-opacity overlays** over `bg-muted`:

- Hover: `bg-ink/5`
- Active / selected: `bg-ink/10` to `bg-ink/15`
- Pressed: `bg-ink/20`

These invert automatically between modes and produce visible contrast against any surface. `bg-muted` only reads in light mode; it fails in dark.

---

## Motion

Motion is for **entrance and state commits**, not decoration. Uses `motion/react` (framer-motion).

- Page entrance: a subtle `rise-in` (opacity 0→1, y: 8→0, 700ms `cubic-bezier(0.16, 1, 0.3, 1)`).
- Stagger children with `staggerChildren: 0.09` + `delayChildren: 0.1`.
- Don't animate color changes. Don't bounce. No "parallax".

---

## What we don't do

Explicit list of rejected patterns. If you feel pulled toward one of these, it's a signal something is wrong with the problem framing, not that the rule needs an exception.

- **No cards** (`Card`, `shadow-*`, rounded-lg containers with bg). Use hairlines + kicker.
- **No shadows.** `shadow-none` is the default.
- **No gradients** in type, icons, or glyphs beyond the two-token palette.
- **No pulsing dots** / "live" indicators. Reads gimmicky.
- **No text-shadow** / "misregistration" logo effects. Reads Y2K.
- **No red dot** for active states. Use the vertical safelight bar for nav, the `bg-ink/10` overlay for controls.
- **No rounded-full pills** for neutral info.
- **No brand colors** outside paper / ink / safelight. The palette is intentionally three tones.
- **No generic Tailwind palette** (`text-gray-600`, `bg-slate-100`, etc.). Only semantic tokens.
- **No colored form states** (red borders for errors, green for success). Use `variant="destructive-outline"` / `safelight` and let the word do the work.
- **No Header.tsx / Footer.tsx** components. Sidebar carries brand and nav; About dialog carries meta (version, source, appearance).

---

## Verifying in both modes

Every visual change must be **tested in light AND dark** before it counts as done. Dark mode is not an automatic transform — some patterns (e.g., `bg-muted` for active state) degrade invisibly. Expect to iterate.

---

## References

- Tokens: `src/styles.css`
- Component examples: `src/components/`, `src/components/ui/`
- CLAUDE.md — scoped design rules for AI agents (shorter, less expository than this doc)
