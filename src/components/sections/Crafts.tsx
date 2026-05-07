import { motion } from 'framer-motion'
import { CRAFTS } from '~/data/crafts'
import { Reveal } from '~/components/ui/Reveal'
import { Icon } from '~/components/ui/Icon'
import { useReducedMotion } from '~/hooks/useReducedMotion'
import { cn } from '~/lib/cn'

export function Crafts() {
  const reduced = useReducedMotion()

  return (
    <section id="craft" className="bg-mist py-[clamp(5rem,10vw,9rem)] px-6 md:px-12">
      <div className="mx-auto max-w-[90rem]">
        <div className="mb-20 md:mb-24">
          <Reveal>
            <span className="text-[11px] tracking-[0.2em] uppercase text-slate-text/70 mb-4 block font-bengali">
              CAPABILITY — ০২
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] text-ink leading-[1.1] tracking-tight max-w-3xl">
              Six crafts. One conscience.
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-base md:text-lg text-slate-text font-light max-w-xl mt-5">
              Where Bangladesh’s traditions meet tomorrow’s technology.
            </p>
          </Reveal>
        </div>

        <div className="flex flex-col gap-20 md:gap-32">
          {CRAFTS.map((craft, idx) => {
            const reversed = idx % 2 === 1
            return (
              <motion.article
                key={craft.id}
                initial={reduced ? false : { opacity: 0, y: 60 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center',
                )}
              >
                <div
                  className={cn(
                    'lg:col-span-7 group relative overflow-hidden aspect-[4/3] bg-cloud',
                    reversed ? 'lg:order-2' : 'lg:order-1',
                  )}
                >
                  <img
                    src={craft.image}
                    alt={craft.alt}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-urmi-blue-deep/40 via-transparent to-transparent" />
                  <span className="absolute top-6 left-6 text-white/85 font-bengali text-sm tracking-[0.2em]">
                    CRAFT ০{craft.index.replace('0', '')}
                  </span>
                  <span className="absolute bottom-6 right-6 font-serif text-white text-3xl md:text-4xl tracking-tight">
                    {craft.name}
                  </span>
                </div>

                <div
                  className={cn(
                    'lg:col-span-5 flex flex-col justify-center px-2 md:px-0',
                    reversed ? 'lg:order-1 lg:pr-8' : 'lg:order-2 lg:pl-8',
                  )}
                >
                  <span className="text-[11px] uppercase tracking-[0.2em] text-urmi-blue font-medium mb-4">
                    No. {craft.index}
                  </span>
                  <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-ink mb-5 leading-[1.1]">
                    {craft.name}
                  </h3>
                  <p className="text-base md:text-lg text-slate-text font-light leading-relaxed mb-7 max-w-md">
                    {craft.description}
                  </p>
                  <div className="border-l-2 border-amber-accent pl-4 py-1 mb-8 max-w-fit">
                    <span className="text-xs uppercase tracking-[0.15em] text-urmi-blue-deep font-medium">
                      {craft.stat}
                    </span>
                  </div>
                  <a
                    href="#connect"
                    className="inline-flex items-center gap-3 text-urmi-blue uppercase tracking-[0.15em] text-xs md:text-sm font-medium hover:text-urmi-blue-deep transition-colors group/cta"
                  >
                    See the process
                    <Icon
                      name="arrow-right"
                      size={16}
                      className="transition-transform duration-300 group-hover/cta:translate-x-1"
                    />
                  </a>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
