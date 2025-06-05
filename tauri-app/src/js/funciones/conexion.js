import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hbtiimdyrzvwtoorhitj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhidGlpbWR5cnp2d3Rvb3JoaXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNDU4NTEsImV4cCI6MjA2MTYyMTg1MX0.aWp4PcsN3uNSckmLqKWiyapz4dR9PY3G6viUVZpMmwg';

export const supabase = createClient(supabaseUrl, supabaseKey);