import { useEffect, useRef, useState } from 'react'
import { useInView } from '~/hooks/useInView'
import { useReducedMotion } from '~/hooks/useReducedMotion'

interface CountUpProps {
  /** Final numeric value to display */
  value: number
  /** Optional suffix appended to the rendered string (e.g. '+', 'k+', ' m³') */
  suffix?: string
  /** Optional prefix (e.g. 'US$ ') */
  prefix?: string
  /** Animation duration in ms */
  duration?: number
  /**
   * If provided, the animation starts from this fraction of `value` (0..1).
   * Always renders the FINAL value as text on first paint to avoid showing 0
   * before the observer fires — animation eases the difference.
   */
  startFraction?: number
  /** Whether to format the number with commas. Default: true */
  format?: boolean
  className?: string
}

export function CountUp({
  value,
  suffix = '',
  prefix = '',
  duration = 1800,
  startFraction = 0.7,
  format = true,
  className,
}: CountUpProps) {
  const reduced = useReducedMotion()
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.4, once: true })
  const [display, setDisplay] = useState<number>(value)
  const startedRef = useRef(false)

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    if (!inView || startedRef.current) return
    startedRef.current = true

    const start = Math.round(value * startFraction)
    const startTime = performance.now()
    setDisplay(start)

    let raf = 0
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = Math.round(start + (value - start) * eased)
      setDisplay(current)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduced, value, duration, startFraction])

  const formatted = format ? display.toLocaleString('en-IN') : String(display)

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
