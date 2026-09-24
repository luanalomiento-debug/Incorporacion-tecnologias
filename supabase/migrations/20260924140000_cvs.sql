-- =====================================================================
-- Parte 3: CV en PDF (RF05)
-- =====================================================================

-- Una fila por postulante (postulante_id es único): si sube un CV nuevo,
-- reemplaza al anterior. El archivo vive en Storage en "{id_usuario}/cv.pdf".
create table public.cvs (
  id                   uuid primary key default gen_random_uuid(),
  postulante_id        uuid not null unique
                       references public.perfiles (id) on delete cascade,
  ruta_archivo         text not null,
  nombre_archivo       text not null,
  subido_en            timestamptz not null default now(),
  -- Para la IA (etapa futura): quedan vacías por ahora.
  perfil_estructurado  jsonb,
  resumen              text
);

alter table public.cvs enable row level security;

-- Si se reemplaza el CV, el análisis anterior deja de valer: se vacía.
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
  end if;
  return new;
end;
$$;

create trigger cvs_al_reemplazar
  before update on public.cvs
  for each row execute function public.cvs_limpiar_analisis();

-- ---------------------------------------------------------------------
-- Permisos y políticas (RLS)
-- ---------------------------------------------------------------------
-- El postulante solo puede escribir los datos del archivo, nunca las
-- columnas de IA. Nadie borra CVs desde la app.
revoke all on public.cvs from anon, authenticated;
grant select on public.cvs to authenticated;
grant insert (postulante_id, ruta_archivo, nombre_archivo, subido_en) on public.cvs to authenticated;
-- (postulante_id se incluye porque el "upsert" lo reescribe; la política
-- de abajo exige que siga siendo el del propio usuario.)
grant update (postulante_id, ruta_archivo, nombre_archivo, subido_en) on public.cvs to authenticated;

-- Cada postulante ve su CV; el reclutador ve todos.
create policy "cvs_select_propio_o_reclutador"
  on public.cvs for select
  to authenticated
  using (postulante_id = (select auth.uid()) or (select public.es_reclutador()));

-- Solo un postulante registra su propio CV, siempre en su carpeta.
create policy "cvs_insert_propio"
  on public.cvs for insert
  to authenticated
  with check (
    postulante_id = (select auth.uid())
    and ruta_archivo = (select auth.uid())::text || '/cv.pdf'
    and not (select public.es_reclutador())
  );

create policy "cvs_update_propio"
  on public.cvs for update
  to authenticated
  using (postulante_id = (select auth.uid()))
  with check (
    postulante_id = (select auth.uid())
    and ruta_archivo = (select auth.uid())::text || '/cv.pdf'
  );

-- ---------------------------------------------------------------------
-- Storage: bucket PRIVADO, solo PDF, hasta 5 MB
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 5242880, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- El postulante sube y reemplaza archivos solo dentro de su carpeta.
create policy "cvs_storage_insert_propio"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not (select public.es_reclutador())
  );

create policy "cvs_storage_update_propio"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Leer (y por lo tanto generar enlaces firmados): el dueño o un reclutador.
create policy "cvs_storage_select_propio_o_reclutador"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'cvs'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.es_reclutador())
    )
  );
