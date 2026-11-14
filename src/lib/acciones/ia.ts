"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { exigirRol } from "@/lib/auth";
import { analizarCv, analizarVarios } from "@/lib/ia/analizar";
import { LOTE_REANALISIS, MINUTOS_ANALISIS_VENCIDO } from "@/lib/ia/config";
import { traerTodo } from "@/lib/dashboard";
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

// Analiza solo los CVs que lo necesitan: los que nunca se analizaron, los que fallaron y los que
// todavía no fueron comparados con alguna de las vacantes abiertas. Si no hay ninguno, avisa que
// todo está al día (y no gasta nada). Procesa un lote por vez para cuidar el tiempo y el gasto.
export async function reanalizarPendientes(): Promise<Resultado> {
  await exigirRol("reclutador");
  const supabase = await crearClienteServidor();

  const [cvs, { data: abiertas }, comparados] = await Promise.all([
    traerTodo<{ postulante_id: string; analisis_estado: string; analisis_iniciado_en: string | null; analizado_en: string | null }>(
      (desde, hasta) =>
        supabase
          .from("cvs")
          .select("postulante_id, analisis_estado, analisis_iniciado_en, analizado_en")
          .order("id")
          .range(desde, hasta),
    ),
    supabase.from("vacantes").select("id").eq("activa", true),
    traerTodo<{ postulante_id: string; vacante_id: string }>((desde, hasta) =>
      supabase.from("afinidades_cv_vacante").select("postulante_id, vacante_id").order("id").range(desde, hasta),
    ),
  ]);

  const idsAbiertas = (abiertas ?? []).map((v) => v.id as string);
  const comparadasPor = new Map<string, Set<string>>();
  for (const c of comparados) {
    const set = comparadasPor.get(c.postulante_id) ?? new Set<string>();
    set.add(c.vacante_id);
    comparadasPor.set(c.postulante_id, set);
  }

  const vencido = Date.now() - MINUTOS_ANALISIS_VENCIDO * 60 * 1000;
  const elegibles = cvs
    .filter((c) => {
      // Si se está analizando ahora mismo (y no venció), no se vuelve a pedir.
      const enCurso =
        c.analisis_estado === "analizando" &&
        c.analisis_iniciado_en &&
        new Date(c.analisis_iniciado_en).getTime() >= vencido;
      if (enCurso) return false;
      if (c.analisis_estado !== "listo") return true; // nunca analizado, fallido o vencido
      const hechas = comparadasPor.get(c.postulante_id);
      return idsAbiertas.some((id) => !hechas?.has(id)); // le falta alguna vacante abierta
    })
    // Primero los que nunca se analizaron, después por fecha de análisis (los más viejos antes).
    .sort((a, b) => (a.analizado_en ?? "").localeCompare(b.analizado_en ?? ""));
  const lote = elegibles.slice(0, LOTE_REANALISIS).map((c) => c.postulante_id as string);

  if (lote.length === 0)
    return { mensaje: "Todo está al día: todos los CVs están analizados y comparados con las vacantes abiertas." };

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

// Desde una vacante: analiza los CVs que todavía no fueron comparados con ESTA vacante
// (por ejemplo, los de personas que se postularon a otros puestos antes de que existiera).
// Procesa un lote por vez; si quedan más, hay que volver a apretar el botón.
export async function reanalizarParaVacante(vacanteId: string): Promise<Resultado> {
  await exigirRol("reclutador");
  const supabase = await crearClienteServidor();

  const { data: vacante } = await supabase.from("vacantes").select("id, activa").eq("id", vacanteId).maybeSingle();
  if (!vacante) return { error: "No se encontró la vacante." };
  if (!vacante.activa) return { error: "La vacante está desactivada: activala para que la IA la tenga en cuenta." };

  const [cvs, comparados] = await Promise.all([
    traerTodo<{ postulante_id: string; analisis_estado: string; analisis_iniciado_en: string | null }>((desde, hasta) =>
      supabase.from("cvs").select("postulante_id, analisis_estado, analisis_iniciado_en").order("id").range(desde, hasta),
    ),
    traerTodo<{ postulante_id: string }>((desde, hasta) =>
      supabase.from("afinidades_cv_vacante").select("postulante_id").eq("vacante_id", vacanteId).order("id").range(desde, hasta),
    ),
  ]);

  const yaComparados = new Set(comparados.map((c) => c.postulante_id as string));
  const vencido = Date.now() - MINUTOS_ANALISIS_VENCIDO * 60 * 1000;
  const elegibles = cvs.filter(
    (c) =>
      !yaComparados.has(c.postulante_id as string) &&
      (c.analisis_estado !== "analizando" ||
        !c.analisis_iniciado_en ||
        new Date(c.analisis_iniciado_en).getTime() < vencido),
  );
  const lote = elegibles.slice(0, LOTE_REANALISIS).map((c) => c.postulante_id as string);

  if (lote.length === 0) return { mensaje: "Todos los CVs ya fueron comparados con esta vacante." };

  after(async () => {
    await analizarVarios(lote, "reclutador");
  });
  refrescarPantallas();
  const faltan = elegibles.length - lote.length;
  return {
    mensaje:
      faltan > 0
        ? `Empezó el análisis de ${lote.length} CVs. Quedan ${faltan} más: cuando termine, volvé a apretar el botón.`
        : `Empezó el análisis de ${lote.length} ${lote.length === 1 ? "CV" : "CVs"}. En unos segundos aparecen los resultados en Postulaciones → Recomendaciones de IA.`,
  };
}
