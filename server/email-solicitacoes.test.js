import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import nodemailer from "nodemailer";
import { montarEmailSolicitacao, notificarSolicitacao } from "./servicoEmailSolicitacoes.js";

const solicitacao = { id: "11111111-1111-4111-8111-111111111111", estado: "recusada", solicitante_nome: "<script>nome</script>", solicitante_email: "pessoa@example.com", dados_ong: { name: "ONG <teste>" }, motivo: "Dados <insuficientes> para confirmar.", email_reserva: "22222222-2222-4222-8222-222222222222" };

test("respostas de aprovacao/recusa incluem protocolo e escapam conteudo do visitante", () => {
  const recusa = montarEmailSolicitacao(solicitacao);
  assert.match(recusa.text, /Dados <insuficientes>/);
  assert.ok(recusa.text.includes(solicitacao.id));
  assert.doesNotMatch(recusa.html, /<script>/);
  assert.match(recusa.html, /&lt;script&gt;/);
  const aprovacao = montarEmailSolicitacao({ ...solicitacao, estado: "aprovada" });
  assert.match(aprovacao.subject, /aprovada/);
  assert.doesNotMatch(aprovacao.text, /insuficientes/);
});

test("notificacao registra sucesso, falha SMTP e impede repetir e-mail ja enviado", async (t) => {
  const variaveis = { SUPABASE_URL: "", SUPABASE_SECRET_KEY: "secret-teste", SMTP_HOST: "smtp.example.com", SMTP_PORT: "465", SMTP_SECURE: "true", SMTP_USER: "contato@example.com", SMTP_PASS: "senha-teste" };
  const antigas = Object.fromEntries(Object.keys(variaveis).map((chave) => [chave, process.env[chave]]));
  let reservar = true;
  let atualizacao;
  const servidor = createServer(async (req, res) => {
    let corpo = ""; for await (const parte of req) corpo += parte;
    res.setHeader("Content-Type", "application/json");
    if (req.url.startsWith("/rest/v1/rpc/reservar_email_solicitacao")) res.end(JSON.stringify(reservar ? solicitacao : null));
    else {
      assert.equal(req.method, "PATCH");
      assert.ok(decodeURIComponent(req.url).includes(`email_reserva=eq.${solicitacao.email_reserva}`));
      atualizacao = JSON.parse(corpo); res.end("null");
    }
  });
  await new Promise((resolve) => servidor.listen(0, "127.0.0.1", resolve));
  Object.assign(process.env, variaveis, { SUPABASE_URL: `http://127.0.0.1:${servidor.address().port}` });
  let falhar = false;
  const enviar = t.mock.fn(async () => { if (falhar) throw Object.assign(new Error("privado"), { code: "ETIMEDOUT" }); return {}; });
  t.mock.method(nodemailer, "createTransport", () => ({ sendMail: enviar }));
  t.mock.method(console, "error", () => {});
  try {
    assert.equal((await notificarSolicitacao(solicitacao.id)).enviado, true);
    assert.equal(atualizacao.email_estado, "enviado");
    assert.ok(atualizacao.email_enviado_em);
    falhar = true;
    assert.equal((await notificarSolicitacao(solicitacao.id)).enviado, false);
    assert.equal(atualizacao.email_estado, "falha");
    assert.equal(atualizacao.email_erro, "ETIMEDOUT");
    reservar = false;
    assert.equal((await notificarSolicitacao(solicitacao.id)).enviado, false);
    assert.equal(enviar.mock.calls.length, 2);
  } finally {
    await new Promise((resolve) => servidor.close(resolve));
    for (const [chave, valor] of Object.entries(antigas)) { if (valor === undefined) delete process.env[chave]; else process.env[chave] = valor; }
  }
});
