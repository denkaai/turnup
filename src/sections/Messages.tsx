import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Send, ArrowLeft, Shield, Loader2, MessageCircle, CheckCheck, Check, Smile, Plus, Mic, Image, MapPin, Play, Square, Trash2, Video, Phone, Search, Pencil, Users, ChevronRight, MicOff, VolumeX, Volume2, VideoOff, PhoneOff } from 'lucide-react'
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
  const { user, setActiveChatId } = useAuthStore()
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
  const [activeCall, setActiveCall] = useState<{ type: 'audio' | 'video'; user: Profile } | null>(null)
  const [callMuted, setCallMuted] = useState(false)
  const [callSpeaker, setCallSpeaker] = useState(true)
  const [callVideoEnabled, setCallVideoEnabled] = useState(true)
  const [callTimer, setCallTimer] = useState(0)
  const callIntervalRef = useRef<any>(null)
  
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const recordingTimer = useRef<any>(null)

  const EMOJIS = ['😊', '😂', '🔥', '❤️', '🙌', '😎', '😍', '✨', '👌', '🙏', '💯', '🤔', '😢', '💀', '👀', '🎉', '🤩', '🤣', '😅', '🙄', '😏', '😉', '😜', '🥳', '🥺', '😡', '😱', '🤯', '😴', '🤤', '🍻', '🍕', '🍔', '🚀', '🌈', '💎', '💡', '✅', '❌', '👋']
  const filteredConversations = conversations.filter(c => c.other.name.toLowerCase().includes(searchQuery.toLowerCase()))

  useEffect(() => {
    loadConversations()
  }, [user])  // Helper to map DB message back to UI-friendly representation (resolves column mismatch)
  const mapDbMessageToUi = (dbMsg: any): Message => {
    let type: 'text' | 'image' | 'audio' = 'text'
    if (dbMsg.content && dbMsg.content.startsWith('https://') && dbMsg.content.includes('/chat/')) {
      if (dbMsg.content.includes('.webm') || dbMsg.content.includes('.ogg') || dbMsg.content.includes('.mp3')) {
        type = 'audio'
      } else {
        type = 'image'
      }
    }
    return {
      ...dbMsg,
      type
    }
  }

  // Get or Create Match record between current user and other selected user
  const getOrCreateMatch = async (otherId: string): Promise<string | null> => {
    if (!user) return null
    try {
      // Fetch match where either user1 is current and user2 is selected, or vice versa
      const { data: existingMatch, error: selectError } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherId}),and(user1_id.eq.${otherId},user2_id.eq.${user.id})`)
        .maybeSingle()

      if (selectError) {
        console.error('Error selecting match:', selectError)
        return null
      }

      if (existingMatch) {
        return existingMatch.id
      }

      // Create new match if none exists (user1 is initiator)
      const { data: newMatch, error: insertError } = await supabase
        .from('matches')
        .insert({ user1_id: user.id, user2_id: otherId })
        .select('id')
        .single()

      if (insertError) {
        console.error('Error inserting match:', insertError)
        return null
      }

      return newMatch?.id || null
    } catch (err) {
      console.error('getOrCreateMatch catch:', err)
      return null
    }
  }

  // Fetch messages belonging to current match
  const fetchMessages = async () => {
    if (!user || !selected) return
    try {
      const matchId = await getOrCreateMatch(selected)
      if (!matchId) {
        toast.error('Failed to establish a secure connection')
        return
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Failed to fetch messages:', error)
        toast.error('Failed to load messages')
        return
      }

      if (data) {
        setMessages(data.map(mapDbMessageToUi))
      }
    } catch (err) {
      console.error('Fetch messages catch:', err)
    }
  }

  // Send a message
  const send = async (type: 'text' | 'image' | 'audio' = 'text', content: string = '') => {
    const text = type === 'text' ? newMsg : content
    if (!text.trim() || !selected || !user || sending) return
    
    setSending(true)
    try {
      const matchId = await getOrCreateMatch(selected)
      if (!matchId) {
        toast.error('Failed to connect to chat match')
        return
      }

      const newMsgObj = { 
        match_id: matchId,
        sender_id: user.id,
        content: text,
        read: false
      }

      const { data, error } = await supabase.from('messages').insert(newMsgObj).select().single()
      
      if (error) {
        console.error('Message send error:', error)
        toast.error('Failed to send message')
        throw error
      }

      if (data) {
        setMessages(prev => [...prev, mapDbMessageToUi(data)])
        setNewMsg('')
        setShowEmojis(false)
      }
    } catch (err) {
      console.error('Send catch:', err)
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

  // Subscribe to real-time updates for active match
  useEffect(() => {
    let activeChannel: any = null

    const setupRealtime = async () => {
      if (selected && user) {
        await fetchMessages()
        
        const matchId = await getOrCreateMatch(selected)
        if (!matchId) return

        activeChannel = supabase
          .channel(`chat:${matchId}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `match_id=eq.${matchId}`
          }, (payload) => {
            const msg = payload.new as any
            if (msg.sender_id !== user.id) {
              setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev
                return [...prev, mapDbMessageToUi(msg)]
              })
            }
          })
          .subscribe()
      }
    }

    setupRealtime()

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel)
      }
    }
  }, [selected, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    setActiveChatId(selected)
    if (selected) {
      setIsTyping(true)
      const timer = setTimeout(() => setIsTyping(false), 3000 + Math.random() * 2000)
      return () => {
        clearTimeout(timer)
        setActiveChatId(null)
      }
    }
    return () => setActiveChatId(null)
  }, [selected])

  useEffect(() => {
    if (activeCall) {
      setCallTimer(0)
      callIntervalRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1)
      }, 1000)
    } else {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current)
    }
    return () => {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current)
    }
  }, [activeCall])

  const loadConversations = async () => {
    if (!user) return
    try {
      // Fetch matching/active chats
      const { data: profiles } = await supabase.from('profiles').select('*').neq('id', user.id).limit(20)
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

  const handleCall = (type: 'audio' | 'video') => {
    if (selectedConv?.other) {
      setActiveCall({ type, user: selectedConv.other })
      toast.success(`Initiating Year 2050 ${type === 'audio' ? 'Voice Link' : 'Holographic Stream'}... ⚡`)
    }
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
    <main className="h-screen pt-14 flex bg-[#090912] overflow-hidden relative">
      {/* Kenyan Flag Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 z-[70] flex">
        <div className="flex-1 bg-black" />
        <div className="flex-1 bg-red-600" />
        <div className="flex-1 bg-green-600" />
      </div>
      {/* Sidebar - Hidden on mobile when chat is selected */}
      <div className={`${selected ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-[380px] border-r border-white/5 bg-[#0c0c18] pb-16 md:pb-0`}>
        <div className="p-4 sm:p-6 pb-2">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h1 className="font-syne font-black text-xl sm:text-2xl text-white">Messages</h1>
            <button 
              onClick={() => { setShowNewMsgModal(true); fetchAllUsers(); }}
              className="w-10 h-10 sm:w-11 sm:h-11 grad-bg rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20 hover:scale-105 transition-all min-h-[44px]"
            >
              <Pencil className="w-4 h-4 text-white" />
            </button>
          </div>
          
          <div className="relative group mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-all"
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
        <div className="flex-1 flex flex-col bg-[#090912] fixed inset-0 z-[60] md:relative md:z-0 md:inset-auto">
          <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 glass border-b border-white/5 z-10 min-h-[64px]">
            <button onClick={() => setSelected(null)} className="md:hidden p-2 text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-shrink-0">
              <img src={selectedConv?.other.photos?.[0]} alt={selectedConv?.other.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#090912]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">{selectedConv?.other.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest truncate">{selectedConv?.other.campus}</p>
                <div className="flex items-center gap-1 text-green-500 text-[9px] font-black uppercase">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" /> Online
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <button onClick={() => handleCall('audio')} className="p-2 sm:p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </button>
              <button onClick={() => handleCall('video')} className="p-2 sm:p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center">
                <Video className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 no-scrollbar bg-[#090912]">
            {messages.map((msg, idx) => {
              const isMe = msg.sender_id === user?.id
              const reaction = msgReactions[msg.id]

              return (
                <div key={msg.id} className={`flex gap-2 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && <img src={selectedConv?.other.photos?.[0]} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0 mt-1" alt="" />}
                  
                  <div 
                    className={`relative group max-w-[85%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    onContextMenu={(e) => { e.preventDefault(); setActiveReactionMsg(msg.id); }}
                  >
                    {/* The bubble */}
                    <div className={`relative px-4 py-3 rounded-[24px] text-sm shadow-xl ${
                      isMe 
                        ? 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-br-sm shadow-purple-500/10' 
                        : 'bg-[#1a1a2e]/90 backdrop-blur-xl border border-white/5 text-gray-200 rounded-bl-sm'
                    }`}>
                      {msg.type === 'text' && <div className="leading-relaxed">{msg.content}</div>}
                      {msg.type === 'image' && (
                        <div className="p-1">
                          <img src={msg.content} className="max-w-[200px] sm:max-w-[300px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity" alt="Sent photo" onClick={() => window.open(msg.content, '_blank')} />
                        </div>
                      )}
                      {msg.type === 'audio' && (
                        <div className="p-1 flex items-center gap-3 min-w-[200px]">
                          <button 
                            onClick={() => {
                              const audio = new Audio(msg.content)
                              audio.play()
                            }}
                            className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-purple-400"
                          >
                            <Play className="w-4 h-4 text-purple-400 fill-purple-400/20" />
                          </button>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Voice Note</span>
                            <span className="text-xs text-white/80">Tap to Listen</span>
                          </div>
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

          {/* Input Area - Year 2050 Futuristic Glassmorphic Telegram Pill */}
          <div className="p-3 bg-transparent pb-safe-area mb-2 md:mb-4 px-4 sm:px-6 z-[80] relative">
            <div className="flex gap-2 sm:gap-3 items-center bg-[#121225]/85 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] shadow-2xl relative shadow-purple-500/5 group focus-within:border-purple-500/30 transition-all">
              
              {/* Attachment Controls */}
              <div className="flex items-center gap-1.5 pl-1">
                <button 
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all min-h-[40px] ${showEmojis ? 'bg-purple-500/10 text-purple-400' : 'text-gray-400 hover:text-white'}`}
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                {/* Paperclip Attachment button - fully visible on mobile! */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all min-h-[40px]"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              </div>

              {/* Text Input / Recording HUD */}
              <div className="flex-1 relative flex items-center">
                {isRecording ? (
                  <div className="flex items-center justify-between w-full pr-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      {/* Pulse Indicator */}
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                      {/* Bouncing Audio Soundwave */}
                      <div className="flex items-center gap-0.5">
                        <div className="w-0.5 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                        <div className="w-0.5 h-5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '100ms', animationDuration: '0.6s' }} />
                        <div className="w-0.5 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '0.6s' }} />
                        <div className="w-0.5 h-6 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.6s' }} />
                        <div className="w-0.5 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '0.6s' }} />
                      </div>
                      <span className="text-red-500 font-mono text-sm font-bold">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs font-black uppercase tracking-widest animate-pulse">
                      Slide to cancel
                    </span>
                  </div>
                ) : (
                  <input
                    className="w-full text-xs sm:text-sm py-2 px-3 bg-transparent border-none text-white focus:outline-none placeholder:text-gray-500 min-h-[40px] focus:ring-0"
                    placeholder="Type message..."
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && send()}
                    disabled={isRecording}
                  />
                )}
              </div>

              {/* Dynamic Send / Microphone Button */}
              <div className="pr-1">
                {newMsg.trim() ? (
                  <button
                    onClick={() => send()}
                    disabled={sending}
                    className="w-9 h-9 sm:w-10 sm:h-10 grad-bg rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-500/30 min-h-[40px] min-w-[40px]"
                  >
                    <Send className="w-4.5 h-4.5 text-white" />
                  </button>
                ) : (
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all min-h-[40px] min-w-[40px] ${
                      isRecording 
                        ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' 
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Mic className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>
            </div>
            
            {showEmojis && (
              <div className="absolute bottom-full mb-3 right-4 z-[100] shadow-2xl rounded-3xl overflow-hidden border border-white/10">
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

      {/* Year 2050 Futuristic Call Dashboard Overlay */}
      {activeCall && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-between p-6 sm:p-12 bg-[#030305]/95 backdrop-blur-xl text-white overflow-hidden select-none animate-fade-in">
          {/* Futuristic Grid Backdrop Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          {/* Cybernetic glowing background gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gradient-to-tr from-purple-600/20 to-pink-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

          {/* Header HUD */}
          <div className="relative z-10 w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-gray-500">
                {activeCall.type === 'video' ? 'Holographic Stream' : 'Neural Voice Link'} Secure
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold tracking-widest text-purple-400">
              TIME: {Math.floor(callTimer / 60)}:{(callTimer % 60).toString().padStart(2, '0')}
            </div>
          </div>

          {/* Central Hologram Ring & Profile Display */}
          <div className="relative z-10 flex flex-col items-center my-auto">
            <div className="relative w-40 h-40 sm:w-56 sm:h-56 flex items-center justify-center">
              
              {/* Spinning Cyber Rings */}
              <div className="absolute inset-0 rounded-full border border-dashed border-purple-500/30 animate-[spin_20s_linear_infinite]" />
              <div className="absolute -inset-4 rounded-full border border-purple-500/20 animate-[spin_30s_linear_infinite_reverse]" />
              <div className="absolute -inset-8 rounded-full border border-double border-pink-500/10 animate-[spin_40s_linear_infinite]" />
              
              {/* Double Glowing Pulsing Orbs */}
              <div className="absolute inset-0 rounded-full bg-purple-500/5 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-0 rounded-full bg-pink-500/5 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />

              {/* Central Avatar */}
              <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full overflow-hidden border-2 border-purple-500/30 relative z-20 shadow-[0_0_50px_rgba(168,85,247,0.3)]">
                {activeCall.type === 'video' && callVideoEnabled ? (
                  <div className="w-full h-full bg-[#05050a] relative">
                    <img src={activeCall.user.photos?.[0]} className="w-full h-full object-cover brightness-[0.7] contrast-[1.1]" alt="" />
                    {/* Simulated holographic scanning lines */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent bg-[length:100%_4px] animate-[pulse_1s_infinite] pointer-events-none" />
                    <div className="absolute inset-0 bg-purple-500/5 mix-blend-color" />
                  </div>
                ) : (
                  <img src={activeCall.user.photos?.[0]} className="w-full h-full object-cover" alt="" />
                )}
              </div>
            </div>

            {/* Caller Metadata */}
            <h3 className="font-syne font-black text-2xl sm:text-4xl text-white mt-10 tracking-tight text-center">
              {activeCall.user.name}
            </h3>
            <p className="text-gray-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mt-2 text-center">
              {activeCall.user.campus}
            </p>
            
            {/* Real-time Voice Frequency Bar Visualizer */}
            {!callMuted && (
              <div className="flex items-end gap-1.5 h-12 mt-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(bar => {
                  const animDuration = 0.4 + Math.random() * 0.5
                  const animDelay = Math.random() * 0.5
                  return (
                    <div 
                      key={bar}
                      className="w-1.5 rounded-full bg-gradient-to-t from-purple-500 to-pink-500 animate-[bounce_0.6s_ease-in-out_infinite]"
                      style={{ 
                        height: `${20 + Math.random() * 80}%`,
                        animationDuration: `${animDuration}s`,
                        animationDelay: `-${animDelay}s`
                      }}
                    />
                  )
                })}
              </div>
            )}
            {callMuted && (
              <span className="text-[10px] uppercase font-black tracking-widest text-red-500 mt-8 animate-pulse">
                Audio link muted
              </span>
            )}
          </div>

          {/* Action Call Controls Panel */}
          <div className="relative z-10 w-full max-w-md flex items-center justify-around bg-white/[0.02] border border-white/5 backdrop-blur-2xl rounded-full p-4 shadow-[0_15px_50px_rgba(0,0,0,0.5)]">
            
            {/* Mute Button */}
            <button 
              onClick={() => setCallMuted(!callMuted)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                callMuted ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {callMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Video Toggle Button (Only for video calls) */}
            {activeCall.type === 'video' && (
              <button 
                onClick={() => setCallVideoEnabled(!callVideoEnabled)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  !callVideoEnabled ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {!callVideoEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            )}

            {/* Speaker Button (Only for audio calls) */}
            {activeCall.type === 'audio' && (
              <button 
                onClick={() => setCallSpeaker(!callSpeaker)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  callSpeaker ? 'bg-purple-500/10 text-purple-400' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {callSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            )}

            {/* Red Decline/End Call Button */}
            <button 
              onClick={() => {
                setActiveCall(null)
                toast.error('Call ended')
              }}
              className="w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-600/30"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
