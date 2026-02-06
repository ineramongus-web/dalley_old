import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dkqwxjxbnczcgnroltnd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcXd4anhibmN6Y2ducm9sdG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Njk4OTgsImV4cCI6MjA4MDA0NTg5OH0.zTD1OUcF-C5QO0KfRYpnUH9NNtT-nx0OomKxC5ZI1bs'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Profile type matching the database schema
export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  updated_at: string
  is_verified: boolean
  is_banned: boolean
}
