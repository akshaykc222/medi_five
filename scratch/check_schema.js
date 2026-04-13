import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://zcsrlmhdmmxmmdhrvmlv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjc3JsbWhkbW14bW1kaHJ2bWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNjU3ODMsImV4cCI6MjA3ODg0MTc4M30.Oh7DEy0SUoWGkg9IdiVK_8M51iNGS_3Ovjz8fjIFsgU')

async function check() {
  const { data, error } = await supabase.from('bookings').select('*').limit(1)
  if (error) {
    console.error('Error:', error.message)
    return
  }
  console.log('Columns:', Object.keys(data[0] || {}))
}
check()
