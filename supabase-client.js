// Configuração compartilhada do Supabase — SC Feira 1823
// A chave abaixo é pública (publishable/anon), feita para ser exposta no navegador.
// A segurança real está nas políticas RLS configuradas no banco.
const SUPABASE_URL = 'https://mkcrlqyssfotdqnxsbfq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eZ_A1lJDdMGrhje0c6pGvQ_ni7OUbdp';

function getSupabaseClient() {
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
