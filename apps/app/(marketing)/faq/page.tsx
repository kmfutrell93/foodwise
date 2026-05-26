'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FAQ_DATA } from '@/lib/faq-data'
import FadeInWhenVisible from '@/components/FadeInWhenVisible'

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#0A1628] pt-28 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <FadeInWhenVisible>
          <div className="flex flex-col items-center text-center mb-16">
            <div className="mb-6">
              <Image
                src="/nori/nori_lightbulb.png"
                alt="Nori mascot"
                width={96}
                height={96}
                className="drop-shadow-[0_0_20px_rgba(29,158,117,0.5)]"
              />
            </div>
            <p className="text-sm font-semibold text-[#1D9E75] uppercase tracking-widest mb-4">
              Got questions?
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-[#94A3B8] text-lg leading-relaxed max-w-xl">
              Everything you need to know about FoodWise and eating for your GLP-1 medication.
            </p>
          </div>
        </FadeInWhenVisible>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQ_DATA.map((item, i) => (
            <FadeInWhenVisible key={i} delay={i * 0.04}>
              <AccordionItem question={item.question} answer={item.answer} />
            </FadeInWhenVisible>
          ))}
        </div>

        {/* Support CTA */}
        <FadeInWhenVisible delay={0.2}>
          <div className="mt-16 text-center">
            <p className="text-[#94A3B8]">
              Still have questions?{' '}
              <a
                href="mailto:support@getfoodwise.app"
                className="text-[#1D9E75] hover:text-[#A8F0D8] transition-colors font-medium"
              >
                Email support@getfoodwise.app
              </a>
            </p>
          </div>
        </FadeInWhenVisible>
      </div>
    </main>
  )
}

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`bg-[rgba(15,32,64,0.6)] backdrop-blur-xl border rounded-2xl overflow-hidden transition-colors duration-200 ${
        open ? 'border-[#1D9E75]/50' : 'border-white/10'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
      >
        <span className="text-white font-semibold leading-snug group-hover:text-[#A8F0D8] transition-colors">
          {question}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1D9E75]/20 border border-[#1D9E75]/40 flex items-center justify-center text-[#1D9E75]"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-5 pt-0">
              <div className="border-t border-white/5 pt-4">
                <p className="text-[#94A3B8] leading-relaxed">{answer}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
