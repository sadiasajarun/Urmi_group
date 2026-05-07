import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SUSTAINABILITY_POINTS } from '~/data/sustainabilityPoints'
import { Reveal } from '~/components/ui/Reveal'
import { Icon } from '~/components/ui/Icon'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { cn } from '~/lib/cn'

/**
 * Radial diagram layout — replaces the sticky-scroll Aura version per v2 feedback.
 * Center "promise" core surrounded by 5 commitment cards. Click a card to expand
 * its description; the connecting line lights up. No scroll-pinning.
 */
export function Sustainability() {
  const [active, setActive] = useState<string>(SUSTAINABILITY_POINTS[0].id)
  const reduced = useReducedMotion()

  const activePoint = SUSTAINABILITY_POINTS.find((p) => p.id === active)!

  return (
    <section
      id="sustainability"
      className="relative py-[clamp(5rem,10vw,9rem)] px-6 md:px-12 overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #F4F7FB 0%, #E8EFE9 100%)',
      }}
    >
      <div className="mx-auto max-w-[90rem]">
        <div className="text-center mb-16 md:mb-20 max-w-4xl mx-auto">
          <Reveal>
            <span className="text-[11px] tracking-[0.2em] uppercase text-sage-deep mb-4 block font-bengali">
              SUSTAINABILITY — ০৩
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] text-ink leading-[1.15] tracking-tight">
              Five commitments behind every responsible thread.
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_1fr] gap-8 lg:gap-12 items-center">
          {/* Left column — points 1, 2 */}
          <div className="flex flex-col gap-6">
            {SUSTAINABILITY_POINTS.slice(0, 2).map((p) => (
              <PointCard
                key={p.id}
                point={p}
                active={active === p.id}
                onClick={() => setActive(p.id)}
                align="right"
              />
            ))}
          </div>

          {/* Center — sage core */}
          <div className="relative flex flex-col items-center justify-center min-h-[420px] order-first lg:order-none">
            {/* Decorative ripples */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={cn(
                  'absolute w-72 h-72 lg:w-96 lg:h-96 rounded-full border border-sage/30',
                  !reduced && 'animate-ripple',
                )}
              />
              <div
                className={cn(
                  'absolute w-56 h-56 lg:w-72 lg:h-72 rounded-full border border-sage/40',
                  !reduced && 'animate-ripple',
                )}
                style={!reduced ? { animationDelay: '0.8s' } : undefined}
              />
            </div>

            <motion.div
              key={activePoint.id}
              initial={reduced ? false : { scale: 0.92, opacity: 0 }}
              animate={reduced ? undefined : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 bg-sage text-white rounded-full w-72 h-72 lg:w-96 lg:h-96 flex flex-col items-center justify-center text-center p-10 shadow-xl"
            >
              <Icon name={activePoint.icon} size={32} className="mb-4 text-white/80" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-3">
                Pillar No. {activePoint.index}
              </span>
              <h3 className="font-serif text-xl lg:text-2xl text-white leading-tight mb-4">
                {activePoint.title}
              </h3>
              <AnimatePresence mode="wait">
                <motion.p
                  key={activePoint.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm lg:text-[15px] text-white/90 leading-relaxed"
                >
                  {activePoint.description}
                </motion.p>
              </AnimatePresence>
              {activePoint.stat && (
                <span className="mt-5 text-xs uppercase tracking-[0.18em] text-white/80 border-t border-white/30 pt-3">
                  {activePoint.stat}
                </span>
              )}
              {activePoint.badge && (
                <span className="mt-5 text-[10px] uppercase tracking-[0.15em] bg-white/20 text-white px-3 py-1 rounded-full">
                  {activePoint.badge}
                </span>
              )}
            </motion.div>
          </div>

          {/* Right column — points 3, 4, 5 */}
          <div className="flex flex-col gap-6">
            {SUSTAINABILITY_POINTS.slice(2).map((p) => (
              <PointCard
                key={p.id}
                point={p}
                active={active === p.id}
                onClick={() => setActive(p.id)}
                align="left"
              />
            ))}
          </div>
        </div>

        <div className="mt-20 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#"
            className="border border-sage-deep text-sage-deep uppercase tracking-[0.15em] text-xs md:text-sm font-medium px-7 py-3.5 hover:bg-sage-deep hover:text-white transition-colors duration-300 text-center"
          >
            Read Sustainability Report
          </a>
          <a
            href="#"
            className="bg-sage text-white uppercase tracking-[0.15em] text-xs md:text-sm font-medium px-7 py-3.5 hover:bg-sage-deep transition-colors duration-300 text-center"
          >
            See Decarbonization 2030 Plan
          </a>
        </div>
      </div>
    </section>
  )
}

interface PointCardProps {
  point: (typeof SUSTAINABILITY_POINTS)[number]
  active: boolean
  onClick: () => void
  align: 'left' | 'right'
}

function PointCard({ point, active, onClick, align }: PointCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group text-left w-full bg-white border border-cloud p-5 md:p-6 transition-all duration-300',
        align === 'right' ? 'lg:text-right' : 'lg:text-left',
        active
          ? 'border-sage shadow-md scale-[1.02]'
          : 'hover:border-sage/60 hover:shadow-sm',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 mb-2',
          align === 'right' ? 'lg:flex-row-reverse' : '',
        )}
      >
        <span
          className={cn(
            'text-[10px] uppercase tracking-[0.2em] font-medium transition-colors',
            active ? 'text-sage-deep' : 'text-slate-text',
          )}
        >
          0{point.index.replace('0', '')}
        </span>
        <span
          className={cn(
            'h-[1px] flex-1 transition-colors',
            active ? 'bg-sage' : 'bg-cloud',
          )}
        />
      </div>
      <h4
        className={cn(
          'font-serif text-lg md:text-xl mb-2 transition-colors',
          active ? 'text-sage-deep' : 'text-ink',
        )}
      >
        {point.title}
      </h4>
      {!active && (
        <p className="text-sm text-slate-text font-light line-clamp-2">{point.description}</p>
      )}
      {active && point.stat && (
        <p className="text-xs uppercase tracking-[0.15em] text-sage-deep font-medium">
          {point.stat}
        </p>
      )}
    </button>
  )
}
