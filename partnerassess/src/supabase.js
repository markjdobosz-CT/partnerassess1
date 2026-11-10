import { createClient } from '@supabase/supabase-js'

// Tolerate a pasted REST address such as https://xxxx.supabase.co/rest/v1/
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const configured = Boolean(url && key)

export const supabase = createClient(url || 'https://missing.invalid', key || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
