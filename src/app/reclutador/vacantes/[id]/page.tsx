import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COLUMNAS_VACANTE, formatearFecha, type Vacante } from "@/lib/tipos";
import { BotonEstadoVacante } from "@/components/BotonEstadoVacante";
import { DetalleVacantePostulante } from "@/components/postulante/DetalleVacantePostulante";
import { Icono } from "@/components/postulante/Icono";
import { EtiquetaEstado } from "@/components/reclutador/EtiquetaEstado";

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

  const { count } = await supabase
    .from("postulaciones")
    .select("id", { count: "exact", head: true })
    .eq("vacante_id", vacante.id);
  const cantidad = count ?? 0;

  return (
    <div className="space-y-6">
      <Link href="/reclutador" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">
        <Icono nombre="flecha" className="h-4 w-4 rotate-180" /> Volver a las vacantes
      </Link>

      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-marca via-blue-900 to-blue-600 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/30 blur-2xl" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <EtiquetaEstado activa={vacante.activa} />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-4xl">{vacante.titulo}</h1>
            <p className="mt-2 text-sm text-blue-100">Creada el {formatearFecha(vacante.creado_en)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/reclutador/vacantes/${vacante.id}/postulaciones`}
              className="inline-flex items-center gap-2 rounded-xl bg-acento px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-acento-oscuro"
            >
              Ver postulaciones ({cantidad})
            </Link>
            <div className="rounded-xl bg-white p-1">
              <BotonEstadoVacante id={vacante.id} activa={vacante.activa} />
            </div>
          </div>
        </div>
      </header>

      <DetalleVacantePostulante vacante={vacante} />
    </div>
  );
}
