import { useState, useEffect, useRef } from 'react'
import { Send, ArrowLeft, Shield, Loader2, MessageCircle, CheckCheck, Check, Smile, Plus, Mic, Image, MapPin, Play, Square, Trash2, Video, Phone, Search, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import type { Match, Message } from '@/lib/supabase'

// Demo data for when Supabase isn't configured
const DEMO_MATCHES = [
  { id: 'm1', other: { name: 'Amina', campus: 'MKU', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', whatsapp: '254712345678', online: true }, lastMsg: 'You going to the party Friday? 🔥', unread: 2, time: '2:15 PM' },
  { id: 'm2', other: { name: 'Brian', campus: 'JKUAT', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop', whatsapp: '254722334455', online: false }, lastMsg: 'Congrats on finishing exams!', unread: 0, time: '1:30 PM' },
  { id: 'm3', other: { name: 'Esther', campus: 'KCA', photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop', whatsapp: '254733445566', online: true }, lastMsg: "Let's plan something for the weekend!", unread: 1, time: 'Yesterday' },
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
  const [searchQuery, setSearchQuery] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const recordingTimer = useRef<NodeJS.Timeout | null>(null)

  const EMOJIS = ['😊', '😂', '🔥', '❤️', '🙌', '😎', '😍', '✨', '👌', '🙏', '💯', '🤔', '😢', '💀', '👀', '🎉', '🤩', '🤣', '😅', '🙄', '😏', '😉', '😜', '🥳', '🥺', '😡', '😱', '🤯', '😴', '🤤', '🍻', '🍕', '🍔', '🚀', '🌈', '💎', '💡', '✅', '❌', '👋']
  const matches = DEMO_MATCHES.filter(m => m.other.name.toLowerCase().includes(searchQuery.toLowerCase()))

  useEffect(() => {
    if (selected) {
      setMessages(DEMO_MESSAGES[selected] || [])
    }
  }, [selected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (type: string = 'text', content: string = '') => {
    const messageContent = type === 'text' ? newMsg : content
    if (!messageContent.trim() || !selected || sending) return
    
    setSending(true)
    const msg = { 
      id: Date.now().toString(), 
      type,
      content: messageContent, 
      sender: 'me', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      read: false 
    }
    setMessages(prev => [...prev, msg])
    setNewMsg('')
    setShowEmojis(false)
    setShowAttachments(false)

    // Simulate reply
    setTimeout(() => {
      const replies = ['Haha yes! 😂', 'Sounds good!', 'Okay sawa 👌', 'Kama kawaida 😄']
      const reply = { 
        id: (Date.now() + 1).toString(), 
        type: 'text',
        content: replies[Math.floor(Math.random() * replies.length)], 
        sender: 'them', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
        read: true 
      }
      setMessages(prev => [...prev, reply])
      setSending(false)
    }, 1500)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setSending(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${user.id}/chat/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      send('image', publicUrl)
    } catch (err) {
      toast.error('Failed to send image')
    } finally {
      setSending(false)
    }
  }

  const handleLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported')
    
    navigator.geolocation.getCurrentPosition((pos) => {
      const url = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`
      send('location', url)
    }, () => toast.error('Location access denied'))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data)
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' })
        const file = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' })
        
        // Upload audio
        const fileName = `${Math.random()}.webm`
        const filePath = `${user?.id}/chat/${fileName}`
        
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(filePath, file)

        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
          send('audio', publicUrl)
        }
      }

      mediaRecorder.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimer.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000)
    } catch (err) {
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)
      if (recordingTimer.current) clearInterval(recordingTimer.current)
      mediaRecorder.current.stream.getTracks().forEach(t => t.stop())
    }
  }

  const reactToMessage = (id: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === id) {
        const reactions = m.reactions || []
        return { ...m, reactions: reactions.includes(emoji) ? reactions.filter((r: string) => r !== emoji) : [...reactions, emoji] }
      }
      return m
    }))
  }

  const selectedMatch = matches.find(m => m.id === selected)

  return (
    <main className="h-screen pt-14 flex bg-[#090912]">
      {/* Sidebar */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[380px] border-r border-white/5 bg-[#0c0c18]`}>
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-syne font-bold text-2xl text-white">Messages</h1>
            <button className="w-10 h-10 grad-bg rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20 hover:scale-105 transition-all">
              <Pencil className="w-4 h-4 text-white" />
            </button>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="input-dark pl-10 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-40">
              <MessageCircle className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No conversations found</p>
            </div>
          ) : (
            matches.map(m => (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 transition-all border-l-2 ${selected === m.id ? 'bg-purple-500/5 border-purple-500' : 'border-transparent hover:bg-white/[0.02]'}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={m.other.photo} alt={m.other.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/5" />
                  {m.other.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-[#0c0c18]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-sm font-bold truncate">{m.other.name}</p>
                    <span className="text-gray-600 text-[10px] uppercase font-black tracking-widest">{m.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs truncate max-w-[180px] ${m.unread > 0 ? 'text-gray-200 font-bold' : 'text-gray-500'}`}>{m.lastMsg}</p>
                    {m.unread > 0 && (
                      <span className="w-5 h-5 grad-bg rounded-full text-white text-[9px] flex items-center justify-center font-black shadow-lg shadow-purple-500/20">{m.unread}</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1 opacity-50">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="text-[9px] font-bold uppercase tracking-tighter">{m.other.campus}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      {selected && selectedMatch ? (
        <div className="flex-1 flex flex-col bg-[#090912]">
          {/* Header */}
          <div className="flex items-center gap-4 px-6 py-4 glass border-b border-white/5 z-10">
            <button onClick={() => setSelected(null)} className="md:hidden p-2 -ml-2 text-gray-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <img src={selectedMatch.other.photo} alt={selectedMatch.other.name} className="w-10 h-10 rounded-xl object-cover" />
              {selectedMatch.other.online && (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-[3px] border-[#090912]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">{selectedMatch.other.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{selectedMatch.other.campus}</p>
                {selectedMatch.other.online && (
                  <div className="flex items-center gap-1 text-green-500 text-[10px] font-black uppercase">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Online
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <Video className="w-4 h-4" />
              </button>
              <a 
                href={`https://wa.me/${selectedMatch.other.whatsapp || ''}`}
                target="_blank"
                className="p-2.5 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
              </a>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-[#090912]">
            {messages.map((msg, idx) => {
              const isMe = msg.sender === 'me'
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="relative group max-w-[75%]">
                    <div className={`rounded-2xl text-sm leading-relaxed overflow-hidden shadow-2xl ${
                      isMe
                        ? 'grad-bg text-white rounded-tr-sm'
                        : 'bg-[#1a1a2e] text-gray-200 rounded-tl-sm border border-white/5'
                    }`}>
                      {msg.type === 'text' && <div className="px-5 py-3">{msg.content || msg.text}</div>}
                      {msg.type === 'image' && (
                        <div className="p-1.5">
                          <img src={msg.content} className="max-w-full rounded-xl" alt="Sent photo" />
                        </div>
                      )}
                      {msg.type === 'audio' && (
                        <div className="px-5 py-4 flex items-center gap-4 min-w-[220px]">
                          <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                            <Play className="w-5 h-5 fill-current" />
                          </button>
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="w-1/3 h-full bg-purple-400" />
                          </div>
                          <span className="text-[10px] font-bold opacity-60">0:12</span>
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-2 mt-1.5 mx-1 ${isMe ? 'justify-end' : ''}`}>
                      <p className="text-[10px] text-gray-600 font-bold uppercase">{msg.time}</p>
                      {isMe && (msg.read ? <CheckCheck className="w-3 h-3 text-purple-400" /> : <Check className="w-3 h-3 text-gray-600" />)}
                    </div>
                  </div>
                </div>
              )
            })}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a2e] px-5 py-3 rounded-2xl rounded-tl-sm border border-white/5">
                  <div className="flex gap-1.5 items-center h-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 pt-2 bg-[#090912]">
            {/* Safety Reminder */}
            <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/5 rounded-xl border border-blue-500/10">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-[10px] text-blue-400/70 font-bold uppercase tracking-tight">Stay safe! Meet in public and verify student IDs.</p>
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-1 bg-[#121225] rounded-2xl p-1 border border-white/5">
                <button 
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showEmojis ? 'bg-purple-500/10 text-purple-400' : 'text-gray-500 hover:text-white'}`}
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-white transition-all"
                >
                  <Image className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 relative flex items-center">
                <input
                  className="input-dark w-full text-sm py-4 px-6 rounded-2xl border-none bg-[#121225] focus:ring-2 focus:ring-purple-500/50"
                  placeholder={isRecording ? 'Recording voice note...' : 'Type your message...'}
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  disabled={isRecording}
                />
              </div>

              <div className="flex items-center gap-2">
                {newMsg.trim() ? (
                  <button
                    onClick={() => send()}
                    disabled={sending}
                    className="w-12 h-12 grad-bg rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-500/20"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                ) : (
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      isRecording ? 'grad-bg animate-pulse' : 'bg-[#121225] text-gray-500 hover:text-white'
                    }`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            {showEmojis && (
              <div className="absolute bottom-full mb-4 left-6 right-6 p-4 bg-[#1a1a2e] border border-white/10 rounded-[32px] shadow-2xl z-20 grid grid-cols-10 gap-2 animate-slide-up">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => { setNewMsg(p => p + e); setShowEmojis(false); }} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-xl transition-all">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-[#090912]">
          <div className="text-center animate-fade-in">
            <div className="w-24 h-24 grad-bg rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/20 rotate-6">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="font-syne font-black text-3xl text-white mb-2">TurnUp Messages</h2>
            <p className="text-gray-600 text-sm max-w-xs mx-auto font-medium">Select a chat to start vibing 🔥<br/>Campus life is better together.</p>
          </div>
        </div>
      )}
    </main>
  )
}
