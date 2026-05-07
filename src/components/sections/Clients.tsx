import { CLIENTS } from '~/data/clients'
import { Reveal } from '~/components/ui/Reveal'
import { cn } from '~/lib/cn'

/** Initials extracted for monogram rendering when no logo is provided. */
function getMonogram(name: string): string {
  const words = name
    .replace(/&/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function Clients() {
  return (
    <section
      id="clients"
      className="bg-mist py-[clamp(5rem,10vw,9rem)] px-6 md:px-12"
    >
      <div className="mx-auto max-w-[90rem]">
        <div className="mb-14 text-center max-w-3xl mx-auto">
          <Reveal>
            <span className="text-[11px] tracking-[0.2em] uppercase text-slate-text/70 mb-4 block font-bengali">
              CLIENTS — ০৭
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] text-ink leading-[1.15] tracking-tight">
              Trusted by the brands that set the standard.
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {CLIENTS.map((client, idx) => (
            <Reveal key={client.id} delay={idx * 0.04}>
              <div
                className={cn(
                  'group bg-white border border-cloud aspect-[4/3] flex flex-col items-center justify-center p-5',
                  'transition-all duration-300 hover:border-wave-blue hover:shadow-md hover:-translate-y-1',
                )}
              >
                <div className="flex-1 flex items-center justify-center w-full">
                  {client.logo ? (
                    <img
                      src={client.logo}
                      alt={`${client.name} logo`}
                      loading="lazy"
                      className="max-h-12 max-w-[80%] object-contain grayscale group-hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="font-serif text-3xl md:text-4xl text-urmi-blue/70 group-hover:text-urmi-blue transition-colors"
                    >
                      {getMonogram(client.name)}
                    </span>
                  )}
                </div>
                <span className="text-xs md:text-sm text-slate-text font-medium tracking-wide text-center mt-3 group-hover:text-urmi-blue-deep transition-colors">
                  {client.name}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
