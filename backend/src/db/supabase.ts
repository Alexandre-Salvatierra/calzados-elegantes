import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const url = process.env.SUPABASE_URL!
const key = process.env.SUPABASE_ANON_KEY!

if (!url || !key) throw new Error('Faltan variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY')

export const supabase = createClient(url, key)
