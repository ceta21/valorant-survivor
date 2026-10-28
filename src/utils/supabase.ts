import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cliente único de Supabase. Es null si el proyecto no está configurado (p. ej. scripts en Node):
// entonces el juego funciona solo en modo invitado y con ranking local.
const env = import.meta.env ?? {};
const URL = env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const KEY = env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = URL && KEY
  ? createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'valorant-survivors-auth' } })
  : null;
