'use client'

import { motion } from 'framer-motion'
import AppStoreButton from '../AppStoreButton'

export default function PricingStripSection() {
  return (
    <section className="py-10 px-4 bg-[#060E1A] border-t border-b border-[#1D9E75]/20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between gap-6"
        >
          {/* Left: value statement */}
          <div className="text-center md:text-left">
            <p className="text-white font-bold text-xl mb-1">Start free. No credit card.</p>
            <p className="text-[#94A3B8] text-sm">
              Upgrade to Pro anytime — cancel from your iPhone settings.
            </p>
          </div>

          {/* Center: pricing pills */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="glass-card px-5 py-3 text-center border border-white/10">
              <p className="text-white font-bold text-lg">Free</p>
              <p className="text-[#64748B] text-xs">3 plans/month</p>
            </div>
            <div className="text-[#1A3A5C] text-xl font-light">/</div>
            <div className="glass-card px-5 py-3 text-center border border-[#1D9E75]/50 shadow-[0_0_20px_rgba(29,158,117,0.1)]">
              <p className="text-[#A8F0D8] font-bold text-lg">Pro $12.99</p>
              <p className="text-[#64748B] text-xs">per month · save 37% yearly</p>
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex-shrink-0">
            <AppStoreButton size="default" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
