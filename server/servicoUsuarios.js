import { z } from "zod";
import { obterSupabaseAdministrativo } from "./supabase.js";
import { ErroApi, validarEntrada } from "./servicoAutenticacao.js";

const campos = "id, nome, email, criado_em, atualizado_em";
const esquemaUsuario = z.object({
  nome: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres.").max(100),
  email: z.string().trim().email("Informe um e-mail válido.").toLowerCase().max(254),
  senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(128),
}).strict();

export async function listarUsuarios() {
  const { data, error } = await obterSupabaseAdministrativo().from("usuarios").select(campos).order("nome").order("id");
  if (error) throw error;
  return data;
}

export async function consultarUsuario(id) {
  validarEntrada(z.uuid("Identificador de usuário inválido."), id);
  const { data, error } = await obterSupabaseAdministrativo().from("usuarios").select(campos).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ErroApi(404, "Usuário não encontrado.");
  return data;
}

export async function criarUsuario(entrada) {
  const { nome, email, senha } = validarEntrada(esquemaUsuario, entrada);
  const { data, error } = await obterSupabaseAdministrativo().auth.admin.createUser({
    email, password: senha, email_confirm: true,
    app_metadata: { help_link_admin: true }, user_metadata: { nome },
  });
  if (error) throw error;
  // O trigger sincroniza perfil e identidade na mesma transação do Auth.
  return consultarUsuario(data.user.id);
}

export async function atualizarUsuario(id, entrada) {
  const dados = validarEntrada(esquemaUsuario.partial().refine((valor) => Object.keys(valor).length > 0, "Informe os campos que deseja alterar."), entrada);
  const atual = await consultarUsuario(id);
  const alteracoes = {};
  if (dados.nome !== undefined) alteracoes.user_metadata = { nome: dados.nome };
  if (dados.email !== undefined && dados.email !== atual.email) {
    alteracoes.email = dados.email;
    alteracoes.email_confirm = true;
  }
  if (dados.senha !== undefined) alteracoes.password = dados.senha;
  if (Object.keys(alteracoes).length) {
    const { error } = await obterSupabaseAdministrativo().auth.admin.updateUserById(id, alteracoes);
    if (error) throw error;
  }
  return consultarUsuario(id);
}

export async function excluirUsuario(id, usuarioAtual) {
  validarEntrada(z.uuid("Identificador de usuário inválido."), id);
  if (id.toLowerCase() === usuarioAtual.id.toLowerCase()) throw new ErroApi(409, "Você não pode excluir sua própria conta.");
  await consultarUsuario(id);
  const { error } = await obterSupabaseAdministrativo().auth.admin.deleteUser(id);
  if (error) throw error;
}
