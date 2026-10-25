import { z } from "zod";
import { obterSupabase } from "./supabase.js";

const booleano = z.enum(["true", "false"]).transform((valor) => valor === "true").optional();
const esquemaFiltros = z.object({
  categoria: z.string().trim().min(1).max(80).optional(),
  bairro: z.string().trim().min(1).max(120).optional(),
  aceitaVoluntarios: booleano,
  emiteCertificado: booleano,
});
// Os aliases preservam o formato dos objetos que as telas ja utilizam.
const camposOng = `
  id, name:nome, shortDescription:descricao_curta, description:descricao,
  address:endereco, neighborhood:bairro, latitude, longitude,
  acceptsVolunteers:aceita_voluntarios, issuesCertificate:emite_certificado,
  phone:telefone, image:imagem, needs:necessidades,
  ongs_categorias(categoria_id, ordem)
`;

function formatarOng({ latitude, longitude, ongs_categorias, ...ong }) {
  return {
    ...ong,
    coordinates: { lat: latitude, lng: longitude },
    categories: ongs_categorias.sort((a, b) => a.ordem - b.ordem).map((item) => item.categoria_id),
  };
}

function responderErro(erro) {
  console.error("Erro ao consultar ONGs no Supabase:", erro.message);
  return {
    status: 503,
    body: { ok: false, message: "Nao foi possivel consultar os dados agora. Tente novamente mais tarde." },
  };
}

export async function listarOngs(filtros = {}) {
  const resultado = esquemaFiltros.safeParse(filtros);
  if (!resultado.success) {
    return { status: 400, body: { ok: false, message: "Filtros invalidos. Use true ou false nos campos booleanos e textos nao vazios." } };
  }

  try {
    const supabase = obterSupabase();
    const { categoria, bairro, aceitaVoluntarios, emiteCertificado } = resultado.data;
    let consulta = supabase.from("ongs").select(camposOng).order("ordem").order("id");

    if (categoria) {
      const { data, error } = await supabase.from("ongs_categorias").select("ong_id").eq("categoria_id", categoria);
      if (error) throw error;
      if (!data.length) return { status: 200, body: { ok: true, data: [] } };
      consulta = consulta.in("id", data.map((item) => item.ong_id));
    }
    if (bairro) consulta = consulta.eq("bairro", bairro);
    if (aceitaVoluntarios !== undefined) consulta = consulta.eq("aceita_voluntarios", aceitaVoluntarios);
    if (emiteCertificado !== undefined) consulta = consulta.eq("emite_certificado", emiteCertificado);

    const { data, error } = await consulta;
    if (error) throw error;
    return { status: 200, body: { ok: true, data: data.map(formatarOng) } };
  } catch (erro) {
    return responderErro(erro);
  }
}

export async function consultarOng(id) {
  if (typeof id !== "string" || !id.trim() || id.length > 150) {
    return { status: 400, body: { ok: false, message: "Informe um ID de ONG valido." } };
  }
  try {
    const { data, error } = await obterSupabase().from("ongs").select(camposOng).eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) return { status: 404, body: { ok: false, message: "ONG nao encontrada." } };
    return { status: 200, body: { ok: true, data: formatarOng(data) } };
  } catch (erro) {
    return responderErro(erro);
  }
}

export async function listarCategorias() {
  try {
    const { data, error } = await obterSupabase().from("categorias").select("id, nome").order("ordem");
    if (error) throw error;
    return { status: 200, body: { ok: true, data } };
  } catch (erro) {
    return responderErro(erro);
  }
}
