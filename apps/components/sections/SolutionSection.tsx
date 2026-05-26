'use client'

import { motion } from 'framer-motion'

const features = [
  {
    title: 'Injection-Day Aware Plans',
    body: 'On dose day and the day after, FoodWise automatically adjusts your plan — soft textures, easy to digest, gentle on your stomach.',
    icon: '💉',
    large: true,
    glow: true,
  },
  {
    title: 'Protein-First, Every Day',
    body: 'Every plan hits 100–120g of protein to protect your muscle while you lose weight. GLP-1 weight loss should come from fat — not muscle.',
    icon: '💪',
    large: true,
    glow: false,
  },
  {
    title: 'Symptom Tracker + AI Insights',
    body: 'Log nausea, constipation, fatigue. After 7 days, FoodWise finds correlations and adjusts your plan automatically.',
    icon: '🧠',
    large: false,
    glow: false,
  },
  {
    title: 'Streak Accountability',
    body: 'Protein streak. Symptom streak. Meal plan streak. All on your home screen, building toward milestone celebrations.',
    icon: '🔥',
    large: false,
    glow: false,
  },
  {
    title: 'Smart Grocery List',
    body: 'Ready-to-shop lists with NOVA scores to flag ultra-processed items. Budget tiers: $50, $75, or $100 per week.',
    icon: '🛒',
    large: false,
    glow: false,
  },
]

export default function SolutionSection() {
  return (
    <section className="py-20 px-4 bg-[#060E1A]">
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
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-[#94A3B8] text-sm leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
