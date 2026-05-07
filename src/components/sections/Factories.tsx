import { useMemo, useState } from 'react'
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
import { motion, AnimatePresence } from 'framer-motion'
import { FACTORIES, URMI_HQ } from '~/data/factories'
import type { Factory } from '~/data/factories'
import { Reveal } from '~/components/ui/Reveal'
import { Icon } from '~/components/ui/Icon'

const MAP_ID = 'urmi-factories-map'

// Cool desaturated map style aligned with the brand
const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f4f7fb' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f4f7fb' }] },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#cfe4f5' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1e5c9f' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#e6ecf2' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#e6ecf2' }],
  },
]

export function Factories() {
  const [activeId, setActiveId] = useState<Factory['id'] | null>(null)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  const aggregate = useMemo(
    () => ({
      manpower: FACTORIES.reduce((acc, f) => acc + f.manpower, 0),
      pieces: '166,920+ pieces / day',
    }),
    [],
  )

  const active = activeId ? FACTORIES.find((f) => f.id === activeId)! : null

  return (
    <section className="bg-white py-[clamp(5rem,10vw,9rem)] px-6 md:px-12">
      <div className="mx-auto max-w-[90rem]">
        <div className="mb-14 max-w-3xl">
          <Reveal>
            <span className="text-[11px] tracking-[0.2em] uppercase text-slate-text/70 mb-4 block font-bengali">
              FACTORIES — ০৬
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] text-ink leading-[1.1] tracking-tight">
              Three rivers. Three factories. One standard.
            </h2>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
          {/* Map */}
          <div className="relative h-[480px] lg:h-[580px] bg-cloud overflow-hidden">
            {apiKey ? (
              <APIProvider apiKey={apiKey}>
                <Map
                  mapId={MAP_ID}
                  defaultCenter={URMI_HQ.position}
                  defaultZoom={9}
                  gestureHandling="cooperative"
                  disableDefaultUI={false}
                  styles={MAP_STYLES}
                  className="w-full h-full"
                >
                  {/* HQ marker */}
                  <AdvancedMarker position={URMI_HQ.position} title={URMI_HQ.name}>
                    <div className="flex flex-col items-center">
                      <div className="bg-white border-2 border-urmi-blue rounded-full p-1 shadow-lg">
                        <img
                          src="/urmi-logo.png"
                          alt={URMI_HQ.name}
                          className="w-9 h-9 object-contain"
                        />
                      </div>
                      <span className="mt-1 px-2 py-0.5 bg-urmi-blue text-white text-[10px] uppercase tracking-wider font-medium">
                        HQ
                      </span>
                    </div>
                  </AdvancedMarker>

                  {/* Factory markers */}
                  {FACTORIES.map((factory) => (
                    <AdvancedMarker
                      key={factory.id}
                      position={factory.position}
                      title={factory.name}
                      onClick={() => setActiveId(factory.id)}
                    >
                      <div className="flex flex-col items-center cursor-pointer group">
                        <Pin
                          background={
                            activeId === factory.id ? '#143F73' : '#1E5C9F'
                          }
                          borderColor="#FFFFFF"
                          glyphColor="#FFFFFF"
                          scale={activeId === factory.id ? 1.4 : 1.1}
                        />
                        <span className="mt-1 px-2 py-0.5 bg-white border border-urmi-blue text-urmi-blue text-[10px] uppercase tracking-wider font-medium shadow-sm">
                          {factory.name}
                        </span>
                      </div>
                    </AdvancedMarker>
                  ))}
                </Map>
              </APIProvider>
            ) : (
              <MapFallback onSelect={setActiveId} activeId={activeId} />
            )}
          </div>

          {/* Data panel */}
          <div className="bg-mist p-8 md:p-10 flex flex-col">
            <AnimatePresence mode="wait">
              {active ? (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4 }}
                >
                  <span className="text-[11px] uppercase tracking-[0.2em] text-urmi-blue font-medium mb-3 block">
                    Factory · {active.name}
                  </span>
                  <h3 className="font-serif text-3xl md:text-4xl text-ink mb-3 leading-tight">
                    {active.fullName}
                  </h3>
                  <p className="text-base text-slate-text font-light leading-relaxed mb-7">
                    {active.description}
                  </p>

                  <dl className="grid grid-cols-2 gap-x-8 gap-y-5 mb-8">
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.2em] text-slate-text/60 mb-1">
                        Manpower
                      </dt>
                      <dd className="font-serif text-2xl text-ink">
                        {active.manpower.toLocaleString('en-IN')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.2em] text-slate-text/60 mb-1">
                        Capacity
                      </dt>
                      <dd className="text-sm text-ink leading-snug">{active.capacity[0]}</dd>
                    </div>
                  </dl>

                  <div className="mb-8">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-text/60 mb-3 block">
                      Capabilities
                    </span>
                    <ul className="flex flex-col gap-1.5">
                      {active.capacity.slice(1).map((cap) => (
                        <li key={cap} className="text-sm text-slate-text flex items-center gap-2">
                          <Icon name="check" size={14} className="text-sage shrink-0" />
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-8">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-text/60 mb-3 block">
                      Certifications
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {active.certifications.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] uppercase tracking-[0.15em] text-urmi-blue-deep border border-urmi-blue/40 px-3 py-1.5"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="text-xs uppercase tracking-[0.15em] text-urmi-blue hover:text-urmi-blue-deep self-start"
                  >
                    ← Back to overview
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <span className="text-[11px] uppercase tracking-[0.2em] text-urmi-blue font-medium mb-3 block">
                    Group at a glance
                  </span>
                  <h3 className="font-serif text-3xl md:text-4xl text-ink mb-5 leading-tight">
                    Three factories, one operating standard.
                  </h3>
                  <p className="text-base text-slate-text font-light leading-relaxed mb-8">
                    Every site runs on its own water treatment plant, on-site child care, and
                    medical facilities. Click a marker to see the specifics.
                  </p>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-8">
                    <div>
                      <div className="font-serif text-3xl md:text-4xl text-urmi-blue-deep">
                        {aggregate.manpower.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-text/70 mt-1 block">
                        Total colleagues
                      </span>
                    </div>
                    <div>
                      <div className="font-serif text-3xl md:text-4xl text-urmi-blue-deep">
                        {aggregate.pieces}
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-text/70 mt-1 block">
                        Combined output
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {FACTORIES.map((f) => (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => setActiveId(f.id)}
                        className="w-full text-left flex items-center justify-between border border-cloud px-5 py-4 hover:border-urmi-blue hover:bg-white transition-colors group"
                      >
                        <div>
                          <div className="font-serif text-lg text-ink">{f.fullName}</div>
                          <div className="text-xs text-slate-text/70 mt-0.5">
                            {f.manpower.toLocaleString('en-IN')} colleagues · {f.capacity[0]}
                          </div>
                        </div>
                        <Icon
                          name="arrow-right"
                          size={18}
                          className="text-urmi-blue transition-transform group-hover:translate-x-1"
                        />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

interface MapFallbackProps {
  activeId: Factory['id'] | null
  onSelect: (id: Factory['id']) => void
}

/** Static stylized map shown when VITE_GOOGLE_MAPS_API_KEY is absent. */
function MapFallback({ activeId, onSelect }: MapFallbackProps) {
  // Approximate normalized positions for Bangladesh (within a 0–100 viewBox)
  const positions: Record<string, { x: number; y: number; label: string }> = {
    hq: { x: 50, y: 50, label: 'HQ' },
    ftml: { x: 52, y: 38, label: 'FTML' },
    ugl: { x: 56, y: 62, label: 'UGL' },
    uhm: { x: 44, y: 44, label: 'UHM' },
  }

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-cloud via-mist to-wave-blue-soft flex items-center justify-center">
      <span className="absolute top-4 left-4 right-4 text-[10px] uppercase tracking-[0.18em] text-slate-text/70 text-center">
        Google Map preview · Add VITE_GOOGLE_MAPS_API_KEY to enable interactive view
      </span>

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full max-w-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Stylised Bangladesh outline (decorative; not geographically precise) */}
        <path
          d="M28,18 Q40,12 52,16 Q68,20 75,28 Q82,40 78,55 Q70,72 60,82 Q48,90 36,82 Q24,75 22,60 Q18,42 22,28 Q24,22 28,18 Z"
          fill="#E6ECF2"
          stroke="#1E5C9F"
          strokeWidth="0.4"
          strokeOpacity="0.5"
        />
        {/* Wavy rivers */}
        <path
          d="M28,40 Q40,42 52,40 T78,42"
          fill="none"
          stroke="#7BB6E8"
          strokeWidth="0.5"
          strokeOpacity="0.7"
        />
        <path
          d="M30,60 Q42,58 54,60 T72,62"
          fill="none"
          stroke="#7BB6E8"
          strokeWidth="0.5"
          strokeOpacity="0.7"
        />

        {/* Connecting lines from HQ to factories */}
        {(['ftml', 'ugl', 'uhm'] as const).map((id) => {
          const factory = positions[id]
          const hq = positions.hq
          return (
            <line
              key={id}
              x1={hq.x}
              y1={hq.y}
              x2={factory.x}
              y2={factory.y}
              stroke="#1E5C9F"
              strokeWidth="0.35"
              strokeOpacity={activeId === id ? 0.9 : 0.4}
              strokeDasharray="1,1"
            />
          )
        })}

        {/* HQ marker */}
        <g>
          <circle cx={positions.hq.x} cy={positions.hq.y} r="2.5" fill="#1E5C9F" />
          <circle cx={positions.hq.x} cy={positions.hq.y} r="1.2" fill="#FFFFFF" />
        </g>

        {/* Factory pins */}
        {(['ftml', 'ugl', 'uhm'] as const).map((id) => {
          const p = positions[id]
          const isActive = activeId === id
          return (
            <g
              key={id}
              className="cursor-pointer"
              onClick={() => onSelect(id)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 3 : 2}
                fill={isActive ? '#143F73' : '#1E5C9F'}
              />
              <text
                x={p.x}
                y={p.y - 4}
                fontSize="2.8"
                fill="#143F73"
                textAnchor="middle"
                fontWeight="600"
              >
                {p.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
