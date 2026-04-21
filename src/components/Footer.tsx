export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="hairline-t mt-24 py-10">
      <div className="page-wrap flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="kicker text-ink-muted m-0">
          penumbra · archive of the darkroom
        </p>
        <p className="text-ink-muted m-0 text-xs tabular-nums">
          © {year}
        </p>
      </div>
    </footer>
  )
}
