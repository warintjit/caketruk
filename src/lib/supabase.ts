import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // เตือนตอน dev ถ้ายังไม่ได้ตั้งค่า .env (ดู .env.example)
  console.warn(
    '[supabase] ยังไม่ได้ตั้งค่า VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — ดูไฟล์ .env.example',
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'public-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
