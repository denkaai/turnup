import { supabase } from './supabase'
import { toast } from 'sonner'

export const handleSupabaseError = (error: any) => {
  if (!error) return null
  if (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('does not exist')) {
    console.warn('Supabase: Skipping operation due to missing column:', error.message)
    return 'SKIP'
  }
  if (error.message?.includes('JWT expired') || error.status === 401) {
    console.error('Session expired, redirecting to login...')
    window.location.href = '/auth'
    return 'REDIRECT'
  }
  if (error.message === 'Failed to fetch' || error.code === 'FETCH_ERROR') {
    toast.error('Connection issue. Check your internet and try again.')
    return 'NETWORK_ERROR'
  }
  console.error('Supabase Error:', error)
  if (error.code !== 'PGRST116') {
    toast.error('Something went wrong. Please try again later.')
  }
  return 'ERROR'
}

export const safeProfileUpsert = async (data: any): Promise<boolean> => {
  try {
    const upsertPromise = supabase.from('profiles').upsert(data)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Save timeout')), 5000)
    )
    const { error } = await Promise.race([upsertPromise, timeoutPromise]) as any
    if (error) {
      const handled = handleSupabaseError(error)
      if (handled === 'SKIP') {
        const { whatsapp_number, ...rest } = data
        const { error: retryError } = await supabase.from('profiles').upsert(rest)
        if (retryError) { handleSupabaseError(retryError); return false }
        return true
      }
      return false
    }
    return true
  } catch (err: any) {
    // Timeout no longer silently returns true — callers get false and show an error
    if (err.message === 'Save timeout') {
      console.warn('Profile save timed out')
      toast.error('Save is taking too long. Check your connection and try again.')
      return false
    }
    console.error('Critical save error:', err)
    return false
  }
}
