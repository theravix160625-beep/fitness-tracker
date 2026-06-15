import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://awbepgvztmrakgwtdvum.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YmVwZ3Z6dG1yYWtnd3RkdnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTA3NTUsImV4cCI6MjA5NzA4Njc1NX0.JTEYnFpwOcrlTaBf-sb4styedByUCAZeY3BET12fZbk'
)
