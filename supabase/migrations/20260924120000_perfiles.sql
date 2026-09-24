-- =====================================================================
-- Parte 1: perfiles y roles (RF01, RF02)
-- =====================================================================

-- Tabla de perfiles: una fila por cada usuario de Supabase Auth.
create table public.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null default '',
  apellido   text not null default '',
  email      text not null,
  rol        text not null default 'postulante'
             check (rol in ('postulante', 'reclutador')),
  creado_en  timestamptz not null default now()
);

alter table public.perfiles enable row level security;

-- ---------------------------------------------------------------------
-- ¿El usuario actual es reclutador?
-- "security definer" permite leer perfiles sin que las políticas de RLS
-- se llamen a sí mismas en bucle. Se usa en las políticas de todas las tablas.
-- ---------------------------------------------------------------------
create or replace function public.es_reclutador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'reclutador'
  );
$$;

revoke execute on function public.es_reclutador() from public, anon;
grant execute on function public.es_reclutador() to authenticated;

-- ---------------------------------------------------------------------
-- Al registrarse, se crea el perfil automáticamente.
-- El rol SIEMPRE es 'postulante': lo que mande el navegador se ignora.
-- Los reclutadores se asignan a mano desde el panel de Supabase.
-- ---------------------------------------------------------------------
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, apellido, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'apellido', ''),
    new.email,
    'postulante'
  );
  return new;
end;
$$;

revoke execute on function public.crear_perfil_nuevo_usuario() from public, anon, authenticated;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- ---------------------------------------------------------------------
-- Permisos y políticas (RLS)
-- ---------------------------------------------------------------------
-- Nadie sin sesión accede. Con sesión: se puede leer y, como máximo,
-- editar nombre y apellido. El rol y el email no se pueden cambiar desde la app.
revoke all on public.perfiles from anon, authenticated;
grant select on public.perfiles to authenticated;
grant update (nombre, apellido) on public.perfiles to authenticated;

-- Cada usuario ve su propio perfil; el reclutador ve todos.
create policy "perfiles_select_propio_o_reclutador"
  on public.perfiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.es_reclutador()));

-- Cada usuario solo puede editar su propio perfil.
-- (El reclutador NO puede editar perfiles de postulantes.)
create policy "perfiles_update_propio"
  on public.perfiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
