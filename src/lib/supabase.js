import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zeqitbdwqrvelzdmnrjw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplcWl0YmR3cXJ2ZWx6ZG1ucmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzMxMzMsImV4cCI6MjA2ODk0OTEzM30.N_pyfbcPrvNFC1X3NkYuDwkUC8jbmndghcYBAQJ7XCY'

if(SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

export default createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})