-- =====================================================================
-- Editar vacantes ya creadas
-- =====================================================================
-- Hasta ahora, de una vacante solo se podía cambiar si estaba activa o no.
-- Ahora el reclutador también puede corregir el texto del puesto.
--
-- La política "vacantes_update_reclutador" (migración de vacantes) sigue
-- vigente: solo un reclutador puede actualizar vacantes. Los postulantes no.
-- No se habilitan id, creado_por ni creado_en: esos datos no se pueden tocar.
grant update (titulo, descripcion, requisitos, habilidades, informacion_adicional)
  on public.vacantes to authenticated;
