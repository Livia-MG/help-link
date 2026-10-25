import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "node:http";
import express from "express";
import listarOngs from "../api/ongs/index.js";
import consultarOng from "../api/ongs/[id].js";
import listarCategorias from "../api/categorias.js";

let banco;
let api;
let enderecoApi;
let respostaBanco;
let consultas = [];
const urlAnterior = process.env.SUPABASE_URL;
const chaveAnterior = process.env.SUPABASE_PUBLISHABLE_KEY;

const registro = {
  id: "ong-teste", name: "ONG Teste", shortDescription: "Resumo", description: "Descricao",
  address: "Rua 1", neighborhood: "Centro", latitude: -20.5, longitude: -48.5,
  acceptsVolunteers: true, issuesCertificate: false, phone: "123", image: "https://example.com/foto.jpg",
  needs: ["Alimentos"], ongs_categorias: [
    { categoria_id: "saude", ordem: 1 }, { categoria_id: "pessoas", ordem: 0 },
  ],
};

before(async () => {
  // Simula apenas o transporte do Supabase; as consultas usam o SDK real.
  banco = createServer((req, res) => {
    consultas.push(new URL(req.url, "http://localhost"));
    const resposta = typeof respostaBanco === "function" ? respostaBanco(req) : respostaBanco;
    res.setHeader("Content-Type", "application/json");
    res.statusCode = resposta.status || 200;
    res.end(JSON.stringify(resposta.dados));
  });
  await new Promise((resolve) => banco.listen(0, "127.0.0.1", resolve));
  process.env.SUPABASE_URL = `http://127.0.0.1:${banco.address().port}`;
  process.env.SUPABASE_PUBLISHABLE_KEY = "chave-de-teste";

  const app = express();
  app.all("/api/ongs", listarOngs);
  // A Vercel fornece o parametro dinamico em query.id.
  app.all("/api/ongs/:id", (req, res) => {
    Object.defineProperty(req, "query", { value: { id: req.params.id } });
    req.params = {};
    return consultarOng(req, res);
  });
  app.all("/api/categorias", listarCategorias);
  api = await new Promise((resolve) => {
    const servidor = app.listen(0, "127.0.0.1", () => resolve(servidor));
  });
  enderecoApi = `http://127.0.0.1:${api.address().port}`;
});

after(async () => {
  await Promise.all([api, banco].map((servidor) => new Promise((resolve) => servidor.close(resolve))));
  if (urlAnterior === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = urlAnterior;
  if (chaveAnterior === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
  else process.env.SUPABASE_PUBLISHABLE_KEY = chaveAnterior;
});

test("lista preserva coordenadas e todas as categorias na ordem original", async () => {
  respostaBanco = { dados: [registro] };
  const resposta = await fetch(`${enderecoApi}/api/ongs`);
  const { data } = await resposta.json();
  assert.equal(resposta.status, 200);
  assert.deepEqual(data[0].coordinates, { lat: -20.5, lng: -48.5 });
  assert.deepEqual(data[0].categories, ["pessoas", "saude"]);
  assert.equal(data[0].latitude, undefined);
});

test("filtros booleanos preservam false e bairro usa igualdade", async () => {
  consultas = [];
  respostaBanco = { dados: [] };
  const resposta = await fetch(`${enderecoApi}/api/ongs?aceitaVoluntarios=false&emiteCertificado=true&bairro=Centro`);
  assert.equal(resposta.status, 200);
  const parametros = consultas[0].searchParams;
  assert.equal(parametros.get("aceita_voluntarios"), "eq.false");
  assert.equal(parametros.get("emite_certificado"), "eq.true");
  assert.equal(parametros.get("bairro"), "eq.Centro");
});

test("rejeita filtros invalidos e repetidos antes de acessar banco", async () => {
  consultas = [];
  for (const filtro of ["aceitaVoluntarios=sim", "bairro=", "categoria=saude&categoria=idosos"]) {
    assert.equal((await fetch(`${enderecoApi}/api/ongs?${filtro}`)).status, 400);
  }
  assert.equal(consultas.length, 0);
});

test("categoria sem ONGs retorna lista vazia", async () => {
  consultas = [];
  respostaBanco = { dados: [] };
  const resposta = await fetch(`${enderecoApi}/api/ongs?categoria=inexistente`);
  assert.deepEqual(await resposta.json(), { ok: true, data: [] });
  assert.equal(consultas.length, 1);
  assert.equal(consultas[0].searchParams.get("categoria_id"), "eq.inexistente");
});

test("filtro de categoria encontra IDs e preserva as demais categorias da ONG", async () => {
  consultas = [];
  respostaBanco = (req) => ({
    dados: req.url.startsWith("/rest/v1/ongs_categorias?") ? [{ ong_id: registro.id }] : [registro],
  });
  const resposta = await fetch(`${enderecoApi}/api/ongs?categoria=pessoas`);
  const { data } = await resposta.json();
  assert.equal(resposta.status, 200);
  assert.deepEqual(data[0].categories, ["pessoas", "saude"]);
  assert.equal(consultas.length, 2);
  assert.equal(consultas[1].searchParams.get("id"), "in.(ong-teste)");
});

test("detalhe por ID aceita acentos e retorna 404 quando ausente", async () => {
  consultas = [];
  respostaBanco = { dados: [registro] };
  assert.equal((await fetch(`${enderecoApi}/api/ongs/${encodeURIComponent("educandário")}`)).status, 200);
  assert.equal(consultas[0].searchParams.get("id"), "eq.educandário");
  respostaBanco = { dados: [] };
  assert.equal((await fetch(`${enderecoApi}/api/ongs/ausente`)).status, 404);
});

test("categorias sao consultadas no banco", async () => {
  respostaBanco = { dados: [{ id: "saude", nome: "Saúde" }] };
  const resposta = await fetch(`${enderecoApi}/api/categorias`);
  assert.deepEqual(await resposta.json(), { ok: true, data: respostaBanco.dados });
});

test("falha do banco retorna 503 sem expor detalhes internos", async () => {
  respostaBanco = { status: 403, dados: { message: "detalhe interno", code: "42501" } };
  const resposta = await fetch(`${enderecoApi}/api/ongs`);
  assert.equal(resposta.status, 503);
  assert.doesNotMatch(await resposta.text(), /detalhe interno/);
});

test("escritas exigem autenticacao e OPTIONS nao acessa banco", async () => {
  consultas = [];
  for (const rota of ["/api/ongs", "/api/ongs/ong-teste", "/api/categorias"]) {
    const resposta = await fetch(enderecoApi + rota, { method: "POST" });
    assert.equal(resposta.status, rota === "/api/ongs" ? 401 : 405);
    assert.equal(resposta.headers.get("allow"), rota === "/api/ongs" ? "POST, OPTIONS" : rota === "/api/categorias" ? "GET, OPTIONS" : "GET, PATCH, DELETE, OPTIONS");
    assert.equal((await fetch(enderecoApi + rota, { method: "OPTIONS" })).status, 204);
  }
  assert.equal(consultas.length, 0);
});

test("configuracao ausente retorna 503 sem acessar banco", async () => {
  consultas = [];
  const url = process.env.SUPABASE_URL;
  delete process.env.SUPABASE_URL;
  try {
    const resposta = await fetch(`${enderecoApi}/api/ongs`);
    assert.equal(resposta.status, 503);
    assert.equal(consultas.length, 0);
  } finally {
    process.env.SUPABASE_URL = url;
  }
});
