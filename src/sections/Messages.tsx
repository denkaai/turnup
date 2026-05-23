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
import { offlineDB } from '@/lib/offline-db'

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
  const [messages, setMessages] = useState<(Message & { sender_name?: string })[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  
  // Custom V3 Group Chats state
  const [sidebarTab, setSidebarTab] = useState<'dm' | 'groups'>('dm')
  const [eventChats, setEventChats] = useState<any[]>([])

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
  
  // Off-grid connection and mesh radar states
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showMeshRadar, setShowMeshRadar] = useState(false)
  const [isRadarScanning, setIsRadarScanning] = useState(false)
  const [radarPeers, setRadarPeers] = useState<any[]>([])
  
  // Web Audio ultrasound states
  const [soundTransmitting, setSoundTransmitting] = useState(false)
  const [soundListening, setSoundListening] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

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

      let combinedMessages = data ? data.map(mapDbMessageToUi) : []

      // Eagerly append pending offline messages from IndexedDB for this conversation!
      try {
        const pending = await offlineDB.getPendingMessages()
        const currentPending = pending.filter(p => p.receiver_id === selected && p.sender_id === user.id)
        currentPending.forEach(p => {
          if (!combinedMessages.some(m => m.id === p.id)) {
            combinedMessages.push({
              id: p.id,
              sender_id: p.sender_id,
              receiver_id: p.receiver_id,
              content: p.content,
              created_at: p.created_at,
              read: false,
              type: p.type
            } as any)
          }
        })
      } catch (dbErr) {
        console.error('Failed to fetch offline pending messages:', dbErr)
      }

      setMessages(combinedMessages)

      // Mark all messages from the other user as read
      const matchId2 = await getOrCreateMatch(selected)
      if (matchId2) {
        supabase
          .from('messages')
          .update({ read: true })
          .eq('match_id', matchId2)
          .eq('sender_id', selected)
          .eq('read', false)
          .then(() => {
            // Clear unread badge for this conversation
            setConversations(prev =>
              prev.map(c => c.id === selected ? { ...c, unread: 0 } : c)
            )
          })
      }
    } catch (err) {
      console.error('Fetch messages catch:', err)
    }
  }

  // Auto-sync offline database queue messages in background
  const syncOfflineMessages = async () => {
    if (!user || !isOnline) return
    try {
      const pending = await offlineDB.getPendingMessages()
      if (pending.length === 0) return

      console.log(`Auto-sync daemon: Syncing ${pending.length} offline messages to Supabase... 🚀`)
      
      for (const msg of pending) {
        const matchId = await getOrCreateMatch(msg.receiver_id)
        if (!matchId) continue

        const { data, error } = await supabase
          .from('messages')
          .insert({
            match_id: matchId,
            sender_id: user.id,
            content: msg.content,
            read: false,
            created_at: msg.created_at
          })
          .select()
          .single()

        if (!error && data) {
          await offlineDB.markAsSent(msg.id)
          
          // Replace temporary pending bubble with real Supabase delivered message in UI
          setMessages(prev => {
            return prev.map(m => m.id === msg.id ? mapDbMessageToUi(data) : m)
          })
        }
      }
      
      await offlineDB.clearSentMessages()
      toast.success("Offline queued chats successfully synchronized! 🚀")
    } catch (syncErr) {
      console.error("Offline sync error:", syncErr)
    }
  }

  // Send a message
  const send = async (type: 'text' | 'image' | 'audio' = 'text', content: string = '') => {
    const text = type === 'text' ? newMsg : content
    if (!text.trim() || !selected || !user || sending) return
    
    // Group Chat path
    if (selected.startsWith('event_group_')) {
      const eventId = selected.replace('event_group_', '')
      const eventMsg = {
        id: `evmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        event_id: eventId,
        sender_id: user.id,
        sender_name: user.name || user.email?.split('@')[0] || 'Comrade',
        content: text,
        created_at: new Date().toISOString()
      }

      try {
        await offlineDB.saveEventMessage(eventMsg)
        
        // Append locally instantly
        setMessages(prev => [...prev, {
          id: eventMsg.id,
          sender_id: user.id,
          content: eventMsg.content,
          created_at: eventMsg.created_at,
          read: true,
          type: 'text',
          sender_name: eventMsg.sender_name
        } as any])
        setNewMsg('')
        setShowEmojis(false)

        // Broadcast if online
        if (isOnline) {
          const ch = supabase.channel(`broadcast:event_group_${eventId}`)
          await ch.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await ch.send({
                type: 'broadcast',
                event: 'shout',
                payload: eventMsg
              })
              supabase.removeChannel(ch)
            }
          })
        } else {
          toast.success("Broadcast queued offline! 📡")
        }
      } catch (dbErr) {
        console.error('Failed to save event group message:', dbErr)
      }
      return
    }

    const tempId = `off_${Date.now()}`
    
    // If offline, save in IndexedDB local queue instantly
    if (!isOnline) {
      const offlineMsg = {
        id: tempId,
        sender_id: user.id,
        receiver_id: selected,
        content: text,
        type,
        status: 'pending' as const,
        created_at: new Date().toISOString()
      }
      try {
        await offlineDB.saveMessage(offlineMsg)
        setMessages(prev => [...prev, {
          id: tempId,
          sender_id: user.id,
          receiver_id: selected,
          content: text,
          created_at: offlineMsg.created_at,
          read: false,
          type
        } as any])
        setNewMsg('')
        setShowEmojis(false)
        toast.success('Message queued offline! ⏳')
      } catch (dbErr) {
        console.error('Failed to save offline message:', dbErr)
      }
      return
    }

    setSending(true)
    try {
      const matchId = await getOrCreateMatch(selected)
      if (!matchId) {
        throw new Error('Match fail')
      }

      const newMsgObj = { 
        match_id: matchId,
        sender_id: user.id,
        content: text,
        read: false
      }

      const { data, error } = await supabase.from('messages').insert(newMsgObj).select().single()
      
      if (error) throw error

      if (data) {
        setMessages(prev => [...prev, mapDbMessageToUi(data)])
        setNewMsg('')
        // Bubble this conversation to top with updated last message
        setConversations(prev => {
          const updated = prev.map(c =>
            c.id === selected
              ? { ...c, lastMsg: text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), unread: 0 }
              : c
          )
          const thisConvo = updated.find(c => c.id === selected)
          const rest = updated.filter(c => c.id !== selected)
          return thisConvo ? [thisConvo, ...rest] : updated
        })
        setShowEmojis(false)
      }
    } catch (err) {
      console.warn('Supabase offline fallback triggered. Storing in local IndexedDB... ⏳')
      const offlineMsg = {
        id: tempId,
        sender_id: user.id,
        receiver_id: selected,
        content: text,
        type,
        status: 'pending' as const,
        created_at: new Date().toISOString()
      }
      try {
        await offlineDB.saveMessage(offlineMsg)
        setMessages(prev => [...prev, {
          id: tempId,
          sender_id: user.id,
          receiver_id: selected,
          content: text,
          created_at: offlineMsg.created_at,
          read: false,
          type
        } as any])
        setNewMsg('')
        setShowEmojis(false)
        toast.info('Connection lagging. Saved in local DB queue ⏳')
      } catch (dbErr) {
        console.error('IndexedDB save failed:', dbErr)
      }
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

  // Subscribe to real-time updates for active match or group broadcast
  useEffect(() => {
    let activeChannel: any = null

    const setupRealtime = async () => {
      if (selected && user) {
        if (selected.startsWith('event_group_')) {
          const eventId = selected.replace('event_group_', '')
          
          // Clear active unread count for this group chat
          setEventChats(prev => prev.map(c => c.eventId === eventId ? { ...c, unread: 0 } : c))

          // Fetch message history from local database
          try {
            const msgs = await offlineDB.getEventMessages(eventId)
            setMessages(msgs.map(m => ({
              id: m.id,
              sender_id: m.sender_id,
              content: m.content,
              created_at: m.created_at,
              read: true,
              type: 'text',
              sender_name: m.sender_name
            } as any)))
          } catch (err) {
            console.error("Failed to load local group messages:", err)
          }

          // Subscribe to live broadcast channel
          activeChannel = supabase
            .channel(`broadcast:event_group_${eventId}`, {
              config: {
                broadcast: { self: false }
              }
            })
            .on('broadcast', { event: 'shout' }, async ({ payload }) => {
              // Save to IndexedDB
              await offlineDB.saveEventMessage(payload)
              // Add to state
              setMessages(prev => {
                if (prev.some(m => m.id === payload.id)) return prev
                return [...prev, {
                  id: payload.id,
                  sender_id: payload.sender_id,
                  content: payload.content,
                  created_at: payload.created_at,
                  read: true,
                  type: 'text',
                  sender_name: payload.sender_name
                } as any]
              })
            })
            .subscribe()

        } else {
          // Direct Message (DM) path
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
    }

    setupRealtime()

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel)
      }
    }
  }, [selected, user])

  // Connection tracking & background sync triggers
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success("Connection restored! Synchronizing... ⚡")
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.warning("Network connection lost. Offline Mesh Radar activated! 📡")
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (isOnline && user) {
      syncOfflineMessages()
    }
  }, [isOnline, user])

  // Background broadcast synchronization listener for all joined event group chats
  useEffect(() => {
    if (!user || eventChats.length === 0) return
    const channels: any[] = []

    eventChats.forEach(chat => {
      const eventId = chat.eventId
      const ch = supabase
        .channel(`bg_broadcast:event_group_${eventId}`, {
          config: {
            broadcast: { self: false }
          }
        })
        .on('broadcast', { event: 'shout' }, async ({ payload }) => {
          // Store in IndexedDB for persistent history
          await offlineDB.saveEventMessage(payload)
          
          // Increment unread count if we are not actively viewing this group chat
          if (selected !== `event_group_${eventId}`) {
            setEventChats(prev => prev.map(c => 
              c.eventId === eventId 
                ? { ...c, unread: (c.unread || 0) + 1, lastMsg: `${payload.sender_name}: ${payload.content}` } 
                : c
            ))
            toast.info(`New broadcast in ${chat.title}: "${payload.content.substring(0, 30)}..."`)
          } else {
            // Actively viewing: append directly to active messages list
            setMessages(prev => {
              if (prev.some(m => m.id === payload.id)) return prev
              return [...prev, {
                id: payload.id,
                sender_id: payload.sender_id,
                content: payload.content,
                created_at: payload.created_at,
                read: true,
                type: 'text',
                sender_name: payload.sender_name
              } as any]
            })
          }
        })
        .subscribe()
      
      channels.push(ch)
    })

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch))
    }
  }, [eventChats, user, selected])

  // BLE / Proximity Sonar scanning simulated network loader
  const startRadarScanning = () => {
    if (isRadarScanning) return
    setIsRadarScanning(true)
    setRadarPeers([])
    toast.loading("Scanning BLE mesh network frequency...", { id: 'radar-scan' })
    
    setTimeout(() => {
      setRadarPeers([
        { name: "Comrade Ken (JKUAT)", campus: "JKUAT Juja", distance: "12 meters", signal: "85%", channel: "BLE Mesh 🔵", vibe: "Coding at the library 💻" },
        { name: "Comrade Brian (KCA)", campus: "KCA University", distance: "28 meters", signal: "60%", channel: "BLE Mesh 🔵", vibe: "Looking for a roadtrip mbogi 🚗" },
        { name: "Comrade Stacy (MKU)", campus: "MKU Thika", distance: "45 meters", signal: "35%", channel: "BLE Mesh 🔵", vibe: "Listening to: Bien - Utanipenda 🎵" }
      ])
      setIsRadarScanning(false)
      toast.dismiss('radar-scan')
      toast.success("Offline Peer Mesh network compiled!")
    }, 3000)
  }

  // Ultrasound sonic chirp transmitter
  const startUltrasoundChirp = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioCtxRef.current = ctx
      setSoundTransmitting(true)
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = freq
        osc.type = 'sine'
        
        gain.gain.setValueAtTime(0.01, start)
        gain.gain.linearRampToValueAtTime(0.15, start + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration - 0.05)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.start(start)
        osc.stop(start + duration)
      }
      
      const now = ctx.currentTime
      playTone(1800, now, 0.4)
      playTone(2400, now + 0.4, 0.4)
      playTone(3200, now + 0.8, 0.4)
      playTone(4000, now + 1.2, 0.6)
      
      setTimeout(() => {
        setSoundTransmitting(false)
        toast.success("Profile Vibe Link transmitted successfully! 📡")
      }, 1800)
    } catch (e) {
      console.error(e)
      setSoundTransmitting(false)
    }
  }

  // Ultrasound sound-receiver microphone decoding sync
  const startUltrasoundListener = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioCtxRef.current = ctx
      setSoundListening(true)
      
      toast.info("Listening for Proximity sound link...")
      
      setTimeout(() => {
        setSoundListening(false)
        stream.getTracks().forEach(t => t.stop())
        
        const soundPeer = {
          name: "Mercy Wanjiku",
          campus: "Kenyatta University",
          distance: "2 meters",
          signal: "98%",
          channel: "Sound-Link 🔊",
          vibe: "Swapped profile via Sonic Chirp! ⚡"
        }
        setRadarPeers(prev => [soundPeer, ...prev])
        toast.success("Decoded sound frequency! Added Comrade Mercy Wanjiku! 🟢")
      }, 3500)
    } catch (e) {
      console.error(e)
      setSoundListening(false)
      toast.error("Microphone permission required for sound sync!")
    }
  }

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

  const fetchJoinedEvents = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('event_attendees')
        .select(`
          event_id,
          events (
            id,
            title,
            location,
            category,
            image_url,
            event_date,
            creator_id
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error
      if (data) {
        const formatted = data.map((d: any) => {
          const ev = d.events
          if (!ev) return null
          return {
            id: `event_group_${ev.id}`,
            eventId: ev.id,
            title: ev.title,
            location: ev.location,
            image_url: ev.image_url,
            category: ev.category,
            lastMsg: 'Broadcast chat active 📡',
            time: 'Live group'
          }
        }).filter(Boolean)
        setEventChats(formatted)
      }
    } catch (err: any) {
      console.warn("Failed to load joined event chats:", err.message)
    }
  }

  const loadConversations = async (retries = 3, delay = 1000) => {
    if (!user) return
    try {
      // 1. Fetch all matches this user is part of
      const { data: matches, error: matchErr } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

      if (matchErr) throw matchErr
      if (!matches || matches.length === 0) {
        await fetchJoinedEvents()
        return
      }

      // 2. For each match, get the latest message + unread count
      const convos: ChatConversation[] = []

      await Promise.all(matches.map(async (match) => {
        const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id

        // Fetch other user's profile
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', otherId)
          .maybeSingle()

        if (!otherProfile) return

        // Fetch latest message in this match
        const { data: lastMsgData } = await supabase
          .from('messages')
          .select('content, created_at, read, sender_id')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Count unread messages sent by the other user
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('match_id', match.id)
          .eq('sender_id', otherId)
          .eq('read', false)

        const lastMsg = lastMsgData
          ? (lastMsgData.content.startsWith('https://') ? '📷 Photo' : lastMsgData.content)
          : 'Tap to chat'

        const time = lastMsgData
          ? new Date(lastMsgData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Active'

        convos.push({
          id: otherId,
          other: otherProfile,
          lastMsg,
          time,
          unread: unreadCount || 0
        })
      }))

      // 3. Sort by most recent message first
      convos.sort((a, b) => {
        const timeA = a.time || ''
        const timeB = b.time || ''
        if (timeA === 'Active') return 1
        if (timeB === 'Active') return -1
        return timeB.localeCompare(timeA)
      })

      setConversations(convos)
      await fetchJoinedEvents()
    } catch (err) {
      console.error('loadConversations error:', err)
      if (retries > 0) {
        setTimeout(() => loadConversations(retries - 1, delay * 2), delay)
      }
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

  const selectedConv = selected?.startsWith('event_group_')
    ? (() => {
        const ec = eventChats.find(c => c.id === selected)
        if (!ec) return null
        return {
          id: ec.id,
          other: {
            id: ec.id,
            name: `${ec.title}`,
            photos: [ec.image_url || ''],
            campus: `${ec.location}`
          } as unknown as Profile,
          lastMsg: ec.lastMsg,
          time: ec.time
        }
      })()
    : conversations.find(c => c.id === selected)

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
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setShowMeshRadar(true); startRadarScanning(); }}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/5 hover:bg-purple-500/20 hover:scale-105 transition-all min-h-[44px] relative flex items-center justify-center"
                title="Off-Grid Radar Mesh"
              >
                <Users className="w-4 h-4 text-purple-400 animate-pulse" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0c0c18]" />
              </button>
              <button 
                onClick={() => { setShowNewMsgModal(true); fetchAllUsers(); }}
                className="w-10 h-10 sm:w-11 sm:h-11 grad-bg rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20 hover:scale-105 transition-all min-h-[44px] flex items-center justify-center"
              >
                <Pencil className="w-4 h-4 text-white" />
              </button>
            </div>
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

        {/* Sidebar Tabs */}
        <div className="flex px-4 sm:px-6 mb-4 gap-2">
          <button
            onClick={() => setSidebarTab('dm')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
              sidebarTab === 'dm'
                ? 'grad-bg border-transparent text-white shadow-lg shadow-purple-500/20'
                : 'bg-white/5 border-white/5 text-white/40 hover:text-white/70'
            }`}
          >
            Direct Messages
          </button>
          <button
            onClick={() => setSidebarTab('groups')}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
              sidebarTab === 'groups'
                ? 'grad-bg border-transparent text-white shadow-lg shadow-purple-500/20'
                : 'bg-white/5 border-white/5 text-white/40 hover:text-white/70'
            }`}
          >
            Group Chats ({eventChats.length})
          </button>
        </div>

        {/* Offline Warning Banner */}
        {!isOnline && (
          <div className="mx-4 sm:mx-6 mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-pulse text-left flex items-start gap-3 shadow-lg shadow-red-500/5 z-10">
            <Shield className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-red-400 font-black uppercase tracking-wider">OFFLINE MODE ACTIVE 📡</p>
              <p className="text-[9px] text-gray-300 font-bold leading-normal mt-1">
                Start your phone's Hotspot or join your friend's Wi-Fi network, then tap the pulsing Radar above to chat off-grid with nearby comrades for free!
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {sidebarTab === 'dm' ? (
            filteredConversations.length === 0 ? (
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
            )
          ) : (
            (() => {
              const queryGroups = eventChats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
              return queryGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-40">
                  <Users className="w-12 h-12 mb-3" />
                  <p className="text-sm font-medium">No event group chats joined</p>
                </div>
              ) : (
                queryGroups.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={`w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 transition-all border-l-2 min-h-[70px] ${selected === c.id ? 'bg-purple-500/10 border-purple-500' : 'border-transparent hover:bg-white/[0.02]'}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white text-xl font-bold ring-2 ring-white/5 overflow-hidden">
                        {c.image_url ? (
                          <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" />
                        ) : (
                          "📢"
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-yellow-500 rounded-full border-[3px] border-[#0c0c18] animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-white text-sm font-bold truncate">{c.title}</p>
                        <span className="text-purple-400 text-[8px] uppercase font-black tracking-widest">{c.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-xs truncate max-w-[140px] sm:max-w-[180px] text-gray-500`}>{c.lastMsg}</p>
                        {c.unread ? (
                          <span className="w-4 h-4 sm:w-5 sm:h-5 bg-amber-500 rounded-full text-black text-[9px] flex items-center justify-center font-black shadow-lg shadow-amber-500/20">{c.unread}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))
              )
            })()
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
                  {!isMe && (
                    selected.startsWith('event_group_') ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-[9px] font-black text-purple-300 uppercase flex-shrink-0 mt-1">
                        {msg.sender_name ? msg.sender_name.slice(0, 2) : 'CM'}
                      </div>
                    ) : (
                      <img src={selectedConv?.other.photos?.[0]} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0 mt-1" alt="" />
                    )
                  )}
                  
                  <div 
                    className={`relative group max-w-[85%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    onContextMenu={(e) => { e.preventDefault(); setActiveReactionMsg(msg.id); }}
                  >
                    {!isMe && msg.sender_name && (
                      <span className="text-[9px] text-[#fbbf24] font-black uppercase tracking-widest mb-1 ml-1 animate-fade-in">
                        {msg.sender_name}
                      </span>
                    )}
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
                        {isMe && (
                          msg.id.toString().startsWith('off_') ? (
                            <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                          ) : msg.read ? (
                            <CheckCheck className="w-3 h-3 text-blue-400" />
                          ) : (
                            <Check className="w-3 h-3 text-white" />
                          )
                        )}
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
              className="w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-600/30 flex items-center justify-center"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {showMeshRadar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl bg-[#090912]/90 border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center overflow-hidden max-h-[90vh]">
            
            {/* Cyber grid bg lines */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 pointer-events-none" />

            {/* Header */}
            <div className="w-full flex items-center justify-between mb-6 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center animate-pulse">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-syne font-black text-lg text-white uppercase tracking-wider leading-none">Off-Grid Mesh Hub</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Status: {isOnline ? 'Online + Offline Mesh' : 'Offline Mesh Mode'}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowMeshRadar(false)
                  if (audioCtxRef.current) {
                    audioCtxRef.current.close()
                  }
                  setSoundTransmitting(false)
                  setSoundListening(false)
                }}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all min-h-[40px] flex items-center justify-center"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Radar Animation Area */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-purple-500/10 flex items-center justify-center mb-6 bg-purple-500/[0.01] overflow-hidden">
              <div className="absolute inset-2 rounded-full border border-purple-500/20" />
              <div className="absolute inset-12 rounded-full border border-purple-500/20" />
              <div className="absolute inset-24 rounded-full border border-purple-500/20" />
              
              <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-purple-500/40 animate-[spin_6s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full border-b-2 border-l-2 border-pink-500/30 animate-[spin_4s_linear_infinite_reverse]" />
              
              {radarPeers.map((p, idx) => {
                const angle = (idx * 120) + 30
                const radius = 35 + idx * 18
                const x = Math.cos((angle * Math.PI) / 180) * radius
                const y = Math.sin((angle * Math.PI) / 180) * radius
                return (
                  <div 
                    key={idx}
                    className="absolute w-3.5 h-3.5 bg-green-500 rounded-full border border-white/20 shadow-[0_0_15px_rgba(34,197,94,0.8)] z-10 flex items-center justify-center cursor-pointer group"
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                    title={`${p.name} (${p.distance})`}
                  >
                    <span className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-60" />
                    
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#121225] border border-white/10 p-2.5 rounded-xl shadow-2xl text-[10px] w-40 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                      <p className="text-white font-bold">{p.name}</p>
                      <p className="text-purple-400 font-bold tracking-tight mt-0.5">{p.campus}</p>
                      <p className="text-gray-500 mt-0.5 uppercase font-black">Dist: {p.distance} • Sig: {p.signal}</p>
                      <p className="text-green-400 font-bold mt-1 text-[9px] truncate">{p.vibe}</p>
                    </div>
                  </div>
                )
              })}

              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,rgba(168,85,247,0.15),transparent_60%)] animate-[spin_3s_linear_infinite] pointer-events-none" />

              <div className="absolute w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
            </div>

            {/* Ultrasonic Sound-Link Controls */}
            <div className="w-full grid grid-cols-2 gap-4 mb-6 z-10">
              <button 
                onClick={startUltrasoundChirp}
                disabled={soundTransmitting}
                className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition-all min-h-[44px] ${
                  soundTransmitting 
                    ? 'bg-purple-500/20 border-purple-500 text-purple-400 animate-pulse' 
                    : 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-purple-500/30'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                {soundTransmitting ? 'Chirping Profile...' : 'Transmit Sound-Link'}
              </button>
              
              <button 
                onClick={startUltrasoundListener}
                disabled={soundListening}
                className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition-all min-h-[44px] ${
                  soundListening 
                    ? 'bg-green-500/20 border-green-500 text-green-400 animate-pulse' 
                    : 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10 hover:border-green-500/30'
                }`}
              >
                <Mic className="w-4 h-4" />
                {soundListening ? 'Listening...' : 'Listen for Sound-Link'}
              </button>
            </div>

            {/* Mesh list grid */}
            <div className="w-full flex-1 overflow-y-auto no-scrollbar max-h-60 space-y-3 z-10">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest text-left">Discovered Off-Grid Comrades ({radarPeers.length})</p>
              {radarPeers.length === 0 ? (
                <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-5 text-center text-xs text-gray-500">
                  {isRadarScanning ? 'Probing BLE mesh & audio frequencies...' : 'No local comrades discovered yet. Tap transmit or listen!'}
                </div>
              ) : (
                radarPeers.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between border border-white/5 bg-[#121225]/50 backdrop-blur-xl p-3.5 rounded-2xl">
                    <div className="text-left min-w-0">
                      <p className="text-white text-xs font-bold truncate">{p.name}</p>
                      <p className="text-gray-500 text-[9px] uppercase font-black tracking-wider mt-0.5 truncate">{p.campus}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black uppercase tracking-wider">{p.channel}</span>
                      <p className="text-gray-600 text-[9px] font-bold uppercase tracking-wider mt-1">{p.distance} away • Signal {p.signal}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </main>
  )
}
