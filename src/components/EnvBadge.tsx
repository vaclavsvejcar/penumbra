export default function EnvBadge() {
  if (!import.meta.env.DEV) return null

  return (
    <span
      role="status"
      aria-label="Development environment"
      className="text-safelight pointer-events-none fixed top-4 right-6 z-50 hidden text-xs font-semibold tracking-[0.22em] uppercase select-none md:inline-block"
    >
      Dev
    </span>
  )
}
