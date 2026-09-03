import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aknvhyezfkfjglpfkjdi.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_gqv6WXEo8cVvIVwrLLXuzQ_lqmfSCC6'

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
