"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { EstadoFormulario } from "@/lib/acciones/auth";

function texto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "").trim();
}

export async function crearVacante(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const perfil = await exigirRol("reclutador");

  const vacante = {
    titulo: texto(formData, "titulo"),
    descripcion: texto(formData, "descripcion"),
    requisitos: texto(formData, "requisitos"),
    habilidades: texto(formData, "habilidades"),
    informacion_adicional: texto(formData, "informacion_adicional"),
    creado_por: perfil.id,
  };

  if (!vacante.titulo || !vacante.descripcion || !vacante.requisitos || !vacante.habilidades)
    return { error: "Completá el nombre del puesto, la descripción, los requisitos y las habilidades." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("vacantes")
    .insert(vacante)
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo guardar la vacante. Intentá de nuevo." };

  revalidatePath("/reclutador");
  redirect(`/reclutador/vacantes/${data.id}`);
}

export async function cambiarEstadoVacante(formData: FormData) {
  await exigirRol("reclutador");

  const id = texto(formData, "id");
  const activa = texto(formData, "activa") === "true";

  const supabase = await crearClienteServidor();
  await supabase.from("vacantes").update({ activa }).eq("id", id);

  revalidatePath("/reclutador");
  revalidatePath(`/reclutador/vacantes/${id}`);
}

// Corrige el texto de una vacante ya creada. Solo un reclutador puede hacerlo
// (lo garantizan los permisos de la base de datos).
export async function editarVacante(
  id: string,
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await exigirRol("reclutador");

  const cambios = {
    titulo: texto(formData, "titulo"),
    descripcion: texto(formData, "descripcion"),
    requisitos: texto(formData, "requisitos"),
    habilidades: texto(formData, "habilidades"),
    informacion_adicional: texto(formData, "informacion_adicional"),
  };

  if (!cambios.titulo || !cambios.descripcion || !cambios.requisitos || !cambios.habilidades)
    return { error: "Completá el nombre del puesto, la descripción, los requisitos y las habilidades." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("vacantes").update(cambios).eq("id", id).select("id");

  if (error || !data || data.length === 0)
    return { error: "No se pudieron guardar los cambios. Intentá de nuevo." };

  revalidatePath("/reclutador");
  revalidatePath(`/reclutador/vacantes/${id}`);
  revalidatePath("/postulante");
  revalidatePath(`/postulante/vacantes/${id}`);
  redirect(`/reclutador/vacantes/${id}`);
}

// Elimina una vacante para siempre. Atención: la base de datos borra también, en cascada,
// todas sus postulaciones y sus candidatos sugeridos. Solo un reclutador puede hacerlo
// (lo garantiza la política de la base de datos). Si ya no existe o no se pudo, avisa.
export async function eliminarVacante(id: string): Promise<{ error?: string }> {
  await exigirRol("reclutador");

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("vacantes").delete().eq("id", id).select("id");

  if (error || !data || data.length === 0)
    return { error: "No se pudo eliminar la vacante. Puede que ya no exista. Actualizá la página e intentá de nuevo." };

  // Se actualizan las pantallas de la reclutadora y las de los postulantes.
  revalidatePath("/reclutador", "layout");
  revalidatePath("/postulante", "layout");
  return {};
}
