'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import AppStoreButton from '../AppStoreButton'

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(29,158,117,0.15) 0%, transparent 60%), #0A1628',
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-16">
        {/* Text */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1D9E75]/50 bg-[#1D9E75]/10 mb-6"
          >
            <span className="text-[#A8F0D8] text-sm font-medium">
              ✦ Now available on the App Store
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white mb-2"
          >
            The only meal planner
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] gradient-text mb-6"
          >
            that knows what day you inject.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg sm:text-xl text-[#94A3B8] max-w-lg leading-relaxed mb-8"
          >
            Protein-first meal plans for{' '}
            <span className="text-white font-semibold">Ozempic</span>
            ,{' '}
            <span className="text-white font-semibold">Wegovy</span>
            ,{' '}
            <span className="text-white font-semibold">Mounjaro</span>
            {' '}and{' '}
            <span className="text-white font-semibold">Zepbound</span>
            .
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center md:items-start gap-3"
          >
            <AppStoreButton size="large" />
            <p className="text-[#64748B] text-sm">
              Free to start · 7-day Pro trial · No credit card needed
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[#1D9E75] font-bold text-sm">Free</span>
                <span className="text-[#64748B] text-sm">— 3 meal plans/month</span>
              </div>
              <span className="text-[#1A3A5C]">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#A8F0D8] font-bold text-sm">Pro $12.99</span>
                <span className="text-[#64748B] text-sm">— unlimited everything</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Nori */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'backOut', delay: 0.3 }}
          className="flex-shrink-0 hidden sm:block"
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image
              src="/nori/nori_happy_hands.png"
              alt="Nori mascot"
              width={240}
              height={240}
              priority
              className="drop-shadow-[0_8px_40px_rgba(29,158,117,0.4)]"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll chevron */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 mt-12 text-[#1D9E75] opacity-60"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </motion.div>
    </section>
  )
}
