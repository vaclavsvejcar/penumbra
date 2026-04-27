# penumbra

Inventory of negatives, darkroom enlargements, and limited editions for film photographers.

## Stack

- [TanStack Start](https://tanstack.com/start) — React full-stack framework (Vite + Nitro)
- [TanStack Router](https://tanstack.com/router) — typed, file-based routing
- [Drizzle ORM](https://orm.drizzle.team) + [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — typed persistence, local SQLite
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) — styling and components
- [Motion](https://motion.dev) — entrance and micro-interactions
- [Lucide](https://lucide.dev) — icons
- [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) + [Geist](https://fonts.google.com/specimen/Geist) — editorial type pairing
- TypeScript, Vitest

## Requirements

- Node.js ≥ 20
- pnpm ≥ 9

## Setup

One-command launch via `run.sh`:

```bash
./run.sh              # pull, install, migrate, clean build, start production server on http://localhost:3000
./run.sh --dev        # dev mode with Vite HMR (after pull, install, migrate)
./run.sh --install    # install deps and migrate DB (no start)
./run.sh --help       # show help
```

While `./run.sh` runs, a sticky footer in the terminal exposes:

- `Enter` — rebuild (pull, install, migrate, build, restart)
- `c` — copy `http://localhost:3000` to clipboard
- `o` — open in default browser
- `^C` — graceful quit

Manual setup, if you prefer:

```bash
pnpm install
pnpm db:migrate       # creates ./.penumbra/penumbra.db in dev
pnpm dev              # http://localhost:3000
```

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` | Production build |
| `pnpm preview` | Preview the production build |
| `pnpm test` | Run Vitest |
| `pnpm db:generate` | Generate migrations from the schema (`src/db/schema.ts`) |
| `pnpm db:migrate` | Apply migrations to `penumbra.db` |
| `pnpm db:studio` | Drizzle Studio (database browser) |

## Structure

```
src/
├── routes/                   # file-based routes (TanStack Router, dot-nested)
│   ├── __root.tsx            # root layout: sidebar + content column
│   ├── index.tsx             # dashboard / home
│   ├── customers.tsx         # customers index + layout for detail routes
│   ├── customers.index.tsx   # list view
│   ├── customers.$id.*.tsx   # detail tabs: index / notes / orders
│   ├── lookups.tsx           # lookups layout
│   ├── lookups.*.tsx         # manufacturers, film / paper stocks, developers, customer types
│   ├── negatives.tsx         # stub
│   ├── editions.tsx          # stub
│   ├── prints.tsx            # stub
│   ├── orders.tsx            # stub
│   └── storage.tsx           # stub
├── components/
│   ├── Sidebar.tsx           # desktop left sidebar
│   ├── MobileNav.tsx         # mobile top bar + sheet drawer
│   ├── ThemeToggle.tsx       # icon-based light / dark / auto
│   ├── SearchPalette.tsx     # ⌘K command palette
│   ├── SearchProvider.tsx    # palette context + keybindings
│   ├── CustomerSheet.tsx     # customer create / edit sheet
│   ├── EnvBadge.tsx          # DEV / PROD kicker
│   ├── PlaceholderPage.tsx   # shared empty-state template
│   ├── lookup/               # reusable lookup-admin pattern (header, list, form, hook)
│   ├── search/               # palette internals (results, preview, prompts)
│   └── ui/                   # shadcn primitives
├── server/                   # createServerFn RPC handlers (customers, lookups, search, …)
├── db/
│   ├── client.ts             # Drizzle client (better-sqlite3, WAL, FKs on)
│   ├── schema.ts             # database schema
│   ├── paths.ts              # app-data dir resolver (DB + assets, dev vs. OS data dir)
│   └── migrations/           # generated SQL migrations
├── lib/                      # helpers: slug, validation, search utilities
├── router.tsx                # router config
├── routeTree.gen.ts          # auto-generated — do not edit
└── styles.css                # design tokens (B/W/red OKLCH) + Tailwind
```

All persisted state lives under a single app-data directory: in dev `./.penumbra/` (gitignored), in production the OS data dir (`~/Library/Application Support/penumbra/` on macOS, `%LOCALAPPDATA%\penumbra\` on Windows, `$XDG_DATA_HOME/penumbra/` on Linux). The dir holds `penumbra.db` and (when binary uploads land) an `assets/` subdir alongside it. Override the whole dir with `PENUMBRA_DATA_DIR`, or override individually via `DATABASE_URL` and `PENUMBRA_ASSETS_DIR`.

## Design

Editorial B/W/red aesthetic inspired by fine-art photography catalogs and darkroom craft. Safelight red is reserved for semantic accents (active route indicator, brand monogram) — not decoration. Typography pairs **Instrument Serif** italic for display and branding with **Geist** for UI and **Geist Mono** for numbers. Dark mode inverts paper and ink while slightly lifting the safelight tone.

Design tokens live in `src/styles.css` as OKLCH CSS variables (`--ink`, `--paper`, `--safelight`, `--hairline`, …), exposed to Tailwind through an `@theme` block so utilities like `bg-paper`, `text-ink-soft`, and `border-hairline` work end-to-end.

## Adding a shadcn component

```bash
pnpm dlx shadcn@latest add <component>
```
