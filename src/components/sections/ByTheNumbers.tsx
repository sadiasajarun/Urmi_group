import { STATS } from '~/data/stats'
import { CountUp } from '~/components/ui/CountUp'
import { Reveal } from '~/components/ui/Reveal'
import { motion } from 'framer-motion'
import { useReducedMotion } from '~/hooks/useReducedMotion'

export function ByTheNumbers() {
  const reduced = useReducedMotion()

  return (
    <section className="bg-urmi-blue-deep text-white py-24 md:py-32 px-6 md:px-12">
      <div className="mx-auto max-w-[90rem] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 text-center lg:text-left">
        {STATS.map((stat, idx) => (
          <Reveal key={stat.id} delay={idx * 0.08} className="flex flex-col gap-4">
            <div className="font-serif text-[clamp(3.5rem,5.5vw,5.5rem)] leading-none flex items-baseline justify-center lg:justify-start text-white">
              {stat.literal ? (
                <span>{stat.literal}</span>
              ) : (
                <CountUp
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  duration={1800}
                />
              )}
            </div>
            <motion.div
              initial={{ width: 0 }}
              whileInView={reduced ? undefined : { width: '4rem' }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.4 + idx * 0.08, ease: 'easeOut' }}
              style={reduced ? { width: '4rem' } : undefined}
              className="h-[1.5px] bg-amber-accent mx-auto lg:mx-0"
            />
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/70 mt-1">
              {stat.caption}
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
