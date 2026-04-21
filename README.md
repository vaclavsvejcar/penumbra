# penumbra

Evidence negativů, zvětšenin a limitovaných edic pro fotografy na film.

## Stack

- [TanStack Start](https://tanstack.com/start) — React full-stack framework (Vite + Nitro)
- [Drizzle ORM](https://orm.drizzle.team) + [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — typovaná perzistence, lokální SQLite
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) — styling a komponenty
- TypeScript, Vitest

## Požadavky

- Node.js ≥ 20
- pnpm ≥ 9

## Setup

```bash
pnpm install
pnpm db:migrate   # vytvoří penumbra.db v kořeni projektu
pnpm dev          # http://localhost:3000
```

## Skripty

| Skript | Co dělá |
| --- | --- |
| `pnpm dev` | Dev server na portu 3000 |
| `pnpm build` | Produkční build |
| `pnpm preview` | Náhled produkčního buildu |
| `pnpm test` | Vitest |
| `pnpm db:generate` | Vygeneruje migrace ze schématu (`src/db/schema.ts`) |
| `pnpm db:migrate` | Aplikuje migrace na `penumbra.db` |
| `pnpm db:studio` | Drizzle Studio (prohlížeč databáze) |

## Struktura

```
src/
├── routes/          # file-based routy (TanStack Router)
│   ├── __root.tsx   # root layout
│   └── index.tsx    # domovská stránka
├── components/      # shadcn + vlastní komponenty
├── db/
│   ├── client.ts    # Drizzle klient (better-sqlite3)
│   ├── schema.ts    # schéma databáze
│   └── migrations/  # generované SQL migrace
├── lib/             # pomocné utility
├── router.tsx       # router config
└── styles.css       # globální styly + Tailwind
```

Databázový soubor `penumbra.db` je v `.gitignore` — každé prostředí má vlastní lokální DB.

## Přidání shadcn komponenty

```bash
pnpm dlx shadcn@latest add button
```
