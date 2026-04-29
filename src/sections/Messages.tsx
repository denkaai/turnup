import { useState, useEffect, useRef } from 'react'
import { Send, ArrowLeft, Shield, Loader2, MessageCircle, CheckCheck, Check, Smile, Plus, Mic, Image, MapPin, Play, Square, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import type { Match, Message } from '@/lib/supabase'

// Demo data for when Supabase isn't configured
const DEMO_MATCHES = [
  { id: 'm1', other: { name: 'Amina', campus: 'MKU', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop', whatsapp: '254712345678' }, lastMsg: 'You going to the party Friday? 🔥', unread: 2, time: '2m ago' },
  { id: 'm2', other: { name: 'Brian', campus: 'JKUAT', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop', whatsapp: '254722334455' }, lastMsg: 'Congrats on finishing exams!', unread: 0, time: '1h ago' },
  { id: 'm3', other: { name: 'Esther', campus: 'KCA', photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&fit=crop', whatsapp: '254733445566' }, lastMsg: "Let's plan something for the weekend!", unread: 1, time: '3h ago' },
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
  const [showEmojis, setShowEmojis] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const recordingTimer = useRef<NodeJS.Timeout | null>(null)

  const EMOJIS = ['😊', '😂', '🔥', '❤️', '🙌', '😎', '😍', '✨', '👌', '🙏', '💯', '🤔', '😢', '💀', '👀', '🎉', '🤩', '🤣', '😅', '🙄', '😏', '😉', '😜', '🥳', '🥺', '😡', '😱', '🤯', '😴', '🤤', '🍻', '🍕', '🍔', '🚀', '🌈', '💎', '💡', '✅', '❌', '👋']
  const matches = DEMO_MATCHES

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
              <div className="flex items-center gap-2">
                <p className="text-gray-600 text-[10px]">{selectedMatch.other.campus}</p>
                <div className="flex items-center gap-1 text-green-500 text-[10px]">
                  <Shield className="w-2.5 h-2.5" /> Verified
                </div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <a 
                href={`https://wa.me/${selectedMatch.other.whatsapp || '254700000000'}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all text-xs font-bold"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                <div className="relative group max-w-[85%]">
                  <div className={`rounded-2xl text-sm leading-relaxed overflow-hidden shadow-sm ${
                    msg.sender === 'me'
                      ? 'grad-bg text-white rounded-br-sm'
                      : 'bg-white/8 text-gray-200 rounded-bl-sm'
                  }`}>
                    {msg.type === 'text' && <div className="px-4 py-2.5">{msg.content || msg.text}</div>}
                    {msg.type === 'image' && (
                      <div className="p-1">
                        <img src={msg.content} className="max-w-full rounded-xl" alt="Sent photo" />
                      </div>
                    )}
                    {msg.type === 'audio' && (
                      <div className="px-4 py-3 flex items-center gap-3 min-w-[200px]">
                        <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all">
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="w-1/3 h-full bg-white/40" />
                        </div>
                        <span className="text-[10px] opacity-60">0:12</span>
                      </div>
                    )}
                    {msg.type === 'location' && (
                      <a href={msg.content} target="_blank" rel="noreferrer" className="block p-1 group">
                        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-all">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-xs">Shared Location</p>
                            <p className="text-[10px] opacity-50">View on Google Maps</p>
                          </div>
                        </div>
                      </a>
                    )}
                    <div className={`flex items-center gap-1 px-4 pb-2 mt-[-4px] ${msg.sender === 'me' ? 'justify-end' : ''}`}>
                      <span className="text-[10px] opacity-60">{msg.time}</span>
                      {msg.sender === 'me' && (msg.read ? <CheckCheck className="w-3 h-3 opacity-70" /> : <Check className="w-3 h-3 opacity-50" />)}
                    </div>
                  </div>

                  {/* Reaction Button */}
                  <div className={`absolute top-0 ${msg.sender === 'me' ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <button 
                      className="p-1.5 rounded-full bg-[#1a1a2e] border border-white/10 text-gray-400 hover:text-white shadow-xl"
                      onClick={(e) => {
                        const emoji = ['❤️', '😂', '😮', '😢', '🔥', '👍'][Math.floor(Math.random() * 6)]
                        reactToMessage(msg.id, emoji)
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Reactions Display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`absolute -bottom-2 ${msg.sender === 'me' ? 'right-2' : 'left-2'} flex gap-0.5 bg-[#1a1a2e] border border-white/10 px-1.5 py-0.5 rounded-full shadow-lg z-10`}>
                      {msg.reactions.map((r: string, idx: number) => (
                        <span key={idx} className="text-[10px]">{r}</span>
                      ))}
                    </div>
                  )}
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
          <div className="px-4 py-3 border-t border-white/5 relative">
            {showEmojis && (
              <div className="absolute bottom-full mb-2 left-4 p-2 bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl z-20 grid grid-cols-8 gap-1 animate-slide-up">
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setNewMsg(p => p + e)} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-lg">
                    {e}
                  </button>
                ))}
              </div>
            )}

            {showAttachments && (
              <div className="absolute bottom-full mb-2 left-4 p-1 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-20 flex flex-col gap-1 animate-slide-up">
                <label className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                  <Image className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Photo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
                <button onClick={handleLocation} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 rounded-lg transition-all text-left">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Location</span>
                </button>
              </div>
            )}

            <div className="flex gap-2 items-center">
              <button 
                onClick={() => { setShowAttachments(!showAttachments); setShowEmojis(false); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showAttachments ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Plus className={`w-5 h-5 transition-transform ${showAttachments ? 'rotate-45' : ''}`} />
              </button>
              
              <button 
                onClick={() => { setShowEmojis(!showEmojis); setShowAttachments(false); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showEmojis ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Smile className="w-5 h-5" />
              </button>

              <div className="flex-1 relative flex items-center">
                <input
                  className="input-dark w-full text-sm py-2.5 pr-10"
                  placeholder={isRecording ? 'Recording voice note...' : 'Type a message...'}
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send('text')}
                  disabled={isRecording}
                />
              </div>

              {newMsg.trim() ? (
                <button
                  onClick={() => send('text')}
                  disabled={sending}
                  className="w-10 h-10 grad-bg rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              ) : (
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isRecording ? 'grad-bg animate-pulse' : 'bg-white/5 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {isRecording ? <Square className="w-4 h-4 text-white" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
            </div>
            {isRecording && (
              <div className="mt-2 flex items-center gap-2 justify-center">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                  Recording {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                </span>
              </div>
            )}
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
