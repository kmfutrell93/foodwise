'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import AppStoreButton from '../AppStoreButton'

export default function FinalCTASection() {
  return (
    <section
      className="py-16 px-4 text-center relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at center, rgba(29,158,117,0.2) 0%, transparent 60%), #0A1628',
      }}
    >
      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'backOut' }}
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Image
              src="/nori/nori_thumbs_up.png"
              alt="Nori"
              width={180}
              height={180}
              className="drop-shadow-[0_8px_40px_rgba(29,158,117,0.5)]"
            />
          </motion.div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight"
        >
          Ready to eat for your medication?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[#94A3B8] text-lg"
        >
          7-day free trial. Free to download.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-3"
        >
          <AppStoreButton size="large" />
          <p className="text-[#64748B] text-sm">No credit card required. Cancel anytime.</p>
        </motion.div>
      </div>
    </section>
  )
}
