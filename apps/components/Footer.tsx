import Link from 'next/link'
import Image from 'next/image'
import { SUPPORT_EMAIL } from '@/lib/constants'

export default function Footer() {
  return (
    <footer className="bg-[#060E1A] border-t border-white/5 py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 text-center">

        <div className="flex items-center gap-2">
          <Image
            src="/nori/NoriIcon.png"
            alt="FoodWise"
            width={28}
            height={28}
          />
          <span className="font-bold text-white">FoodWise</span>
        </div>

        <p className="text-[#94A3B8] text-sm">
          The meal planner built for GLP-1.
        </p>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-[#64748B]">
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="/faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white transition-colors">
            {SUPPORT_EMAIL}
          </a>
        </div>

        <div className="w-full bg-[#0F2040] rounded-xl py-3 px-4 text-center">
          <p className="text-[#64748B] text-xs">
            ⚕️ FoodWise does not provide medical advice. Always consult your prescribing physician.
          </p>
        </div>

        <p className="text-[#64748B] text-xs">© 2026 FoodWise. Not medical advice.</p>
      </div>
    </footer>
  )
}
