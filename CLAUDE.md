# CLAUDE.md

Project-specific guidance for Claude Code when working in this repo.

## Product

Penumbra is a personal inventory app for a traditional film photographer who sells hand-printed darkroom enlargements in limited editions. Core domain entities (not yet modeled): negatives, enlargements, editions, customers, orders. Primarily for the author's own use; eventually openable to other analog photographers.

## Stack (decided — don't re-litigate)

- **Framework:** TanStack Start (Vite + Nitro). Chosen over Next.js for cleaner conventions, typed router, and integrated full-stack without magic.
- **ORM:** Drizzle + `better-sqlite3`. Local-first, one DB file per environment.
- **Styling:** Tailwind v4 + shadcn/ui. Components copied into `src/components/ui/`.
- **Animation:** `motion` (framer-motion).
- **Icons:** Lucide.
- **Fonts:** Instrument Serif (display), Geist (UI), Geist Mono (numbers).
- **Package manager:** pnpm.
- **Node:** ≥ 20.

## Design principles

- **B/W/red palette in OKLCH**, defined in `src/styles.css` and exposed to Tailwind through an `@theme` block. Use tokens (`bg-paper`, `text-ink`, `text-ink-soft`, `border-hairline`, `bg-safelight`, …) — never hex or named colors.
- **Safelight red is semantic, not decoration.** Reserve it for state signals (active route, sold out, destructive actions) and the brand monogram. Don't scatter it as a passive accent.
- **Typography hierarchy:** Instrument Serif italic for display + brand. Geist sans for UI, forms, nav. Geist Mono with `tabular-nums` for numbers, edition IDs, versions.
- **Editorial over utilitarian:** catalog-style `N° 01` kickers, small-caps labels via `.kicker`, hairline dividers instead of cards, subtle film-grain overlay.
- **Hairlines over shadows.** Prefer `border-hairline` over `shadow-*`.
- **Active nav state:** 2px safelight vertical bar on the left + `font-medium` on text. Don't use a red dot (tried, rejected as gimmicky).
- **Dark mode inverts `--paper` ↔ `--ink` and slightly lifts `--safelight`.** Test in both modes before declaring a visual change done.

## Layout

- **Desktop (≥ md):** left sidebar (240px, hairline right border) + content column. No footer — removed intentionally.
- **Mobile (< md):** slim top bar with brand + hamburger; sidebar content lives inside a shadcn Sheet drawer sliding from left.
- Content column `max-w-[1120px] mx-auto`, horizontal padding `px-6 md:px-10 lg:px-16`.
- Sidebar bottom row: `v0.1.0` (mono) · GitHub link · theme toggle.

## Component conventions

- `src/components/ui/` — shadcn primitives. Add via `pnpm dlx shadcn@latest add <name>`.
- `src/components/` — domain / layout components (Sidebar, MobileNav, PlaceholderPage, ThemeToggle).
- `src/routes/` — TanStack Router file-based routes.
- `src/routeTree.gen.ts` — auto-generated, never edit manually.
- **Brand wordmark** is a two-span monogram: oversized safelight italic "p" + "enumbra" in ink, with `<span className="sr-only">penumbra</span>` for screen readers.

## Data

- Schema: `src/db/schema.ts`.
- Client: `src/db/client.ts` (better-sqlite3 with WAL and foreign keys).
- Migrations: generated to `src/db/migrations/` via `pnpm db:generate`; apply with `pnpm db:migrate`.
- `penumbra.db` is gitignored.

## Verification workflow

- Run `pnpm build` for a compile / type / Tailwind check after non-trivial changes.
- **Do not auto-start `pnpm dev` or `./run.sh --dev`.** The user runs the dev server manually. A competing dev process grabs port 3000 and bumps the user's to another port, breaking their flow.
- Prefer static checks. When visual verification is needed, ask the user to reload their running dev server.
- `agent-browser` CLI is available for UI review when the user requests one and dev is up.

## Commit style

- **No `Co-Authored-By: Claude` trailer.** User has been explicit about this.
- One-line subjects in imperative mood; short body when context helps.
- Batch related changes; don't fragment small logical units into many commits.

## Lessons learned (don't redo)

- No `Header.tsx` — the Sidebar carries brand and nav.
- No `Footer.tsx` — version, GitHub link, and theme toggle live at sidebar bottom.
- No pulsing safelight dots — reads as a gimmicky live-indicator, not editorial.
- No text-shadow "misregistration" logo effect — reads as Y2K / bad print.
- No red dot for active nav — use the vertical safelight bar.
- No colored gradients in the type or glyphs beyond the two-token palette — muddies the editorial tone.

## Roadmap hints (not implemented)

- Domain model (Negative, Frame, Edition, Print, Customer, Order) — routes exist as placeholders, schemas not yet written.
- Command palette (⌘K) — design anticipates it, not built.
- Authentication / multi-user — not yet needed.

## Reference: forge

The `run.sh` pattern (sticky footer, phase animation, crash monitor, reload loop with key bindings) is adapted from the user's other repo at `/Users/xwinus/Desktop/Work/Cognera/Repo/forge`. Keep that in mind if the script needs evolution — the forge version is the ergonomic source of truth.
