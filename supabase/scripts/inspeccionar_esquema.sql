-- =====================================================================
-- Inspección del esquema REAL de Supabase (solo lectura: no modifica nada)
-- =====================================================================
-- Pegar en el SQL Editor y apretar Run. Devuelve una tabla con todo el esquema de "public":
-- columnas, restricciones, índices, políticas de seguridad y disparadores.
-- Sirve para comprobar que la base desplegada coincide con las migraciones (docs/base-de-datos.md).

select '1-columna' as tipo, table_name as tabla,
       column_name || ' ' || data_type || case when is_nullable = 'NO' then ' NOT NULL' else '' end
         || coalesce(' DEFAULT ' || column_default, '') as detalle
from information_schema.columns where table_schema = 'public'
union all
select '2-restriccion', conrelid::regclass::text, conname || ' ' || pg_get_constraintdef(oid)
from pg_constraint where connamespace = 'public'::regnamespace
union all
select '3-indice', tablename, indexname
from pg_indexes where schemaname = 'public'
union all
select '4-politica', tablename, policyname || ' (' || cmd || ')'
from pg_policies where schemaname = 'public'
union all
select '5-disparador', event_object_table, trigger_name
from information_schema.triggers where trigger_schema in ('public', 'auth')
union all
select '6-rls', relname::text, case when relrowsecurity then 'RLS activado' else 'SIN RLS' end
from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r'
order by 1, 2, 3;
