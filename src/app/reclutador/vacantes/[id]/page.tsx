import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COLUMNAS_VACANTE, formatearFecha, type Vacante } from "@/lib/tipos";
import { DetalleVacante, EtiquetaEstado } from "@/components/DetalleVacante";
import { BotonEstadoVacante } from "@/components/BotonEstadoVacante";
import { estilos } from "@/components/estilos";

export default async function VacanteReclutadorPage({
  params,
}: PageProps<"/reclutador/vacantes/[id]">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data: vacante } = await supabase
    .from("vacantes")
    .select(COLUMNAS_VACANTE)
    .eq("id", id)
    .maybeSingle<Vacante>();

  if (!vacante) notFound();

  return (
    <div className="space-y-6">
      <Link href="/reclutador" className="text-sm text-indigo-600 hover:underline">
        ← Volver al panel
      </Link>

      <div className={`${estilos.tarjeta} space-y-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={estilos.titulo}>{vacante.titulo}</h1>
              <EtiquetaEstado activa={vacante.activa} />
            </div>
            <p className="mt-1 text-sm text-slate-500">Creada el {formatearFecha(vacante.creado_en)}</p>
          </div>
          <BotonEstadoVacante id={vacante.id} activa={vacante.activa} />
        </div>
        <DetalleVacante vacante={vacante} />
      </div>
    </div>
  );
}
