import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Send, ArrowLeft, Shield, Loader2, MessageCircle, CheckCheck, Check, Smile, Plus, Mic, Image, MapPin, Play, Square, Trash2, Video, Phone, Search, Pencil, Users, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import type { Profile, Message } from '@/lib/supabase'
import FollowButton from '@/components/FollowButton'
import { X as CloseIcon } from 'lucide-react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'

// Types for internal UI state
interface ChatConversation {
  id: string
  other: Profile
  lastMsg?: string
  unread?: number
  time?: string
}

export default function Messages() {
  const { user } = useAuthStore()
  const [selected, setSelected] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showNewMsgModal, setShowNewMsgModal] = useState(false)
  const [allUsers, setAllUsers] = useState<Profile[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [activeReactionMsg, setActiveReactionMsg] = useState<string | null>(null)
  const [msgReactions, setMsgReactions] = useState<Record<string, string>>({})
  const [isTyping, setIsTyping] = useState(false)
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const recordingTimer = useRef<NodeJS.Timeout | null>(null)

  const EMOJIS = ['😊', '😂', '🔥', '❤️', '🙌', '😎', '😍', '✨', '👌', '🙏', '💯', '🤔', '😢', '💀', '👀', '🎉', '🤩', '🤣', '😅', '🙄', '😏', '😉', '😜', '🥳', '🥺', '😡', '😱', '🤯', '😴', '🤤', '🍻', '🍕', '🍔', '🚀', '🌈', '💎', '💡', '✅', '❌', '👋']
  const filteredConversations = conversations.filter(c => c.other.name.toLowerCase().includes(searchQuery.toLowerCase()))

  useEffect(() => {
    loadConversations()
  }, [user])

  useEffect(() => {
    if (selected && user) {
      fetchMessages()
      const channel = supabase
        .channel(`chat:${user.id}:${selected}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, (payload) => {
          const msg = payload.new as Message
          if (msg.sender_id === selected) {
            setMessages(prev => [...prev, msg])
          }
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [selected, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (selected) {
      setIsTyping(true)
      const timer = setTimeout(() => setIsTyping(false), 3000 + Math.random() * 2000)
      return () => clearTimeout(timer)
    }
  }, [selected])

  const loadConversations = async () => {
    if (!user) return
    try {
      // In a real app, we'd have a conversations view or query last messages
      // For now, let's fetch all profiles we've matched or followed
      const { data: profiles } = await supabase.from('profiles').select('*').neq('id', user.id).limit(10)
      if (profiles) {
        setConversations(profiles.map(p => ({
          id: p.id,
          other: p,
          lastMsg: 'Tap to chat',
          time: 'Active'
        })))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMessages = async () => {
    if (!user || !selected) return
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selected}),and(sender_id.eq.${selected},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
  }

  const send = async (type: 'text' | 'image' | 'audio' = 'text', content: string = '') => {
    const text = type === 'text' ? newMsg : content
    if (!text.trim() || !selected || !user || sending) return
    
    setSending(true)
    const newMsgObj = { 
      sender_id: user.id,
      receiver_id: selected,
      content: text,
      type,
      read: false
    }

    try {
      const { data, error } = await supabase.from('messages').insert(newMsgObj).select().single()
      if (error) throw error
      if (data) {
        setMessages(prev => [...prev, data])
        setNewMsg('')
        setShowEmojis(false)
      }
    } catch (err) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
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
        .from('chat-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath)

      send('image', publicUrl)
    } catch (err) {
      toast.error('Failed to upload image')
    } finally {
      setSending(false)
    }
  }

  const handleCall = (type: 'audio' | 'video') => {
    toast(`${type === 'audio' ? 'Calling' : 'Video call'} feature coming soon 🔥`, {
      className: 'bg-[#13131f] border-purple-500/50 text-white font-bold',
      duration: 3000,
      position: 'top-center'
    })
  }

  const fetchAllUsers = async (query: string = '') => {
    if (!user) return
    setLoadingUsers(true)
    try {
      // 1. Get everyone I follow
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
      
      const followingIds = following?.map(f => f.following_id) || []
      if (followingIds.length === 0) {
        setAllUsers([])
        return
      }

      // 2. Get mutual follows (they follow me back)
      const { data: mutual } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', user.id)
        .in('follower_id', followingIds)
      
      const mutualIds = mutual?.map(m => m.follower_id) || []
      if (mutualIds.length === 0) {
        setAllUsers([])
        return
      }

      // 3. Fetch profiles and apply search filter
      let q = supabase.from('profiles').select('*').in('id', mutualIds)
      if (query) q = q.ilike('name', `%${query}%`)
      const { data } = await q.limit(20)
      if (data) setAllUsers(data)
    } catch (err) {
      toast.error('Failed to load connections')
    } finally {
      setLoadingUsers(false)
    }
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
        
        const fileName = `${Math.random()}.webm`
        const filePath = `${user?.id}/chat/${fileName}`
        
        const { error } = await supabase.storage
          .from('chat-images')
          .upload(filePath, file)

        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(filePath)
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

  const startNewChat = (u: Profile) => {
    const existing = conversations.find(c => c.other.id === u.id)
    if (!existing) {
      setConversations(prev => [{ id: u.id, other: u, lastMsg: 'Tap to chat', time: 'Just now' }, ...prev])
    }
    setSelected(u.id)
    setShowNewMsgModal(false)
    toast.success(`Chatting with ${u.name}! 🔥`)
  }

  const selectedConv = conversations.find(c => c.id === selected)

  return (
    <main className="h-screen pt-14 flex bg-[#090912] overflow-hidden">
      {/* Sidebar - Hidden on mobile when chat is selected */}
      <div className={`${selected ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-[380px] border-r border-white/5 bg-[#0c0c18] pb-16 md:pb-0`}>
        <div className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="font-syne font-bold text-xl sm:text-2xl text-white">Messages</h1>
            <button 
              onClick={() => { setShowNewMsgModal(true); fetchAllUsers(); }}
              className="w-10 h-10 sm:w-11 sm:h-11 grad-bg rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20 hover:scale-105 transition-all min-h-[44px]"
            >
              <Pencil className="w-4 h-4 text-white" />
            </button>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="input-dark pl-10 text-sm min-h-[44px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-40">
              <MessageCircle className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 transition-all border-l-2 min-h-[70px] ${selected === c.id ? 'bg-purple-500/10 border-purple-500' : 'border-transparent hover:bg-white/[0.02]'}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={c.other.photos?.[0]} alt={c.other.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-white/5" />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-[3px] border-[#0c0c18]" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-white text-sm font-bold truncate">{c.other.name}</p>
                    <span className="text-gray-600 text-[9px] uppercase font-black tracking-widest">{c.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs truncate max-w-[140px] sm:max-w-[180px] text-gray-500`}>{c.lastMsg}</p>
                    {c.unread ? (
                      <span className="w-4 h-4 sm:w-5 sm:h-5 grad-bg rounded-full text-white text-[9px] flex items-center justify-center font-black shadow-lg shadow-purple-500/20">{c.unread}</span>
                    ) : null}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area - Full screen on mobile when selected */}
      {selected && selectedConv ? (
        <div className="flex-1 flex flex-col bg-[#090912] absolute inset-0 z-[60] md:relative md:z-0 md:inset-auto">
          <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 glass border-b border-white/5 z-10 min-h-[64px]">
            <button onClick={() => setSelected(null)} className="md:hidden p-2 -ml-2 text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-shrink-0">
              <img src={selectedConv?.other.photos?.[0]} alt={selectedConv?.other.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#090912]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">{selectedConv?.other.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest truncate">{selectedConv?.other.campus}</p>
                <div className="flex items-center gap-1 text-green-500 text-[9px] font-black uppercase">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" /> Online
                </div>
                <div className="hidden sm:flex items-center ml-2 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-bold">
                  🔥 Vibing with {Math.floor(Math.random() * 5) + 1} students today
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => handleCall('audio')} className="p-2 sm:p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </button>
              <button onClick={() => handleCall('video')} className="p-2 sm:p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center">
                <Video className="w-4 h-4" />
              </button>
              <a 
                href={`https://wa.me/${selectedConv?.other.whatsapp_number || ''}`}
                target="_blank"
                className="p-2 sm:p-2.5 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
              </a>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 no-scrollbar bg-[#090912]">
            {messages.map((msg, idx) => {
              const isMe = msg.sender_id === user?.id
              const reaction = msgReactions[msg.id]

              return (
                <div key={msg.id} className={`flex gap-2 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && <img src={selectedConv?.other.photos?.[0]} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" alt="" />}
                  
                  <div 
                    className={`relative group max-w-[92%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    onContextMenu={(e) => { e.preventDefault(); setActiveReactionMsg(msg.id); }}
                  >
                    {/* The bubble */}
                    <div className={`relative px-4 py-2.5 rounded-[20px] text-sm shadow-md ${
                      isMe 
                        ? 'grad-bg text-white rounded-br-sm' 
                        : 'bg-[#1a1a2e] border border-white/5 text-gray-200 rounded-bl-sm'
                    }`}>
                      {msg.type === 'text' && <div>{msg.content}</div>}
                      {msg.type === 'image' && (
                        <div className="p-1">
                          <img src={msg.content} className="max-w-[200px] sm:max-w-[300px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity" alt="Sent photo" onClick={() => window.open(msg.content, '_blank')} />
                        </div>
                      )}

                      {/* Timestamp & Read Receipt */}
                      <div className={`flex items-center gap-1.5 mt-1 opacity-70 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[9px] font-bold">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (msg.read ? <CheckCheck className="w-3 h-3 text-blue-400" /> : <Check className="w-3 h-3 text-white" />)}
                      </div>
                    </div>

                    {/* Reaction Display */}
                    {reaction && (
                      <div className={`absolute -bottom-3 ${isMe ? 'right-4' : 'left-4'} w-6 h-6 bg-[#0c0c18] border border-white/10 rounded-full flex items-center justify-center text-xs shadow-xl z-10`}>
                        {reaction}
                      </div>
                    )}

                    {/* Reaction Bar (Pop up on long press / right click) */}
                    {activeReactionMsg === msg.id && (
                      <div className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1 p-1.5 bg-[#121225] border border-white/10 rounded-full shadow-2xl z-50 animate-fade-in`}>
                        {['🔥', '❤️', '😂', '💯', '👀'].map(emoji => (
                          <button 
                            key={emoji} 
                            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-base transition-all"
                            onClick={() => {
                              setMsgReactions(prev => ({ ...prev, [msg.id]: emoji }))
                              setActiveReactionMsg(null)
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                        <button onClick={() => setActiveReactionMsg(null)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-gray-400 transition-all"><CloseIcon className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a2e] px-4 py-2.5 rounded-2xl rounded-tl-sm border border-white/5">
                  <div className="flex gap-1 items-center h-3">
                    <div className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            {isTyping && !sending && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a2e] px-4 py-2.5 rounded-2xl rounded-tl-sm border border-white/5">
                  <div className="flex gap-1 items-center h-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 sm:p-6 pt-2 bg-[#090912] pb-8 md:pb-6">
            <div className="flex gap-2 sm:gap-3 items-center">
              <div className="flex items-center gap-1 bg-[#121225] rounded-2xl p-1 border border-white/5">
                <button 
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all min-h-[40px] ${showEmojis ? 'bg-purple-500/10 text-purple-400' : 'text-gray-500 hover:text-white'}`}
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="hidden sm:flex w-10 h-10 rounded-xl items-center justify-center text-gray-500 hover:text-white transition-all min-h-[40px]"
                >
                  <Image className="w-5 h-5" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              <div className="flex-1 relative flex items-center">
                <input
                  className="input-dark w-full text-xs sm:text-sm py-3 sm:py-4 px-4 sm:px-6 rounded-2xl border-none bg-[#121225] focus:ring-2 focus:ring-purple-500/50 min-h-[44px]"
                  placeholder={isRecording ? 'Recording...' : 'Type message...'}
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
                    className="w-11 h-11 sm:w-12 sm:h-12 grad-bg rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-500/20 min-h-[44px] min-w-[44px]"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                ) : (
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all min-h-[44px] min-w-[44px] ${
                      isRecording ? 'grad-bg animate-pulse text-white' : 'bg-[#121225] text-gray-500 hover:text-white'
                    }`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            {showEmojis && (
              <div className="absolute bottom-full mb-2 right-4 z-[100] shadow-2xl">
                <Picker 
                  data={data} 
                  onEmojiSelect={(emoji: any) => {
                    setNewMsg(prev => prev + emoji.native)
                    setShowEmojis(false)
                  }}
                  theme="dark"
                  skinTonePosition="none"
                  previewPosition="none"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-[#090912] relative">
          <div className="text-center animate-fade-in">
            <div className="w-24 h-24 grad-bg rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/20 rotate-6 relative animate-pulse">
              <MessageCircle className="w-12 h-12 text-white absolute" />
              <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-[32px]" />
            </div>
            <h2 className="font-syne font-black text-3xl text-white mb-2">Who's sliding into your DMs? 👀</h2>
            <p className="text-gray-600 text-sm max-w-xs mx-auto font-medium mb-6">Follow students on Discover to start vibing 🔥</p>
            <Link to="/discover" className="text-purple-400 font-bold hover:text-purple-300 transition-colors flex items-center justify-center gap-2">
              Go to Discover <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* New Message Modal */}
      {showNewMsgModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="card w-full max-w-md p-6 sm:p-8 animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 grad-bg" />
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-syne font-bold text-2xl text-white tracking-tight">New Message</h2>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Search Comrades</p>
              </div>
              <button onClick={() => setShowNewMsgModal(false)} className="p-2 text-gray-500 hover:text-white transition-all">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search by name..." 
                className="input-dark pl-10 text-sm min-h-[44px]"
                onChange={(e) => fetchAllUsers(e.target.value)}
                onFocus={() => allUsers.length === 0 && fetchAllUsers()}
              />
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto no-scrollbar">
              {loadingUsers ? (
                <div className="flex flex-col items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-2" />
                  <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Searching comrades...</p>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-12 opacity-40">
                  <Users className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-sm font-medium text-white mb-1">No comrades found</p>
                  <p className="text-xs">Follow someone to start chatting!</p>
                </div>
              ) : (
                allUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => startNewChat(u)}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-left group"
                  >
                    <img src={u.photos?.[0]} className="w-12 h-12 rounded-xl object-cover" alt={u.name} />
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm group-hover:text-purple-400 transition-colors">{u.name}</p>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider">{u.campus}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-700 group-hover:text-purple-500" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
