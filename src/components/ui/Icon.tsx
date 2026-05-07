import type { SVGProps } from 'react'

type IconName =
  | 'arrow-right'
  | 'arrow-down'
  | 'menu'
  | 'close'
  | 'droplet'
  | 'leaf'
  | 'check'
  | 'plus'
  | 'mail'
  | 'instagram'
  | 'linkedin'
  | 'facebook'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

/** Hand-drawn inline SVG icons. No Lucide / Heroicons (knowledge-base hard rule). */
export function Icon({ name, size = 20, ...rest }: IconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  }

  switch (name) {
    case 'arrow-right':
      return (
        <svg {...props}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )
    case 'arrow-down':
      return (
        <svg {...props}>
          <path d="M12 5v14M6 13l6 6 6-6" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...props}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      )
    case 'close':
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      )
    case 'droplet':
      return (
        <svg {...props}>
          <path d="M12 3c0 0-7 6.5-7 11.5a7 7 0 0014 0C19 9.5 12 3 12 3z" />
        </svg>
      )
    case 'leaf':
      return (
        <svg {...props}>
          <path d="M5 19c8 0 14-6 14-14-7 0-14 5-14 14z" />
          <path d="M5 19l8-8" />
        </svg>
      )
    case 'check':
      return (
        <svg {...props}>
          <path d="M5 13l4 4L19 7" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'mail':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="1" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 014 0v4M12 13v4" />
        </svg>
      )
    case 'facebook':
      return (
        <svg {...props}>
          <path d="M14 8h2V5h-2a3 3 0 00-3 3v2H9v3h2v6h3v-6h2.4l.6-3H14V8z" />
        </svg>
      )
  }
}

export type { IconName }
