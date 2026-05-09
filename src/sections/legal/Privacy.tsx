import React from 'react'
import LegalLayout from './LegalLayout'

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <section>
        <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-tight">1. Information We Collect</h2>
        <p>
          To provide the best experience on TurnUp, we collect information you provide directly to us, 
          including your name, age, university affiliation, and profile photos. We also collect usage data 
          to improve our "vibes" and event matching algorithms.
        </p>
      </section>

      <section>
        <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-tight">2. How We Use Your Information</h2>
        <p>
          Your data is used to verify your student status, match you with other comrades, and personalize 
          your campus experience. We do not sell your personal data to third parties.
        </p>
      </section>

      <section>
        <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-tight">3. Visibility & Control</h2>
        <p>
          You have full control over what is displayed on your profile. You can hide your university, 
          online status, or WhatsApp number through your Profile settings.
        </p>
      </section>

      <section>
        <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-tight">4. Safety Measures</h2>
        <p>
          We use identity verification to ensure only real students can access the platform. 
          While we strive to protect your data, no method of transmission over the internet is 100% secure.
        </p>
      </section>
    </LegalLayout>
  )
}
