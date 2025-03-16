// Configurazione centralizzata di Supabase
const SUPABASE_URL = 'https://mzcrogljyijgyzcxczcr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16Y3JvZ2xqeWlqZ3l6Y3hjemNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2NTg4NzQsImV4cCI6MjA1NTIzNDg3NH0.NRvCsTtpEZ6HSMkEwsGc9IrnOVqwtfoVNS7CTKPCB5A';

function createSupabaseClient() {
    return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Esponi funzione
window.createSupabaseClient = createSupabaseClient;