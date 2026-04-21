# penumbra

Inventory of negatives, enlargements, and limited editions for film photographers.

## Stack

- [TanStack Start](https://tanstack.com/start) — React full-stack framework (Vite + Nitro)
- [Drizzle ORM](https://orm.drizzle.team) + [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — typed persistence, local SQLite
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) — styling and components
- TypeScript, Vitest

## Requirements

- Node.js ≥ 20
- pnpm ≥ 9

## Setup

```bash
pnpm install
pnpm db:migrate   # creates penumbra.db in the project root
pnpm dev          # http://localhost:3000
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
├── routes/          # file-based routes (TanStack Router)
│   ├── __root.tsx   # root layout
│   └── index.tsx    # home page
├── components/      # shadcn and custom components
├── db/
│   ├── client.ts    # Drizzle client (better-sqlite3)
│   ├── schema.ts    # database schema
│   └── migrations/  # generated SQL migrations
├── lib/             # helper utilities
├── router.tsx       # router config
└── styles.css       # global styles and Tailwind
```

The `penumbra.db` file is in `.gitignore` — each environment has its own local database.

## Adding a shadcn component

```bash
pnpm dlx shadcn@latest add button
```
