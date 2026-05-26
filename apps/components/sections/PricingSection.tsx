'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import AppStoreButton from '../AppStoreButton'

const freeFeatures = [
  '3 AI meal plans per month',
  'Injection day awareness',
  'Basic grocery list',
  'Medication-specific menus',
]

const proFeatures = [
  'Everything in Free',
  'Unlimited meal plans',
  'Symptom tracker + AI insights',
  'Weekly progress reports (Sundays)',
  'Streak system + milestones',
  'Dose escalation awareness',
  'Smart grocery list with NOVA scores',
  'Apple Health integration',
]

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="flex-shrink-0 mt-0.5">
      <circle cx="9" cy="9" r="8" fill="rgba(29,158,117,0.15)" stroke="#1D9E75" strokeWidth="1"/>
      <polyline points="5,9 8,12 13,6" stroke="#1D9E75" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function PricingSection() {
  return (
    <section className="py-20 px-4 bg-[#060E1A]">
      <div className="max-w-4xl mx-auto">

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[#1D9E75] text-sm font-semibold uppercase tracking-widest text-center mb-3"
        >
          Transparent pricing
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold text-white text-center mb-12 tracking-tight"
        >
          Start free. Upgrade when you&apos;re ready.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

          {/* Free card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 h-full flex flex-col"
          >
            <h3 className="text-white font-bold text-2xl mb-2">Free</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-extrabold text-white">$0</span>
              <span className="text-[#64748B]">/forever</span>
            </div>
            <ul className="space-y-3 mb-8">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check />
                  <span className="text-[#94A3B8] text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <AppStoreButton size="default" fullWidth />
            </div>
          </motion.div>

          {/* Pro card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-8 relative border border-[#1D9E75]/60 shadow-[0_0_50px_rgba(29,158,117,0.15)] h-full flex flex-col"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1D9E75] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-[0_4px_12px_rgba(29,158,117,0.4)]">
              Most Popular
            </div>

            <div className="absolute top-4 right-4">
              <Image
                src="/nori/NoriIcon.png"
                alt="Pro"
                width={40}
                height={40}
                className="drop-shadow-[0_2px_8px_rgba(29,158,117,0.5)]"
              />
            </div>

            <h3 className="text-white font-bold text-2xl mb-2 mt-2">FoodWise Pro</h3>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-extrabold text-white">$12.99</span>
              <span className="text-[#64748B]">/month</span>
            </div>
            <p className="text-[#64748B] text-sm mb-1">or $99/year · save 37%</p>
            <p className="text-[#A8F0D8] text-sm font-medium mb-6">
              7-day free trial · cancel anytime
            </p>
            <ul className="space-y-3 mb-8">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check />
                  <span className="text-[#94A3B8] text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <AppStoreButton size="large" fullWidth />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
