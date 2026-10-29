import "server-only";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { pedirPreguntas } from "@/lib/ia/claude";
import { MODELO_IA } from "@/lib/ia/config";

// Genera y guarda las preguntas de entrevista de una postulación. Devuelve un mensaje de error
// (sin datos del CV) o null si salió bien.
export async function generarPreguntasEntrevista(postulacionId: string): Promise<string | null> {
  try {
    const db = crearClienteAdmin();
    const { data: postulacion } = await db
      .from("postulaciones")
      .select("id, vacante_id, postulante_id, analisis")
      .eq("id", postulacionId)
      .maybeSingle();
    if (!postulacion) return "No se encontró la postulación.";

    const [{ data: cv }, { data: vacante }] = await Promise.all([
      db.from("cvs").select("ruta_archivo").eq("postulante_id", postulacion.postulante_id).maybeSingle(),
      db
        .from("vacantes")
        .select("id, titulo, descripcion, requisitos, habilidades, informacion_adicional")
        .eq("id", postulacion.vacante_id)
        .maybeSingle(),
    ]);
    if (!cv || !vacante) return "No se encontró el CV o la vacante.";

    const { data: archivo, error } = await db.storage.from("cvs").download(cv.ruta_archivo);
    if (error || !archivo) return "No se pudo leer el CV.";
    const pdfBase64 = Buffer.from(await archivo.arrayBuffer()).toString("base64");

    const previo = postulacion.analisis ? JSON.stringify(postulacion.analisis) : "";
    const preguntas = await pedirPreguntas(pdfBase64, vacante, previo);
    if (preguntas.length === 0) return "La IA no devolvió preguntas. Probá de nuevo.";

    const { error: errorGuardar } = await db
      .from("preguntas_entrevista")
      .upsert({ postulacion_id: postulacionId, preguntas, modelo: MODELO_IA, generado_en: new Date().toISOString() });
    if (errorGuardar) return "No se pudieron guardar las preguntas.";
    return null;
  } catch (e) {
    // Solo el mensaje del error: nunca el contenido del CV.
    console.error("Preguntas de entrevista fallidas:", e instanceof Error ? e.message : String(e));
    return "No se pudieron generar las preguntas. Probá de nuevo en un rato.";
  }
}
