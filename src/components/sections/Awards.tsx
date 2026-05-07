import { AWARDS } from '~/data/awards'
import { Reveal } from '~/components/ui/Reveal'

export function Awards() {
  return (
    <section className="bg-white py-[clamp(5rem,10vw,9rem)] px-6 md:px-12">
      <div className="mx-auto max-w-[90rem]">
        <div className="mb-14 text-center max-w-3xl mx-auto">
          <Reveal>
            <span className="text-[11px] tracking-[0.2em] uppercase text-slate-text/70 mb-4 block font-bengali">
              RECOGNITION — ০৮
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] text-ink leading-[1.15] tracking-tight">
              Recognised by the industry.
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {AWARDS.map((award, idx) => (
            <Reveal key={award.id} delay={idx * 0.05}>
              <div className="group cursor-default">
                <div className="aspect-square overflow-hidden bg-cloud border border-cloud group-hover:border-amber-accent transition-colors">
                  <img
                    src={award.image}
                    alt={award.alt}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-4">
                  <h3 className="font-serif text-base md:text-lg text-ink leading-snug mb-1">
                    {award.title}
                  </h3>
                  <span className="text-[11px] uppercase tracking-[0.18em] text-amber-accent font-medium">
                    {award.year}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
