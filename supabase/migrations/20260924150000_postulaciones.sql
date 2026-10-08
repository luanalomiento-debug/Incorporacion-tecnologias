-- =====================================================================
-- Parte 4: postulaciones (RF06, RF07) + tabla para la IA futura
-- =====================================================================

create table public.postulaciones (
  id                   uuid primary key default gen_random_uuid(),
  vacante_id           uuid not null
                       constraint postulaciones_vacante_id_fkey
                       references public.vacantes (id) on delete cascade,
  postulante_id        uuid not null default auth.uid()
                       references public.perfiles (id) on delete cascade,
  creado_en            timestamptz not null default now(),
  -- Para la IA (etapa futura): quedan vacías por ahora.
  afinidad             numeric,
  analisis             jsonb,
  vacante_sugerida_id  uuid
                       constraint postulaciones_vacante_sugerida_id_fkey
                       references public.vacantes (id) on delete set null,
  -- Nadie puede postularse dos veces a la misma vacante (RF06).
  constraint postulaciones_unica unique (vacante_id, postulante_id)
);

create index postulaciones_postulante_idx on public.postulaciones (postulante_id);

alter table public.postulaciones enable row level security;

-- ---------------------------------------------------------------------
-- Permisos y políticas (RLS)
-- ---------------------------------------------------------------------
-- Desde la app solo se puede leer y crear, y al crear solo se escriben
-- vacante_id y postulante_id. Las columnas de IA no son escribibles.
-- Nadie edita ni borra postulaciones.
revoke all on public.postulaciones from anon, authenticated;
grant select on public.postulaciones to authenticated;
grant insert (vacante_id, postulante_id) on public.postulaciones to authenticated;

-- Cada postulante ve las suyas; el reclutador ve todas.
create policy "postulaciones_select_propia_o_reclutador"
  on public.postulaciones for select
  to authenticated
  using (postulante_id = (select auth.uid()) or (select public.es_reclutador()));

-- Solo un postulante, a su nombre, a una vacante activa y con su CV ya cargado.
-- (La consulta a "vacantes" respeta RLS: un postulante solo ve las activas.)
create policy "postulaciones_insert_propia"
  on public.postulaciones for insert
  to authenticated
  with check (
    postulante_id = (select auth.uid())
    and not (select public.es_reclutador())
    and exists (
      select 1 from public.vacantes v
      where v.id = vacante_id and v.activa
    )
    and exists (
      select 1 from public.cvs c
      where c.postulante_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- Candidatos sugeridos por la IA (etapa futura): solo lectura para el reclutador
-- ---------------------------------------------------------------------
create table public.candidatos_sugeridos (
  id             uuid primary key default gen_random_uuid(),
  vacante_id     uuid not null references public.vacantes (id) on delete cascade,
  postulante_id  uuid not null references public.perfiles (id) on delete cascade,
  afinidad       numeric,
  creado_en      timestamptz not null default now(),
  constraint candidatos_sugeridos_unico unique (vacante_id, postulante_id)
);

alter table public.candidatos_sugeridos enable row level security;

revoke all on public.candidatos_sugeridos from anon, authenticated;
grant select on public.candidatos_sugeridos to authenticated;

create policy "candidatos_sugeridos_select_reclutador"
  on public.candidatos_sugeridos for select
  to authenticated
  using ((select public.es_reclutador()));
