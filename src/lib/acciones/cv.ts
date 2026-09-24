"use server";

import { revalidatePath } from "next/cache";
import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { rutaCv } from "@/lib/tipos";

// Se llama después de que el navegador subió el PDF a Storage.
// Guarda (o reemplaza) la referencia al archivo en la tabla cvs.
export async function registrarCv(nombreArchivo: string): Promise<{ error?: string }> {
  const perfil = await exigirRol("postulante");
  const ruta = rutaCv(perfil.id);
  const supabase = await crearClienteServidor();

  const { data: existe } = await supabase.storage.from("cvs").exists(ruta);
  if (!existe) return { error: "No encontramos el archivo subido. Intentá de nuevo." };

  const { error } = await supabase.from("cvs").upsert(
    {
      postulante_id: perfil.id,
      ruta_archivo: ruta,
      nombre_archivo: nombreArchivo.slice(0, 200) || "cv.pdf",
      subido_en: new Date().toISOString(),
    },
    { onConflict: "postulante_id" },
  );
  if (error) return { error: "No se pudo guardar tu CV. Intentá de nuevo." };

  revalidatePath("/postulante/mi-cv");
  return {};
}
