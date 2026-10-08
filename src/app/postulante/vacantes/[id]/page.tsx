import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COLUMNAS_VACANTE, formatearFecha, type Vacante } from "@/lib/tipos";
import { DetalleVacante } from "@/components/DetalleVacante";
import { BotonPostularse } from "@/components/BotonPostularse";
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

  const perfil = await exigirRol("postulante");
  const [{ data: postulacion }, { data: cv }] = await Promise.all([
    supabase
      .from("postulaciones")
      .select("id")
      .eq("vacante_id", vacante.id)
      .eq("postulante_id", perfil.id)
      .maybeSingle(),
    supabase.from("cvs").select("id").eq("postulante_id", perfil.id).maybeSingle(),
  ]);

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

      <section className={`${estilos.tarjeta} space-y-3`}>
        {postulacion ? (
          <p className={estilos.exito}>✓ Ya te postulaste a esta vacante.</p>
        ) : cv ? (
          <BotonPostularse vacanteId={vacante.id} />
        ) : (
          <p className="text-slate-700">
            Para postularte primero necesitás subir tu CV.{" "}
            <Link href="/postulante/mi-cv" className="font-semibold text-indigo-600 hover:underline">
              Ir a Mi CV
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
