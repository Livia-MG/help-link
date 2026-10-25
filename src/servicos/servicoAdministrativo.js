import { obterAuth } from "./supabaseAuth";

export async function consultarAdministrativo(caminho, { metodo = "GET", dados, signal } = {}) {
  const { data: { session }, error } = await obterAuth().auth.getSession();
  if (error || !session) {
    const erro = new Error("Sua sessão expirou. Entre novamente.");
    erro.status = 401;
    window.dispatchEvent(new Event("sessao-administrativa-invalida"));
    throw erro;
  }
  const resposta = await fetch(caminho, {
    method: metodo, signal, cache: "no-store",
    headers: { Authorization: `Bearer ${session.access_token}`, ...(dados ? { "Content-Type": "application/json" } : {}) },
    ...(dados ? { body: JSON.stringify(dados) } : {}),
  });
  if (resposta.status === 204) return null;
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok || !corpo.ok) {
    const erro = new Error(corpo.message || "Não foi possível concluir a operação.");
    erro.status = resposta.status;
    if ([401, 403].includes(resposta.status)) window.dispatchEvent(new Event("sessao-administrativa-invalida"));
    throw erro;
  }
  return corpo.data;
}
