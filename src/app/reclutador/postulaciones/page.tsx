import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { agruparPorVacante, cargarEstadosCv, cargarPostulaciones, nombreCompleto, ordenarPorAfinidad, resumenAfinidad } from "@/lib/dashboard";
import { COLUMNAS_VACANTE, type Vacante } from "@/lib/tipos";
import { Icono } from "@/components/postulante/Icono";
import { ActualizarSiAnalizando } from "@/components/reclutador/ActualizarSiAnalizando";
import { EtiquetaEstado } from "@/components/reclutador/EtiquetaEstado";
import { ListaPostulantes } from "@/components/reclutador/ListaPostulantes";
import { PestanasPostulaciones } from "@/components/reclutador/PestanasPostulaciones";
import { estilosReclutador } from "@/components/reclutador/estilos";

// Los análisis con IA que se disparan desde esta pantalla pueden tardar: se amplía el tiempo.
export const maxDuration = 60;

// Pestaña "Postulaciones" (para operar): quiénes se postularon a cada puesto.
export default async function PostulacionesPage() {
  const supabase = await crearClienteServidor();
  const [{ data }, postulaciones, estadosCv] = await Promise.all([
    supabase.from("vacantes").select(COLUMNAS_VACANTE).order("creado_en", { ascending: false }),
    cargarPostulaciones(supabase),
    cargarEstadosCv(supabase),
  ]);
  const vacantes = (data ?? []) as Vacante[];
  const porVacante = agruparPorVacante(postulaciones);
  const titulos = new Map(vacantes.map((v) => [v.id, v.titulo]));

  // Primero los puestos con postulaciones más recientes (lo último que pasó).
  const conPostulantes = vacantes
    .filter((v) => porVacante.has(v.id))
    .sort((a, b) => (porVacante.get(b.id)![0].creado_en).localeCompare(porVacante.get(a.id)![0].creado_en));

  return (
    <div className="space-y-6">
      <ActualizarSiAnalizando activo={[...estadosCv.values()].includes("analizando")} />
      <div className="space-y-4">
        <div>
          <h1 className={estilosReclutador.titulo}>Postulaciones</h1>
          <p className="mt-1 text-slate-600">Quiénes se postularon a cada puesto, con su afinidad y el acceso a su CV.</p>
        </div>
        <PestanasPostulaciones activa="postulaciones" />
      </div>

      {conPostulantes.length === 0 ? (
        <div className={`${estilosReclutador.tarjeta} flex flex-col items-center py-12 text-center`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Icono nombre="documento" className="h-7 w-7" />
          </span>
          <p className="mt-4 font-semibold text-marca">Todavía nadie se postuló a ninguna vacante</p>
          <p className="mt-1 text-sm text-slate-600">Cuando alguien se postule, lo vas a ver acá.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {conPostulantes.map((v) => {
            const lista = porVacante.get(v.id) ?? [];
            const { promedio, mejor } = resumenAfinidad(lista);
            return (
              <section key={v.id} className={`${estilosReclutador.tarjeta} space-y-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icono nombre="maletin" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-marca">{v.titulo}</h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <EtiquetaEstado activa={v.activa} />
                        <span>
                          {lista.length} {lista.length === 1 ? "postulante" : "postulantes"}
                        </span>
                        {promedio !== null && <span>· Promedio de matching: <strong className="text-marca">{promedio}</strong></span>}
                        {mejor && (
                          <span>
                            · Mejor match: <strong className="text-marca">{nombreCompleto(mejor.postulante)} ({Number(mejor.afinidad)})</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/reclutador/vacantes/${v.id}`} className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}>
                      Ver detalle del puesto
                    </Link>
                    <Link href={`/reclutador/vacantes/${v.id}/postulaciones`} className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}>
                      Solo esta vacante
                    </Link>
                  </div>
                </div>
                <ListaPostulantes
                  postulaciones={ordenarPorAfinidad(lista)}
                  titulosVacantes={titulos}
                  estadosCv={estadosCv}
                  mejorId={mejor?.id}
                />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
