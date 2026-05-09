import React from 'react'
import LegalLayout from './LegalLayout'
import { Mail, MessageSquare, Twitter, Instagram } from 'lucide-react'

export default function Support() {
  return (
    <LegalLayout title="Support Hub">
      <section>
        <p className="mb-8">
          Got an issue with your account? Or maybe you've got ideas to make TurnUp even better? 
          We're here for you, comrade.
        </p>

        <div className="space-y-4">
          <a href="mailto:support@turnupcampus.netlify.app" className="flex items-center gap-4 p-5 rounded-[24px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
            <div className="w-12 h-12 rounded-xl grad-bg flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold uppercase text-xs tracking-widest mb-1">Email Us</h3>
              <p className="text-gray-500 text-[10px]">support@turnupcampus.netlify.app</p>
            </div>
          </a>

          <div className="flex items-center gap-4 p-5 rounded-[24px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group cursor-pointer">
            <div className="w-12 h-12 rounded-xl grad-bg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold uppercase text-xs tracking-widest mb-1">WhatsApp Support</h3>
              <p className="text-gray-500 text-[10px]">Instant help from the TurnUp Team</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-white text-xl font-bold mb-6 uppercase tracking-tight">Socials</h2>
        <div className="flex gap-4">
          <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <Twitter className="w-5 h-5 text-blue-400" />
          </a>
          <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
            <Instagram className="w-5 h-5 text-pink-500" />
          </a>
        </div>
      </section>

      <section>
        <h2 className="text-white text-xl font-bold mb-4 uppercase tracking-tight">FAQ</h2>
        <div className="space-y-6">
          <div>
            <h4 className="text-purple-400 font-bold text-sm mb-2">How do I verify my account?</h4>
            <p className="text-sm">Head to Onboarding step 5 or your Profile settings. You'll need to upload a photo of your student ID.</p>
          </div>
          <div>
            <h4 className="text-purple-400 font-bold text-sm mb-2">Can I join if I'm not in Thika Road?</h4>
            <p className="text-sm">Currently we are focusing on the Thika Road circuit, but we'll be expanding to other Kenyan campuses soon!</p>
          </div>
        </div>
      </section>
    </LegalLayout>
  )
}
