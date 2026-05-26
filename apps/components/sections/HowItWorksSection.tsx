'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const steps = [
  {
    number: '1',
    nori: '/nori/nori_pointing_right_2.png',
    bubble: "I'll remember your injection day 💉",
    title: 'Tell Nori your medication and injection day',
    body: "Choose Ozempic, Wegovy, Mounjaro, or Zepbound. Add your dose day. That's all Nori needs.",
  },
  {
    number: '2',
    nori: '/nori/nori_tablet.png',
    bubble: 'Your plan is ready in seconds ⚡',
    title: 'Get a 7-day plan built around your schedule',
    body: 'Your first AI-generated meal plan is ready in seconds. Protein-first. Injection-day aware. Budget-matched.',
  },
  {
    number: '3',
    nori: '/nori/nori_lightbulb.png',
    bubble: 'I get smarter about you every week 🧠',
    title: 'Track, learn, and improve every week',
    body: 'Log symptoms, build streaks, get a weekly AI report. FoodWise gets smarter about you over time.',
  },
]

export default function HowItWorksSection() {
  return (
    <section className="py-20 px-4 bg-[#0A1628]">
      <div className="max-w-6xl mx-auto">

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[#1D9E75] text-sm font-semibold uppercase tracking-widest text-center mb-3"
        >
          Simple to start
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white text-center mb-16 tracking-tight"
        >
          Three steps to your first plan.
        </motion.h2>

        <div className="flex flex-col md:flex-row gap-8 md:gap-4 relative">
          {/* Connector line desktop */}
          <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-px border-t-2 border-dashed border-[#1D9E75]/30 z-0" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="flex-1 flex flex-col items-center text-center relative z-10"
            >
              {/* Speech bubble */}
              <div className="glass-card px-4 py-2 border border-[#1D9E75]/40 text-sm text-white font-medium mb-3 relative">
                {step.bubble}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-[#1D9E75]/40" />
              </div>

              {/* Nori */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
              >
                <Image
                  src={step.nori}
                  alt={`Step ${step.number}`}
                  width={90}
                  height={90}
                  className="drop-shadow-[0_4px_16px_rgba(29,158,117,0.4)] mb-4"
                />
              </motion.div>

              {/* Number circle */}
              <div className="w-10 h-10 rounded-full bg-[#1D9E75] flex items-center justify-center text-white font-bold text-lg mb-4 shadow-[0_0_20px_rgba(29,158,117,0.4)]">
                {step.number}
              </div>

              <h3 className="text-white font-bold text-lg mb-2 leading-snug">{step.title}</h3>
              <p className="text-[#94A3B8] text-sm leading-relaxed max-w-xs">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
