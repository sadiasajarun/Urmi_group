import { Reveal } from '~/components/ui/Reveal'
import { Icon } from '~/components/ui/Icon'

const CTAS = [
  { label: 'Become a Buyer', href: '#connect' },
  { label: 'Join the Team', href: '#connect' },
  { label: 'Visit a Factory', href: '#connect' },
]

export function CallToAction() {
  return (
    <section
      id="connect"
      className="relative bg-urmi-blue-deep text-white py-[clamp(6rem,12vw,10rem)] px-6 md:px-12 overflow-hidden"
    >
      {/* Background image — placeholder editorial fabric/wave shot */}
      <div
        className="absolute inset-0 z-0 opacity-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1605289982774-9a6fef564df8?q=80&w=1800&auto=format&fit=crop')",
        }}
        aria-hidden="true"
      />

      {/* Subtle SVG cloth ripple overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
        aria-hidden="true"
      >
        <path
          d="M0,300 C240,360 480,240 720,300 C960,360 1200,240 1440,300 L1440,400 C1200,460 960,340 720,400 C480,460 240,340 0,400 Z"
          fill="#7BB6E8"
          opacity="0.25"
        />
        <path
          d="M0,500 C240,560 480,440 720,500 C960,560 1200,440 1440,500 L1440,600 C1200,660 960,540 720,600 C480,660 240,540 0,600 Z"
          fill="#7BB6E8"
          opacity="0.18"
        />
        <path
          d="M0,700 C240,760 480,640 720,700 C960,760 1200,640 1440,700 L1440,800 C1200,860 960,740 720,800 C480,860 240,740 0,800 Z"
          fill="#7BB6E8"
          opacity="0.12"
        />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-b from-urmi-blue-deep/85 via-urmi-blue-deep/75 to-urmi-blue-deep/95" />

      <div className="relative z-10 mx-auto max-w-[90rem] text-center">
        <Reveal>
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/60 mb-6 block font-bengali">
            CARRY THE WAVE — ০৯
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-serif text-[clamp(2.5rem,6vw,5.25rem)] text-white leading-[1.05] tracking-tight max-w-4xl mx-auto mb-8">
            The next wave is waiting.
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="text-base md:text-lg text-white/85 max-w-xl mx-auto mb-14 font-light leading-relaxed">
            Whether you're a global buyer, a young designer, or a future colleague — there's a
            place for you here.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {CTAS.map((cta, idx) => (
              <a
                key={cta.label}
                href={cta.href}
                className={
                  idx === 0
                    ? 'bg-white text-urmi-blue-deep uppercase tracking-[0.15em] text-xs md:text-sm font-medium px-8 py-4 hover:bg-wave-blue hover:text-white transition-colors group inline-flex items-center gap-2'
                    : 'border border-white/80 text-white uppercase tracking-[0.15em] text-xs md:text-sm font-medium px-8 py-4 hover:bg-white hover:text-urmi-blue-deep transition-colors group inline-flex items-center gap-2'
                }
              >
                {cta.label}
                <Icon
                  name="arrow-right"
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
