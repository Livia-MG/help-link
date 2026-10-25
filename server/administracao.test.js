import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import express from "express";
import { rotaMeuPerfil, rotaUsuario, rotaUsuarios } from "./rotasAdministrativas.js";
import { rotaConsultarOng, rotaListarOngs } from "./rotasConsulta.js";
import { excluirUsuario } from "./servicoUsuarios.js";
import { rotaSolicitacao, rotaSolicitacoes, rotaReenviarSolicitacao } from "./rotasSolicitacoes.js";

test("autoexclusao e bloqueada inclusive com UUID em maiusculas", async () => {
  const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  await assert.rejects(() => excluirUsuario(id.toUpperCase(), { id }), (erro) => erro.status === 409);
});

test("API administrativa valida identidade, perfil e entradas antes das operacoes privilegiadas", async (t) => {
  const usuario = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", nome: "Administrador", email: "admin@example.com" };
  const chaves = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY"];
  const anteriores = Object.fromEntries(chaves.map((chave) => [chave, process.env[chave]]));
  const chamadas = [];
  const banco = createServer((req, res) => {
    const token = req.headers.authorization;
    const url = new URL(req.url, "http://localhost");
    chamadas.push({ caminho: url.pathname, token });
    res.setHeader("Content-Type", "application/json");
    if (url.pathname === "/auth/v1/user") {
      if (!["Bearer admin-valido", "Bearer sem-perfil", "Bearer perfil-sem-permissao"].includes(token)) {
        res.statusCode = 401; res.end(JSON.stringify({ code: "bad_jwt", message: "Invalid token" })); return;
      }
      res.end(JSON.stringify({ id: usuario.id, email: usuario.email, app_metadata: { help_link_admin: token === "Bearer admin-valido" } })); return;
    }
    if (url.pathname === "/rest/v1/usuarios") {
      res.end(JSON.stringify(token === "Bearer sem-perfil" ? [] : [usuario])); return;
    }
    res.statusCode = 500; res.end(JSON.stringify({ message: "Endpoint inesperado" }));
  });
  await new Promise((resolve) => banco.listen(0, "127.0.0.1", resolve));
  process.env.SUPABASE_URL = `http://127.0.0.1:${banco.address().port}`;
  process.env.SUPABASE_ANON_KEY = "anon-teste";
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_SECRET_KEY = "secret-teste";
  const app = express(); app.use(express.json());
  app.all("/api/usuarios", rotaUsuarios); app.all("/api/usuarios/:id", rotaUsuario);
  app.all("/api/autenticacao/me", rotaMeuPerfil);
  app.all("/api/ongs", rotaListarOngs); app.all("/api/ongs/:id", rotaConsultarOng);
  app.all("/api/solicitacoes", rotaSolicitacoes);
  app.all("/api/solicitacoes/:id", rotaSolicitacao);
  app.all("/api/solicitacoes/:id/reenviar", rotaReenviarSolicitacao);
  const api = await new Promise((resolve) => { const servidor = app.listen(0, "127.0.0.1", () => resolve(servidor)); });
  async function chamar(caminho, token, method = "GET", body) {
    return fetch(`http://127.0.0.1:${api.address().port}${caminho}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  }
  try {
    await t.test("401 sem token ou com identidade invalida; 403 sem perfil ou sem marca administrativa", async () => {
      assert.equal((await chamar("/api/usuarios")).status, 401);
      assert.equal((await chamar("/api/usuarios", "invalido")).status, 401);
      assert.equal((await chamar("/api/usuarios", "sem-perfil")).status, 403);
      assert.equal((await chamar("/api/usuarios", "perfil-sem-permissao")).status, 403);
    });
    await t.test("perfil retorna somente dados da plataforma e impede cache", async () => {
      const resposta = await chamar("/api/autenticacao/me", "admin-valido");
      assert.equal(resposta.status, 200);
      assert.equal(resposta.headers.get("cache-control"), "no-store");
      assert.deepEqual(await resposta.json(), { ok: true, data: usuario });
    });
    await t.test("cliente administrativo nao recebe o token do visitante", async () => {
      chamadas.length = 0;
      assert.equal((await chamar("/api/usuarios", "admin-valido")).status, 200);
      assert.equal(chamadas.at(-1).token, "Bearer secret-teste");
      assert.equal(chamadas[0].token, "Bearer admin-valido");
    });
    await t.test("criacao valida senha e rejeita campos de privilegio arbitrarios", async () => {
      for (const corpo of [
        { nome: "Teste", email: "teste@example.com", senha: "curta" },
        { nome: "Teste", email: "teste@example.com", senha: "senha-longa", app_metadata: { help_link_admin: true } },
      ]) assert.equal((await chamar("/api/usuarios", "admin-valido", "POST", corpo)).status, 400);
    });
    await t.test("autoexclusao bloqueada e UUIDs invalidos retornam 400", async () => {
      assert.equal((await chamar(`/api/usuarios/${usuario.id}`, "admin-valido", "DELETE")).status, 409);
      assert.equal((await chamar("/api/usuarios/nao-e-uuid", "admin-valido")).status, 400);
    });
    await t.test("escritas de ONGs exigem sessao e validam coordenadas e HTTPS", async () => {
      assert.equal((await chamar("/api/ongs", null, "POST", {})).status, 401);
      assert.equal((await chamar("/api/ongs/ong", null, "PATCH", {})).status, 401);
      assert.equal((await chamar("/api/ongs/ong", null, "DELETE")).status, 401);
      const ong = { name: "Nome", shortDescription: "Resumo", description: "Descricao", address: "Rua", neighborhood: "Centro", phone: "123", image: "http://example.com/foto", coordinates: { lat: 100, lng: -48 }, categories: ["animais"], needs: [], acceptsVolunteers: true, issuesCertificate: false };
      assert.equal((await chamar("/api/ongs", "admin-valido", "POST", ong)).status, 400);
      ong.coordinates.lat = -20;
      assert.equal((await chamar("/api/ongs", "admin-valido", "POST", ong)).status, 400);
    });
    await t.test("OPTIONS e metodos invalidos nao consultam autenticacao", async () => {
      chamadas.length = 0;
      assert.equal((await chamar("/api/usuarios", null, "OPTIONS")).status, 204);
      assert.equal((await chamar("/api/usuarios", null, "PUT")).status, 405);
      assert.equal(chamadas.length, 0);
    });
    await t.test("solicitacoes privadas exigem sessao e cadastro publico valida os dados", async () => {
      assert.equal((await chamar("/api/solicitacoes")).status, 401);
      assert.equal((await chamar(`/api/solicitacoes/${usuario.id}`)).status, 401);
      assert.equal((await chamar(`/api/solicitacoes/${usuario.id}`, null, "PATCH", {})).status, 401);
      assert.equal((await chamar(`/api/solicitacoes/${usuario.id}/reenviar`, null, "POST")).status, 401);
      assert.equal((await chamar("/api/solicitacoes", null, "POST", {})).status, 400);
    });
  } finally {
    await Promise.all([banco, api].map((servidor) => new Promise((resolve) => servidor.close(resolve))));
    for (const [chave, valor] of Object.entries(anteriores)) {
      if (valor === undefined) delete process.env[chave]; else process.env[chave] = valor;
    }
  }
});
