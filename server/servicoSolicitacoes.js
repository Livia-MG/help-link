import { createHmac } from "node:crypto";
import { z } from "zod";
import { esquemaOng } from "./servicoCadastroOngs.js";
import { ErroApi, validarEntrada } from "./servicoAutenticacao.js";
import { obterSupabaseAdministrativo } from "./supabase.js";
import { notificarSolicitacao } from "./servicoEmailSolicitacoes.js";

const esquemaSolicitacao = z.object({
  solicitanteNome: z.string().trim().min(2, "Informe seu nome.").max(100),
  solicitanteEmail: z.string().trim().email("Informe seu e-mail válido.").toLowerCase().max(254),
  ong: esquemaOng,
  website: z.string().max(200).optional().default(""),
}).strict();
const campos = "id, solicitante_nome, solicitante_email, dados_ong, estado, motivo, criado_em, analisado_em, analisado_por, ong_id, email_estado, email_enviado_em, email_tentativas, email_erro, email_reservado_ate";

export async function criarSolicitacao(request) {
  const dados = validarEntrada(esquemaSolicitacao, request.body);
  if (dados.website) return { id: null, estado: "pendente" };
  const supabase = obterSupabaseAdministrativo();
  const encaminhado = request.headers["x-forwarded-for"];
  const ip = process.env.VERCEL && typeof encaminhado === "string" ? encaminhado.split(",")[0].trim() : request.socket?.remoteAddress || "local";
  const ipHash = createHmac("sha256", process.env.SUPABASE_SECRET_KEY).update(ip).digest("hex");
  const { data, error } = await supabase.rpc("registrar_solicitacao_ong", {
    p_nome: dados.solicitanteNome, p_email: dados.solicitanteEmail, p_dados: dados.ong, p_ip_hash: ipHash,
  });
  if (error?.code === "P0429") throw new ErroApi(429, "Limite de solicitações atingido. Tente novamente mais tarde.");
  if (error) throw error;
  return data;
}

export async function listarSolicitacoes(supabase) {
  const { data, error } = await supabase.from("solicitacoes_ongs").select(campos).order("criado_em", { ascending: false });
  if (error) throw error;
  return data;
}

export async function consultarSolicitacao(supabase, id) {
  validarEntrada(z.uuid("Protocolo inválido."), id);
  const { data, error } = await supabase.from("solicitacoes_ongs").select(campos).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ErroApi(404, "Solicitação não encontrada.");
  return data;
}

export async function analisarSolicitacao(supabase, id, entrada) {
  const atual = await consultarSolicitacao(supabase, id);
  const dados = validarEntrada(z.discriminatedUnion("decisao", [
    z.object({ decisao: z.literal("aprovada"), ong: esquemaOng }).strict(),
    z.object({ decisao: z.literal("recusada"), motivo: z.string().trim().min(10, "Informe o motivo da recusa com pelo menos 10 caracteres.").max(1000) }).strict(),
  ]), entrada);
  if (atual.estado !== "pendente") throw new ErroApi(409, "Esta solicitação já foi analisada.");
  const { error } = await supabase.rpc("analisar_solicitacao_ong", {
    p_id: id, p_decisao: dados.decisao, p_motivo: dados.motivo || null, p_dados: dados.ong || null,
  });
  if (error?.code === "P0409") throw new ErroApi(409, "Esta solicitação já foi analisada.");
  if (error) throw error;
  let notificacao;
  try { notificacao = await notificarSolicitacao(id); }
  catch { notificacao = { enviado: false, message: "Decisão salva. Não foi possível confirmar o e-mail; confira o painel e reenvie se necessário." }; }
  return { solicitacao: await consultarSolicitacao(supabase, id), notificacao };
}

export async function reenviarResposta(supabase, id) {
  const solicitacao = await consultarSolicitacao(supabase, id);
  if (solicitacao.estado === "pendente") throw new ErroApi(409, "Analise a solicitação antes de enviar a resposta.");
  return notificarSolicitacao(id);
}
