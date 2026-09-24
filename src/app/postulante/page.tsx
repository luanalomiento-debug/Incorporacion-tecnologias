import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COLUMNAS_VACANTE, formatearFecha, type Vacante } from "@/lib/tipos";
import { estilos } from "@/components/estilos";

export default async function VacantesPostulantePage() {
  const supabase = await crearClienteServidor();
  // RLS ya filtra las inactivas; el filtro explícito deja clara la intención.
  const { data } = await supabase
    .from("vacantes")
    .select(COLUMNAS_VACANTE)
    .eq("activa", true)
    .order("creado_en", { ascending: false });
  const vacantes = (data ?? []) as Vacante[];

  return (
    <div className="space-y-6">
      <h1 className={estilos.titulo}>Vacantes disponibles</h1>

      {vacantes.length === 0 ? (
        <p className={`${estilos.tarjeta} text-slate-600`}>
          No hay vacantes abiertas en este momento. ¡Volvé a revisar pronto!
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {vacantes.map((v) => (
            <li key={v.id}>
              <Link
                href={`/postulante/vacantes/${v.id}`}
                className={`${estilos.tarjeta} block h-full transition hover:border-indigo-300 hover:shadow`}
              >
                <h2 className="font-semibold text-slate-900">{v.titulo}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{v.descripcion}</p>
                <p className="mt-3 text-xs text-slate-500">Publicada el {formatearFecha(v.creado_en)}</p>
                <p className="mt-3 text-sm font-semibold text-indigo-600">Ver detalle →</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
