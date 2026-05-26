'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const problems = [
  {
    icon: '💪',
    title: "GLP-1 takes your appetite — and your muscle",
    body: "Up to 30% of weight lost on GLP-1 medications can come from muscle, not fat. Most meal apps don't know — or care.",
  },
  {
    icon: '💉',
    title: 'Injection day is not like other days',
    body: 'Nausea. Zero appetite. Sensitivity to textures. You need softer, easier foods — not the same plan as every other day.',
  },
  {
    icon: '📊',
    title: 'Symptoms and meals are never connected',
    body: 'What you eat directly affects how you feel on GLP-1. Most people never connect the dots. FoodWise does it for you.',
  },
]

export default function ProblemSection() {
  return (
    <section className="py-20 px-4 bg-[#0A1628]">
      <div className="max-w-6xl mx-auto">

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-[#1D9E75] text-sm font-semibold uppercase tracking-widest text-center mb-3"
        >
          The problem with other meal apps
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
              <div className="text-3xl mb-4">{p.icon}</div>
              <h3 className="text-white font-bold text-lg mb-3 leading-snug">{p.title}</h3>
              <p className="text-[#94A3B8] leading-relaxed text-sm">{p.body}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col items-center mt-12 gap-3"
        >
          <Image
            src="/nori/nori_happy_hands.png"
            alt="Nori"
            width={80}
            height={80}
            className="drop-shadow-[0_4px_16px_rgba(29,158,117,0.4)]"
          />
          <p className="text-[#94A3B8] text-sm">FoodWise was built to fix all of this.</p>
        </motion.div>
      </div>
    </section>
  )
}
