// Teste opt-in: cria somente registros temporarios e os remove ao terminar.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { obterSupabaseAdministrativo } from "./supabase.js";

const administrativo = obterSupabaseAdministrativo();
const clientes = [];
const idsUsuarios = new Set();
const idsOngs = new Set();
const porta = "31078";
const servidor = spawn(process.execPath, ["server/servidor.js"], { env: { ...process.env, PORT: porta }, stdio: ["ignore", "pipe", "pipe"] });

async function chamar(caminho, token, method = "GET", body) {
  const resposta = await fetch(`http://127.0.0.1:${porta}${caminho}`, {
    method, signal: AbortSignal.timeout(20000),
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: resposta.status, corpo: resposta.status === 204 ? null : await resposta.json() };
}

async function entrar(email, senha) {
  const cliente = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  clientes.push(cliente);
  const { data, error } = await cliente.auth.signInWithPassword({ email, password: senha });
  assert.ifError(error);
  return { cliente, token: data.session.access_token };
}

try {
  await new Promise((resolve, reject) => {
    const limite = setTimeout(() => reject(new Error("Servidor não iniciou.")), 10000);
    servidor.stdout.once("data", () => { clearTimeout(limite); resolve(); });
    servidor.once("error", () => { clearTimeout(limite); reject(new Error("Servidor não iniciou.")); });
  });
  const senha = `HL!${randomUUID()}`;
  const email = `help-link-teste-${randomUUID()}@example.com`;
  const { data, error } = await administrativo.auth.admin.createUser({ email, password: senha, email_confirm: true, app_metadata: { help_link_admin: true }, user_metadata: { nome: "Teste temporário integração" } });
  assert.ifError(error);
  idsUsuarios.add(data.user.id);
  const { cliente, token } = await entrar(email, senha);
  assert.equal((await chamar("/api/usuarios")).status, 401);
  assert.equal((await chamar("/api/usuarios", "invalido")).status, 401);
  assert.equal((await chamar("/api/autenticacao/me", token)).corpo.data.id, data.user.id);
  assert.equal((await chamar(`/api/usuarios/${data.user.id}`, token, "DELETE")).status, 409);
  const outroEmail = `help-link-teste-${randomUUID()}@example.com`;
  const criado = await chamar("/api/usuarios", token, "POST", { nome: "Usuário temporário", email: outroEmail, senha });
  assert.equal(criado.status, 201);
  idsUsuarios.add(criado.corpo.data.id);
  const id = criado.corpo.data.id;
  assert.equal((await chamar("/api/usuarios", token, "POST", { nome: "Duplicado", email: outroEmail, senha })).status, 409);
  assert.equal((await chamar(`/api/usuarios/${id}`, token)).status, 200);
  const novaSenha = `HL!${randomUUID()}`;
  const emailAtualizado = `help-link-teste-${randomUUID()}@example.com`;
  const atualizado = await chamar(`/api/usuarios/${id}`, token, "PATCH", { nome: "Nome atualizado", email: emailAtualizado, senha: novaSenha });
  assert.equal(atualizado.status, 200);
  assert.equal(atualizado.corpo.data.nome, "Nome atualizado");
  assert.equal(atualizado.corpo.data.email, emailAtualizado);
  const outraSessao = await entrar(emailAtualizado, novaSenha);
  assert.equal((await chamar(`/api/usuarios/${id}`, token, "DELETE")).status, 204);
  idsUsuarios.delete(id);
  assert.equal((await chamar("/api/usuarios", outraSessao.token)).status, 401);

  const { data: comum, error: erroComum } = await administrativo.auth.admin.createUser({ email: `help-link-teste-${randomUUID()}@example.com`, password: senha, email_confirm: true, user_metadata: { nome: "Sem acesso", help_link_admin: true } });
  assert.ifError(erroComum); idsUsuarios.add(comum.user.id);
  const sessaoComum = await entrar(comum.user.email, senha);
  assert.equal((await chamar("/api/usuarios", sessaoComum.token)).status, 403);

  const ong = { name: "ONG temporária integração", shortDescription: "Teste temporário", description: "Registro removido ao finalizar a validação.", address: "Rua Teste", neighborhood: "Centro", coordinates: { lat: -20.5, lng: -48.5 }, acceptsVolunteers: true, issuesCertificate: false, phone: "(17) 0000-0000", image: "https://example.com/teste.png", categories: ["pessoas", "saude"], needs: ["Teste"] };
  assert.equal((await chamar("/api/ongs", null, "POST", ong)).status, 401);
  assert.equal((await chamar("/api/ongs", sessaoComum.token, "POST", ong)).status, 403);
  const nova = await chamar("/api/ongs", token, "POST", ong);
  assert.equal(nova.status, 201);
  const idOng = nova.corpo.data.id; idsOngs.add(idOng);
  assert.equal((await chamar(`/api/ongs/${idOng}`, token, "PATCH", { name: "ONG editada", categories: ["animais"] })).status, 200);
  assert.equal((await chamar(`/api/ongs/${idOng}`, token, "PATCH", { name: "Não persistir", categories: ["invalida"] })).status, 400);
  const consulta = await chamar(`/api/ongs/${idOng}`);
  assert.equal(consulta.corpo.data.name, "ONG editada");
  assert.deepEqual(consulta.corpo.data.categories, ["animais"]);
  const negado = await sessaoComum.cliente.from("ongs").update({ nome: "Indevido" }).eq("id", idOng).select("id");
  assert.equal(negado.data?.length || 0, 0);
  assert.equal((await chamar(`/api/ongs/${idOng}`, token, "DELETE")).status, 204); idsOngs.delete(idOng);
  assert.equal((await chamar(`/api/ongs/${idOng}`)).status, 404);

  // generateLink cria um token de recuperação sem enviar mensagem.
  const recuperacao = await administrativo.auth.admin.generateLink({ type: "recovery", email });
  assert.ifError(recuperacao.error);
  const recuperado = await cliente.auth.verifyOtp({ token_hash: recuperacao.data.properties.hashed_token, type: "recovery" });
  assert.ifError(recuperado.error);
  const repetido = await cliente.auth.verifyOtp({ token_hash: recuperacao.data.properties.hashed_token, type: "recovery" });
  assert.ok(repetido.error);
  console.log("Integração real aprovada: autenticação, 401/403, usuários, senhas, autoexclusão, sessão revogada, CRUD de ONGs, rollback, RLS e recuperação sem envio de e-mail.");
} finally {
  servidor.kill();
  for (const id of idsOngs) {
    const { error } = await administrativo.from("ongs").delete().eq("id", id);
    if (error) console.error("Limpeza pendente de ONG de teste:", id);
  }
  for (const id of idsUsuarios) {
    const { error } = await administrativo.auth.admin.deleteUser(id);
    if (error) console.error("Limpeza pendente de conta de teste:", id);
  }
  for (const cliente of clientes) cliente.auth.stopAutoRefresh();
}
