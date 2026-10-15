"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { exigirRol } from "@/lib/auth";
import { analizarCv, analizarVarios } from "@/lib/ia/analizar";
import { LOTE_REANALISIS, MINUTOS_ANALISIS_VENCIDO } from "@/lib/ia/config";
import { crearClienteServidor } from "@/lib/supabase/server";

type Resultado = { error?: string; mensaje?: string };

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function refrescarPantallas() {
  revalidatePath("/reclutador/postulaciones", "layout");
  revalidatePath("/reclutador/dashboard", "layout");
  revalidatePath("/reclutador/vacantes", "layout");
}

// Vuelve a analizar el CV de una persona (por ejemplo, después de crear vacantes nuevas).
export async function reanalizarCv(postulanteId: string): Promise<Resultado> {
  await exigirRol("reclutador");
  if (!ES_UUID.test(postulanteId)) return { error: "No se reconoció a la persona." };

  after(async () => {
    await analizarCv(postulanteId, "reclutador");
  });
  refrescarPantallas();
  return { mensaje: "Empezó el análisis. En unos segundos se actualiza solo." };
}

// Vuelve a analizar los CVs que más lo necesitan: primero los que nunca se analizaron o
// fallaron, después los más viejos. Procesa un lote por vez para cuidar el tiempo y el gasto.
export async function reanalizarPendientes(): Promise<Resultado> {
  await exigirRol("reclutador");
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("cvs")
    .select("postulante_id, analisis_estado, analisis_iniciado_en, analizado_en")
    .order("analizado_en", { ascending: true, nullsFirst: true })
    .limit(100);

  const vencido = Date.now() - MINUTOS_ANALISIS_VENCIDO * 60 * 1000;
  const elegibles = (data ?? []).filter(
    (c) =>
      c.analisis_estado !== "analizando" ||
      !c.analisis_iniciado_en ||
      new Date(c.analisis_iniciado_en).getTime() < vencido,
  );
  const lote = elegibles.slice(0, LOTE_REANALISIS).map((c) => c.postulante_id as string);

  if (lote.length === 0) return { mensaje: "No hay CVs para analizar en este momento." };

  after(async () => {
    await analizarVarios(lote, "reclutador");
  });
  refrescarPantallas();
  const faltan = elegibles.length - lote.length;
  return {
    mensaje:
      faltan > 0
        ? `Empezó el análisis de ${lote.length} CVs. Quedan ${faltan} más: cuando termine, volvé a apretar el botón.`
        : `Empezó el análisis de ${lote.length} ${lote.length === 1 ? "CV" : "CVs"}. En unos segundos se actualiza solo.`,
  };
}
