import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COLUMNAS_VACANTE, formatearFecha, type Vacante } from "@/lib/tipos";
import { DetalleVacante } from "@/components/DetalleVacante";
import { estilos } from "@/components/estilos";

export default async function VacantePostulantePage({
  params,
}: PageProps<"/postulante/vacantes/[id]">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data: vacante } = await supabase
    .from("vacantes")
    .select(COLUMNAS_VACANTE)
    .eq("id", id)
    .eq("activa", true)
    .maybeSingle<Vacante>();

  if (!vacante) notFound();

  return (
    <div className="space-y-6">
      <Link href="/postulante" className="text-sm text-indigo-600 hover:underline">
        ← Volver a las vacantes
      </Link>

      <article className={`${estilos.tarjeta} space-y-5`}>
        <div>
          <h1 className={estilos.titulo}>{vacante.titulo}</h1>
          <p className="mt-1 text-sm text-slate-500">Publicada el {formatearFecha(vacante.creado_en)}</p>
        </div>
        <DetalleVacante vacante={vacante} />
      </article>
    </div>
  );
}
