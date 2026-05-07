import { cn } from '~/lib/cn'

interface GrainOverlayProps {
  opacity?: number
  className?: string
}

/** Subtle 3% grain overlay — used selectively over photo-heavy areas. */
export function GrainOverlay({ opacity = 0.03, className }: GrainOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 z-10', className)}
      style={{
        opacity,
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  )
}
