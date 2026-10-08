import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cargarPostulaciones } from "@/lib/dashboard";
import { COLUMNAS_VACANTE, formatearFecha, type Vacante } from "@/lib/tipos";
import { Icono } from "@/components/postulante/Icono";
import { EtiquetaEstado } from "@/components/reclutador/EtiquetaEstado";
import { ListaPostulantes } from "@/components/reclutador/ListaPostulantes";
import { TarjetaDato } from "@/components/reclutador/TarjetaDato";
import { estilosReclutador } from "@/components/reclutador/estilos";

// Dashboard de una sola vacante: solo las postulaciones a ese puesto.
export default async function PostulacionesVacantePage({
  params,
}: PageProps<"/reclutador/vacantes/[id]/postulaciones">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const [{ data: vacante }, postulaciones, { data: todas }] = await Promise.all([
    supabase.from("vacantes").select(COLUMNAS_VACANTE).eq("id", id).maybeSingle<Vacante>(),
    cargarPostulaciones(supabase, id),
    supabase.from("vacantes").select("id, titulo"),
  ]);

  if (!vacante) notFound();

  const titulos = new Map((todas ?? []).map((v) => [v.id, v.titulo]));
  const ultima = postulaciones[0]?.creado_en;

  return (
    <div className="space-y-6">
      <Link href="/reclutador/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">
        <Icono nombre="flecha" className="h-4 w-4 rotate-180" /> Volver al dashboard
      </Link>

      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-marca via-blue-900 to-blue-600 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/30 blur-2xl" />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
              Postulaciones
            </span>
            <EtiquetaEstado activa={vacante.activa} />
          </div>
          <h1 className="text-2xl font-bold sm:text-4xl">{vacante.titulo}</h1>
          <Link
            href={`/reclutador/vacantes/${vacante.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-marca shadow-sm transition hover:bg-blue-50"
          >
            Ver detalle del puesto
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <TarjetaDato etiqueta="Postulaciones recibidas" valor={postulaciones.length} />
        <TarjetaDato etiqueta="Última postulación" valor={ultima ? formatearFecha(ultima) : "—"} />
      </div>

      {postulaciones.length === 0 ? (
        <div className={`${estilosReclutador.tarjeta} flex flex-col items-center py-12 text-center`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Icono nombre="documento" className="h-7 w-7" />
          </span>
          <p className="mt-4 font-semibold text-marca">Todavía nadie se postuló a esta vacante</p>
        </div>
      ) : (
        <section className={estilosReclutador.tarjeta}>
          <h2 className="mb-4 font-bold text-marca">Postulantes</h2>
          <ListaPostulantes postulaciones={postulaciones} titulosVacantes={titulos} />
        </section>
      )}
    </div>
  );
}
