-- =====================================================================
-- Optimización del modelo de datos (resultado de la ingeniería inversa del MER)
-- =====================================================================
-- Todos los cambios son ADITIVOS o ENDURECEN reglas que los datos actuales ya cumplen:
-- no se borra ninguna tabla, columna ni dato. Todo ocurre en una sola transacción: si algo
-- falla, no se aplica nada. Antes de correrla, correr supabase/scripts/respaldo_antes_de_optimizar.sql.
-- Detalle y justificación de cada cambio: docs/base-de-datos.md

begin;

-- ---------------------------------------------------------------------
-- 1) Integridad: la afinidad es un número entero de 0 a 100
-- ---------------------------------------------------------------------
-- Antes era "numeric" sin límites: la base aceptaba -5, 250 o 55.37 y solo el código de la app
-- lo impedía. Ahora la propia base lo garantiza (y ocupa menos espacio).
alter table public.postulaciones
  alter column afinidad type smallint using round(afinidad)::smallint,
  add constraint postulaciones_afinidad_rango check (afinidad between 0 and 100);

alter table public.candidatos_sugeridos
  alter column afinidad type smallint using round(afinidad)::smallint,
  add constraint candidatos_sugeridos_afinidad_rango check (afinidad between 0 and 100);

-- ---------------------------------------------------------------------
-- 2) Integridad: reglas de negocio que antes solo vivían en el código
-- ---------------------------------------------------------------------
-- Una vacante "sugerida" nunca puede ser la misma a la que la persona ya se postuló.
alter table public.postulaciones
  add constraint postulaciones_sugerida_distinta
  check (vacante_sugerida_id is null or vacante_sugerida_id <> vacante_id);

-- El CV de cada persona siempre vive en su carpeta (hasta ahora solo lo exigía la política RLS,
-- que el servidor con clave secreta se salta).
alter table public.cvs
  add constraint cvs_ruta_propia check (ruta_archivo = postulante_id::text || '/cv.pdf');

-- Un CV marcado como "listo" siempre tiene la fecha en que se analizó.
alter table public.cvs
  add constraint cvs_listo_con_fecha check (analisis_estado <> 'listo' or analizado_en is not null);

-- Los campos JSON tienen la forma esperada (objeto o lista), no cualquier valor suelto.
alter table public.postulaciones
  add constraint postulaciones_analisis_objeto check (analisis is null or jsonb_typeof(analisis) = 'object');
alter table public.candidatos_sugeridos
  add constraint candidatos_sugeridos_analisis_objeto check (analisis is null or jsonb_typeof(analisis) = 'object');
alter table public.preguntas_entrevista
  add constraint preguntas_entrevista_lista check (jsonb_typeof(preguntas) = 'array');

-- ---------------------------------------------------------------------
-- 3) Índices para las consultas reales de la app
-- ---------------------------------------------------------------------
-- Claves foráneas sin índice: borrar una vacante obligaba a recorrer toda la tabla de postulaciones.
create index postulaciones_vacante_sugerida_idx on public.postulaciones (vacante_sugerida_id)
  where vacante_sugerida_id is not null;

-- La app consulta y borra los resultados de IA "de una persona" (la clave única empieza por vacante).
create index candidatos_sugeridos_postulante_idx on public.candidatos_sugeridos (postulante_id);

-- Alertas del dashboard: candidatos "nuevos" sin revisar y procesos sin cambios, por etapa y antigüedad.
create index postulaciones_etapa_idx on public.postulaciones (etapa, etapa_actualizada_en);

-- El historial se lee siempre por postulación y en orden de fecha: un índice compuesto
-- reemplaza al simple (que queda redundante).
create index postulacion_movimientos_postulacion_fecha_idx
  on public.postulacion_movimientos (postulacion_id, creado_en);
drop index public.postulacion_movimientos_postulacion_idx;

-- ---------------------------------------------------------------------
-- 4) Datos para los indicadores: cuándo se modificó y cuándo se cerró cada vacante
-- ---------------------------------------------------------------------
-- Hasta ahora una vacante solo tenía "activa" (sí/no): no se podía calcular cuánto tiempo estuvo
-- abierta ni cuándo se cambió por última vez.
alter table public.vacantes
  add column actualizado_en timestamptz not null default now(),
  add column cerrada_en timestamptz;

