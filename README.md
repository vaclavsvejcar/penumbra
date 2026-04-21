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
pnpm db:migrate       # creates penumbra.db in the project root
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
├── routes/                   # file-based routes (TanStack Router)
│   ├── __root.tsx            # root layout: sidebar + content column
│   ├── index.tsx             # dashboard / home
│   ├── negatives.tsx         # stub
│   ├── editions.tsx          # stub
│   ├── prints.tsx            # stub
│   ├── customers.tsx         # stub
│   └── orders.tsx            # stub
├── components/
│   ├── Sidebar.tsx           # desktop left sidebar
│   ├── MobileNav.tsx         # mobile top bar + sheet drawer
│   ├── ThemeToggle.tsx       # icon-based light / dark / auto
│   ├── PlaceholderPage.tsx   # shared empty-state template
│   └── ui/                   # shadcn components (button, card, badge, separator, sheet)
├── db/
│   ├── client.ts             # Drizzle client (better-sqlite3)
│   ├── schema.ts             # database schema
│   └── migrations/           # generated SQL migrations
├── lib/                      # helper utilities
├── router.tsx                # router config
├── routeTree.gen.ts          # auto-generated — do not edit
└── styles.css                # design tokens (B/W/red OKLCH) + Tailwind
```

The `penumbra.db` file is in `.gitignore` — each environment has its own local database.

## Design

Editorial B/W/red aesthetic inspired by fine-art photography catalogs and darkroom craft. Safelight red is reserved for semantic accents (active route indicator, brand monogram) — not decoration. Typography pairs **Instrument Serif** italic for display and branding with **Geist** for UI and **Geist Mono** for numbers. Dark mode inverts paper and ink while slightly lifting the safelight tone.

Design tokens live in `src/styles.css` as OKLCH CSS variables (`--ink`, `--paper`, `--safelight`, `--hairline`, …), exposed to Tailwind through an `@theme` block so utilities like `bg-paper`, `text-ink-soft`, and `border-hairline` work end-to-end.

## Adding a shadcn component

```bash
pnpm dlx shadcn@latest add <component>
```
