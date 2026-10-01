import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COLUMNAS_VACANTE, formatearFecha, type Vacante } from "@/lib/tipos";
import { DetalleVacante, EtiquetaEstado } from "@/components/DetalleVacante";
import { BotonEstadoVacante } from "@/components/BotonEstadoVacante";
import { estilos } from "@/components/estilos";

type Postulacion = {
  id: string;
  postulante_id: string;
  creado_en: string;
  afinidad: number | null;
  analisis: unknown;
  vacante_sugerida_id: string | null;
  postulante: { nombre: string; apellido: string; email: string } | null;
};

function Pendiente() {
  return <span className="text-slate-400">Pendiente de análisis</span>;
}

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

  const { data } = await supabase
    .from("postulaciones")
    .select(
      "id, postulante_id, creado_en, afinidad, analisis, vacante_sugerida_id, postulante:perfiles!postulaciones_postulante_id_fkey(nombre, apellido, email)",
    )
    .eq("vacante_id", vacante.id)
    .order("creado_en", { ascending: false });
  const postulaciones = (data ?? []) as unknown as Postulacion[];

  // Títulos para mostrar la vacante sugerida (el reclutador ve todas).
  const { data: todas } = await supabase.from("vacantes").select("id, titulo");
  const titulos = new Map((todas ?? []).map((v) => [v.id, v.titulo]));

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

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-slate-900">Postulantes ({postulaciones.length})</h2>
        {postulaciones.length === 0 ? (
          <p className={`${estilos.tarjeta} text-slate-600`}>Todavía nadie se postuló a esta vacante.</p>
        ) : (
          <ul className="space-y-3">
            {postulaciones.map((p) => (
              <li key={p.id} className={`${estilos.tarjeta} space-y-3`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {p.postulante ? `${p.postulante.nombre} ${p.postulante.apellido}` : "Postulante"}
                    </p>
                    {p.postulante && <p className="break-all text-sm text-slate-600">{p.postulante.email}</p>}
                    <p className="text-sm text-slate-500">Se postuló el {formatearFecha(p.creado_en)}</p>
                  </div>
                  <a href={`/cv/${p.postulante_id}`} target="_blank" rel="noopener" className={estilos.botonSecundario}>
                    Ver CV
                  </a>
                </div>
                <dl className="grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="font-medium text-slate-500">Afinidad</dt>
                    <dd>{p.afinidad === null ? <Pendiente /> : p.afinidad}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Análisis</dt>
                    <dd>{p.analisis === null ? <Pendiente /> : "Disponible"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Vacante sugerida</dt>
                    <dd>
                      {p.vacante_sugerida_id === null ? (
                        <Pendiente />
                      ) : (
                        (titulos.get(p.vacante_sugerida_id) ?? "—")
                      )}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
