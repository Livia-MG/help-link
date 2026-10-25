begin;

create table public.solicitacoes_ongs (
  id uuid primary key default gen_random_uuid(),
  solicitante_nome text not null check (char_length(btrim(solicitante_nome)) between 2 and 100),
  solicitante_email text not null check (solicitante_email = lower(btrim(solicitante_email))),
  dados_ong jsonb not null check (jsonb_typeof(dados_ong) = 'object'),
  estado text not null default 'pendente' check (estado in ('pendente', 'aprovada', 'recusada')),
  motivo text,
  criado_em timestamptz not null default now(),
  analisado_em timestamptz,
  analisado_por uuid references public.usuarios(id) on delete set null,
  ong_id text references public.ongs(id) on delete set null,
  ip_hash text not null,
  email_estado text not null default 'nao_aplicavel' check (email_estado in ('nao_aplicavel', 'pendente', 'enviando', 'enviado', 'falha')),
  email_enviado_em timestamptz,
  email_tentativas integer not null default 0,
  email_erro text,
  email_reserva uuid,
  email_reservado_ate timestamptz,
  check (estado <> 'recusada' or char_length(btrim(motivo)) between 10 and 1000),
  check ((estado = 'pendente' and analisado_em is null) or (estado <> 'pendente' and analisado_em is not null))
);
create index on public.solicitacoes_ongs (estado, criado_em desc);
create index on public.solicitacoes_ongs (ip_hash, criado_em);
create index on public.solicitacoes_ongs (solicitante_email, criado_em);
alter table public.solicitacoes_ongs enable row level security;
revoke all on public.solicitacoes_ongs from anon, authenticated;
grant select on public.solicitacoes_ongs to authenticated;
grant all on public.solicitacoes_ongs to service_role;
create policy "Administradores consultam solicitacoes" on public.solicitacoes_ongs
  for select to authenticated using (exists (select 1 from public.usuarios where id = (select auth.uid())));

-- Somente o backend pode registrar solicitacoes anonimas validadas.
create function public.registrar_solicitacao_ong(p_nome text, p_email text, p_dados jsonb, p_ip_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended(lower(btrim(p_email)), 1));
  if (select count(*) from public.solicitacoes_ongs where ip_hash = p_ip_hash and criado_em > now() - interval '1 hour') >= 5
    or (select count(*) from public.solicitacoes_ongs where solicitante_email = lower(btrim(p_email)) and criado_em > now() - interval '1 day') >= 3 then
    raise exception 'Limite de solicitacoes' using errcode = 'P0429';
  end if;
  if exists (select 1 from jsonb_array_elements_text(p_dados -> 'categories') as itens(id)
    where not exists (select 1 from public.categorias c where c.id = itens.id)) then
    raise exception 'Categoria invalida' using errcode = '22023';
  end if;
  insert into public.solicitacoes_ongs (solicitante_nome, solicitante_email, dados_ong, ip_hash)
    values (btrim(p_nome), lower(btrim(p_email)), p_dados, p_ip_hash) returning id into v_id;
  return jsonb_build_object('id', v_id, 'estado', 'pendente');
end;
$$;
revoke all on function public.registrar_solicitacao_ong(text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.registrar_solicitacao_ong(text, text, jsonb, text) to service_role;

create function public.analisar_solicitacao_ong(p_id uuid, p_decisao text, p_motivo text default null, p_dados jsonb default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_solicitacao public.solicitacoes_ongs; v_ong_id text;
begin
  if not exists (select 1 from public.usuarios where id = (select auth.uid())) then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;
  select * into v_solicitacao from public.solicitacoes_ongs where id = p_id for update;
  if not found then raise exception 'Solicitacao inexistente' using errcode = 'P0002'; end if;
  if v_solicitacao.estado <> 'pendente' then raise exception 'Solicitacao ja analisada' using errcode = 'P0409'; end if;
  if p_decisao not in ('aprovada', 'recusada') or p_decisao is null then
    raise exception 'Decisao invalida' using errcode = '22023';
  end if;
  if p_decisao = 'recusada' and coalesce(char_length(btrim(p_motivo)), 0) not between 10 and 1000 then
    raise exception 'Informe o motivo' using errcode = '22023';
  end if;
  if p_decisao = 'aprovada' then
    v_ong_id := v_solicitacao.id::text;
    perform public.salvar_ong(v_ong_id, coalesce(p_dados, v_solicitacao.dados_ong), true);
  end if;
  update public.solicitacoes_ongs set estado = p_decisao,
    motivo = case when p_decisao = 'recusada' then btrim(p_motivo) else null end,
    dados_ong = case when p_decisao = 'aprovada' then coalesce(p_dados, dados_ong) else dados_ong end,
    analisado_em = now(), analisado_por = auth.uid(), ong_id = v_ong_id, email_estado = 'pendente'
  where id = p_id returning * into v_solicitacao;
  return jsonb_build_object('id', v_solicitacao.id, 'estado', v_solicitacao.estado, 'ong_id', v_solicitacao.ong_id);
end;
$$;
revoke all on function public.analisar_solicitacao_ong(uuid, text, text, jsonb) from public, anon;
grant execute on function public.analisar_solicitacao_ong(uuid, text, text, jsonb) to authenticated;

-- Reserva impede envios simultaneos. Uma reserva expirada pode ser retomada no painel.
create function public.reservar_email_solicitacao(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_solicitacao public.solicitacoes_ongs;
begin
  update public.solicitacoes_ongs set email_estado = 'enviando', email_reserva = gen_random_uuid(),
    email_reservado_ate = now() + interval '5 minutes', email_tentativas = email_tentativas + 1
  where id = p_id and estado <> 'pendente' and email_estado <> 'enviado'
    and (email_reservado_ate is null or email_reservado_ate < now())
  returning * into v_solicitacao;
  if not found then return null; end if;
  return to_jsonb(v_solicitacao);
end;
$$;
revoke all on function public.reservar_email_solicitacao(uuid) from public, anon, authenticated;
grant execute on function public.reservar_email_solicitacao(uuid) to service_role;

commit;
