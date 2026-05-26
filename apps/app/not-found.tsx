'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center px-4 text-center gap-6">

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'backOut' }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Image
            src="/nori/NoriCharacter.png"
            alt="Nori"
            width={180}
            height={180}
            className="drop-shadow-[0_8px_32px_rgba(29,158,117,0.4)]"
          />
        </motion.div>
      </motion.div>

      <h1 className="text-8xl font-extrabold gradient-text">404</h1>

      <h2 className="text-2xl font-bold text-white">Nori can&apos;t find that page.</h2>

      <p className="text-[#94A3B8]">
        The page you&apos;re looking for doesn&apos;t exist or was moved.
      </p>

      <Link
        href="/"
        className="bg-[#1D9E75] text-white font-semibold px-8 py-3 rounded-full hover:bg-[#1D9E75]/80 transition-colors duration-200"
      >
        Back to Home
      </Link>
    </main>
  )
}
