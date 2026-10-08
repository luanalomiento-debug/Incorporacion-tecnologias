import { createBrowserClient } from "@supabase/ssr";
import { claveSupabase, urlSupabase } from "@/lib/supabase/config";

// Cliente de Supabase para componentes que corren en el navegador.
export function crearClienteNavegador() {
  return createBrowserClient(
    urlSupabase(),
    claveSupabase(),
  );
}
