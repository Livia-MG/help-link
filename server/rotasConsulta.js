import { consultarOng, listarCategorias, listarOngs } from "./servicoOngs.js";
import { rotaAlterarOng, rotaSalvarOng } from "./rotasAdministrativas.js";

async function responderConsulta(request, response, consultar, permitir = "GET, OPTIONS") {
  response.setHeader("Allow", permitir);
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "GET") {
    return response.status(405).json({ ok: false, message: "Metodo nao permitido." });
  }
  const resultado = await consultar();
  return response.status(resultado.status).json(resultado.body);
}

export function rotaListarOngs(request, response) {
  if (request.method === "POST") return rotaSalvarOng(request, response);
  if (request.method === "OPTIONS") {
    response.setHeader("Allow", "GET, POST, OPTIONS");
    return response.status(204).end();
  }
  return responderConsulta(request, response, () => listarOngs(request.query), "GET, POST, OPTIONS");
}

export function rotaConsultarOng(request, response) {
  if (["PATCH", "DELETE"].includes(request.method)) return rotaAlterarOng(request, response);
  if (request.method === "OPTIONS") {
    response.setHeader("Allow", "GET, PATCH, DELETE, OPTIONS");
    return response.status(204).end();
  }
  return responderConsulta(request, response, () => consultarOng(request.params?.id ?? request.query?.id), "GET, PATCH, DELETE, OPTIONS");
}

export function rotaListarCategorias(request, response) {
  return responderConsulta(request, response, listarCategorias);
}
