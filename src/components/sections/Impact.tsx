import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IMPACT_VALUES } from '~/data/impactValues'
import { Reveal } from '~/components/ui/Reveal'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { cn } from '~/lib/cn'

export function Impact() {
  const [activeIdx, setActiveIdx] = useState(0)
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLDivElement>(null)

  const next = useCallback(
    () => setActiveIdx((i) => (i + 1) % IMPACT_VALUES.length),
    [],
  )
  const prev = useCallback(
    () => setActiveIdx((i) => (i - 1 + IMPACT_VALUES.length) % IMPACT_VALUES.length),
    [],
  )

  // Keyboard nav when section is in viewport
  useEffect(() => {
    const node = sectionRef.current
    if (!node) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    node.addEventListener('keydown', onKey)
    return () => node.removeEventListener('keydown', onKey)
  }, [next, prev])

  const active = IMPACT_VALUES[activeIdx]

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      className="bg-mist py-[clamp(5rem,10vw,9rem)] px-6 md:px-12 outline-none"
    >
      <div className="mx-auto max-w-[90rem]">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Reveal>
            <span className="text-[11px] tracking-[0.2em] uppercase text-slate-text/70 mb-4 block font-bengali">
              VALUES — ০৫
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] text-ink leading-[1.15] tracking-tight">
              Every wave leaves an IMPACT.
            </h2>
          </Reveal>
        </div>

        {/* Active card — large display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={reduced ? false : { opacity: 0, scale: 0.96 }}
              animate={reduced ? undefined : { opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-square overflow-hidden bg-cloud rounded-full mx-auto w-full max-w-md"
            >
              <img
                src={active.image}
                alt={active.alt}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-urmi-blue-deep/35 via-transparent to-transparent" />
              <span className="absolute top-6 left-6 font-serif text-white text-6xl lg:text-7xl">
                {active.letter}
              </span>
            </motion.div>
          </AnimatePresence>

          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
              >
                <span className="text-[11px] uppercase tracking-[0.2em] text-urmi-blue font-medium mb-4 block">
                  Value No. 0{activeIdx + 1}
                </span>
                <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-ink mb-5 leading-[1.1]">
                  {active.title}
                </h3>
                <p className="text-base md:text-lg text-slate-text font-light leading-relaxed max-w-md">
                  {active.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Thumbnail row */}
        <div className="flex justify-center gap-4 md:gap-6 flex-wrap">
          {IMPACT_VALUES.map((v, i) => (
            <button
              type="button"
              key={v.id}
              onClick={() => setActiveIdx(i)}
              aria-label={`Show value ${v.title}`}
              aria-pressed={activeIdx === i}
              className={cn(
                'relative rounded-full overflow-hidden transition-all duration-300 ease-out',
                'border-2',
                activeIdx === i
                  ? 'w-20 h-20 md:w-24 md:h-24 border-urmi-blue'
                  : 'w-14 h-14 md:w-16 md:h-16 border-transparent opacity-70 hover:opacity-100',
              )}
            >
              <img src={v.image} alt={v.alt} className="w-full h-full object-cover" />
              <span
                className={cn(
                  'absolute inset-0 flex items-center justify-center font-serif text-white transition-opacity',
                  activeIdx === i ? 'opacity-0' : 'opacity-100 bg-urmi-blue-deep/40',
                )}
              >
                {v.letter}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
