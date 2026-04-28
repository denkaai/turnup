import { useState, useEffect, useRef } from 'react'
import { Send, ArrowLeft, Shield, Loader2, MessageCircle, CheckCheck, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import type { Match, Message } from '@/lib/supabase'

// Demo data for when Supabase isn't configured
const DEMO_MATCHES = [
  { id: 'm1', other: { name: 'Amina', campus: 'MKU', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop' }, lastMsg: 'You going to the party Friday? 🔥', unread: 2, time: '2m ago' },
  { id: 'm2', other: { name: 'Brian', campus: 'JKUAT', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop' }, lastMsg: 'Congrats on finishing exams!', unread: 0, time: '1h ago' },
  { id: 'm3', other: { name: 'Esther', campus: 'KCA', photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&fit=crop' }, lastMsg: "Let's plan something for the weekend!", unread: 1, time: '3h ago' },
]

const DEMO_MESSAGES: Record<string, any[]> = {
  m1: [
    { id: '1', text: 'Hey! 👋', sender: 'them', time: '10:30 AM', read: true },
    { id: '2', text: 'Hi there! How are you?', sender: 'me', time: '10:32 AM', read: true },
    { id: '3', text: "I'm good! Just finished my exams finally 😅", sender: 'them', time: '10:33 AM', read: true },
    { id: '4', text: 'Congrats!! Which campus are you at again?', sender: 'me', time: '10:35 AM', read: true },
    { id: '5', text: 'MKU! Third year Business. You?', sender: 'them', time: '10:36 AM', read: true },
    { id: '6', text: 'JKUAT CS Year 4! Almost done 🚀', sender: 'me', time: '10:38 AM', read: true },
    { id: '7', text: 'You going to the party Friday? 🔥', sender: 'them', time: '11:45 AM', read: false },
    { id: '8', text: 'Heard its gonna be lit at Club Volume!', sender: 'them', time: '11:45 AM', read: false },
  ],
  m2: [
    { id: '1', text: 'Hey! Saw you study CS too?', sender: 'me', time: 'Yesterday', read: true },
    { id: '2', text: 'Yep! 4th year. What year are you?', sender: 'them', time: 'Yesterday', read: true },
    { id: '3', text: 'Congrats on finishing exams!', sender: 'me', time: 'Yesterday', read: true },
  ],
  m3: [
    { id: '1', text: 'Hi! Love your profile 😊', sender: 'them', time: '3h ago', read: true },
    { id: '2', text: 'Thanks! You seem cool too 😄', sender: 'me', time: '3h ago', read: true },
    { id: '3', text: "Let's plan something for the weekend!", sender: 'them', time: '3h ago', read: false },
  ],
}

export default function Messages() {
  const { user } = useAuthStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const matches = DEMO_MATCHES

  useEffect(() => {
    if (selected) {
      setMessages(DEMO_MESSAGES[selected] || [])
    }
  }, [selected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!newMsg.trim() || !selected || sending) return
    setSending(true)
    const msg = { id: Date.now().toString(), text: newMsg, sender: 'me', time: 'now', read: false }
    setMessages(prev => [...prev, msg])
    setNewMsg('')

    // Simulate reply after 1.5s (in production this would be real Supabase Realtime)
    setTimeout(() => {
      const replies = [
        'Haha yes! 😂', 'Sounds good!', 'Let me check my schedule', 'Yoooo for real?? 🔥',
        'Okay sawa 👌', 'I was just thinking the same thing!', 'Kama kawaida 😄'
      ]
      const reply = { id: (Date.now() + 1).toString(), text: replies[Math.floor(Math.random() * replies.length)], sender: 'them', time: 'now', read: true }
      setMessages(prev => [...prev, reply])
      setSending(false)
    }, 1500)
  }

  const selectedMatch = matches.find(m => m.id === selected)

  return (
    <main className="h-screen pt-14 flex">
      {/* Sidebar */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-white/5 bg-[#0c0c18]`}>
        <div className="p-4 border-b border-white/5">
          <h1 className="font-syne font-bold text-lg text-white">Messages</h1>
          <p className="text-gray-600 text-xs">{matches.length} conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="w-10 h-10 text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">No matches yet</p>
              <p className="text-gray-700 text-xs mt-1">Start swiping to find people!</p>
            </div>
          ) : (
            matches.map(m => (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-all ${selected === m.id ? 'bg-purple-500/10 border-r-2 border-purple-500' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={m.other.photo} alt={m.other.name} className="w-11 h-11 rounded-full object-cover" />
                  {m.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 grad-bg rounded-full text-white text-[9px] flex items-center justify-center font-bold">{m.unread}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-medium truncate">{m.other.name}</p>
                    <span className="text-gray-700 text-xs flex-shrink-0 ml-1">{m.time}</span>
                  </div>
                  <p className={`text-xs truncate ${m.unread > 0 ? 'text-gray-300 font-medium' : 'text-gray-600'}`}>{m.lastMsg}</p>
                  <p className="text-gray-700 text-[10px]">{m.other.campus}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      {selected && selectedMatch ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0c0c18]">
            <button onClick={() => setSelected(null)} className="md:hidden p-1 text-gray-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img src={selectedMatch.other.photo} alt={selectedMatch.other.name} className="w-9 h-9 rounded-full object-cover" />
            <div>
              <p className="text-white font-medium text-sm">{selectedMatch.other.name}</p>
              <p className="text-gray-600 text-xs">{selectedMatch.other.campus}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-green-500 text-xs">
              <Shield className="w-3 h-3" /> Verified
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'me'
                    ? 'grad-bg text-white rounded-br-sm'
                    : 'bg-white/8 text-gray-200 rounded-bl-sm'
                }`}>
                  {msg.text}
                  <div className={`flex items-center gap-1 mt-0.5 ${msg.sender === 'me' ? 'justify-end' : ''}`}>
                    <span className="text-[10px] opacity-60">{msg.time}</span>
                    {msg.sender === 'me' && (msg.read ? <CheckCheck className="w-3 h-3 opacity-70" /> : <Check className="w-3 h-3 opacity-50" />)}
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white/8 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center h-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Safety tip */}
          <div className="px-4 py-2 bg-blue-500/5 border-t border-blue-500/10 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <p className="text-blue-400/70 text-xs">Never share personal financial info. Meet in public places first.</p>
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/5 flex gap-2 items-center">
            <input
              className="input-dark flex-1 text-sm"
              placeholder="Type a message..."
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            />
            <button
              onClick={send}
              disabled={!newMsg.trim() || sending}
              className="w-10 h-10 grad-bg rounded-xl flex items-center justify-center disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Select a conversation</p>
          </div>
        </div>
      )}
    </main>
  )
}
