-- =====================================================================
-- Parte 2: vacantes (RF03, RF04)
-- =====================================================================

create table public.vacantes (
  id                     uuid primary key default gen_random_uuid(),
  titulo                 text not null check (length(trim(titulo)) > 0),
  descripcion            text not null default '',
  requisitos             text not null default '',
  habilidades            text not null default '',
  informacion_adicional  text not null default '',
  activa                 boolean not null default true,
  creado_por             uuid default auth.uid()
                         references public.perfiles (id) on delete set null,
  creado_en              timestamptz not null default now()
);

create index vacantes_activa_idx on public.vacantes (activa);

alter table public.vacantes enable row level security;

-- ---------------------------------------------------------------------
-- Permisos y políticas (RLS)
-- ---------------------------------------------------------------------
-- Sin sesión no hay acceso. Una vez creada, de una vacante solo se puede
-- cambiar si está activa o no (RF03). Nadie puede borrarlas desde la app.
revoke all on public.vacantes from anon, authenticated;
grant select, insert on public.vacantes to authenticated;
grant update (activa) on public.vacantes to authenticated;

-- Postulantes: solo vacantes activas. Reclutador: todas.
create policy "vacantes_select_activas_o_reclutador"
  on public.vacantes for select
  to authenticated
  using (activa or (select public.es_reclutador()));

-- Solo el reclutador crea vacantes, y quedan a su nombre.
create policy "vacantes_insert_reclutador"
  on public.vacantes for insert
  to authenticated
  with check (
    (select public.es_reclutador())
    and creado_por = (select auth.uid())
  );

-- Solo el reclutador activa o desactiva vacantes.
create policy "vacantes_update_reclutador"
  on public.vacantes for update
  to authenticated
  using ((select public.es_reclutador()))
  with check ((select public.es_reclutador()));
