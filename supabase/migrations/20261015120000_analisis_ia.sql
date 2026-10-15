-- =====================================================================
-- Análisis con IA: estado de cada CV, motivos de las sugerencias y tope diario
-- =====================================================================
-- Todo lo que guarda la IA lo escribe SOLO el servidor de la app (con la clave
-- secreta de Supabase). Ni los postulantes ni los reclutadores pueden escribir
-- estas columnas desde el navegador: los permisos de las tablas no cambian.

-- ---------------------------------------------------------------------
-- 1) Estado del análisis de cada CV
-- ---------------------------------------------------------------------
-- pendiente  -> todavía no se analizó (o se reemplazó el CV)
-- analizando -> el análisis está en curso
-- listo      -> el análisis terminó bien
-- error      -> falló (por ejemplo, sin saldo); se puede reintentar
alter table public.cvs
  add column analisis_estado text not null default 'pendiente'
    check (analisis_estado in ('pendiente', 'analizando', 'listo', 'error')),
  add column analisis_iniciado_en timestamptz,
  add column analizado_en timestamptz;

-- Si el postulante reemplaza su CV, el análisis anterior deja de valer:
-- se vacía todo (ahora también el estado).
create or replace function public.cvs_limpiar_analisis()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.ruta_archivo is distinct from old.ruta_archivo
     or new.subido_en is distinct from old.subido_en then
    new.perfil_estructurado := null;
    new.resumen := null;
    new.analisis_estado := 'pendiente';
    new.analisis_iniciado_en := null;
    new.analizado_en := null;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2) Motivos de cada sugerencia (qué coincide y qué falta)
-- ---------------------------------------------------------------------
alter table public.candidatos_sugeridos
  add column analisis jsonb;

-- ---------------------------------------------------------------------
-- 3) Registro de intentos de análisis, para el tope diario por persona
-- ---------------------------------------------------------------------
create table public.analisis_ia_intentos (
  id             uuid primary key default gen_random_uuid(),
  postulante_id  uuid not null references public.perfiles (id) on delete cascade,
  creado_en      timestamptz not null default now()
);

create index analisis_ia_intentos_postulante_idx
  on public.analisis_ia_intentos (postulante_id, creado_en desc);

alter table public.analisis_ia_intentos enable row level security;

-- Sin políticas y sin permisos: nadie lo ve ni lo toca desde la app.
revoke all on public.analisis_ia_intentos from anon, authenticated;

-- ---------------------------------------------------------------------
-- 4) El servidor (rol service_role) escribe los resultados de la IA
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.analisis_ia_intentos to service_role;
grant select, insert, update, delete on public.candidatos_sugeridos to service_role;
grant select, update on public.cvs to service_role;
grant select, update on public.postulaciones to service_role;
grant select on public.vacantes to service_role;
grant select on public.perfiles to service_role;
