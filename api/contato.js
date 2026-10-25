import { handleContactPayload } from "../server/servicoContato.js";

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.setHeader("Allow", "POST, OPTIONS");
    return response.status(204).end();
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return response.status(405).json({
      ok: false,
      message: "Metodo nao permitido.",
    });
  }

  let payload;

  try {
    payload = request.body;
  } catch {
    return response.status(400).json({
      ok: false,
      message: "Os dados enviados estao em um formato invalido.",
    });
  }

  const result = await handleContactPayload(payload);
  return response.status(result.status).json(result.body);
}
