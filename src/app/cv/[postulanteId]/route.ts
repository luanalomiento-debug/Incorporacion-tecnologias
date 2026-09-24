import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

// Duración del enlace firmado: el CV nunca tiene una URL pública permanente.
const SEGUNDOS_VALIDEZ = 60;

// Abre un CV: genera un enlace firmado de corta duración y redirige a él.
// Solo funciona para el propio postulante o para un reclutador (lo garantizan
// las políticas RLS de la tabla cvs y del bucket).
export async function GET(
  request: Request,
  { params }: RouteContext<"/cv/[postulanteId]">,
) {
  const sesion = await obtenerSesion();
  if (sesion.estado !== "ok") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { postulanteId } = await params;
  const supabase = await crearClienteServidor();
  const { data: cv } = await supabase
    .from("cvs")
    .select("ruta_archivo, subido_en")
    .eq("postulante_id", postulanteId)
    .maybeSingle();

  if (!cv) {
    return new NextResponse("CV no disponible.", { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("cvs")
    .createSignedUrl(cv.ruta_archivo, SEGUNDOS_VALIDEZ, {
      // Evita que se muestre una versión vieja si el CV fue reemplazado.
      cacheNonce: new Date(cv.subido_en).getTime().toString(),
    });

  if (error || !data) {
    return new NextResponse("No se pudo abrir el CV.", { status: 500 });
  }

  const respuesta = NextResponse.redirect(data.signedUrl, 303);
  respuesta.headers.set("Cache-Control", "no-store");
  return respuesta;
}
