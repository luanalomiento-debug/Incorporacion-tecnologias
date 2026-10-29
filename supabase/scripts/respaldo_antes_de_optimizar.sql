-- =====================================================================
-- RESPALDO de los datos antes de optimizar el modelo (correr UNA vez, antes de la migración)
-- =====================================================================
-- Copia todas las tablas de la app al esquema "respaldo". Ese esquema NO está expuesto por la
-- API de Supabase (nadie puede leerlo desde la app), así que los datos quedan guardados sin
-- riesgo. No modifica ni borra nada de las tablas originales.
-- Para volver atrás una tabla: insert into public.<tabla> select * from respaldo.<tabla>;
-- (después de vaciarla). Cuando todo esté verificado, se puede borrar con: drop schema respaldo cascade;

create schema if not exists respaldo;

create table respaldo.perfiles                 as table public.perfiles;
create table respaldo.vacantes                 as table public.vacantes;
create table respaldo.cvs                      as table public.cvs;
create table respaldo.postulaciones            as table public.postulaciones;
create table respaldo.candidatos_sugeridos     as table public.candidatos_sugeridos;
create table respaldo.analisis_ia_intentos     as table public.analisis_ia_intentos;
create table respaldo.postulacion_movimientos  as table public.postulacion_movimientos;
create table respaldo.notas_postulacion        as table public.notas_postulacion;
create table respaldo.preguntas_entrevista     as table public.preguntas_entrevista;

-- Control: cuántas filas se copiaron de cada tabla (tienen que coincidir con las originales).
select 'perfiles' as tabla, (select count(*) from public.perfiles) as original, (select count(*) from respaldo.perfiles) as copia
union all select 'vacantes', (select count(*) from public.vacantes), (select count(*) from respaldo.vacantes)
union all select 'cvs', (select count(*) from public.cvs), (select count(*) from respaldo.cvs)
union all select 'postulaciones', (select count(*) from public.postulaciones), (select count(*) from respaldo.postulaciones)
union all select 'candidatos_sugeridos', (select count(*) from public.candidatos_sugeridos), (select count(*) from respaldo.candidatos_sugeridos)
union all select 'analisis_ia_intentos', (select count(*) from public.analisis_ia_intentos), (select count(*) from respaldo.analisis_ia_intentos)
union all select 'postulacion_movimientos', (select count(*) from public.postulacion_movimientos), (select count(*) from respaldo.postulacion_movimientos)
union all select 'notas_postulacion', (select count(*) from public.notas_postulacion), (select count(*) from respaldo.notas_postulacion)
union all select 'preguntas_entrevista', (select count(*) from public.preguntas_entrevista), (select count(*) from respaldo.preguntas_entrevista);
