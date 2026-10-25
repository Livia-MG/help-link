import { responderAdministrativo, obterId } from "./rotasAdministrativas.js";
import { tratarErroApi } from "./servicoAutenticacao.js";
import { analisarSolicitacao, consultarSolicitacao, criarSolicitacao, listarSolicitacoes, reenviarResposta } from "./servicoSolicitacoes.js";

export async function rotaSolicitacoes(request, response) {
  if (request.method === "GET") return responderAdministrativo(request, response, ["GET"], ({ supabase }) => listarSolicitacoes(supabase));
  response.setHeader("Allow", "GET, POST, OPTIONS");
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST") return response.status(405).json({ ok: false, message: "Método não permitido." });
  try {
    const data = await criarSolicitacao(request);
    return response.status(201).json({ ok: true, data });
  } catch (erro) {
    const resultado = tratarErroApi(erro);
    if (resultado.status === 429) response.setHeader("Retry-After", "3600");
    return response.status(resultado.status).json(resultado.body);
  }
}

export function rotaSolicitacao(request, response) {
  return responderAdministrativo(request, response, ["GET", "PATCH"], ({ supabase }) => request.method === "GET"
    ? consultarSolicitacao(supabase, obterId(request))
    : analisarSolicitacao(supabase, obterId(request), request.body));
}

export function rotaReenviarSolicitacao(request, response) {
  return responderAdministrativo(request, response, ["POST"], ({ supabase }) => reenviarResposta(supabase, obterId(request)));
}
