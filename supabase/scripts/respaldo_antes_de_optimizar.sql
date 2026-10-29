-- =====================================================================
-- RESPALDO de los datos antes de optimizar el modelo (correr UNA vez, antes de la migración)
-- =====================================================================
-- Copia todas las tablas de la app al esquema "respaldo". Ese esquema NO está expuesto por la
-- API de Supabase (nadie puede leerlo desde la app), así que los datos quedan guardados sin
-- riesgo. No modifica ni borra nada de las tablas originales.
-- Se puede correr más de una vez sin problema (si una copia ya existe, la deja como está).
-- Para volver atrás una tabla: insert into public.<tabla> select * from respaldo.<tabla>;
-- (después de vaciarla). Cuando todo esté verificado, se puede borrar con: drop schema respaldo cascade;

create schema if not exists respaldo;

create table if not exists respaldo.perfiles                 as table public.perfiles;
create table if not exists respaldo.vacantes                 as table public.vacantes;
create table if not exists respaldo.cvs                      as table public.cvs;
create table if not exists respaldo.postulaciones            as table public.postulaciones;
create table if not exists respaldo.candidatos_sugeridos     as table public.candidatos_sugeridos;
create table if not exists respaldo.analisis_ia_intentos     as table public.analisis_ia_intentos;
create table if not exists respaldo.postulacion_movimientos  as table public.postulacion_movimientos;
create table if not exists respaldo.notas_postulacion        as table public.notas_postulacion;
create table if not exists respaldo.preguntas_entrevista     as table public.preguntas_entrevista;

-- Control: cuántas filas se copiaron de cada tabla (tienen que coincidir con las originales).
select 'perfiles' as tabla, (select count(1) from public.perfiles) as original, (select count(1) from respaldo.perfiles) as copia
union all select 'vacantes', (select count(1) from public.vacantes), (select count(1) from respaldo.vacantes)
union all select 'cvs', (select count(1) from public.cvs), (select count(1) from respaldo.cvs)
union all select 'postulaciones', (select count(1) from public.postulaciones), (select count(1) from respaldo.postulaciones)
union all select 'candidatos_sugeridos', (select count(1) from public.candidatos_sugeridos), (select count(1) from respaldo.candidatos_sugeridos)
union all select 'analisis_ia_intentos', (select count(1) from public.analisis_ia_intentos), (select count(1) from respaldo.analisis_ia_intentos)
union all select 'postulacion_movimientos', (select count(1) from public.postulacion_movimientos), (select count(1) from respaldo.postulacion_movimientos)
union all select 'notas_postulacion', (select count(1) from public.notas_postulacion), (select count(1) from respaldo.notas_postulacion)
union all select 'preguntas_entrevista', (select count(1) from public.preguntas_entrevista), (select count(1) from respaldo.preguntas_entrevista);
