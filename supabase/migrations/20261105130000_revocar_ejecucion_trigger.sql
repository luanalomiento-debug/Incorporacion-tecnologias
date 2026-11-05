-- =====================================================================
-- Seguridad: la función del disparador de etapas no debe poder llamarse desde la API
-- =====================================================================
-- El asesor de seguridad de Supabase avisó que "postulaciones_registrar_etapa" (SECURITY DEFINER) figura
-- como ejecutable por anon y authenticated vía /rest/v1/rpc. Es una función de disparador y no se puede
-- invocar como RPC útil, pero no debe estar expuesta. Revocar EXECUTE no afecta al disparador: PostgreSQL
-- no exige ese permiso a quien lo dispara (igual que "crear_perfil_nuevo_usuario" y "sincronizar_email_perfil").
-- NO se toca "es_reclutador()": las políticas RLS la necesitan y debe seguir siendo ejecutable.

revoke execute on function public.postulaciones_registrar_etapa() from public, anon, authenticated;
