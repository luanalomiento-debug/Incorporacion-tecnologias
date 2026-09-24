import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COLUMNAS_VACANTE, formatearFecha, type Vacante } from "@/lib/tipos";
import { EtiquetaEstado } from "@/components/DetalleVacante";
import { BotonEstadoVacante } from "@/components/BotonEstadoVacante";
import { estilos } from "@/components/estilos";

export default async function PanelReclutadorPage() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("vacantes")
    .select(COLUMNAS_VACANTE)
    .order("creado_en", { ascending: false });
  const vacantes = (data ?? []) as Vacante[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={estilos.titulo}>Vacantes publicadas</h1>
        <Link href="/reclutador/vacantes/nueva" className={estilos.boton}>
          + Nueva vacante
        </Link>
      </div>

      {vacantes.length === 0 ? (
        <p className={`${estilos.tarjeta} text-slate-600`}>
          Todavía no creaste ninguna vacante.
        </p>
      ) : (
        <ul className="space-y-3">
          {vacantes.map((v) => (
            <li key={v.id} className={`${estilos.tarjeta} flex flex-wrap items-center justify-between gap-3`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/reclutador/vacantes/${v.id}`}
                    className="font-semibold text-slate-900 hover:text-indigo-700 hover:underline"
                  >
                    {v.titulo}
                  </Link>
                  <EtiquetaEstado activa={v.activa} />
                </div>
                <p className="mt-1 text-sm text-slate-500">Creada el {formatearFecha(v.creado_en)}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/reclutador/vacantes/${v.id}`} className={estilos.botonSecundario}>
                  Ver
                </Link>
                <BotonEstadoVacante id={v.id} activa={v.activa} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
