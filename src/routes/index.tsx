import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-12 sm:px-10 sm:py-16">
        <p className="island-kicker mb-3">penumbra</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
          Evidence z&nbsp;temné komory.
        </h1>
        <p className="max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Archiv negativů, zvětšenin a&nbsp;limitovaných edic pro fotografy,
          kteří pracují na&nbsp;film.
        </p>
      </section>
    </main>
  )
}
