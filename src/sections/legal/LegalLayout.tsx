import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface LegalLayoutProps {
  title: string
  children: React.ReactNode
}

export default function LegalLayout({ title, children }: LegalLayoutProps) {
  return (
    <main className="min-h-screen bg-[#05050a] pt-24 pb-20 px-4">
      {/* Kenyan Flag Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 z-[60] flex">
        <div className="flex-1 bg-black" />
        <div className="flex-1 bg-red-600" />
        <div className="flex-1 bg-green-600" />
      </div>

      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Landing</span>
        </Link>

        <h1 className="font-syne font-black text-4xl sm:text-5xl text-white mb-4 tracking-tighter">{title}</h1>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-12 border-b border-white/5 pb-8">Last Updated: May 2026</p>

        <div className="prose prose-invert prose-purple max-w-none space-y-8 text-gray-400 font-medium leading-relaxed">
          {children}
        </div>

        <div className="mt-20 pt-12 border-t border-white/5 text-center">
          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mb-6">Need more help?</p>
          <Link to="/support" className="btn-grad px-8 py-3 rounded-2xl text-[10px] inline-block">
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  )
}
