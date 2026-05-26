import Navbar from '@/components/Navbar'
import HeroSection from '@/components/sections/HeroSection'
import ProblemSection from '@/components/sections/ProblemSection'
import SolutionSection from '@/components/sections/SolutionSection'
import PricingStripSection from '@/components/sections/PricingStripSection'
import SmartFridgeSection from '@/components/sections/SmartFridgeSection'
import HowItWorksSection from '@/components/sections/HowItWorksSection'
import PricingSection from '@/components/sections/PricingSection'
import MedicationsSection from '@/components/sections/MedicationsSection'
import FinalCTASection from '@/components/sections/FinalCTASection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <MedicationsSection />
      <PricingStripSection />
      <SmartFridgeSection />
      <HowItWorksSection />
      <PricingSection />
      <FinalCTASection />
      <Footer />
    </main>
  )
}
