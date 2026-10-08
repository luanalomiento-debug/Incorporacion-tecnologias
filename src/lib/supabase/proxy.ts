import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { claveSupabase, urlSupabase } from "@/lib/supabase/config";

const RUTAS_PROTEGIDAS = ["/postulante", "/reclutador"];
const RUTAS_DE_ACCESO = ["/login", "/registro"];

// Renueva la sesión de Supabase en cada pedido y hace redirecciones básicas.
// La verificación de ROL se hace en los layouts de cada sección (servidor).
export async function actualizarSesion(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    urlSupabase(),
    claveSupabase(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // No poner código entre createServerClient y getClaims.
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims);
  const ruta = request.nextUrl.pathname;

  const redirigir = (destino: string) => {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    url.search = "";
    const redireccion = NextResponse.redirect(url);
    // Conservar las cookies de sesión renovadas.
    response.cookies.getAll().forEach((c) => redireccion.cookies.set(c));
    return redireccion;
  };

  if (!conSesion && RUTAS_PROTEGIDAS.some((r) => ruta.startsWith(r))) {
    return redirigir("/login");
  }
  if (conSesion && RUTAS_DE_ACCESO.some((r) => ruta.startsWith(r))) {
    return redirigir("/");
  }

  return response;
}
