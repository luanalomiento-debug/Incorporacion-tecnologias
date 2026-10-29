"use server";

import { revalidatePath } from "next/cache";
import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

// Postula al usuario actual a una vacante. Las reglas importantes (vacante
// activa, CV cargado, una sola vez) las garantiza la base de datos; acá solo
// traducimos los errores a mensajes claros.
export async function postularse(vacanteId: string): Promise<{ error?: string }> {
  const perfil = await exigirRol("postulante");
  const supabase = await crearClienteServidor();

  const { data: cv } = await supabase
    .from("cvs")
    .select("id")
    .eq("postulante_id", perfil.id)
    .maybeSingle();
  if (!cv) return { error: "Primero tenés que subir tu CV en tu perfil." };

  const { error } = await supabase
    .from("postulaciones")
    .insert({ vacante_id: vacanteId, postulante_id: perfil.id });

  if (error) {
    if (error.code === "23505") return { error: "Ya te postulaste a esta vacante." };
    return { error: "No se pudo enviar tu postulación. Puede que la vacante ya no esté disponible." };
  }

  revalidatePath(`/postulante/vacantes/${vacanteId}`);
  revalidatePath("/postulante/mis-postulaciones");
  return {};
}
