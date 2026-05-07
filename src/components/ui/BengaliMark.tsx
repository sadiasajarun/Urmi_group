import { cn } from '~/lib/cn'

interface BengaliMarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap: Record<NonNullable<BengaliMarkProps['size']>, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
}

export function BengaliMark({ className, size = 'md' }: BengaliMarkProps) {
  return (
    <span
      className={cn(
        'font-bengali font-medium tracking-wide leading-none',
        sizeMap[size],
        className,
      )}
      aria-label="Urmi (the wave)"
    >
      ঊর্মি
    </span>
  )
}
