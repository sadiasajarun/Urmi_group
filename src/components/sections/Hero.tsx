import { Reveal } from '~/components/ui/Reveal'
import { BengaliMark } from '~/components/ui/BengaliMark'
import { GrainOverlay } from '~/components/ui/GrainOverlay'
import { useReducedMotion } from '~/hooks/useReducedMotion'

export function Hero() {
  const reduced = useReducedMotion()

  return (
    <section
      id="home"
      className="relative h-screen min-h-[680px] w-full overflow-hidden flex flex-col justify-center items-center text-center"
    >
      {/* Background — gradient placeholder until /hero.mp4 is provided */}
      <div className="absolute inset-0 z-0">
        {!reduced && (
          <video
            src="/hero.mp4"
            autoPlay
            muted
            loop
            playsInline
            poster="/hero-poster.jpg"
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
        )}
        {/* Always-on fallback gradient — sits behind video so it shows if /hero.mp4 is missing */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #143F73 0%, #1E5C9F 45%, #4A6F8F 100%)',
          }}
        />
        <GrainOverlay opacity={0.05} />
      </div>

      {/* Tonal overlay so text stays legible */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-urmi-blue-deep/85 via-urmi-blue-deep/40 to-urmi-blue-deep/30 pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-[90rem] px-6 md:px-12 flex flex-col items-center mt-16">
        <Reveal>
          <BengaliMark size="lg" className="text-white tracking-[0.2em] mb-2" />
        </Reveal>
        <Reveal delay={0.1}>
          <span className="italic font-serif text-sm text-white/70 mb-10 block">
            (Urmi — the wave.)
          </span>
        </Reveal>
        <Reveal delay={0.2}>
          <h1 className="font-serif text-white text-[clamp(2.75rem,6.5vw,5.25rem)] leading-[1.05] tracking-tight max-w-[60rem] mb-8">
            The wave that clothes the world.
          </h1>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="text-white/85 text-base md:text-lg max-w-[34rem] leading-relaxed mb-12 font-light">
            For four decades, every thread we weave has carried two currents — Bangladesh's craft,
            and the planet's future.
          </p>
        </Reveal>
        <Reveal delay={0.4}>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="#about"
              className="bg-white text-urmi-blue-deep uppercase tracking-[0.15em] text-xs md:text-sm font-medium px-9 py-4 hover:bg-wave-blue hover:text-white transition-colors duration-300"
            >
              Discover Our Story
            </a>
            <a
              href="#connect"
              className="border border-white/80 text-white uppercase tracking-[0.15em] text-xs md:text-sm font-medium px-9 py-4 hover:bg-white hover:text-urmi-blue-deep transition-colors duration-300"
            >
              Partner With Us
            </a>
          </div>
        </Reveal>
      </div>

      {/* Bottom-left scroll cue */}
      <div className="absolute bottom-12 left-6 md:left-12 z-20 hidden md:flex items-center gap-4">
        <div className="h-12 w-[1px] bg-white/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white animate-pulse-line" />
        </div>
        <span className="text-white/70 text-[11px] tracking-[0.2em] uppercase">
          Scroll · Bangladesh's first Full-Green RMG group
        </span>
      </div>
    </section>
  )
}
