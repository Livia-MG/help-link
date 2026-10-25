import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

test("migrations: perfis, RLS, CRUD atomico e revogacao de acesso", async () => {
  const banco = new PGlite();
  const admin = "11111111-1111-4111-8111-111111111111";
  const outro = "22222222-2222-4222-8222-222222222222";
  try {
    await banco.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key, email text, raw_app_meta_data jsonb default '{}', raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
    `);
    for (const arquivo of ["20261025000100_criar_tabelas_ongs.sql", "20261025000200_inserir_ongs.sql", "20261025000300_administracao.sql"]) {
      await banco.exec(readFileSync(new URL(`../supabase/migrations/${arquivo}`, import.meta.url), "utf8"));
    }
    await banco.query("insert into auth.users values ($1, 'ADMIN@example.com', '{\"help_link_admin\":true}', '{\"nome\":\"Administrador Teste\"}')", [admin]);
    await banco.query("insert into auth.users values ($1, 'outro@example.com', '{}', '{\"nome\":\"Outro Usuario\",\"help_link_admin\":true}')", [outro]);
    assert.equal((await banco.query("select * from public.usuarios")).rows.length, 1);
    assert.equal((await banco.query("select email from public.usuarios")).rows[0].email, "admin@example.com");
    await banco.query("update auth.users set email = 'novo@example.com', raw_user_meta_data = '{\"nome\":\"Novo Nome\"}' where id = $1", [admin]);
    assert.equal((await banco.query("select nome from public.usuarios")).rows[0].nome, "Novo Nome");

    const ong = {
      name: "ONG Teste", shortDescription: "Resumo", description: "Descricao", address: "Rua Teste", neighborhood: "Centro",
      phone: "123", image: "https://example.com/imagem.jpg", coordinates: { lat: -20, lng: -48 },
      acceptsVolunteers: true, issuesCertificate: false, categories: ["pessoas", "saude"], needs: ["Alimentos"],
    };
    async function como(papel, id = "") {
      await banco.exec("reset role");
      await banco.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
      await banco.exec(`set role ${papel}`);
    }
    async function salvar(dados, criar = false) {
      return banco.query("select public.salvar_ong('ong-teste', $1::jsonb, $2)", [JSON.stringify(dados), criar]);
    }
    await como("anon");
    assert.equal((await banco.query("select * from public.ongs")).rows.length, 11);
    await assert.rejects(() => banco.query("select * from public.usuarios"), /permission denied/);
    await assert.rejects(() => salvar(ong, true), /permission denied/);
    await assert.rejects(() => banco.exec("delete from public.ongs"), /permission denied/);

    await como("authenticated", outro);
    assert.equal((await banco.query("select * from public.usuarios")).rows.length, 0);
    await assert.rejects(() => salvar(ong, true), /administrativo/);
    assert.equal((await banco.query("delete from public.ongs returning id")).rows.length, 0);
    await assert.rejects(() => banco.query("update public.usuarios set nome = 'Indevido'"), /permission denied/);

    await como("authenticated", admin);
    assert.equal((await banco.query("select * from public.usuarios")).rows.length, 1);
    await salvar(ong, true);
    assert.deepEqual((await banco.query("select categoria_id from public.ongs_categorias where ong_id = 'ong-teste' order by ordem")).rows.map((linha) => linha.categoria_id), ["pessoas", "saude"]);
    await assert.rejects(() => salvar({ ...ong, name: "Nao persistir", categories: ["categoria-invalida"] }), /foreign key/);
    assert.equal((await banco.query("select nome from public.ongs where id = 'ong-teste'")).rows[0].nome, ong.name);
    assert.equal((await banco.query("select * from public.ongs_categorias where ong_id = 'ong-teste'")).rows.length, 2);
    await salvar({ ...ong, name: "ONG Editada", categories: ["animais"] });
    assert.equal((await banco.query("select nome from public.ongs where id = 'ong-teste'")).rows[0].nome, "ONG Editada");
    assert.equal((await banco.query("select categoria_id from public.ongs_categorias where ong_id = 'ong-teste'")).rows[0].categoria_id, "animais");
    await banco.exec("delete from public.ongs where id = 'ong-teste'");
    assert.equal((await banco.query("select * from public.ongs_categorias where ong_id = 'ong-teste'")).rows.length, 0);

    await banco.exec("reset role");
    await banco.query("delete from auth.users where id = $1", [admin]);
    await como("authenticated", admin);
    assert.equal((await banco.query("select * from public.usuarios")).rows.length, 0);
    await assert.rejects(() => salvar(ong, true), /administrativo/);
    assert.equal((await banco.query("delete from public.ongs returning id")).rows.length, 0);
  } finally { await banco.close(); }
});
