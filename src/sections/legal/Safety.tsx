import React from 'react'
import LegalLayout from './LegalLayout'
import { Shield, MapPin, MessageCircle, AlertTriangle } from 'lucide-react'

export default function Safety() {
  return (
    <LegalLayout title="Safety Center">
      <div className="grid grid-cols-1 gap-8">
        <section className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl grad-bg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-white text-lg font-bold uppercase tracking-tight">Verified Community</h2>
          </div>
          <p>
            Every user on TurnUp undergoes student verification. This reduces the risk of fake accounts 
            and ensures you are interacting with real campus students.
          </p>
        </section>

        <section className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl grad-bg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-white text-lg font-bold uppercase tracking-tight">Meeting Offline</h2>
          </div>
          <p>
            Always meet in public, well-lit places. If you're joining a squad for an event, tell a friend 
            where you're going or share your live location.
          </p>
        </section>

        <section className="bg-white/5 p-6 rounded-[24px] border border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl grad-bg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-white text-lg font-bold uppercase tracking-tight">Messaging Safety</h2>
          </div>
          <p>
            Never share sensitive personal information (like your physical address or passwords) in chat. 
            Keep the conversation on the app until you've established trust.
          </p>
        </section>

        <section className="bg-red-500/5 p-6 rounded-[24px] border border-red-500/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-white text-lg font-bold uppercase tracking-tight text-red-400">Reporting Issues</h2>
          </div>
          <p className="text-red-100/60">
            If a comrade is being disrespectful or suspicious, report them immediately. We take safety 
            seriously and investigate every report.
          </p>
        </section>
      </div>
    </LegalLayout>
  )
}
