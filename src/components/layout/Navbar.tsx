import { useEffect, useState } from 'react'
import { cn } from '~/lib/cn'
import { Icon } from '~/components/ui/Icon'

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Craft', href: '#craft' },
  { label: 'Portfolio', href: '#portfolio' },
  { label: 'Sustainability', href: '#sustainability' },
  { label: 'Clients', href: '#clients' },
  { label: 'Connect', href: '#connect' },
]

export function Navbar() {
  const [solid, setSolid] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          solid
            ? 'bg-mist/95 backdrop-blur-sm shadow-[0_1px_0_rgba(15,30,51,0.06)]'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto max-w-[90rem] px-6 md:px-12 py-4 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-3 group" aria-label="Urmi Group home">
            <img
              src="/urmi-logo.png"
              alt="Urmi Group"
              width={48}
              height={48}
              className="h-10 w-10 md:h-12 md:w-12 object-contain"
            />
          </a>

          <div
            className={cn(
              'hidden lg:flex items-center gap-8 text-sm uppercase tracking-[0.12em] font-medium transition-colors',
              solid ? 'text-ink' : 'text-white drop-shadow-sm',
            )}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative py-2 group"
              >
                {link.label}
                <span
                  className={cn(
                    'absolute bottom-0 left-0 h-[1.5px] w-0 transition-all duration-200 ease-out group-hover:w-full',
                    solid ? 'bg-urmi-blue' : 'bg-wave-blue',
                  )}
                />
              </a>
            ))}
          </div>

          <button
            type="button"
            aria-label="Open menu"
            className={cn(
              'lg:hidden p-2 transition-colors',
              solid ? 'text-ink' : 'text-white',
            )}
            onClick={() => setDrawerOpen(true)}
          >
            <Icon name="menu" size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 transition-opacity duration-300 lg:hidden',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          aria-label="Close menu"
          className="absolute inset-0 bg-ink/40"
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={cn(
            'absolute top-0 right-0 h-full w-[80vw] max-w-sm bg-mist shadow-2xl transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]',
            drawerOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex items-center justify-between p-6 border-b border-cloud">
            <img src="/urmi-logo.png" alt="Urmi Group" className="h-10 w-10 object-contain" />
            <button
              type="button"
              aria-label="Close menu"
              className="p-2 text-ink"
              onClick={() => setDrawerOpen(false)}
            >
              <Icon name="close" size={24} />
            </button>
          </div>
          <ul className="flex flex-col p-6 gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className="block py-3 text-lg uppercase tracking-[0.12em] text-ink hover:text-urmi-blue border-b border-cloud"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  )
}
