'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

const SAMPLE_INGREDIENTS = [
  'Greek yogurt', 'Eggs', 'Salmon', 'Spinach',
  'Quinoa', 'Chicken breast', 'Cottage cheese',
  'Avocado', 'Broccoli', 'Protein powder',
]

const SUGGESTED_MEALS = [
  {
    name: 'Soft Scrambled Eggs & Spinach',
    protein: '28g protein',
    tag: '💉 Injection-day friendly',
    time: '8 min',
  },
  {
    name: 'Greek Yogurt Protein Bowl',
    protein: '32g protein',
    tag: '💪 Muscle protective',
    time: '5 min',
  },
  {
    name: 'Salmon & Quinoa Power Plate',
    protein: '44g protein',
    tag: '🌿 GLP-1 optimized',
    time: '20 min',
  },
]

export default function SmartFridgeSection() {
  const [selected, setSelected] = useState<string[]>(
    ['Eggs', 'Greek yogurt', 'Salmon']
  )

  const toggleIngredient = (item: string) => {
    setSelected(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : prev.length < 6
          ? [...prev, item]
          : prev
    )
  }

  return (
    <section
      className="py-14 px-4 bg-[#060E1A] border-t border-[#1D9E75]/20"
    >
      <div className="max-w-6xl mx-auto">

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[#1D9E75] text-sm font-semibold uppercase tracking-widest text-center mb-3"
        >
          New feature
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold text-white text-center mb-3 tracking-tight"
        >
          Tell Nori what&apos;s in your{' '}
          <span className="gradient-text">fridge.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="text-[#94A3B8] text-center max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Tap what you have. FoodWise builds GLP-1 optimized meals from your
          actual ingredients. No shopping required.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Left — ingredient picker */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6"
          >
            <div className="w-full h-32 rounded-xl bg-[#0A1628] border border-[#1A3A5C] flex items-center justify-center mb-5 relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{ background: 'radial-gradient(circle at 30% 50%, rgba(29,158,117,0.4), transparent 60%)' }}
              />
              <div className="relative z-10 flex flex-col items-center gap-1">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="10" y="4" width="28" height="40" rx="4" stroke="#1D9E75" strokeWidth="2"/>
                  <line x1="10" y1="18" x2="38" y2="18" stroke="#1D9E75" strokeWidth="2"/>
                  <circle cx="16" cy="11" r="2" fill="#1D9E75"/>
                  <circle cx="16" cy="28" r="2" fill="#1D9E75"/>
                  <line x1="20" y1="26" x2="20" y2="34" stroke="#A8F0D8" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-[#94A3B8] text-xs font-medium">What&apos;s in your fridge?</span>
              </div>
            </div>

            <p className="text-[#94A3B8] text-sm mb-4">Tap up to 6 ingredients you have:</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {SAMPLE_INGREDIENTS.map(item => (
                <button
                  key={item}
                  onClick={() => toggleIngredient(item)}
                  className={`
                    px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                    ${selected.includes(item)
                      ? 'bg-[#1D9E75] text-white shadow-[0_0_12px_rgba(29,158,117,0.4)]'
                      : 'bg-[#0A1628] text-[#94A3B8] border border-[#1A3A5C] hover:border-[#1D9E75]/50'
                    }
                  `}
                >
                  {item}
                </button>
              ))}
            </div>

            <p className="text-[#64748B] text-xs">
              {selected.length}/6 selected · FoodWise finds meals from what you have
            </p>
          </motion.div>

          {/* Right — suggested meals */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            <p className="text-white font-semibold text-sm">Meals you can make right now:</p>

            {SUGGESTED_MEALS.map((meal, i) => (
              <motion.div
                key={meal.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="glass-card p-4 border border-[#1A3A5C] hover:border-[#1D9E75]/40 hover:shadow-[0_0_20px_rgba(29,158,117,0.1)] transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-sm mb-1">{meal.name}</h4>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[#1D9E75] text-xs font-bold">{meal.protein}</span>
                      <span className="text-[#A8F0D8] text-xs">{meal.tag}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 bg-[#0A1628] border border-[#1A3A5C] rounded-lg px-3 py-1.5 text-center">
                    <span className="text-[#94A3B8] text-xs">{meal.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="glass-card p-4 border border-[#1D9E75]/30 text-center">
              <p className="text-[#A8F0D8] text-sm font-medium flex items-center justify-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8F0D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
                Coming to the app soon
              </p>
              <p className="text-[#64748B] text-xs mt-1">
                Snap your fridge or pantry. Nori reads it automatically.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
