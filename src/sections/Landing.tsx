import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Heart, MessageCircle, Calendar, Users, Zap, MapPin, Lock, Star, CheckCircle } from 'lucide-react'

const campuses = ['MKU', 'JKUAT', 'Kenyatta University', 'Zetech', 'KCA', 'KMTC Thika', 'Thika Tech', 'Gresta', 'Jordan College', 'Imperial Medical', 'Thika Health']

const features = [
  { icon: Shield, title: 'Student Verification', desc: 'Every user verified with student ID and institutional email. Real students only.', color: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { icon: Heart, title: 'Smart Matching', desc: 'Swipe and match across 11 Thika Road campuses. Filter by course, year, interests.', color: 'from-pink-500 to-rose-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  { icon: MessageCircle, title: 'Real-time Chat', desc: 'Powered by Supabase Realtime. Share photos and plan your weekend meetups.', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { icon: Calendar, title: 'Weekend Events', desc: 'Discover parties, game nights, and hangouts. Never miss the vibe!', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { icon: Users, title: 'Squad Finder', desc: 'Find study groups or party crews based on shared interests and campus.', color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { icon: MapPin, title: 'Campus Mode', desc: 'Toggle between your campus only or explore the whole Thika Road community.', color: 'from-red-500 to-pink-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { icon: Lock, title: 'Safety First', desc: 'Block, report, emergency contacts, and 24/7 support. Your safety matters.', color: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
]

const testimonials = [
  { name: 'Amina W.', campus: 'MKU · Business Y3', text: 'Met my whole squad through TurnUp. Best app for campus life!', rating: 5 },
  { name: 'Brian K.', campus: 'JKUAT · CS Y4', text: 'Finally a dating app that actually verifies students. No more catfishes!', rating: 5 },
  { name: 'Cynthia M.', campus: 'Kenyatta · Medicine Y2', text: 'Found amazing study partners AND weekend plans. 10/10.', rating: 5 },
]

export default function Landing() {
  return (
    <main className="pt-14 overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="orb w-96 h-96 bg-purple-600/20 top-0 left-0 -translate-x-1/2" />
        <div className="orb w-96 h-96 bg-pink-600/15 bottom-0 right-0 translate-x-1/3" />
        <div className="orb w-72 h-72 bg-orange-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="chip mb-6 mx-auto">
            <Shield className="w-3.5 h-3.5" /> Thika Road Campus Students Only
          </div>

          <h1 className="font-syne font-extrabold text-4xl sm:text-6xl md:text-8xl leading-[0.95] mb-6">
            <span className="block text-white">Weekend</span>
            <span className="block grad-text">TURNUP</span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-3 leading-relaxed">
            The exclusive dating & social hub for students across{' '}
            <span className="text-purple-400 font-medium">11 Thika Road campuses</span>
          </p>
          <p className="text-gray-600 mb-10 text-sm">Verified students only · Real connections · Real weekend plans</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link to="/auth?mode=signup" className="btn-grad flex items-center gap-2 text-base w-full sm:w-auto justify-center">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all text-base text-center">
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-16">
            {[
              { v: '10K+', l: 'Verified Students' },
              { v: '11', l: 'Campuses' },
              { v: '5K+', l: 'Matches Made' },
              { v: '500+', l: 'Events Hosted' },
            ].map((s) => (
              <div key={s.l} className="card p-4 text-center">
                <div className="grad-text font-syne font-bold text-2xl mb-1">{s.v}</div>
                <div className="text-gray-500 text-xs">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Campus pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {campuses.map((c) => (
              <span key={c} className="px-3 py-1 rounded-full text-xs border border-white/8 text-gray-500 hover:text-gray-300 hover:border-purple-500/30 transition-all cursor-default">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-4 relative">
        <div className="orb w-80 h-80 bg-purple-600/10 top-0 right-0" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="chip mb-4">Why TURNUP?</span>
            <h2 className="font-syne font-bold text-4xl sm:text-5xl text-white mb-4">
              Everything You Need to <span className="grad-text">Turn Up</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">Built specifically for Thika Road campus students. Find your people, make plans, live your best campus life.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc, color, bg, border }) => (
              <div key={title} className={`group p-6 rounded-2xl ${bg} border ${border} hover:scale-[1.02] transition-all duration-300 cursor-default`}>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2 text-sm">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="mt-24 text-center">
            <h2 className="font-syne font-bold text-3xl sm:text-4xl text-white mb-4">How It <span className="grad-text">Works</span></h2>
            <p className="text-gray-500 mb-14">Get started in 3 simple steps</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Verify Your Student Status', desc: 'Upload your student ID and verify your institutional email. Confirmed within 24 hours.', icon: Shield },
                { step: '02', title: 'Create Your Profile', desc: 'Add your photos, bio, interests, and what you\'re looking for. Show off your personality!', icon: Users },
                { step: '03', title: 'Match & Make Plans', desc: 'Swipe, match, chat, and plan your weekends. Discover events and find your squad!', icon: Heart },
              ].map(({ step, title, desc, icon: Icon }) => (
                <div key={step} className="card p-8 text-center hover:border-purple-500/20 transition-all">
                  <div className="w-14 h-14 rounded-full grad-bg flex items-center justify-center font-syne font-bold text-xl mx-auto mb-5">{step}</div>
                  <Icon className="w-7 h-7 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-3">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-syne font-bold text-3xl sm:text-4xl text-white mb-3">What Students <span className="grad-text">Say</span></h2>
            <p className="text-gray-500">Real reviews from real campus students</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <p className="text-white font-medium text-sm">{t.name}</p>
                  <p className="text-gray-600 text-xs">{t.campus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 relative">
        <div className="orb w-96 h-96 bg-purple-600/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <div className="card p-12">
            <div className="w-16 h-16 rounded-2xl grad-bg flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-syne font-bold text-3xl sm:text-4xl text-white mb-4">Ready to Turn Up?</h2>
            <p className="text-gray-400 mb-8">Join thousands of verified campus students and start connecting today.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth?mode=signup" className="btn-grad flex items-center gap-2 justify-center text-base">
                Join Free <ArrowRight className="w-4 h-4" />
              </Link>
              
            </div>
            <div className="flex items-center justify-center gap-4 mt-6">
              {['No credit card', 'Cancel anytime', 'Student verified'].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 px-4 text-center text-gray-600 text-sm">
        <p>© 2025 TurnUp · Built for Thika Road campus students · Nairobi, Kenya</p>
        <div className="flex gap-4 justify-center mt-3">
          {['Privacy', 'Terms', 'Safety', 'Contact'].map((l) => (
            <a key={l} href="#" className="hover:text-gray-400 transition-colors">{l}</a>
          ))}
        </div>
      </footer>
    </main>
  )
}
