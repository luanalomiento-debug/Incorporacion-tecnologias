-- =====================================================================
-- Resultados de IA: una sola fuente de verdad (y no visibles para el postulante)
-- =====================================================================
-- Antes: la afinidad y el análisis de IA vivían en DOS lugares: la tabla "candidatos_sugeridos"
-- y una copia en "postulaciones" (más la "vacante sugerida"). Dos fuentes de verdad que el código
-- tenía que mantener iguales y, además, el postulante podía leer su propia fila de "postulaciones",
-- es decir, su puntaje y la evaluación interna de la IA.
-- Ahora: los resultados viven SOLO en "afinidades_cv_vacante" (antes "candidatos_sugeridos"), que
-- solo puede leer el reclutador. "postulaciones" conserva únicamente datos del proceso.
-- La "otra vacante sugerida" deja de guardarse: se calcula al mostrarla a partir de esas afinidades.
--
-- Antes de correr: haber corrido el respaldo (supabase/scripts/respaldo_antes_de_optimizar.sql) y la
-- migración 20261105120000. Todo ocurre en una sola transacción: si algo falla, no se aplica nada.
-- IMPORTANTE: justo después de correr esta migración hay que publicar la versión nueva de la app
-- (la anterior todavía usa las columnas que acá se eliminan).

begin;

-- ---------------------------------------------------------------------
-- 1) Red de seguridad: ningún resultado de IA se pierde
-- ---------------------------------------------------------------------
-- Si alguna postulación tiene una afinidad que no está en la tabla de resultados, se copia antes de
-- eliminar las columnas.
insert into public.candidatos_sugeridos (vacante_id, postulante_id, afinidad, analisis)
select p.vacante_id, p.postulante_id, p.afinidad, p.analisis
from public.postulaciones p
where p.afinidad is not null
  and not exists (
    select 1 from public.candidatos_sugeridos c
    where c.vacante_id = p.vacante_id and c.postulante_id = p.postulante_id
  );

-- ---------------------------------------------------------------------
-- 2) La tabla de resultados pasa a llamarse por lo que contiene
-- ---------------------------------------------------------------------
-- Guarda la afinidad de CADA CV con CADA vacante abierta (incluidas aquellas a las que la persona sí
-- se postuló), no solo "candidatos sugeridos".
alter table public.candidatos_sugeridos rename to afinidades_cv_vacante;

alter table public.afinidades_cv_vacante rename constraint candidatos_sugeridos_pkey to afinidades_cv_vacante_pkey;
alter table public.afinidades_cv_vacante rename constraint candidatos_sugeridos_unico to afinidades_cv_vacante_unico;
alter table public.afinidades_cv_vacante rename constraint candidatos_sugeridos_vacante_id_fkey to afinidades_cv_vacante_vacante_id_fkey;
alter table public.afinidades_cv_vacante rename constraint candidatos_sugeridos_postulante_id_fkey to afinidades_cv_vacante_postulante_id_fkey;
alter table public.afinidades_cv_vacante rename constraint candidatos_sugeridos_afinidad_rango to afinidades_cv_vacante_afinidad_rango;
alter table public.afinidades_cv_vacante rename constraint candidatos_sugeridos_analisis_objeto to afinidades_cv_vacante_analisis_objeto;
alter index public.candidatos_sugeridos_postulante_idx rename to afinidades_cv_vacante_postulante_idx;
alter policy "candidatos_sugeridos_select_reclutador" on public.afinidades_cv_vacante rename to "afinidades_select_reclutador";

-- ---------------------------------------------------------------------
-- 3) "postulaciones" deja de duplicar datos de la IA
-- ---------------------------------------------------------------------
-- Al eliminar las columnas se eliminan solas sus restricciones e índices (rango de afinidad, forma del
-- JSON, "sugerida distinta" y el índice de vacante_sugerida_id).
alter table public.postulaciones
  drop column afinidad,
  drop column analisis,
  drop column vacante_sugerida_id;

-- ---------------------------------------------------------------------
-- 4) Documentación
-- ---------------------------------------------------------------------
comment on table public.afinidades_cv_vacante is 'Resultado del análisis de IA: afinidad (0 a 100) y motivos de cada CV con cada vacante abierta, incluidas las que la persona sí se postuló. Única fuente de verdad de los resultados de IA; solo la lee el reclutador.';
comment on table public.postulaciones is 'Una persona postulada a una vacante (única por par). Solo datos del proceso (etapa y fechas): los resultados de IA están en afinidades_cv_vacante.';

commit;
