import "server-only";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { pedirAnalisis, type VacanteParaIa } from "@/lib/ia/claude";
import type { MotivosAfinidad } from "@/lib/ia/esquema";
import {
  CONCURRENCIA_REANALISIS,
  MAX_VACANTES_POR_ANALISIS,
  MODELO_IA,
  TOPE_DIARIO_POR_PERSONA,
} from "@/lib/ia/config";

type Admin = ReturnType<typeof crearClienteAdmin>;

// "automatico": lo dispara la propia persona al subir su CV (tiene tope diario).
// "reclutador": lo dispara una reclutadora con el botón "Re-analizar" (sin ese tope).
export type OrigenAnalisis = "automatico" | "reclutador";

function mensajeDe(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function limitarAfinidad(valor: number) {
  if (!Number.isFinite(valor)) return 0;
  return Math.min(100, Math.max(0, Math.round(valor)));
}

// Analiza el CV de una persona frente a TODAS las vacantes abiertas y guarda el resultado.
// Nunca lanza errores: si algo falla, deja el CV marcado como "error" y lo anota en los logs.
export async function analizarCv(
  postulanteId: string,
  origen: OrigenAnalisis,
): Promise<{ ok: boolean; motivo?: string }> {
  let db: Admin;
  try {
    db = crearClienteAdmin();
  } catch (e) {
    console.error("Análisis IA: no se pudo crear el cliente de Supabase:", mensajeDe(e));
    return { ok: false, motivo: "configuracion" };
  }

  const { data: cv } = await db
    .from("cvs")
    .select("id, ruta_archivo, subido_en")
    .eq("postulante_id", postulanteId)
    .maybeSingle();
  if (!cv) return { ok: false, motivo: "sin-cv" };

  // Marca el estado del CV, solo si sigue siendo la misma versión del archivo.
  const marcar = (estado: "analizando" | "listo" | "error", extra: Record<string, unknown> = {}) =>
    db
      .from("cvs")
      .update({ analisis_estado: estado, ...extra })
      .eq("id", cv.id)
      .eq("subido_en", cv.subido_en)
      .select("id");

  try {
    // 1) Tope diario por persona (solo para los análisis automáticos).
    if (origen === "automatico") {
      const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await db
        .from("analisis_ia_intentos")
        .select("id", { count: "exact", head: true })
        .eq("postulante_id", postulanteId)
        .gte("creado_en", desde);
      if ((count ?? 0) >= TOPE_DIARIO_POR_PERSONA) {
        console.warn("Análisis IA: tope diario alcanzado para una persona");
        await marcar("error");
        return { ok: false, motivo: "tope-diario" };
      }
    }
    await db.from("analisis_ia_intentos").insert({ postulante_id: postulanteId });
    await marcar("analizando", { analisis_iniciado_en: new Date().toISOString() });

    // 2) El PDF, desde el bucket privado.
    const { data: archivo, error: errorArchivo } = await db.storage.from("cvs").download(cv.ruta_archivo);
    if (errorArchivo || !archivo) throw new Error("No se pudo leer el PDF del CV");
    const pdfBase64 = Buffer.from(await archivo.arrayBuffer()).toString("base64");

    // 3) Las vacantes abiertas (las más recientes).
    const { data: vacantes } = await db
      .from("vacantes")
      .select("id, titulo, descripcion, requisitos, habilidades, informacion_adicional")
      .eq("activa", true)
      .order("creado_en", { ascending: false })
      .limit(MAX_VACANTES_POR_ANALISIS);
    const abiertas = (vacantes ?? []) as VacanteParaIa[];

    // 4) Claude.
    const resultado = await pedirAnalisis(pdfBase64, abiertas);

    // 5) Solo se aceptan vacantes que realmente se enviaron (ignora ids inventados o repetidos).
    const idsValidos = new Set(abiertas.map((v) => v.id));
    const vistos = new Set<string>();
    const filas = resultado.vacantes
      .filter((v) => idsValidos.has(v.vacante_id) && !vistos.has(v.vacante_id) && vistos.add(v.vacante_id))
      .map((v) => {
        const motivos: MotivosAfinidad = {
          coincide: v.coincide.slice(0, 6),
          inferido: v.inferido.slice(0, 6),
          falta: v.falta.slice(0, 6),
          conclusion: v.conclusion,
        };
        return {
          vacante_id: v.vacante_id,
          postulante_id: postulanteId,
          afinidad: limitarAfinidad(v.afinidad),
          analisis: motivos,
          modelo: MODELO_IA,
        };
      });

    // 6) Guardar. Si mientras tanto la persona reemplazó su CV, este resultado se descarta.
    const { data: guardado } = await marcar("listo", {
      perfil_estructurado: resultado.perfil,
      resumen: resultado.resumen,
      analizado_en: new Date().toISOString(),
    });
    if (!guardado || guardado.length === 0) return { ok: false, motivo: "cv-reemplazado" };

    // Los resultados nuevos reemplazan a los anteriores de esta persona (sin dejar un momento sin datos):
    // se guardan o actualizan los actuales y se quitan los de vacantes que ya no se compararon.
    if (filas.length > 0) {
      const ahora = new Date().toISOString();
      const { error } = await db
        .from("afinidades_cv_vacante")
        .upsert(
          filas.map((f) => ({ ...f, creado_en: ahora })),
          { onConflict: "vacante_id,postulante_id" },
        );
      if (error) throw new Error(`No se pudieron guardar las afinidades: ${error.message}`);
    }
    let borrar = db.from("afinidades_cv_vacante").delete().eq("postulante_id", postulanteId);
    if (filas.length > 0) borrar = borrar.not("vacante_id", "in", `(${filas.map((f) => f.vacante_id).join(",")})`);
    await borrar;
    return { ok: true };
  } catch (e) {
    // Solo se anota el mensaje del error: nunca el contenido del CV.
    console.error("Análisis IA fallido:", mensajeDe(e));
    try {
      await marcar("error");
    } catch {
      /* si tampoco se puede marcar, queda "analizando" y vence solo */
    }
    return { ok: false, motivo: "error" };
  }
}

// Analiza varios CVs, unos pocos a la vez.
export async function analizarVarios(postulanteIds: string[], origen: OrigenAnalisis) {
  const cola = [...postulanteIds];
  const trabajadores = Array.from({ length: Math.min(CONCURRENCIA_REANALISIS, cola.length) }, async () => {
    for (let id = cola.shift(); id !== undefined; id = cola.shift()) {
      await analizarCv(id, origen);
    }
  });
  await Promise.all(trabajadores);
}
