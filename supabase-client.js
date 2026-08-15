// Configuração compartilhada do Supabase — SC Feira 1823
// A chave abaixo é pública (anon), feita para ser exposta no navegador.
// A segurança real está nas políticas RLS configuradas no banco.
const SUPABASE_URL = 'https://mkcrlqyssfotdqnxsbfq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rY3JscXlzc2ZvdGRxbnhzYmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NjMxNTksImV4cCI6MjEwMjMzOTE1OX0.C5QV2CY6E2ckTBKkBR74sBfXi1H7L7G9jyX_-wdOnvc';

function getSupabaseClient() {
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
