import React from 'react'
import LegalLayout from './LegalLayout'

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service">
      <section>
        <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-tight">1. Eligibility</h2>
        <p>
          TurnUp is strictly for current university students in Kenya. By using this service, you represent 
          that you are a student at one of the supported institutions and are at least 18 years old.
        </p>
      </section>

      <section>
        <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-tight">2. User Conduct</h2>
        <p>
          You agree to treat all comrades with respect. Harassment, hate speech, or any illegal activities 
          will result in an immediate and permanent ban. Respect the "vibe" of the community.
        </p>
      </section>

      <section>
        <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-tight">3. Events & Squads</h2>
        <p>
          TurnUp facilitates connections but is not responsible for the conduct of users at physical events 
          or during squad meetups. Always meet in public places and prioritize your safety.
        </p>
      </section>

      <section>
        <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-tight">4. Account Termination</h2>
        <p>
          We reserve the right to terminate accounts that violate our community guidelines or misrepresent 
          their student identity.
        </p>
      </section>
    </LegalLayout>
  )
}
