import { useState } from 'react'
import { BengaliMark } from '~/components/ui/BengaliMark'
import { Icon } from '~/components/ui/Icon'
import { cn } from '~/lib/cn'

const SITEMAP = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Craft', href: '#craft' },
  { label: 'Portfolio', href: '#portfolio' },
  { label: 'Sustainability', href: '#sustainability' },
  { label: 'Clients', href: '#clients' },
  { label: 'Connect', href: '#connect' },
]

export function Footer() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
    setEmail('')
  }

  return (
    <footer className="bg-urmi-blue-deep text-white">
      <div className="mx-auto max-w-[90rem] px-6 md:px-12 py-20 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <div className="flex items-baseline gap-3 mb-6">
            <BengaliMark size="lg" className="text-white" />
            <span className="font-serif text-xl tracking-widest uppercase">Urmi Group</span>
          </div>
          <p className="text-white/75 text-sm leading-relaxed max-w-xs mb-6">
            Bangladesh's first Full-Green RMG group. Forty years of craft, woven thread by thread,
            for the world.
          </p>
          <address className="not-italic text-sm text-white/70 leading-relaxed">
            Sam Tower, Gulshan-1
            <br />
            Dhaka, Bangladesh
          </address>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-white/50 mb-6 font-sans font-medium">
            Sitemap
          </h3>
          <ul className="space-y-3">
            {SITEMAP.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-white hover:text-wave-blue transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-white/50 mb-6 font-sans font-medium">
            Newsletter
          </h3>
          <p className="text-sm text-white/70 mb-6">
            Updates from the floor — sustainability reports, capability releases, the occasional
            quiet announcement.
          </p>
          {submitted ? (
            <p className="text-sm text-wave-blue flex items-center gap-2">
              <Icon name="check" size={18} />
              Thank you. We'll be in touch.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                aria-label="Email address"
                className={cn(
                  'flex-1 bg-white/10 border border-white/20 px-4 py-3 text-sm text-white',
                  'placeholder:text-white/40 focus:outline-none focus:border-wave-blue',
                  'transition-colors',
                )}
              />
              <button
                type="submit"
                className="bg-white text-urmi-blue-deep px-5 py-3 text-xs uppercase tracking-[0.12em] font-medium hover:bg-wave-blue hover:text-white transition-colors"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[90rem] px-6 md:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <p>© 2026 Urmi Group. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a
              href="https://www.linkedin.com/"
              aria-label="LinkedIn"
              target="_blank"
              rel="noreferrer"
              className="hover:text-wave-blue transition-colors"
            >
              <Icon name="linkedin" size={18} />
            </a>
            <a
              href="https://www.instagram.com/"
              aria-label="Instagram"
              target="_blank"
              rel="noreferrer"
              className="hover:text-wave-blue transition-colors"
            >
              <Icon name="instagram" size={18} />
            </a>
            <a
              href="https://www.facebook.com/"
              aria-label="Facebook"
              target="_blank"
              rel="noreferrer"
              className="hover:text-wave-blue transition-colors"
            >
              <Icon name="facebook" size={18} />
            </a>
          </div>
          <p className="italic">Crafted on the Padma.</p>
        </div>
      </div>
    </footer>
  )
}
