import { supabase } from './supabase'
import { toast } from 'sonner'

export const handleSupabaseError = (error: any) => {
  if (!error) return null

  // 1. Silent skip for missing columns
  if (error.code === 'PGRST204' || error.message?.includes('column') || error.message?.includes('does not exist')) {
    console.warn('Supabase: Skipping operation due to missing column:', error.message)
    return 'SKIP'
  }

  // 2. JWT Expired
  if (error.message?.includes('JWT expired') || error.status === 401) {
    console.error('Session expired, redirecting to login...')
    window.location.href = '/auth'
    return 'REDIRECT'
  }

  // 3. Network Error
  if (error.message === 'Failed to fetch' || error.code === 'FETCH_ERROR') {
    toast.error('Connection issue. Check your internet and try again.')
    return 'NETWORK_ERROR'
  }

  // 4. Fallback friendly message
  console.error('Supabase Error:', error)
  // Only show generic error for critical failures
  if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned" for .single()
    toast.error('Something went wrong. Please try again later.')
  }
  
  return 'ERROR'
}

export const safeProfileUpsert = async (data: any) => {
  try {
    const { error } = await supabase.from('profiles').upsert(data)
    if (error) {
      const handled = handleSupabaseError(error)
      if (handled === 'SKIP') {
        // If column missing, try saving without the likely culprit (whatsapp_number)
        const { whatsapp_number, ...rest } = data
        console.log('Retrying profile save without whatsapp_number...')
        const { error: retryError } = await supabase.from('profiles').upsert(rest)
        if (retryError) handleSupabaseError(retryError)
      }
    }
    return !error
  } catch (err) {
    console.error('Critical save error:', err)
    return false
  }
}
