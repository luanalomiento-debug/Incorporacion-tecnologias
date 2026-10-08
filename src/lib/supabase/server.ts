import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { claveSupabase, urlSupabase } from "@/lib/supabase/config";

// Cliente de Supabase para el servidor (páginas, layouts y server actions).
// Se crea uno nuevo en cada pedido.
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    urlSupabase(),
    claveSupabase(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Desde un Server Component no se pueden escribir cookies.
            // No pasa nada: proxy.ts ya renueva la sesión en cada pedido.
          }
        },
      },
    },
  );
}
