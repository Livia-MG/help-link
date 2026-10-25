import { obterSupabaseAutenticado } from "./supabase.js";

export class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

export async function autenticarAdministrador(request) {
  const cabecalho = request.headers.authorization;
  const token = typeof cabecalho === "string" ? /^Bearer ([^\s]+)$/i.exec(cabecalho)?.[1] : null;
  if (!token) throw new ErroApi(401, "Entre na sua conta para continuar.");
  const supabase = obterSupabaseAutenticado(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    if (error.status >= 500 || error.name === "AuthRetryableFetchError") throw error;
    throw new ErroApi(401, "Sua sessão expirou. Entre novamente.");
  }
  if (!data.user) throw new ErroApi(401, "Sua sessão expirou. Entre novamente.");
  const { data: usuario, error: erroPerfil } = await supabase.from("usuarios").select("id, nome, email, criado_em, atualizado_em").eq("id", data.user.id).maybeSingle();
  if (erroPerfil) throw erroPerfil;
  if (!usuario || data.user.app_metadata?.help_link_admin !== true) {
    throw new ErroApi(403, "Sua conta não tem acesso administrativo.");
  }
  return { supabase, usuario };
}

export function validarEntrada(esquema, entrada) {
  const resultado = esquema.safeParse(entrada);
  if (!resultado.success) throw new ErroApi(400, resultado.error.issues[0]?.message || "Revise os dados enviados.");
  return resultado.data;
}

export function tratarErroApi(erro) {
  if (erro instanceof ErroApi) return { status: erro.status, body: { ok: false, message: erro.message } };
  const codigo = erro.code;
  if (["23505", "email_exists", "email_already_exists", "user_already_exists"].includes(codigo)) {
    return { status: 409, body: { ok: false, message: "Já existe um cadastro com esse e-mail ou identificador." } };
  }
  if (["23503", "23514", "22P02", "22023", "23502", "validation_failed", "weak_password"].includes(codigo)) {
    return { status: 400, body: { ok: false, message: "Dados inválidos. Confira os campos e as categorias selecionadas." } };
  }
  if (["P0002", "user_not_found"].includes(codigo)) return { status: 404, body: { ok: false, message: "Cadastro não encontrado." } };
  if (codigo === "42501") return { status: 403, body: { ok: false, message: "Operação não permitida." } };
  console.error("Falha na API administrativa:", { codigo: codigo || erro.name });
  return { status: 503, body: { ok: false, message: "Não foi possível concluir a operação agora. Tente novamente." } };
}
