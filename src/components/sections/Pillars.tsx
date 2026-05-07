import { motion } from 'framer-motion'
import { PILLARS } from '~/data/pillars'
import { Reveal } from '~/components/ui/Reveal'
import { GrainOverlay } from '~/components/ui/GrainOverlay'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { cn } from '~/lib/cn'

export function Pillars() {
  const reduced = useReducedMotion()

  return (
    <section id="about" className="bg-mist py-[clamp(5rem,10vw,9rem)] px-6 md:px-12">
      <div className="mx-auto max-w-[90rem]">
        <div className="text-center mb-16 md:mb-20">
          <Reveal>
            <span className="text-[11px] tracking-[0.2em] uppercase text-slate-text/70 mb-4 block font-bengali">
              COMPANY AT A GLANCE — ০১
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] text-ink leading-[1.15] tracking-tight">
              Four pillars. One promise.
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {PILLARS.map((pillar, idx) => (
            <motion.div
              key={pillar.id}
              initial={reduced ? false : { y: 60, opacity: 0, clipPath: 'inset(100% 0 0 0)' }}
              whileInView={
                reduced
                  ? undefined
                  : { y: 0, opacity: 1, clipPath: 'inset(0 0 0 0)' }
              }
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.9,
                delay: idx * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={cn(
                'group relative overflow-hidden bg-cloud aspect-[4/5] flex flex-col justify-end cursor-default grain',
                idx % 2 === 0 ? 'wave-clip-top' : 'wave-clip-top-alt',
              )}
            >
              <img
                src={pillar.image}
                alt={pillar.alt}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-urmi-blue-deep/55 via-urmi-blue-deep/10 to-transparent" />
              <GrainOverlay opacity={0.04} />

              <div className="absolute bottom-0 left-0 w-full bg-mist/95 backdrop-blur-sm p-5 md:p-6 border-t border-cloud">
                <span
                  className={cn(
                    'block text-[clamp(1.6rem,2.4vw,2.25rem)] text-urmi-blue-deep mb-1 leading-none',
                    pillar.statIsBengali ? 'font-bengali font-medium' : 'font-serif',
                  )}
                >
                  {pillar.stat}
                </span>
                <span className="text-[11px] uppercase tracking-[0.15em] text-slate-text">
                  {pillar.caption}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
