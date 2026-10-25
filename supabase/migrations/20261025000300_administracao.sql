begin;

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 2 and 100),
  email text not null check (email = lower(btrim(email))),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index usuarios_email_unico on public.usuarios (lower(email));
alter table public.usuarios enable row level security;
revoke all on public.usuarios from anon, authenticated;
grant select on public.usuarios to authenticated;
grant all on public.usuarios to service_role;
create policy "Consultar proprio perfil" on public.usuarios
  for select to authenticated using (id = (select auth.uid()));

-- Apenas app_metadata e controlado pelo Admin API; user_metadata nunca concede acesso.
create function public.sincronizar_usuario_administrativo()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_app_meta_data -> 'help_link_admin' = 'true'::jsonb then
    insert into public.usuarios (id, nome, email)
    values (new.id, btrim(new.raw_user_meta_data ->> 'nome'), lower(btrim(new.email)))
    on conflict (id) do update set
      nome = excluded.nome, email = excluded.email, atualizado_em = now();
  else
    delete from public.usuarios where id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.sincronizar_usuario_administrativo() from public, anon, authenticated;
create trigger sincronizar_usuario_help_link
  after insert or update of email, raw_app_meta_data, raw_user_meta_data on auth.users
  for each row execute function public.sincronizar_usuario_administrativo();

insert into public.usuarios (id, nome, email)
select id, btrim(raw_user_meta_data ->> 'nome'), lower(btrim(email)) from auth.users
where raw_app_meta_data -> 'help_link_admin' = 'true'::jsonb;

grant insert, update, delete on public.ongs, public.ongs_categorias to authenticated;
create policy "Administradores cadastram ONGs" on public.ongs
  for insert to authenticated with check (exists (select 1 from public.usuarios where id = (select auth.uid())));
create policy "Administradores atualizam ONGs" on public.ongs
  for update to authenticated using (exists (select 1 from public.usuarios where id = (select auth.uid())))
  with check (exists (select 1 from public.usuarios where id = (select auth.uid())));
create policy "Administradores excluem ONGs" on public.ongs
  for delete to authenticated using (exists (select 1 from public.usuarios where id = (select auth.uid())));
create policy "Administradores cadastram vinculos" on public.ongs_categorias
  for insert to authenticated with check (exists (select 1 from public.usuarios where id = (select auth.uid())));
create policy "Administradores atualizam vinculos" on public.ongs_categorias
  for update to authenticated using (exists (select 1 from public.usuarios where id = (select auth.uid())))
  with check (exists (select 1 from public.usuarios where id = (select auth.uid())));
create policy "Administradores excluem vinculos" on public.ongs_categorias
  for delete to authenticated using (exists (select 1 from public.usuarios where id = (select auth.uid())));

-- Executa com as permissoes/RLS de quem chama. Qualquer falha desfaz ONG e vinculos.
create function public.salvar_ong(p_id text, p_dados jsonb, p_criar boolean)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  categorias text[];
  v_necessidades text[];
begin
  if not exists (select 1 from public.usuarios where id = (select auth.uid())) then
    raise exception 'Acesso administrativo necessario' using errcode = '42501';
  end if;
  select array_agg(valor) into categorias from jsonb_array_elements_text(p_dados -> 'categories') as itens(valor);
  select coalesce(array_agg(valor), '{}'::text[]) into v_necessidades from jsonb_array_elements_text(p_dados -> 'needs') as itens(valor);
  if coalesce(cardinality(categorias), 0) = 0 then
    raise exception 'Selecione categorias' using errcode = '22023';
  end if;
  if p_criar then
    insert into public.ongs (id, nome, descricao_curta, descricao, endereco, bairro, latitude, longitude,
      aceita_voluntarios, emite_certificado, telefone, imagem, necessidades, ordem)
    values (p_id, p_dados ->> 'name', p_dados ->> 'shortDescription', p_dados ->> 'description',
      p_dados ->> 'address', p_dados ->> 'neighborhood', (p_dados #>> '{coordinates,lat}')::double precision,
      (p_dados #>> '{coordinates,lng}')::double precision, (p_dados ->> 'acceptsVolunteers')::boolean,
      (p_dados ->> 'issuesCertificate')::boolean, p_dados ->> 'phone', p_dados ->> 'image', v_necessidades,
      (select coalesce(max(ordem), -1) + 1 from public.ongs));
  else
    update public.ongs set nome = p_dados ->> 'name', descricao_curta = p_dados ->> 'shortDescription',
      descricao = p_dados ->> 'description', endereco = p_dados ->> 'address', bairro = p_dados ->> 'neighborhood',
      latitude = (p_dados #>> '{coordinates,lat}')::double precision,
      longitude = (p_dados #>> '{coordinates,lng}')::double precision,
      aceita_voluntarios = (p_dados ->> 'acceptsVolunteers')::boolean,
      emite_certificado = (p_dados ->> 'issuesCertificate')::boolean,
      telefone = p_dados ->> 'phone', imagem = p_dados ->> 'image', necessidades = v_necessidades
    where id = p_id;
    if not found then raise exception 'ONG nao encontrada' using errcode = 'P0002'; end if;
  end if;
  delete from public.ongs_categorias where ong_id = p_id;
  insert into public.ongs_categorias (ong_id, categoria_id, ordem)
    select p_id, categoria, posicao::integer - 1 from unnest(categorias) with ordinality as itens(categoria, posicao);
end;
$$;
revoke all on function public.salvar_ong(text, jsonb, boolean) from public, anon;
grant execute on function public.salvar_ong(text, jsonb, boolean) to authenticated;

commit;
