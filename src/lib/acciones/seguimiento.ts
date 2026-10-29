"use server";

import { revalidatePath } from "next/cache";
import { exigirRol } from "@/lib/auth";
import { esEtapa } from "@/lib/etapas";
import { generarPreguntasEntrevista } from "@/lib/ia/preguntas";
import { crearClienteServidor } from "@/lib/supabase/server";

type Resultado = { error?: string };

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function refrescar() {
  revalidatePath("/reclutador", "layout");
}

// Cambia la etapa de una postulación. La base de datos anota el cambio en el historial.
export async function cambiarEtapa(postulacionId: string, etapa: string): Promise<Resultado> {
  await exigirRol("reclutador");
  if (!ES_UUID.test(postulacionId) || !esEtapa(etapa)) return { error: "No se pudo cambiar la etapa." };
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("postulaciones").update({ etapa }).eq("id", postulacionId).select("id");
  if (error || !data || data.length === 0) return { error: "No se pudo cambiar la etapa. Actualizá la página e intentá de nuevo." };
  refrescar();
  return {};
}

export async function agregarNota(postulacionId: string, texto: string): Promise<Resultado> {
  await exigirRol("reclutador");
  const limpio = texto.trim();
  if (!ES_UUID.test(postulacionId)) return { error: "No se encontró la postulación." };
  if (!limpio) return { error: "Escribí la nota antes de guardarla." };
  if (limpio.length > 2000) return { error: "La nota es muy larga (máximo 2000 caracteres)." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("notas_postulacion").insert({ postulacion_id: postulacionId, texto: limpio });
  if (error) return { error: "No se pudo guardar la nota. Intentá de nuevo." };
  refrescar();
  return {};
}

export async function eliminarNota(notaId: string): Promise<Resultado> {
  await exigirRol("reclutador");
  if (!ES_UUID.test(notaId)) return { error: "No se encontró la nota." };
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("notas_postulacion").delete().eq("id", notaId).select("id");
  if (error || !data || data.length === 0) return { error: "No se pudo borrar la nota." };
  refrescar();
  return {};
}

// Pide a la IA las preguntas de entrevista (solo cuando la reclutadora aprieta el botón).
export async function generarPreguntas(postulacionId: string): Promise<Resultado> {
  await exigirRol("reclutador");
  if (!ES_UUID.test(postulacionId)) return { error: "No se encontró la postulación." };
  // Con la sesión de la reclutadora se comprueba que la postulación existe y que puede verla.
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("postulaciones").select("id").eq("id", postulacionId).maybeSingle();
  if (!data) return { error: "No se encontró la postulación." };
  const error = await generarPreguntasEntrevista(postulacionId);
  if (error) return { error };
  refrescar();
  return {};
}
