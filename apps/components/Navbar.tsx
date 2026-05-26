'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import AppStoreButton from './AppStoreButton'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-300
        ${scrolled
          ? 'bg-[rgba(10,22,40,0.95)] backdrop-blur-xl border-b border-white/10 shadow-lg'
          : 'bg-transparent'}
      `}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/nori/NoriIcon.png"
            alt="FoodWise"
            width={32}
            height={32}
            className="drop-shadow-[0_2px_8px_rgba(29,158,117,0.5)]"
          />
          <span className="font-bold text-white text-lg tracking-tight">
            FoodWise
          </span>
        </div>
        <AppStoreButton size="default" />
      </div>
    </nav>
  )
}
