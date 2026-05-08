import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Loader2, MessageSquare, Bot, User, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are "TurnUp AI", a cool, Gen Z campus assistant for students in Kenya, specifically focusing on the Thika Road campus circuit (KU, JKUAT, MKU, Zetech, KCA, etc.). 
Your vibe is helpful, energetic, and savvy about Kenyan campus life. Use some local slang like "form", "mbogi", "vibe", "plot" where appropriate but stay professional enough to help with academic or administrative questions.
You help students find squads, events, study tips, and navigate campus life.
If asked about "TurnUp", you are the official AI assistant of the TurnUp Campus V3 app.
Keep responses concise and punchy. Be funny sometimes.`

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Yo! I'm TurnUp AI. 🚀 Need a plot for the weekend or just some campus help? I got you!" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_NVIDIA_API_KEY}`
        },
        body: JSON.stringify({
          model: "meta/llama3-70b-instruct",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
            userMsg
          ],
          temperature: 0.7,
          max_tokens: 512,
        })
      })

      const data = await response.json()
      
      if (data.choices?.[0]?.message) {
        setMessages(prev => [...prev, data.choices[0].message])
      } else {
        throw new Error('No response from AI')
      }
    } catch (err) {
      console.error('AI Assistant Error:', err)
      toast.error('AI is a bit tired right now. Try again soon!')
      setMessages(prev => [...prev, { role: 'assistant', content: "My bad, something went wrong on my end. Say that again? 😅" }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 w-14 h-14 rounded-full grad-bg text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center z-[80] transition-all hover:scale-110 active:scale-95 ${isOpen ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}`}
      >
        <Sparkles className="w-6 h-6 animate-pulse" />
      </button>

      {/* Chat Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#08080F]/95 backdrop-blur-2xl z-[100] shadow-[-20px_0_40px_rgba(0,0,0,0.5)] border-l border-white/5 flex flex-col transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl grad-bg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-syne font-black text-lg leading-none">TurnUp AI</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Campus Savvy</span>
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${m.role === 'user' ? 'bg-white/5' : 'grad-bg'}`}>
                  {m.role === 'user' ? <User className="w-4 h-4 text-gray-400" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-white/5 text-gray-300 rounded-tr-sm border border-white/5' 
                    : 'bg-[#1A1A2E] text-white rounded-tl-sm border border-purple-500/20 shadow-xl'
                }`}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-lg grad-bg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="p-4 rounded-2xl bg-[#1A1A2E] border border-purple-500/20">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-white/5 bg-[#0C0C14]">
          <div className="relative">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about campus..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-14 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 w-10 rounded-xl grad-bg flex items-center justify-center text-white shadow-lg disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-4 text-center font-medium">
            Powered by NVIDIA NIM • Campus Intelligence V3
          </p>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] animate-in fade-in duration-300"
        />
      )}
    </>
  )
}
