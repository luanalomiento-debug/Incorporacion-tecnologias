"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoFormulario = { error?: string; mensaje?: string };

function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email o contraseña incorrectos.";
  if (m.includes("already registered") || m.includes("already exists"))
    return "Ya existe una cuenta con ese email.";
  if (m.includes("password") && m.includes("at least"))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("email not confirmed"))
    return "Todavía no confirmaste tu email. Revisá tu casilla de correo.";
  if (m.includes("invalid") && m.includes("email"))
    return "El email no es válido.";
  if (m.includes("rate limit"))
    return "Demasiados intentos. Esperá unos minutos y volvé a probar.";
  return "Ocurrió un error. Intentá de nuevo.";
}

function texto(formData: FormData, campo: string) {
  return String(formData.get(campo) ?? "").trim();
}

export async function iniciarSesion(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = texto(formData, "email");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Completá email y contraseña." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: traducirError(error.message) };

  redirect("/");
}

// El registro público crea SOLO cuentas de postulante: no se envía ningún rol,
// y aunque alguien lo mandara, la base de datos lo ignora (ver migración).
export async function registrarse(
  _previo: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const nombre = texto(formData, "nombre");
  const apellido = texto(formData, "apellido");
  const email = texto(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!nombre || !apellido || !email || !password)
    return { error: "Completá todos los campos." };
  if (password.length < 6)
    return { error: "La contraseña debe tener al menos 6 caracteres." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre, apellido } },
  });
  if (error) return { error: traducirError(error.message) };

  // Si en Supabase está activada la confirmación por email, no hay sesión todavía.
  if (!data.session) {
    return {
      mensaje:
        "¡Cuenta creada! Te enviamos un email para confirmarla. Después podés iniciar sesión.",
    };
  }

  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
