'use client'

import { motion } from 'framer-motion'
import { APP_STORE_LINK } from '@/lib/constants'

interface AppStoreButtonProps {
  size?: 'default' | 'large'
  fullWidth?: boolean
}

export default function AppStoreButton({
  size = 'default',
  fullWidth = false,
}: AppStoreButtonProps) {
  const width = size === 'large' ? 200 : 160

  const handleClick = () => {
    if (typeof window === 'undefined') return
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      window.location.href = APP_STORE_LINK
    } else {
      window.open(APP_STORE_LINK, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`
        inline-flex items-center justify-center
        bg-black rounded-xl cursor-pointer
        shadow-[0_4px_20px_rgba(0,0,0,0.5)]
        border border-white/10
        ${fullWidth ? 'w-full py-4' : ''}
      `}
      style={{ width: fullWidth ? '100%' : width }}
      aria-label="Download on the App Store"
    >
      <div className="flex items-center gap-3 px-5 py-3">
        {/* Apple logo */}
        <svg width="22" height="27" viewBox="0 0 22 27" fill="white">
          <path d="M18.05 14.2c-.03-3.16 2.58-4.7 2.7-4.77-1.48-2.16-3.77-2.45-4.58-2.48-1.95-.2-3.8 1.15-4.79 1.15-.99 0-2.52-1.12-4.15-1.09-2.13.03-4.1 1.24-5.2 3.14C-.1 14.2.55 20.26 2.63 23.56c1.03 1.49 2.26 3.16 3.87 3.1 1.56-.06 2.15-1 4.04-1 1.88 0 2.42 1 4.07.97 1.68-.03 2.73-1.52 3.75-3.02 1.19-1.73 1.68-3.4 1.7-3.49-.04-.02-3.27-1.25-3.3-4.97l-.01.05zM14.9 4.7C15.73 3.7 16.3 2.3 16.14.77c-1.31.06-2.9.88-3.84 1.87-.84.9-1.58 2.35-1.38 3.73 1.46.11 2.95-.74 3.98-1.67z" />
        </svg>
        <div className="flex flex-col items-start">
          <span className="text-white/70 text-[10px] leading-none">
            Download on the
          </span>
          <span className="text-white font-semibold text-[17px] leading-tight">
            App Store
          </span>
        </div>
      </div>
    </motion.button>
  )
}
