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
    <section className="py-20 px-4 bg-[#0A1628]">
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

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-[#94A3B8] text-center max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Each medication has a different nausea profile, side effect window, and dose escalation
          schedule. FoodWise knows the difference and adjusts your plan accordingly.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {meds.map((med, i) => (
            <motion.div
              key={med.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass-card p-6 hover:border-[#1D9E75]/50 hover:shadow-[0_0_30px_rgba(29,158,117,0.1)] transition-all duration-300"
            >
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
