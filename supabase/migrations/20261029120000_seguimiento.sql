-- =====================================================================
-- Seguimiento del proceso de selección: etapas, notas y preguntas de entrevista
-- =====================================================================
-- NO borra ni cambia datos existentes: solo agrega columnas y tablas nuevas.
-- Todas las postulaciones que ya existen quedan en la etapa "nuevo".

-- ---------------------------------------------------------------------
-- 1) Etapa de cada postulación
-- ---------------------------------------------------------------------
alter table public.postulaciones
  add column etapa text not null default 'nuevo'
    check (etapa in ('nuevo', 'preseleccionado', 'entrevista', 'finalista', 'contratado', 'descartado')),
  add column etapa_actualizada_en timestamptz not null default now();

-- Para las postulaciones que ya existen, la "última novedad" es la fecha en que llegaron.
update public.postulaciones set etapa_actualizada_en = creado_en;

-- Solo un reclutador puede cambiar la etapa, y es lo único que puede cambiar de una postulación.
grant update (etapa) on public.postulaciones to authenticated;

create policy "postulaciones_update_reclutador"
  on public.postulaciones for update
  to authenticated
  using ((select public.es_reclutador()))
  with check ((select public.es_reclutador()));

-- ---------------------------------------------------------------------
-- 2) Historial de cambios de etapa (lo escribe un disparador, nadie a mano)
-- ---------------------------------------------------------------------
create table public.postulacion_movimientos (
  id               uuid primary key default gen_random_uuid(),
  postulacion_id   uuid not null references public.postulaciones (id) on delete cascade,
  etapa_anterior   text not null,
  etapa_nueva      text not null,
  autor_id         uuid default auth.uid() references public.perfiles (id) on delete set null,
  creado_en        timestamptz not null default now()
);

create index postulacion_movimientos_postulacion_idx on public.postulacion_movimientos (postulacion_id);

alter table public.postulacion_movimientos enable row level security;
revoke all on public.postulacion_movimientos from anon, authenticated;
grant select on public.postulacion_movimientos to authenticated;

create policy "movimientos_select_reclutador"
  on public.postulacion_movimientos for select
  to authenticated
  using ((select public.es_reclutador()));

create or replace function public.postulaciones_registrar_etapa()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.etapa is distinct from old.etapa then
    new.etapa_actualizada_en := now();
    insert into public.postulacion_movimientos (postulacion_id, etapa_anterior, etapa_nueva)
    values (old.id, old.etapa, new.etapa);
  end if;
  return new;
end;
$$;

create trigger postulaciones_registrar_etapa
  before update on public.postulaciones
  for each row execute function public.postulaciones_registrar_etapa();

-- ---------------------------------------------------------------------
-- 3) Notas de la reclutadora sobre cada postulación (el postulante NO las ve)
-- ---------------------------------------------------------------------
create table public.notas_postulacion (
  id               uuid primary key default gen_random_uuid(),
  postulacion_id   uuid not null references public.postulaciones (id) on delete cascade,
  autor_id         uuid default auth.uid() references public.perfiles (id) on delete set null,
  texto            text not null check (char_length(texto) between 1 and 2000),
  creado_en        timestamptz not null default now()
);

create index notas_postulacion_postulacion_idx on public.notas_postulacion (postulacion_id);

alter table public.notas_postulacion enable row level security;
revoke all on public.notas_postulacion from anon, authenticated;
grant select, delete on public.notas_postulacion to authenticated;
grant insert (postulacion_id, texto) on public.notas_postulacion to authenticated;

create policy "notas_select_reclutador"
  on public.notas_postulacion for select
  to authenticated
  using ((select public.es_reclutador()));

create policy "notas_insert_reclutador"
  on public.notas_postulacion for insert
  to authenticated
  with check ((select public.es_reclutador()) and autor_id = (select auth.uid()));

create policy "notas_delete_propia"
  on public.notas_postulacion for delete
  to authenticated
  using ((select public.es_reclutador()) and autor_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 4) Preguntas de entrevista sugeridas por la IA (las escribe solo el servidor)
-- ---------------------------------------------------------------------
create table public.preguntas_entrevista (
  postulacion_id  uuid primary key references public.postulaciones (id) on delete cascade,
  preguntas       jsonb not null,
  generado_en     timestamptz not null default now()
);

alter table public.preguntas_entrevista enable row level security;
revoke all on public.preguntas_entrevista from anon, authenticated;
grant select on public.preguntas_entrevista to authenticated;

create policy "preguntas_select_reclutador"
  on public.preguntas_entrevista for select
  to authenticated
  using ((select public.es_reclutador()));
