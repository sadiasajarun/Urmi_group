import type { SVGProps } from 'react'

interface WaveDividerProps extends Omit<SVGProps<SVGSVGElement>, 'viewBox'> {
  variant?: 'soft' | 'tall'
  flip?: boolean
}

/** Hand-drawn wave SVG divider — used between sections to keep the wave motif present. */
export function WaveDivider({
  variant = 'soft',
  flip = false,
  className,
  ...rest
}: WaveDividerProps) {
  const path =
    variant === 'tall'
      ? 'M0,40 C240,90 480,0 720,40 C960,80 1200,30 1440,50 L1440,100 L0,100 Z'
      : 'M0,30 C240,60 480,10 720,30 C960,50 1200,20 1440,35 L1440,80 L0,80 Z'

  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className={className}
      style={flip ? { transform: 'scaleY(-1)' } : undefined}
      aria-hidden="true"
      {...rest}
    >
      <path d={path} fill="currentColor" />
    </svg>
  )
}
