import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

interface AuthState {
  user: any | null
  profile: Profile | null
  loading: boolean
  profileError: string | null
  activeChatId: string | null
  setUser: (user: any) => void
  setProfile: (profile: Profile | null) => void
  signOut: () => Promise<void>
  fetchProfile: (userId: string) => Promise<Profile | null>
  clearProfileError: () => void
  setActiveChatId: (id: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: false,
  profileError: null,
  activeChatId: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  clearProfileError: () => set({ profileError: null }),
  setActiveChatId: (activeChatId) => set({ activeChatId }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, loading: false, profileError: null })
  },
  fetchProfile: async (userId: string) => {
    set({ loading: true, profileError: null })
    
    const maxRetries = 3
    let delay = 1000 // Start with 1 second delay
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const fetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
        
        // Increased timeout to 15 seconds to support slower cellular connections gracefully
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Fetch timeout')), 15000)
        )

        const res = await Promise.race([fetchPromise, timeoutPromise]) as any
        const { data, error } = res
        
        if (error) {
          console.error(`fetchProfile error (attempt ${attempt}):`, error.message)
          throw new Error(error.message)
        }
        
        const prof = data || null
        set({ profile: prof, profileError: null, loading: false })
        return prof
      } catch (err: any) {
        console.warn(`fetchProfile attempt ${attempt} failed:`, err.message || err)
        if (attempt === maxRetries) {
          const errMsg = err.message || 'Failed to connect to TurnUp server'
          console.error('fetchProfile final exception or timeout:', errMsg)
          set({ profileError: errMsg, loading: false })
          throw err
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2 // Increase delay for the next attempt (e.g. 1s, then 2s)
      }
    }
    
    set({ loading: false })
    return null
  },
}))
