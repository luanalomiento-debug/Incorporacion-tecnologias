import { cache } from "react";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Rol = "postulante" | "reclutador";

export type Perfil = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
};

type Sesion =
  | { estado: "sin-sesion" }
  | { estado: "sin-perfil" }
  | { estado: "ok"; perfil: Perfil };

// Lee el usuario y su perfil desde Supabase. `cache` evita repetir la
// consulta si varias partes de la misma página la necesitan.
export const obtenerSesion = cache(async (): Promise<Sesion> => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { estado: "sin-sesion" };

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre, apellido, email, rol")
    .eq("id", userId)
    .single<Perfil>();

  if (!perfil) return { estado: "sin-perfil" };
  return { estado: "ok", perfil };
});

// Para usar en layouts, páginas y server actions: si el usuario no tiene
// el rol pedido, lo manda a su propia vista (o al login).
export async function exigirRol(rol: Rol): Promise<Perfil> {
  const sesion = await obtenerSesion();
  if (sesion.estado === "sin-sesion") redirect("/login");
  if (sesion.estado !== "ok" || sesion.perfil.rol !== rol) redirect("/");
  return sesion.perfil;
}

export function inicioDelRol(rol: Rol) {
  return rol === "reclutador" ? "/reclutador" : "/postulante";
}
