import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("solicitacoes: privacidade, limites, aprovacao atomica, recusa e reserva de e-mail", async () => {
  const banco = new PGlite();
  const administrador = "11111111-1111-4111-8111-111111111111";
  try {
    await banco.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key, email text, raw_app_meta_data jsonb default '{}', raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;`);
    for (const arquivo of ["20261025000100_criar_tabelas_ongs.sql", "20261025000200_inserir_ongs.sql", "20261025000300_administracao.sql", "20261025000400_solicitacoes_ongs.sql"]) {
      await banco.exec(readFileSync(new URL(`../supabase/migrations/${arquivo}`, import.meta.url), "utf8"));
    }
    // O Supabase concede esses privilegios ao service_role por padrao.
    await banco.exec("grant select on public.ongs to service_role");
    await banco.query("insert into auth.users values ($1, 'admin@example.com', '{\"help_link_admin\":true}', '{\"nome\":\"Administrador Teste\"}')", [administrador]);
    const ong = { name: "ONG Solicitada", shortDescription: "Resumo", description: "Descricao", address: "Rua Teste", neighborhood: "Centro", phone: "123", image: "https://example.com/imagem.jpg", coordinates: { lat: -20, lng: -48 }, acceptsVolunteers: true, issuesCertificate: false, categories: ["pessoas", "saude"], needs: [] };
    async function registrar(email = "solicitante@example.com", ip = "ip-teste") {
      const { rows } = await banco.query("select public.registrar_solicitacao_ong('Solicitante', $1, $2::jsonb, $3) as resultado", [email, JSON.stringify(ong), ip]);
      return rows[0].resultado.id;
    }
    async function decidir(id, decisao, dados = null, motivo = null) {
      return banco.query("select public.analisar_solicitacao_ong($1, $2, $3, $4::jsonb)", [id, decisao, motivo, dados ? JSON.stringify(dados) : null]);
    }
    await banco.exec("set role anon");
    await assert.rejects(() => banco.query("select * from public.solicitacoes_ongs"), /permission denied/);
    await assert.rejects(() => registrar(), /permission denied/);
    await banco.exec("set role service_role");
    const aprovar = await registrar();
    const recusar = await registrar();
    assert.equal((await banco.query("select * from public.ongs")).rows.length, 11);
    await registrar();
    await assert.rejects(() => registrar("solicitante@example.com", "outro-ip"), (erro) => erro.code === "P0429");
    await registrar("outro@example.com");
    await registrar("terceiro@example.com");
    await assert.rejects(() => registrar("quarto@example.com"), (erro) => erro.code === "P0429");

    await banco.exec("reset role");
    await banco.query("select set_config('request.jwt.claim.sub', '', false)");
    await banco.exec("set role authenticated");
    assert.equal((await banco.query("select * from public.solicitacoes_ongs")).rows.length, 0);
    await assert.rejects(() => decidir(aprovar, "aprovada", ong), (erro) => erro.code === "42501");
    await banco.exec("reset role");
    await banco.query("select set_config('request.jwt.claim.sub', $1, false)", [administrador]);
    await banco.exec("set role authenticated");
    assert.equal((await banco.query("select * from public.solicitacoes_ongs")).rows.length, 5);
    await assert.rejects(() => decidir(aprovar, "aprovada", { ...ong, categories: ["invalida"] }), /foreign key/);
    assert.equal((await banco.query("select estado from public.solicitacoes_ongs where id=$1", [aprovar])).rows[0].estado, "pendente");
    assert.equal((await banco.query("select * from public.ongs")).rows.length, 11);
    await decidir(aprovar, "aprovada", ong);
    assert.equal((await banco.query("select * from public.ongs where id=$1", [aprovar])).rows.length, 1);
    assert.equal((await banco.query("select * from public.ongs_categorias where ong_id=$1", [aprovar])).rows.length, 2);
    await assert.rejects(() => decidir(aprovar, "aprovada", ong), (erro) => erro.code === "P0409");
    await assert.rejects(() => decidir(recusar, "recusada", null, "curto"), (erro) => erro.code === "22023");
    await decidir(recusar, "recusada", null, "Dados insuficientes para confirmar a instituição.");
    assert.equal((await banco.query("select * from public.ongs where id=$1", [recusar])).rows.length, 0);
    await assert.rejects(() => banco.query("update public.solicitacoes_ongs set estado='pendente'"), /permission denied/);
    await assert.rejects(() => banco.query("select public.reservar_email_solicitacao($1)", [aprovar]), /permission denied/);

    await banco.exec("reset role; set role service_role");
    const reserva = (await banco.query("select public.reservar_email_solicitacao($1) as resultado", [aprovar])).rows[0].resultado;
    assert.equal(reserva.email_estado, "enviando");
    assert.ok(reserva.email_reserva);
    assert.equal((await banco.query("select public.reservar_email_solicitacao($1) as resultado", [aprovar])).rows[0].resultado, null);
    await banco.query("update public.solicitacoes_ongs set email_reservado_ate=now()-interval '1 second' where id=$1", [aprovar]);
    const nova = (await banco.query("select public.reservar_email_solicitacao($1) as resultado", [aprovar])).rows[0].resultado;
    assert.notEqual(nova.email_reserva, reserva.email_reserva);
    assert.equal(nova.email_tentativas, 2);
    await banco.query("update public.solicitacoes_ongs set email_estado='enviado', email_reservado_ate=null where id=$1", [aprovar]);
    assert.equal((await banco.query("select public.reservar_email_solicitacao($1) as resultado", [aprovar])).rows[0].resultado, null);
    await banco.exec("reset role");
    await banco.query("delete from auth.users where id=$1", [administrador]);
    assert.equal((await banco.query("select analisado_por from public.solicitacoes_ongs where id=$1", [aprovar])).rows[0].analisado_por, null);
  } finally { await banco.close(); }
});
