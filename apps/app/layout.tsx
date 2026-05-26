import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s — FoodWise',
    default: 'FoodWise — GLP-1 Meal Planner for Ozempic & Wegovy',
  },
  description:
    'The only meal planner that knows what day you inject. Protein-first meal plans for Ozempic, Wegovy, Mounjaro & Zepbound.',
  metadataBase: new URL('https://getfoodwise.app'),
  openGraph: {
    title: 'FoodWise — GLP-1 Meal Planner',
    description: 'Injection-day aware. Protein-first. Built for GLP-1.',
    url: 'https://getfoodwise.app',
    siteName: 'FoodWise',
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/nori/NoriIcon.png',
    apple: '/nori/NoriIcon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
