// Opt-in: banco remoto real; por padrao SMTP simulado, sem mensagens externas.
import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { obterSupabaseAdministrativo } from "./supabase.js";

const admin = obterSupabaseAdministrativo();
const emailReal = process.argv.includes("--email-real");
const email = emailReal ? process.env.SMTP_USER : `solicitante-${randomUUID()}@example.com`;
const conta = `admin-teste-${randomUUID()}@example.com`;
const senha = `HL!${randomUUID()}`;
const ids = new Set();
let usuarioId;
const inicializacao = emailReal ? 'await import("./server/servidor.js");' : `
  import nodemailer from 'nodemailer';
  let envios = 0;
  nodemailer.createTransport = () => ({ sendMail: async () => {
    if (++envios === 2) throw Object.assign(new Error('Falha simulada'), { code: 'ETIMEDOUT' });
    return {};
  }});
  await import('./server/servidor.js');
`;
const servidor = spawn(process.execPath, ["--input-type=module", "-e", inicializacao], { env: { ...process.env, PORT: "31081" }, stdio: ["ignore", "pipe", "pipe"] });
async function chamar(caminho, method = "GET", dados, token) {
  const resposta = await fetch(`http://127.0.0.1:31081${caminho}`, { method, signal: AbortSignal.timeout(40000), headers: { ...(dados ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(dados ? { body: JSON.stringify(dados) } : {}) });
  return { status: resposta.status, ...await resposta.json() };
}
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Servidor não iniciou.")), 10000);
    servidor.stdout.once("data", () => { clearTimeout(timer); resolve(); });
    servidor.once("error", () => { clearTimeout(timer); reject(new Error("Servidor não iniciou.")); });
  });
  const criado = await admin.auth.admin.createUser({ email: conta, password: senha, email_confirm: true, app_metadata: { help_link_admin: true }, user_metadata: { nome: "Administrador temporário de solicitações" } });
  assert.ifError(criado.error); usuarioId = criado.data.user.id;
  const cliente = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const login = await cliente.auth.signInWithPassword({ email: conta, password: senha });
  assert.ifError(login.error);
  const token = login.data.session.access_token;
  const ong = { name: "ONG temporária de solicitação", shortDescription: "Teste de fluxo", description: "Cadastro temporário removido após a validação.", address: "Rua Teste", neighborhood: "Centro", phone: "123", image: "https://example.com/imagem.png", coordinates: { lat: -20.5, lng: -48.5 }, categories: ["animais"], needs: [], acceptsVolunteers: true, issuesCertificate: false };
  const entrada = { solicitanteNome: "Teste de solicitação", solicitanteEmail: email, ong };
  assert.equal((await chamar("/api/solicitacoes")).status, 401);
  assert.equal((await chamar("/api/solicitacoes", "POST", { ...entrada, solicitanteEmail: "invalido" })).status, 400);
  const primeira = await chamar("/api/solicitacoes", "POST", entrada);
  assert.equal(primeira.status, 201); ids.add(primeira.data.id);
  const segunda = await chamar("/api/solicitacoes", "POST", entrada);
  assert.equal(segunda.status, 201); ids.add(segunda.data.id);
  assert.equal((await chamar(`/api/ongs/${primeira.data.id}`)).status, 404);
  assert.equal((await chamar(`/api/solicitacoes/${primeira.data.id}`)).status, 401);
  const anonimo = await cliente.from("solicitacoes_ongs").select("id");
  assert.equal(anonimo.error, null); // Cliente logado como administrador.
  const publico = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const privado = await publico.from("solicitacoes_ongs").select("id");
  assert.ok(privado.error);
  const invalida = await chamar(`/api/solicitacoes/${primeira.data.id}`, "PATCH", { decisao: "aprovada", ong: { ...ong, categories: ["invalida"] } }, token);
  assert.equal(invalida.status, 400);
  assert.equal((await chamar(`/api/solicitacoes/${primeira.data.id}`, "GET", null, token)).data.estado, "pendente");
  const aprovada = await chamar(`/api/solicitacoes/${primeira.data.id}`, "PATCH", { decisao: "aprovada", ong }, token);
  assert.equal(aprovada.status, 200);
  assert.equal(aprovada.data.solicitacao.estado, "aprovada");
  assert.equal(aprovada.data.notificacao.enviado, true);
  assert.equal((await chamar(`/api/ongs/${primeira.data.id}`)).status, 200);
  assert.equal((await chamar(`/api/solicitacoes/${primeira.data.id}`, "PATCH", { decisao: "recusada", motivo: "Repetição não permitida." }, token)).status, 409);
  const recusada = await chamar(`/api/solicitacoes/${segunda.data.id}`, "PATCH", { decisao: "recusada", motivo: "Teste de recusa: dados insuficientes para publicação." }, token);
  assert.equal(recusada.status, 200);
  assert.equal(recusada.data.solicitacao.estado, "recusada");
  assert.equal(recusada.data.notificacao.enviado, emailReal);
  assert.equal((await chamar(`/api/ongs/${segunda.data.id}`)).status, 404);
  if (!emailReal) {
    const reenvio = await chamar(`/api/solicitacoes/${segunda.data.id}/reenviar`, "POST", null, token);
    assert.equal(reenvio.data.enviado, true);
    const repetido = await chamar(`/api/solicitacoes/${segunda.data.id}/reenviar`, "POST", null, token);
    assert.equal(repetido.data.enviado, false);
  }
  console.log(emailReal ? "Fluxo real aprovado; Google SMTP aceitou as respostas de aprovação e recusa para SMTP_USER. Registros temporários serão removidos." : "Integração aprovada: solicitação pública, privacidade, aprovação, rollback, recusa, e-mail simulado, falha e reenvio sem duplicar decisão.");
} finally {
  servidor.kill();
  for (const id of ids) {
    const exclusao = await admin.from("solicitacoes_ongs").delete().eq("id", id);
    const ong = await admin.from("ongs").delete().eq("id", id);
    if (exclusao.error || ong.error) console.error("Limpeza pendente de solicitação de teste:", id);
  }
  if (usuarioId) {
    const { error } = await admin.auth.admin.deleteUser(usuarioId);
    if (error) console.error("Limpeza pendente de administrador temporário:", usuarioId);
  }
}
