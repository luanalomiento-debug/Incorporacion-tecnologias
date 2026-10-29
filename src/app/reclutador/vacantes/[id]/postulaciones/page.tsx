import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cargarEstadosCv, cargarPostulaciones, nombreCompleto, ordenarPorAfinidad, resumenAfinidad } from "@/lib/dashboard";
import { ETAPAS } from "@/lib/etapas";
import { aplicarFiltros, hayFiltros, leerFiltros } from "@/lib/filtros";
import { COLUMNAS_VACANTE, type Vacante } from "@/lib/tipos";
import { Icono } from "@/components/postulante/Icono";
import { ActualizarSiAnalizando } from "@/components/reclutador/ActualizarSiAnalizando";
import { FiltrosPostulaciones } from "@/components/reclutador/FiltrosPostulaciones";
import { EtiquetaEstado } from "@/components/reclutador/EtiquetaEstado";
import { ListaPostulantes } from "@/components/reclutador/ListaPostulantes";
import { TarjetaDato } from "@/components/reclutador/TarjetaDato";
import { estilosReclutador } from "@/components/reclutador/estilos";

// Los análisis con IA que se disparan desde esta pantalla pueden tardar: se amplía el tiempo.
export const maxDuration = 60;

// Dashboard de una sola vacante: solo las postulaciones a ese puesto.
export default async function PostulacionesVacantePage({
  params,
  searchParams,
}: PageProps<"/reclutador/vacantes/[id]/postulaciones">) {
  const { id } = await params;
  const filtros = leerFiltros(await searchParams);
  const supabase = await crearClienteServidor();
  const [{ data: vacante }, postulaciones, { data: todas }] = await Promise.all([
    supabase.from("vacantes").select(COLUMNAS_VACANTE).eq("id", id).maybeSingle<Vacante>(),
    cargarPostulaciones(supabase, id),
    supabase.from("vacantes").select("id, titulo"),
  ]);

  if (!vacante) notFound();

  const titulos = new Map((todas ?? []).map((v) => [v.id, v.titulo]));
  const estadosCv = await cargarEstadosCv(
    supabase,
    postulaciones.map((p) => p.postulante_id),
  );
  const { analizadas, promedio, mejor } = resumenAfinidad(postulaciones);
  const ordenadas = ordenarPorAfinidad(aplicarFiltros(postulaciones, filtros));
  const porEtapa = (valor: string) => postulaciones.filter((x) => x.etapa === valor).length;
  const ruta = `/reclutador/vacantes/${id}/postulaciones`;

  return (
    <div className="space-y-6">
      <ActualizarSiAnalizando activo={[...estadosCv.values()].includes("analizando")} />
      <Link href="/reclutador" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">
        <Icono nombre="flecha" className="h-4 w-4 rotate-180" /> Volver a las vacantes
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

      <div className="grid gap-4 sm:grid-cols-3">
        <TarjetaDato etiqueta="Postulaciones recibidas" valor={postulaciones.length} />
        <TarjetaDato
          etiqueta="Mejor match"
          texto
          valor={mejor ? nombreCompleto(mejor.postulante) : "Pendiente de análisis"}
          detalle={mejor ? `Afinidad ${Number(mejor.afinidad)} de 100` : undefined}
        />
        <TarjetaDato
          etiqueta="Promedio de matching"
          valor={promedio === null ? "—" : promedio}
          detalle={
            promedio === null
              ? "Todavía no hay CVs analizados"
              : `Sobre ${analizadas} de ${postulaciones.length} ${postulaciones.length === 1 ? "postulación" : "postulaciones"} analizadas`
          }
        />
      </div>

      {postulaciones.length === 0 ? (
        <div className={`${estilosReclutador.tarjeta} flex flex-col items-center py-12 text-center`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Icono nombre="documento" className="h-7 w-7" />
          </span>
          <p className="mt-4 font-semibold text-marca">Todavía nadie se postuló a esta vacante</p>
        </div>
      ) : (
        <section className={`${estilosReclutador.tarjeta} space-y-5`}>
          <div className="flex flex-wrap gap-2" aria-label="Postulantes por etapa">
            {ETAPAS.map((e) => (
              <Link
                key={e.valor}
                href={`${ruta}?etapa=${e.valor}`}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ring-slate-200 transition hover:ring-blue-300 ${e.clases} ${filtros.etapa === e.valor ? "outline outline-2 outline-blue-600" : ""}`}
              >
                {e.texto}: {porEtapa(e.valor)}
              </Link>
            ))}
          </div>
          <FiltrosPostulaciones filtros={filtros} ruta={ruta} />
          <form method="get" action={`/reclutador/vacantes/${id}/comparar`} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-marca">
                Postulantes{hayFiltros(filtros) ? ` (${ordenadas.length} de ${postulaciones.length})` : ""}
              </h2>
              <button type="submit" className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}>
                Comparar seleccionados (2 a 4)
              </button>
            </div>
            {ordenadas.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
                Ningún postulante coincide con los filtros.
              </p>
            ) : (
              <ListaPostulantes postulaciones={ordenadas} titulosVacantes={titulos} estadosCv={estadosCv} mejorId={mejor?.id} seleccionable />
            )}
          </form>
        </section>
      )}
    </div>
  );
}
