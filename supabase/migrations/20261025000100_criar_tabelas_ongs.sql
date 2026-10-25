begin;

create table public.categorias (
  id text primary key,
  nome text not null,
  ordem integer not null check (ordem >= 0)
);

create table public.ongs (
  id text primary key,
  nome text not null,
  descricao_curta text not null,
  descricao text not null,
  endereco text not null,
  bairro text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  aceita_voluntarios boolean not null default false,
  emite_certificado boolean not null default false,
  telefone text not null,
  imagem text not null,
  necessidades text[] not null default '{}',
  ordem integer not null check (ordem >= 0)
);

create table public.ongs_categorias (
  ong_id text not null references public.ongs(id) on delete cascade,
  categoria_id text not null references public.categorias(id),
  ordem integer not null check (ordem >= 0),
  primary key (ong_id, categoria_id),
  unique (ong_id, ordem)
);

create index on public.ongs_categorias (categoria_id);
create index on public.ongs (bairro);

-- O catalogo e publico para leitura; gravacoes ficam restritas ao administrador.
alter table public.categorias enable row level security;
alter table public.ongs enable row level security;
alter table public.ongs_categorias enable row level security;

revoke all on public.categorias, public.ongs, public.ongs_categorias from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.categorias, public.ongs, public.ongs_categorias to anon, authenticated;

create policy "Permitir consulta de categorias" on public.categorias
  for select to anon, authenticated using (true);
create policy "Permitir consulta de ONGs" on public.ongs
  for select to anon, authenticated using (true);
create policy "Permitir consulta de categorias das ONGs" on public.ongs_categorias
  for select to anon, authenticated using (true);

commit;
