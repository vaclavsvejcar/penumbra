# CLAUDE.md

Project-specific guidance for Claude Code when working in this repo.

## Product

Penumbra is a personal inventory app for a traditional film photographer who sells hand-printed darkroom enlargements in limited editions. Modeled so far: customers and supporting lookup tables (customer types, manufacturers, film stocks, paper stocks, developers). Still to come: negatives, enlargements, editions, prints, orders, storage. Primarily for the author's own use; eventually openable to other analog photographers.

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
- **Safelight red is the brand accent, not decoration.** Reserved for: the brand monogram, active state signals (active nav, sold out), and the primary commit action in forms (Save/Add, via `variant="safelight"`). Don't scatter it as a passive accent.
- **Destructive actions use `variant="destructive-outline"`** — red border + red text on transparent background, never a solid fill. Structural outline-vs-fill is the signal that distinguishes "commit" (safelight fill) from "dangerous" (red outline). Always pair with a confirmation step.
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

- `src/components/ui/` — shadcn primitives (style `new-york`, base color zinc). Add via `pnpm dlx shadcn@latest add <name>`.
- `src/components/` — domain / layout components (Sidebar, MobileNav, PlaceholderPage, ThemeToggle, SearchPalette, EnvBadge, …).
- `src/routes/` — TanStack Router file-based routes, dot-nested (e.g. `customers.$id.tsx` is the layout for `customers.$id.index.tsx` / `.notes.tsx` / `.orders.tsx`; `lookups.tsx` is the layout for `lookups.*`).
- `src/routeTree.gen.ts` — auto-generated, never edit manually.
- Path aliases: `#/*` and `@/*` both resolve to `./src/*` (see `tsconfig.json` + `package.json#imports`). Prefer `#/` — it's what the existing code uses.
- **Brand wordmark** is a two-span monogram: oversized safelight italic "p" + "enumbra" in ink, with `<span className="sr-only">penumbra</span>` for screen readers.

## Server functions

- `src/server/` holds typed RPC handlers built with `createServerFn` from `@tanstack/react-start`. Routes call these directly; there are no REST endpoints.
- Validate inputs inside the handler — throw plain `Error`s with human messages; callers surface them. See `src/server/manufacturers.ts` for the canonical shape.
- Every new lookup table also needs an entry in `src/server/search.ts`, which builds the palette index (`SearchItem[]`). Missing it = the entity is invisible to ⌘K.

## Lookup tables (reusable admin pattern)

- All lookup admins (manufacturers, film/paper stocks, developers, customer types) share one pattern. Don't hand-roll a new one.
- UI: `src/components/lookup/` — `LookupHeader`, `LookupList`, `LookupSearch`, `LookupFormActions`, `LookupRowActions`, `FieldWrap`, `focusSearch`.
- State: `useLookupAdmin` manages creating/editing/busy/error/query + archive/unarchive callbacks. Default filter: empty query hides archived; non-empty searches across everything including archived.
- Soft-delete: every lookup row has `archivedAt` — archive, don't delete. Foreign keys use `onDelete: 'restrict'`.
- Sort: `sortOrder` (int, default 0), then `label`.

## Data

- Schema: `src/db/schema.ts`. Convention: every table has `createdAt` + `updatedAt` (unix timestamps); lookup tables add `archivedAt`, `sortOrder`, and a `(manufacturerId, code)` unique index where applicable.
- Client: `src/db/client.ts` — better-sqlite3 with WAL + `foreign_keys = ON`. Exports `db` and `DB` type.
- DB location: `src/db/paths.ts` — dev uses `./penumbra.db` in the repo root; production writes to the OS data dir (`~/Library/Application Support/penumbra/` on macOS, `%LOCALAPPDATA%\penumbra\` on Windows, `$XDG_DATA_HOME/penumbra/` on Linux). `DATABASE_URL` overrides both. Drizzle Kit uses the same resolver.
- Migrations: generate to `src/db/migrations/` via `pnpm db:generate`; apply with `pnpm db:migrate`. `penumbra.db` is gitignored.

## Verification workflow

- Run `pnpm build` for a compile / type / Tailwind check after non-trivial changes (TS is `strict` + `noUnusedLocals` + `noUnusedParameters` — the build will fail on dead bindings).
- `pnpm test` runs Vitest (jsdom). No lint step is configured.
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

- Remaining domain model (Negative, Frame, Edition, Print, Order, Storage) — routes exist as placeholders, schemas not yet written.
- Authentication / multi-user — not yet needed.

## Reference: forge

The `run.sh` pattern (sticky footer, phase animation, crash monitor, reload loop with key bindings) is adapted from the user's other repo at `/Users/xwinus/Desktop/Work/Cognera/Repo/forge`. Keep that in mind if the script needs evolution — the forge version is the ergonomic source of truth.
