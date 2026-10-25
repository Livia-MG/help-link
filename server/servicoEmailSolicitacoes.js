import { createTransporter } from "./servicoContato.js";
import { obterSupabaseAdministrativo } from "./supabase.js";

const escapar = (valor) => String(valor ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

export function montarEmailSolicitacao(solicitacao) {
  const aprovada = solicitacao.estado === "aprovada";
  const titulo = aprovada ? "Sua instituição foi aprovada!" : "Resposta à sua solicitação de inclusão";
  const mensagem = aprovada
    ? `A instituição ${solicitacao.dados_ong.name} foi aprovada e já está disponível no Help Link.`
    : `A solicitação de inclusão da instituição ${solicitacao.dados_ong.name} não foi aprovada. Motivo: ${solicitacao.motivo}`;
  return {
    from: `"Help Link" <${process.env.SMTP_USER}>`, to: solicitacao.solicitante_email,
    subject: aprovada ? "Instituição aprovada · Help Link" : "Solicitação não aprovada · Help Link",
    text: `Olá, ${solicitacao.solicitante_nome}.\n\n${mensagem}\n\nProtocolo: ${solicitacao.id}\n\nEquipe Help Link`,
    html: `<html lang="pt-BR"><body style="margin:0;padding:32px 16px;background:#fcfaf7;color:#17261e;font-family:Arial,sans-serif"><div style="max-width:560px;margin:auto;padding:32px;background:white;border:1px solid #e6e2dc;border-radius:20px"><p style="font-size:24px;font-weight:bold">Help <span style="color:#268249">Link</span></p><h1 style="font-size:24px">${titulo}</h1><p>Olá, ${escapar(solicitacao.solicitante_nome)}.</p><p style="line-height:1.7">${escapar(mensagem).replaceAll("\n", "<br>")}</p><p style="font-size:12px;color:#606e66">Protocolo: ${escapar(solicitacao.id)}</p><p>Equipe Help Link</p></div></body></html>`,
  };
}

export async function notificarSolicitacao(id) {
  const supabase = obterSupabaseAdministrativo();
  const { data: solicitacao, error } = await supabase.rpc("reservar_email_solicitacao", { p_id: id });
  if (error) throw error;
  if (!solicitacao) return { enviado: false, message: "E-mail já enviado ou reservado por outra tentativa." };
  let enviado = false;
  let codigo = null;
  try {
    await createTransporter().sendMail(montarEmailSolicitacao(solicitacao));
    enviado = true;
  } catch (erro) {
    codigo = erro.code || erro.name || "SMTP_ERROR";
    console.error("Falha ao notificar solicitação:", { id, codigo });
  }
  const { error: erroAtualizacao } = await supabase.from("solicitacoes_ongs").update({
    email_estado: enviado ? "enviado" : "falha", email_enviado_em: enviado ? new Date().toISOString() : null,
    email_erro: codigo, email_reservado_ate: null, email_reserva: null,
  }).eq("id", id).eq("email_reserva", solicitacao.email_reserva);
  if (erroAtualizacao) throw erroAtualizacao;
  return { enviado, message: enviado ? "Resposta aceita pelo servidor de e-mail." : "Decisão salva. O envio do e-mail falhou; tente reenviar pelo painel." };
}
