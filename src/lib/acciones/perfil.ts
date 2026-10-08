"use server";

import { revalidatePath } from "next/cache";
import { obtenerSesion } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

const LARGO_MAXIMO = 60;

// Cambia el nombre y el apellido de la propia persona (postulante o reclutador/a). El rol y el email no se
// pueden tocar desde acá: la base de datos solo permite escribir esas dos columnas.
export async function actualizarPerfil(
  nombre: string,
  apellido: string,
): Promise<{ error?: string }> {
  const sesion = await obtenerSesion();
  if (sesion.estado !== "ok") return { error: "Tu sesión venció. Volvé a iniciar sesión." };
  const perfil = sesion.perfil;

  const nuevoNombre = nombre.trim();
  const nuevoApellido = apellido.trim();
  if (!nuevoNombre || !nuevoApellido) return { error: "Completá el nombre y el apellido." };
  if (nuevoNombre.length > LARGO_MAXIMO || nuevoApellido.length > LARGO_MAXIMO)
    return { error: `El nombre y el apellido pueden tener hasta ${LARGO_MAXIMO} letras.` };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("perfiles")
    .update({ nombre: nuevoNombre, apellido: nuevoApellido })
    .eq("id", perfil.id)
    .select("id");

  if (error || !data || data.length === 0)
    return { error: "No se pudieron guardar los cambios. Intentá de nuevo." };

  // El nombre también se ve en la barra de arriba de todas las pantallas.
  revalidatePath("/postulante", "layout");
  revalidatePath("/reclutador", "layout");
  return {};
}
