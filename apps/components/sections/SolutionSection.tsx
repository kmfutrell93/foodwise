'use client'

import { motion } from 'framer-motion'

const features = [
  {
    title: 'Injection-Day Aware Plans',
    body: 'Soft textures automatically on dose day and the day after.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="2" y1="22" x2="8" y2="16"/>
        <path d="M7 19l-5-5 9-9 5 5z"/>
        <path d="M11 13l2-2"/>
        <path d="M15 9l2-2"/>
        <line x1="18" y1="2" x2="22" y2="6"/>
      </svg>
    ),
    large: true,
    glow: true,
  },
  {
    title: 'Protein-First, Every Day',
    body: 'Every plan hits 100–120g of protein to protect muscle.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    large: true,
    glow: false,
  },
  {
    title: 'Symptom Tracker + AI Insights',
    body: 'Log symptoms and get AI-driven meal adjustments after 7 days.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    large: false,
    glow: false,
  },
  {
    title: 'Streak Accountability',
    body: 'Protein, symptom, and meal plan streaks on your home screen.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c0 6-6 8-6 14a6 6 0 0012 0c0-6-6-8-6-14z"/>
        <path d="M12 12c0 3-2 4-2 6a2 2 0 004 0c0-2-2-3-2-6z"/>
      </svg>
    ),
    large: false,
    glow: false,
  },
  {
    title: 'Smart Grocery List',
    body: 'NOVA-scored lists in $50, $75, or $100 budget tiers.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
    large: false,
    glow: false,
  },
]

export default function SolutionSection() {
  return (
    <section className="py-14 px-4 bg-[#060E1A]">
      <div className="max-w-6xl mx-auto">

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[#1D9E75] text-sm font-semibold uppercase tracking-widest text-center mb-3"
        >
          How FoodWise is different
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white text-center mb-12 tracking-tight"
        >
          FoodWise knows what day{' '}
          <span className="gradient-text">you inject.</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`
                glass-card p-6
                transition-all duration-300
                hover:border-[#1D9E75]/40
                hover:shadow-[0_0_30px_rgba(29,158,117,0.15)]
                ${f.glow ? 'border border-[#1D9E75]/40 shadow-[0_0_30px_rgba(29,158,117,0.1)]' : ''}
                ${f.large ? 'md:col-span-2 lg:col-span-1' : ''}
              `}
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-[#94A3B8] text-sm leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
