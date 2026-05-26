'use client'

import { motion } from 'framer-motion'

const meds = [
  {
    name: 'Ozempic',
    generic: 'semaglutide',
    desc: 'Weekly injection. The original GLP-1 weight management pen.',
  },
  {
    name: 'Wegovy',
    generic: 'semaglutide',
    desc: 'Higher-dose semaglutide. FDA-approved for chronic weight management.',
  },
  {
    name: 'Mounjaro',
    generic: 'tirzepatide',
    desc: 'Dual GIP+GLP-1 action. Stronger appetite control and glucose response.',
  },
  {
    name: 'Zepbound',
    generic: 'tirzepatide',
    desc: "FDA-approved tirzepatide for weight loss. Mounjaro's dedicated twin.",
  },
]

export default function MedicationsSection() {
  return (
    <section className="py-14 px-4 bg-[#080F1E] border-t border-[#1A3A5C]/50">
      <div className="max-w-6xl mx-auto">

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[#1D9E75] text-sm font-semibold uppercase tracking-widest text-center mb-3"
        >
          Your medication
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold text-white text-center mb-4 tracking-tight"
        >
          Built for the four major GLP-1 medications.
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
          {meds.map((med, i) => (
            <motion.div
              key={med.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative glass-card p-6 hover:border-[#1D9E75]/50 hover:shadow-[0_0_30px_rgba(29,158,117,0.1)] transition-all duration-300"
            >
              <div className="absolute top-4 right-4 opacity-20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.5 20.5L3.5 13.5a5 5 0 017-7l7 7a5 5 0 01-7 7z"/>
                  <line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/>
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl mb-1">{med.name}</h3>
              <p className="text-[#1D9E75] text-sm font-medium mb-3">{med.generic}</p>
              <p className="text-[#94A3B8] text-sm leading-relaxed">{med.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
