import assert from "node:assert/strict";
import { test } from "node:test";
import nodemailer from "nodemailer";
import { handleContactPayload } from "./servicoContato.js";

const payload = { name: "Pessoa Teste", email: "teste@example.com", message: "Mensagem de teste do formulario." };

function configurarAmbiente(t) {
  const valores = {
    SMTP_HOST: "smtp.example.com", SMTP_PORT: "465", SMTP_SECURE: "true",
    SMTP_USER: "contato@example.com", SMTP_PASS: "senha-de-teste", CONTACT_TO: "",
  };
  const anteriores = Object.fromEntries(Object.keys(valores).map((chave) => [chave, process.env[chave]]));
  Object.assign(process.env, valores);
  t.after(() => {
    for (const [chave, valor] of Object.entries(anteriores)) {
      if (valor === undefined) delete process.env[chave];
      else process.env[chave] = valor;
    }
  });
}

test("contato aguarda aceitacao SMTP e aplica limites menores de espera", async (t) => {
  configurarAmbiente(t);
  let confirmar;
  let opcoes;
  let mensagem;
  t.mock.method(nodemailer, "createTransport", (configuracao) => {
    opcoes = configuracao;
    return { sendMail: (email) => {
      mensagem = email;
      return new Promise((resolve) => { confirmar = resolve; });
    } };
  });
  const log = t.mock.method(console, "info", () => {});
  let concluiu = false;
  const envio = handleContactPayload(payload).then((resultado) => { concluiu = true; return resultado; });
  await Promise.resolve();
  assert.equal(concluiu, false);
  assert.equal(opcoes.connectionTimeout, 10000);
  assert.equal(opcoes.greetingTimeout, 10000);
  assert.equal(opcoes.dnsTimeout, 10000);
  assert.equal(opcoes.socketTimeout, 20000);
  assert.equal(opcoes.secure, true);
  assert.equal(mensagem.to, process.env.SMTP_USER);
  assert.equal(mensagem.replyTo, payload.email);
  confirmar({ envelopeTime: 50, messageTime: 100, messageSize: 1000 });
  assert.deepEqual(await envio, { status: 200, body: { ok: true } });
  assert.equal(log.mock.calls[0].arguments[1].mensagemMs, 100);
  assert.doesNotMatch(JSON.stringify(log.mock.calls), /teste@example|Mensagem de teste|senha-de-teste/);
});

test("timeout SMTP retorna 504 com mensagem sem confirmar envio", async (t) => {
  configurarAmbiente(t);
  t.mock.method(nodemailer, "createTransport", () => ({
    sendMail: async () => { throw Object.assign(new Error("dado privado"), { code: "ETIMEDOUT", command: "CONN" }); },
  }));
  const log = t.mock.method(console, "error", () => {});
  const resultado = await handleContactPayload(payload);
  assert.equal(resultado.status, 504);
  assert.equal(resultado.body.ok, false);
  assert.match(resultado.body.message, /confirmar/);
  assert.equal(log.mock.calls[0].arguments[1].comando, "CONN");
  assert.doesNotMatch(JSON.stringify(log.mock.calls), /dado privado/);
});

test("erro de autenticacao permanece falha, sem expor resposta SMTP", async (t) => {
  configurarAmbiente(t);
  t.mock.method(nodemailer, "createTransport", () => ({
    sendMail: async () => { throw Object.assign(new Error("senha privada"), { code: "EAUTH", responseCode: 535 }); },
  }));
  const log = t.mock.method(console, "error", () => {});
  const resultado = await handleContactPayload(payload);
  assert.equal(resultado.status, 500);
  assert.equal(resultado.body.ok, false);
  assert.doesNotMatch(JSON.stringify([resultado, log.mock.calls]), /senha privada/);
});

test("validacao e honeypot nao abrem conexao SMTP", async (t) => {
  const transporte = t.mock.method(nodemailer, "createTransport", () => { throw new Error("Nao deveria conectar"); });
  assert.equal((await handleContactPayload({})).status, 400);
  assert.equal((await handleContactPayload({ ...payload, website: "bot.example.com" })).status, 200);
  assert.equal(transporte.mock.calls.length, 0);
});

test("email e anexos sao montados localmente sem buscar imagens na rede", async (t) => {
  configurarAmbiente(t);
  const montar = nodemailer.createTransport({ streamTransport: true, buffer: true });
  let tamanho;
  t.mock.method(nodemailer, "createTransport", () => ({ sendMail: async (mensagem) => {
    assert.equal(mensagem.attachments.length, 2);
    assert.ok(mensagem.attachments.every((anexo) => anexo.content && !anexo.path && !anexo.href));
    const email = await montar.sendMail(mensagem);
    tamanho = email.message.length;
    return { messageSize: tamanho };
  } }));
  t.mock.method(console, "info", () => {});
  assert.equal((await handleContactPayload(payload)).status, 200);
  assert.ok(tamanho > 0 && tamanho < 50000);
});
