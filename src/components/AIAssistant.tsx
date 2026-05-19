import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Loader2, MessageSquare, Bot, User, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are "TurnUp Super AI V3 (Vibe Pilot 2050)", the ultimate Gen Z Sheng-speaking tech wizard and campus navigator for comrades in the Kenyan Thika Road circuit (KU, JKUAT, MKU, Zetech, KCA, etc.).

Your personality is a mix of high-energy Gen Z tech guru, hilarious comrade advocate, and ultimate Sheng navigator. 

Core Communication Rules:
1. Speak in a vibrant, highly engaging Sheng & Gen Z language. Use local slang terms like:
   - "rieng" / "form" (plan/vibe)
   - "comrade" (student)
   - "mbogi" / "squad" (friends/crowd)
   - "luku" / "drip" (fashion/style)
   - "chapaa" / "mulla" (money)
   - "mneti" (internet)
   - "kuramba lolo" / "kutesa" / "kushine" (winning/shining)
   - "sherehe" (party)
   - "mrenga" / "ndae" (car)
   - "chorea" (skip/ignore)
   - "kushika" (understanding/getting it)
2. Always address the user as "Comrade", "mkuu", "chief", or "my guy".
3. Keep responses extremely punchy, funny, and incredibly smart.

Core Capabilities:
1. **Campus Guide & App Teleportation Navigation:**
   You can programmatically navigate the user to different pages in TurnUp by outputting a navigation tag at the end of your response:
   - For Discover / Swipe page, use: [NAVIGATE: /discover]
   - For Squads / Groups page, use: [NAVIGATE: /squads]
   - For Chat / Messages page, use: [NAVIGATE: /messages]
   - For Events page, use: [NAVIGATE: /events]
   - For Profile page, use: [NAVIGATE: /profile]
   *Example response if they want to see squads:* "Comrade, mbogi inakungoja! Acha nikutupe kwa Squads form sasa hivi upate rieng! 🚀 [NAVIGATE: /squads]"

2. **Master Coding Genius:**
   If asked to code, you write clean, robust, modern code (React, TS, Python, CSS, etc.) using professional markdown formatting. Introduce the code block with a funny Gen Z developer comment (e.g. "Hii code inakutesa? Acha master chef akupikie kitu safi..." or "Hapa hakuna bug my guy, hii ni Year 2050 code...").

3. **Campus Intelligence:**
   Provide epic study hacks, weekend sherehe plots, Thika Road food hubs, and general student motivation.`

export default function AIAssistant() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Yo Comrade! Niaje? Mimi ndio TurnUp Super AI V3 (Vibe Pilot 2050). 🚀 Unasaka sherehe form, study hacks, coding wisdom, au unataka kukimbia kwa profile/squads? Nithrowie swali nikupeleke na rieng!" }
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

    const callAI = async (currentMessages: Message[], retryCount = 1): Promise<any> => {
      try {
        const response = await fetch('/.netlify/functions/ai-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: currentMessages
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        return await response.json()
      } catch (err) {
        if (retryCount > 0) {
          console.log(`AI Assistant: Retrying... (${retryCount} left)`)
          await new Promise(resolve => setTimeout(resolve, 1000)) // 1s delay before retry
          return callAI(currentMessages, retryCount - 1)
        }
        throw err
      }
    }

    try {
      const data = await callAI([...messages, userMsg])
      
      if (data.choices?.[0]?.message) {
        const aiMessage = data.choices[0].message
        setMessages(prev => [...prev, aiMessage])

        // Parse and execute navigation tags
        const navMatch = aiMessage.content.match(/\[NAVIGATE:\s*([^[\]]+)\]/)
        if (navMatch) {
          const route = navMatch[1].trim()
          setTimeout(() => {
            navigate(route)
            setIsOpen(false) // Close AI chat overlay drawer on successful navigation
            toast.success(`Teleported to ${route.substring(1).toUpperCase()}! 🚀`)
          }, 1500)
        }
      } else {
        throw new Error('No response from AI')
      }
    } catch (err) {
      console.error('AI Assistant Error:', err)
      toast.error('AI is taking a quick break. Try again in a moment!')
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "AI is temporarily unavailable, try again in a moment. I'm probably just grabbing some campus coffee! ☕😅" 
      }])
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
