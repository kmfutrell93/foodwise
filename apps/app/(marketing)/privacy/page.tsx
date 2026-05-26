import type { Metadata } from 'next'
import FadeInWhenVisible from '@/components/FadeInWhenVisible'

export const metadata: Metadata = {
  title: 'Privacy Policy | FoodWise GLP-1 Meal Planner',
  description: 'How FoodWise collects, uses, and protects your health and nutrition data.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0A1628] pt-20 pb-30">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6">
        <FadeInWhenVisible>
          <div className="mb-10">
            <p className="text-[#94A3B8] text-sm mb-8">Last updated: May 2026</p>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.03em] text-white mb-4">
              Privacy Policy
            </h1>
          </div>
        </FadeInWhenVisible>

        <div className="space-y-8" style={{ fontSize: 16, lineHeight: 1.7, color: '#444444' }}>
          <Section title="1. Introduction">
            <p>
              FoodWise (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your
              privacy. This policy explains what we collect, how we use it, and your choices.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <ul className="list-disc list-inside mt-2 space-y-2 ml-2">
              <li>
                <strong className="text-[#1A1A1A]">Account information:</strong>{' '}
                email address, hashed password (never stored in plain text)
              </li>
              <li>
                <strong className="text-[#1A1A1A]">Health and medication data:</strong>{' '}
                GLP-1 medication type, dose, injection day, side effect logs, food aversions,
                protein goals, weight logs (manual or Apple Health sync)
              </li>
              <li>
                <strong className="text-[#1A1A1A]">Usage data:</strong>{' '}
                meal plans generated, grocery lists, symptom logs, streak activity, screens visited
              </li>
              <li>
                <strong className="text-[#1A1A1A]">Device data:</strong>{' '}
                device type, OS version, push notification token
              </li>
              <li>
                <strong className="text-[#1A1A1A]">Apple Health data (iOS only, if permission granted):</strong>{' '}
                body weight, step count. FoodWise also writes dietary protein back to Apple Health.
              </li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc list-inside mt-2 space-y-2 ml-2">
              <li>To generate personalised GLP-1 meal plans</li>
              <li>To detect symptom correlations and provide weekly insights</li>
              <li>To send push notifications and weekly progress reports</li>
              <li>
                To process subscription payments via RevenueCat (we do not store payment
                card information)
              </li>
              <li>To improve the app</li>
            </ul>
          </Section>

          <Section title="4. Data Sharing">
            <p>
              We do <strong className="text-[#1A1A1A]">not</strong> sell your data. We share
              data only with:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 ml-2">
              <li>
                <strong className="text-[#1A1A1A]">Supabase</strong> — database, US-based
              </li>
              <li>
                <strong className="text-[#1A1A1A]">Anthropic</strong> — AI generation; prompts
                include medication and symptom data but not your name or email
              </li>
              <li>
                <strong className="text-[#1A1A1A]">RevenueCat</strong> — subscription management
              </li>
              <li>
                <strong className="text-[#1A1A1A]">Expo Push</strong> — push notification delivery
              </li>
            </ul>
            <p className="mt-3">All partners are bound by data processing agreements.</p>
          </Section>

          <Section title="5. Health Data">
            <p>
              Health and medication data is used solely to personalise your experience. It is
              encrypted at rest (AES-256) and in transit (TLS 1.3). It is never used for
              advertising and never shared with insurers, employers, or pharmaceutical companies.
            </p>
          </Section>

          <Section title="6. Data Retention">
            <p>
              Data is retained while your account is active. Delete your account and all data at
              any time: Settings &rarr; Danger Zone &rarr; Delete Account. Deletion is permanent
              within 30 days.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>
              You may access, correct, export, or delete your personal data at any time. Contact
              us at{' '}
              <a href="mailto:support@foodwise.app" className="text-[#1D9E75] hover:text-[#A8F0D8] transition-colors">
                support@foodwise.app
              </a>
              .
            </p>
          </Section>

          <Section title="8. Children">
            <p>FoodWise is not intended for users under 18.</p>
          </Section>

          <Section title="9. Changes">
            <p>
              Material changes will be notified via push notification or email.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              <a href="mailto:support@foodwise.app" className="text-[#1D9E75] hover:text-[#A8F0D8] transition-colors">
                support@foodwise.app
              </a>
            </p>
          </Section>
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <FadeInWhenVisible>
      <div className="bg-[rgba(15,32,64,0.6)] backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <div className="space-y-3">{children}</div>
      </div>
    </FadeInWhenVisible>
  )
}
