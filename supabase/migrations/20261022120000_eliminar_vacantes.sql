-- =====================================================================
-- Eliminar vacantes
-- =====================================================================
-- Hasta ahora las vacantes solo se podían activar o desactivar. Ahora un reclutador
-- también puede ELIMINARLAS. Atención: al borrar una vacante, la base de datos borra
-- también (en cascada) todas sus postulaciones y sus candidatos sugeridos por la IA.
-- Las postulaciones de otras vacantes que la tenían como "vacante sugerida" quedan sin
-- sugerencia. No se puede deshacer.
--
-- Solo un reclutador puede borrar: lo garantiza la política de abajo. Los postulantes no.
grant delete on public.vacantes to authenticated;

create policy "vacantes_delete_reclutador"
  on public.vacantes for delete
  to authenticated
  using ((select public.es_reclutador()));
