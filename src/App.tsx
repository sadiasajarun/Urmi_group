import { Navbar } from '~/components/layout/Navbar'
import { Footer } from '~/components/layout/Footer'
import { Hero } from '~/components/sections/Hero'
import { Pillars } from '~/components/sections/Pillars'
import { ByTheNumbers } from '~/components/sections/ByTheNumbers'
import { Crafts } from '~/components/sections/Crafts'
import { Sustainability } from '~/components/sections/Sustainability'
import { Products } from '~/components/sections/Products'
import { Impact } from '~/components/sections/Impact'
import { Factories } from '~/components/sections/Factories'
import { Clients } from '~/components/sections/Clients'
import { Awards } from '~/components/sections/Awards'
import { CallToAction } from '~/components/sections/CallToAction'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Pillars />
        <ByTheNumbers />
        <Crafts />
        <Sustainability />
        <Products />
        <Impact />
        <Factories />
        <Clients />
        <Awards />
        <CallToAction />
      </main>
      <Footer />
    </>
  )
}
