import "server-only";
import { createClient } from "@supabase/supabase-js";
import { urlSupabase } from "@/lib/supabase/config";

// Cliente de Supabase con la CLAVE SECRETA. Se salta las reglas de seguridad (RLS),
// así que solo se usa en el servidor, para guardar los resultados de la IA.
// "server-only" hace que la app NO compile si alguien lo importa desde una pantalla.
export function crearClienteAdmin() {
  const clave = (process.env.SUPABASE_SECRET_KEY ?? "").trim();
  if (!clave) throw new Error("Falta la variable SUPABASE_SECRET_KEY");
  return createClient(urlSupabase(), clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
