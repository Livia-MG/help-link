import { autenticarAdministrador, tratarErroApi } from "./servicoAutenticacao.js";
import { atualizarUsuario, consultarUsuario, criarUsuario, excluirUsuario, listarUsuarios } from "./servicoUsuarios.js";
import { excluirOng, salvarOng } from "./servicoCadastroOngs.js";

export function obterId(request) {
  return request.params?.id ?? request.query?.id;
}

export async function responderAdministrativo(request, response, metodos, executar) {
  response.setHeader("Allow", [...metodos, "OPTIONS"].join(", "));
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "OPTIONS") return response.status(204).end();
  if (!metodos.includes(request.method)) return response.status(405).json({ ok: false, message: "Método não permitido." });
  try {
    const contexto = await autenticarAdministrador(request);
    const resultado = await executar(contexto);
    if (request.method === "DELETE") return response.status(204).end();
    return response.status(request.method === "POST" ? 201 : 200).json({ ok: true, data: resultado });
  } catch (erro) {
    const resultado = tratarErroApi(erro);
    return response.status(resultado.status).json(resultado.body);
  }
}

export function rotaUsuarios(request, response) {
  return responderAdministrativo(request, response, ["GET", "POST"], () => request.method === "GET" ? listarUsuarios() : criarUsuario(request.body));
}

export function rotaUsuario(request, response) {
  return responderAdministrativo(request, response, ["GET", "PATCH", "DELETE"], ({ usuario }) => {
    const id = obterId(request);
    if (request.method === "GET") return consultarUsuario(id);
    if (request.method === "PATCH") return atualizarUsuario(id, request.body);
    return excluirUsuario(id, usuario);
  });
}

export function rotaMeuPerfil(request, response) {
  return responderAdministrativo(request, response, ["GET"], ({ usuario }) => usuario);
}

export function rotaSalvarOng(request, response) {
  return responderAdministrativo(request, response, ["POST"], ({ supabase }) => salvarOng(supabase, null, request.body));
}

export function rotaAlterarOng(request, response) {
  return responderAdministrativo(request, response, ["PATCH", "DELETE"], ({ supabase }) => request.method === "PATCH"
    ? salvarOng(supabase, obterId(request), request.body)
    : excluirOng(supabase, obterId(request)));
}
