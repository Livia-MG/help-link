import { randomUUID } from "node:crypto";
import { z } from "zod";
import { consultarOng } from "./servicoOngs.js";
import { ErroApi, validarEntrada } from "./servicoAutenticacao.js";

const texto = (limite) => z.string().trim().min(1, "Preencha os campos obrigatórios.").max(limite);
export const esquemaOng = z.object({
  name: texto(200), shortDescription: texto(500), description: texto(10000),
  address: texto(500), neighborhood: texto(120), phone: texto(50),
  image: z.url("Informe uma URL de imagem válida.").max(2048).refine((url) => new URL(url).protocol === "https:", "A imagem deve usar uma URL HTTPS."),
  coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).strict(),
  categories: z.array(texto(80)).min(1, "Selecione ao menos uma categoria.").max(20).refine((lista) => new Set(lista).size === lista.length, "Não repita categorias."),
  needs: z.array(texto(200)).max(50), acceptsVolunteers: z.boolean(), issuesCertificate: z.boolean(),
}).strict();

export async function salvarOng(supabase, id, entrada) {
  let dados = validarEntrada(id ? esquemaOng.partial().refine((valor) => Object.keys(valor).length > 0, "Informe os campos que deseja alterar.") : esquemaOng, entrada);
  if (id) {
    const atual = await consultarOng(id);
    if (atual.status !== 200) throw new ErroApi(atual.status, atual.body.message);
    const { id: _id, ...camposAtuais } = atual.body.data;
    void _id;
    dados = validarEntrada(esquemaOng, { ...camposAtuais, ...dados });
  }
  const identificador = id || randomUUID();
  const { error } = await supabase.rpc("salvar_ong", { p_id: identificador, p_dados: dados, p_criar: !id });
  if (error) throw error;
  const resultado = await consultarOng(identificador);
  if (resultado.status !== 200) throw new ErroApi(resultado.status, resultado.body.message);
  return resultado.body.data;
}

export async function excluirOng(supabase, id) {
  if (typeof id !== "string" || !id || id.length > 150) throw new ErroApi(400, "Identificador inválido.");
  const { data, error } = await supabase.from("ongs").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data.length) throw new ErroApi(404, "Instituição não encontrada.");
}
