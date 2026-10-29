import { NextResponse } from "next/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";

// Mantenimiento diario (lo dispara Vercel Cron, ver vercel.json):
//  1) borra del bucket "cvs" los PDF que ya no tienen un CV en la base (por ejemplo, de cuentas eliminadas:
//     la base borra la fila en cascada pero no puede borrar el archivo);
//  2) borra los registros de intentos de análisis de IA con más de 30 días (solo se usa la ventana de 24 h).
// Está protegido con el secreto CRON_SECRET: si no está configurado, no hace nada.
const DIAS_CONSERVAR_INTENTOS = 30;
const TAMANO_PAGINA = 100;
// Un archivo recién subido todavía puede estar guardándose en la base: solo se borran los de más de 1 hora.
const EDAD_MINIMA_MS = 60 * 60 * 1000;

export const maxDuration = 60;

async function listar(db: ReturnType<typeof crearClienteAdmin>, carpeta: string) {
  const nombres: { name: string; id: string | null; updated_at?: string | null }[] = [];
  for (let offset = 0; ; offset += TAMANO_PAGINA) {
    const { data, error } = await db.storage.from("cvs").list(carpeta, { limit: TAMANO_PAGINA, offset });
    if (error) throw new Error("No se pudo listar el bucket");
    nombres.push(...(data ?? []));
    if ((data ?? []).length < TAMANO_PAGINA) break;
  }
  return nombres;
}

export async function GET(request: Request) {
  const secreto = (process.env.CRON_SECRET ?? "").trim();
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return new NextResponse("No autorizado.", { status: 401 });
  }

  try {
    const db = crearClienteAdmin();

    // 1) PDF huérfanos: carpetas del bucket (una por persona) sin su CV en la tabla cvs.
    const { data: filas } = await db.from("cvs").select("ruta_archivo");
    const conCv = new Set((filas ?? []).map((f) => f.ruta_archivo as string));
    const aBorrar: string[] = [];
    for (const carpeta of await listar(db, "")) {
      if (carpeta.id !== null) continue; // un archivo suelto en la raíz: no se toca
      for (const archivo of await listar(db, carpeta.name)) {
        const ruta = `${carpeta.name}/${archivo.name}`;
        const reciente = archivo.updated_at && Date.now() - new Date(archivo.updated_at).getTime() < EDAD_MINIMA_MS;
        if (!conCv.has(ruta) && !reciente) aBorrar.push(ruta);
      }
    }
    if (aBorrar.length > 0) {
      const { error } = await db.storage.from("cvs").remove(aBorrar);
      if (error) throw new Error("No se pudieron borrar los archivos huérfanos");
    }

    // 2) Intentos de análisis viejos.
    const limite = new Date(Date.now() - DIAS_CONSERVAR_INTENTOS * 24 * 60 * 60 * 1000).toISOString();
    const { data: intentos } = await db.from("analisis_ia_intentos").delete().lt("creado_en", limite).select("id");

    return NextResponse.json({ pdfHuerfanosBorrados: aBorrar.length, intentosBorrados: intentos?.length ?? 0 });
  } catch (e) {
    console.error("Limpieza fallida:", e instanceof Error ? e.message : String(e));
    return new NextResponse("La limpieza falló.", { status: 500 });
  }
}
