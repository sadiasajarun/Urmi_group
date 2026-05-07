import { PRODUCTS } from '~/data/products'
import { Reveal } from '~/components/ui/Reveal'
import { Icon } from '~/components/ui/Icon'
import { cn } from '~/lib/cn'

export function Products() {
  const heroes = PRODUCTS.filter((p) => p.size === 'hero')
  const mediums = PRODUCTS.filter((p) => p.size === 'medium')

  return (
    <section id="portfolio" className="bg-mist py-[clamp(5rem,10vw,9rem)] px-6 md:px-12">
      <div className="mx-auto max-w-[90rem]">
        <div className="mb-16 md:mb-20 max-w-3xl">
          <Reveal>
            <span className="text-[11px] tracking-[0.2em] uppercase text-slate-text/70 mb-4 block font-bengali">
              PORTFOLIO — ০৪
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.5rem)] text-ink leading-[1.1] tracking-tight">
              Garments worn from the gym to the gala — and to bed.
            </h2>
          </Reveal>
        </div>

        {/* Top row — 2 hero tiles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          {heroes.map((product, idx) => (
            <Reveal key={product.id} delay={idx * 0.1}>
              <ProductTile product={product} />
            </Reveal>
          ))}
        </div>

        {/* Bottom row — 4 medium tiles, deliberately staggered heights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {mediums.map((product, idx) => (
            <Reveal
              key={product.id}
              delay={idx * 0.08}
              className={cn(idx % 2 === 1 ? 'lg:translate-y-8' : '')}
            >
              <ProductTile product={product} />
            </Reveal>
          ))}
        </div>

        <div className="mt-20 flex justify-center">
          <a
            href="#connect"
            className="inline-flex items-center gap-3 text-urmi-blue uppercase tracking-[0.15em] text-sm font-medium hover:text-urmi-blue-deep transition-colors group"
          >
            Open the Full Catalogue
            <Icon
              name="arrow-right"
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
        </div>
      </div>
    </section>
  )
}

function ProductTile({ product }: { product: (typeof PRODUCTS)[number] }) {
  return (
    <a
      href="#connect"
      className={cn(
        'group relative block overflow-hidden bg-cloud aspect-[4/5]',
        product.size === 'hero' && 'lg:aspect-[5/4]',
      )}
    >
      <img
        src={product.image}
        alt={product.alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:saturate-[0.85]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-urmi-blue-deep/65 via-transparent to-transparent" />
      <div className="absolute bottom-6 left-6 right-6 transform transition-transform duration-500 ease-out lg:translate-y-2 lg:group-hover:translate-y-0">
        <h3 className="font-serif italic text-white text-xl md:text-2xl lg:text-3xl mb-1">
          {product.name}
        </h3>
        <p className="text-white/85 text-sm font-light opacity-0 lg:group-hover:opacity-100 transition-opacity duration-500">
          {product.tagline}
        </p>
      </div>
    </a>
  )
}
