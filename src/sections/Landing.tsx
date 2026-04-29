import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Heart, MessageCircle, Calendar, Users, Zap, MapPin, Lock, Star, CheckCircle, Flame, GraduationCap, PartyPopper } from 'lucide-react'

const campuses = ['KU', 'JKUAT', 'Zetech', 'MKU', 'PAC University', 'Gretsa', "Murang'a Uni"]

const featuredEvents = [
  {
    title: 'Friday Night Turn Up',
    location: 'Club Volume, Thika',
    date: 'Friday, 9:00 PM',
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800',
    type: 'Party'
  },
  {
    title: 'JKUAT Game Night',
    location: 'Main Campus, Juja',
    date: 'Saturday, 7:00 PM',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
    type: 'Social'
  },
  {
    title: 'Rooftop Sundowner',
    location: 'TRM Rooftop',
    date: 'Saturday, 4:00 PM',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    type: 'Chill'
  }
]

function StatCounter({ target, suffix = '', duration = 2000 }: { target: number, suffix?: string, duration?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])

  return <span>{count.toLocaleString()}{suffix}</span>
}

export default function Landing() {
  return (
    <main className="pt-14 overflow-x-hidden bg-[#05050a]">
      {/* SECTION 1: HERO */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px]" />
          
          {/* Floating Orbs */}
          <div className="orb w-96 h-96 bg-purple-500/10 top-20 left-20 animate-float" />
          <div className="orb w-72 h-72 bg-pink-500/10 bottom-20 right-20 animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-gray-300 text-xs font-bold uppercase tracking-widest">LIVE IN THIKA ROAD CAMPUSES</span>
          </div>

          <h1 className="font-syne font-extrabold text-5xl sm:text-7xl md:text-9xl leading-[0.9] mb-8 tracking-tighter">
            <span className="block text-white">Weekend</span>
            <span className="block grad-text animate-gradient-x">TURNUP</span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            The exclusive social & vibe hub for verified comrades across Thika Road. 
            <span className="text-white"> Match, chat, and hit the best events together.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth?mode=signup" className="btn-grad text-lg px-10 py-4 w-full sm:w-auto shadow-2xl shadow-purple-500/30">
              Join Free Now
            </Link>
            <Link to="/auth" className="px-10 py-4 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all w-full sm:w-auto">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: LIVE STATS BAR */}
      <section className="relative z-20 w-full border-y border-white/5 bg-[#090915] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-2xl sm:text-3xl font-syne font-black text-white mb-1">
                🔥 <StatCounter target={2400} suffix="+" />
              </div>
              <div className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Comrades Online</div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-2xl sm:text-3xl font-syne font-black text-white mb-1">
                🎉 <StatCounter target={12} />
              </div>
              <div className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Events This Weekend</div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-2xl sm:text-3xl font-syne font-black text-white mb-1">
                💘 <StatCounter target={847} />
              </div>
              <div className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Matches Today</div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-2xl sm:text-3xl font-syne font-black text-white mb-1">
                🏫 <StatCounter target={7} />
              </div>
              <div className="text-gray-500 text-[10px] uppercase font-black tracking-widest">Campuses Connected</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURED EVENTS PREVIEW */}
      <section className="py-24 px-4 bg-gradient-to-b from-[#05050a] to-[#090915]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-syne font-bold text-4xl sm:text-5xl text-white mb-4">Featured <span className="grad-text">Vibes</span></h2>
            <p className="text-gray-500">Don't miss out on what's happening this weekend.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredEvents.map((event, idx) => (
              <div key={idx} className="group relative rounded-[32px] overflow-hidden aspect-[4/5] border border-white/10 shadow-2xl">
                <img src={event.image} alt={event.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                
                {/* Blurred Lock Overlay */}
                <div className="absolute inset-0 backdrop-blur-md bg-black/40 flex flex-col items-center justify-center p-8 opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-6 border border-white/20">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2 text-center">{event.title}</h3>
                  <p className="text-gray-300 text-sm mb-8 text-center">{event.location} · {event.date}</p>
                  <Link to="/auth?mode=signup" className="btn-grad w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                    Join to See Details <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: HOW IT WORKS */}
      <section className="py-24 px-4 bg-[#090915]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-syne font-bold text-4xl sm:text-5xl text-white mb-4">How It <span className="grad-text">Works</span></h2>
            <p className="text-gray-500">Start your weekend journey in 3 steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: GraduationCap, title: 'Verify Your Campus', desc: 'Sign up with your university email to join the exclusive community.' },
              { icon: Heart, title: 'Match With Comrades', desc: 'Discover and connect with students from all Thika Road campuses.' },
              { icon: PartyPopper, title: 'Turn Up Together', desc: 'Join events, launch squads, and live your best campus life.' }
            ].map((step, idx) => (
              <div key={idx} className="relative group text-center">
                <div className="w-20 h-20 rounded-3xl grad-bg flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/20 group-hover:scale-110 transition-transform">
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-white font-bold text-xl mb-4">Step {idx + 1}: {step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-10 left-[70%] w-full h-[2px] bg-gradient-to-r from-purple-500/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: CAMPUS PILLS */}
      <section className="py-12 px-4 bg-[#05050a] border-y border-white/5 overflow-hidden">
        <div className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto">
          {campuses.map(uni => (
            <div key={uni} className="px-6 py-2.5 rounded-full bg-white/5 border border-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:border-purple-500/50 transition-all cursor-default">
              {uni}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: CTA (Existing) */}
      <section className="py-32 px-4 relative">
        <div className="orb w-96 h-96 bg-purple-600/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="card p-12 sm:p-20 border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-2xl">
            <Zap className="w-16 h-16 text-purple-500 mx-auto mb-8" />
            <h2 className="font-syne font-bold text-4xl sm:text-6xl text-white mb-6">Ready to Turn Up?</h2>
            <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">Join 10,000+ verified comrades and start your next campus adventure today.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?mode=signup" className="btn-grad text-lg px-12 py-4">
                Join Free Today
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-10">
              {['No Fees', 'Comrades Only', 'Safe & Verified'].map((t) => (
                <span key={t} className="flex items-center gap-2 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                  <CheckCircle className="w-4 h-4 text-green-500" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-16 px-4 text-center">
        <p className="text-gray-500 text-sm">© 2026 TurnUp · The Hub for Thika Road Campus Students</p>
        <p className="text-[12px] text-gray-700 mt-2 font-medium tracking-wide">
          Developed & Designed by <span className="text-[#c026d3] font-bold">DEV.Den.kaai</span>&lt;/&gt;
        </p>
        <div className="flex gap-6 justify-center mt-10">
          {['Privacy', 'Terms', 'Safety', 'Support'].map((l) => (
            <a key={l} href="#" className="text-gray-600 hover:text-purple-400 transition-colors text-xs font-bold uppercase tracking-widest">{l}</a>
          ))}
        </div>
      </footer>
    </main>
  )
}
