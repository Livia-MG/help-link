import { createClient } from "@supabase/supabase-js";

let cliente;
let clienteAdministrativo;
const opcoesAuth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

export function obterSupabase() {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !chave) {
    throw new Error("Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no servidor.");
  }

  cliente ??= createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  return cliente;
}

export function obterSupabaseAutenticado(token) {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !chave) throw new Error("Supabase não configurado no servidor.");
  return createClient(url, chave, {
    auth: opcoesAuth,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export function obterSupabaseAdministrativo() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    throw new Error("Configure SUPABASE_SECRET_KEY somente no servidor.");
  }
  clienteAdministrativo ??= createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: opcoesAuth });
  return clienteAdministrativo;
}
