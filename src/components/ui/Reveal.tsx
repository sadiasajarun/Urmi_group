import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReducedMotion } from '~/hooks/useReducedMotion'

interface RevealProps {
  children: ReactNode
  delay?: number
  distance?: number
  duration?: number
  className?: string
}

export function Reveal({
  children,
  delay = 0,
  distance = 24,
  duration = 0.8,
  className,
}: RevealProps) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
