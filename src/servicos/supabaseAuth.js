import { createClient } from "@supabase/supabase-js";

let cliente;

export function obterAuth() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const chave = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !chave) throw new Error("A autenticação ainda não foi configurada. Consulte a administração do site.");
  cliente ??= createClient(url, chave, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: "pkce" },
  });
  return cliente;
}