-- Las vacantes existentes: la última modificación conocida es su creación. "cerrada_en" queda vacío
-- en las que ya estaban inactivas porque esa fecha nunca se registró (no se inventa).
update public.vacantes set actualizado_en = creado_en;

create or replace function public.vacantes_registrar_cambios()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  if old.activa and not new.activa then
    new.cerrada_en := now();
  elsif new.activa then
    new.cerrada_en := null;
  end if;
  return new;
end;
$$;

create trigger vacantes_registrar_cambios
  before update on public.vacantes
  for each row execute function public.vacantes_registrar_cambios();

-- ---------------------------------------------------------------------
-- 5) Consistencia con auth.users: el email del perfil siempre coincide con el de la cuenta
-- ---------------------------------------------------------------------
-- perfiles.email es una copia de auth.users.email (necesaria porque la app no puede leer la tabla
-- de autenticación). Antes solo se copiaba al registrarse: si el email de la cuenta cambiaba,
-- quedaban distintos. Ahora se sincroniza.
create or replace function public.sincronizar_email_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.perfiles set email = new.email where id = new.id;
  return new;
end;
$$;

revoke execute on function public.sincronizar_email_perfil() from public, anon, authenticated;

create trigger al_cambiar_email_usuario
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sincronizar_email_perfil();

-- ---------------------------------------------------------------------
-- 6) Trazabilidad de la IA: qué modelo generó cada resultado
-- ---------------------------------------------------------------------
-- Los resultados se reemplazan en cada nuevo análisis; sin este dato no se puede saber con qué modelo
-- se calculó una afinidad (clave para auditar y comparar). Quedan vacíos en los resultados anteriores.
alter table public.candidatos_sugeridos add column modelo text;
alter table public.preguntas_entrevista add column modelo text;

-- ---------------------------------------------------------------------
-- 7) Documentación dentro de la propia base
-- ---------------------------------------------------------------------
comment on table public.perfiles is 'Una fila por cuenta (auth.users). Guarda nombre, email y rol (postulante o reclutador).';
comment on table public.vacantes is 'Búsquedas laborales publicadas por reclutadores. "activa" controla si los postulantes las ven.';
comment on table public.cvs is 'CV (PDF) de cada postulante: exactamente uno por persona. El archivo está en el bucket privado "cvs"; acá va el análisis de la IA.';
comment on table public.postulaciones is 'Una persona postulada a una vacante (única por par). Lleva la etapa del proceso y una copia de la afinidad calculada por la IA.';
comment on table public.candidatos_sugeridos is 'Resultado del análisis de IA: afinidad de cada CV con cada vacante abierta (incluye las vacantes a las que la persona sí se postuló). Solo lo lee el reclutador.';
comment on table public.analisis_ia_intentos is 'Un registro por cada análisis de IA pedido: sirve para el tope diario por persona.';
comment on table public.postulacion_movimientos is 'Historial de cambios de etapa. Lo escribe un disparador; nadie lo modifica a mano.';
comment on table public.notas_postulacion is 'Notas internas del equipo de selección sobre una postulación. El postulante no puede verlas.';
comment on table public.preguntas_entrevista is 'Preguntas de entrevista sugeridas por la IA para una postulación. Las escribe solo el servidor.';

comment on column public.postulaciones.etapa is 'nuevo, preseleccionado, entrevista, finalista, contratado o descartado.';
comment on column public.postulaciones.etapa_actualizada_en is 'Se actualiza sola (disparador) cuando cambia la etapa. Base de las alertas de procesos estancados.';
comment on column public.postulaciones.afinidad is 'Copia de candidatos_sugeridos.afinidad para esta vacante (0 a 100). Nula hasta que se analiza el CV.';
comment on column public.postulaciones.vacante_sugerida_id is 'Otra vacante que a la IA le parece claramente mejor para esta persona (si la hay).';
comment on column public.vacantes.cerrada_en is 'Momento en que la vacante se desactivó por última vez (nulo si está activa o si se cerró antes de registrarlo).';
comment on column public.vacantes.actualizado_en is 'Última modificación de la vacante (se actualiza sola).';
comment on column public.cvs.analisis_estado is 'pendiente, analizando, listo o error.';
comment on column public.candidatos_sugeridos.modelo is 'Modelo de IA que calculó este resultado (nulo en los análisis anteriores a registrarlo).';

commit;
