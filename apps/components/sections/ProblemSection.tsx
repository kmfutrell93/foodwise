'use client'

import { motion } from 'framer-motion'

const problems = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    title: "GLP-1 takes your appetite — and your muscle",
    body: "Up to 30% of weight lost on GLP-1 medications can come from muscle, not fat. Most meal apps don't know — or care.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <circle cx="12" cy="16" r="1" fill="#1D9E75"/>
      </svg>
    ),
    title: 'Injection day is not like other days',
    body: 'Nausea. Zero appetite. Sensitivity to textures. You need softer, easier foods — not the same plan as every other day.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    title: 'Symptoms and meals are never connected',
    body: 'What you eat directly affects how you feel on GLP-1. Most people never connect the dots. FoodWise does it for you.',
  },
]

export default function ProblemSection() {
  return (
    <section className="py-14 px-4 bg-[#0A1628] border-t border-[#1D9E75]/20">
      <div className="max-w-6xl mx-auto">

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-[#1D9E75] text-sm font-semibold uppercase tracking-widest text-center mb-3"
        >
          The problem with other Ozempic &amp; GLP-1 meal apps
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white text-center mb-12 tracking-tight"
        >
          They weren&apos;t built for GLP-1.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass-card p-6 border-t-4 border-t-[#1D9E75] hover:shadow-[0_0_40px_rgba(29,158,117,0.15)] transition-all duration-300"
            >
              <div className="mb-4">{p.icon}</div>
              <h3 className="text-white font-bold text-lg mb-3 leading-snug">{p.title}</h3>
              <p className="text-[#94A3B8] leading-relaxed text-sm">{p.body}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
