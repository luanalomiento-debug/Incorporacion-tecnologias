import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { agruparPorVacante, cargarPostulaciones } from "@/lib/dashboard";
import { COLUMNAS_VACANTE, type Vacante } from "@/lib/tipos";
import { Icono } from "@/components/postulante/Icono";
import { EtiquetaEstado } from "@/components/reclutador/EtiquetaEstado";
import { GraficoBarras } from "@/components/reclutador/GraficoBarras";
import { ListaPostulantes } from "@/components/reclutador/ListaPostulantes";
import { PestanasDashboard } from "@/components/reclutador/PestanasDashboard";
import { TarjetaDato } from "@/components/reclutador/TarjetaDato";
import { estilosReclutador } from "@/components/reclutador/estilos";

// Dashboard 1: los puestos a los que efectivamente se postularon personas.
export default async function DashboardPostulacionesPage() {
  const supabase = await crearClienteServidor();
  const [{ data }, postulaciones] = await Promise.all([
    supabase.from("vacantes").select(COLUMNAS_VACANTE).order("creado_en", { ascending: false }),
    cargarPostulaciones(supabase),
  ]);
  const vacantes = (data ?? []) as Vacante[];
  const porVacante = agruparPorVacante(postulaciones);
  const titulos = new Map(vacantes.map((v) => [v.id, v.titulo]));

  const conPostulantes = vacantes
    .filter((v) => porVacante.has(v.id))
    .sort((a, b) => (porVacante.get(b.id)?.length ?? 0) - (porVacante.get(a.id)?.length ?? 0));
  const sinPostulantes = vacantes.length - conPostulantes.length;
  const activas = vacantes.filter((v) => v.activa).length;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className={estilosReclutador.titulo}>Dashboard</h1>
          <p className="mt-1 text-slate-600">Los puestos a los que ya se postularon personas.</p>
        </div>
        <PestanasDashboard activa="postulaciones" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TarjetaDato etiqueta="Postulaciones recibidas" valor={postulaciones.length} />
        <TarjetaDato etiqueta="Vacantes con postulantes" valor={`${conPostulantes.length} de ${vacantes.length}`} />
        <TarjetaDato etiqueta="Vacantes activas" valor={activas} />
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
        <>
          <section className={estilosReclutador.tarjeta}>
            <h2 className="font-bold text-marca">Postulaciones por vacante</h2>
            <p className="mb-4 mt-1 text-sm text-slate-500">Tocá una barra para ver solo esa vacante.</p>
            <GraficoBarras
              unidad="postulaciones"
              filas={conPostulantes.map((v) => ({
                id: v.id,
                etiqueta: v.titulo,
                valor: porVacante.get(v.id)?.length ?? 0,
                href: `/reclutador/vacantes/${v.id}/postulaciones`,
              }))}
            />
          </section>

          <div className="space-y-5">
            {conPostulantes.map((v) => {
              const lista = porVacante.get(v.id) ?? [];
              return (
                <section key={v.id} className={`${estilosReclutador.tarjeta} space-y-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icono nombre="maletin" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold text-marca">{v.titulo}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <EtiquetaEstado activa={v.activa} />
                          <span className="text-sm text-slate-500">
                            {lista.length} {lista.length === 1 ? "postulante" : "postulantes"}
                          </span>
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
                  <ListaPostulantes postulaciones={lista} titulosVacantes={titulos} />
                </section>
              );
            })}
          </div>

          {sinPostulantes > 0 && (
            <p className="text-center text-sm text-slate-500">
              {sinPostulantes} {sinPostulantes === 1 ? "vacante todavía no tiene" : "vacantes todavía no tienen"} postulaciones.
            </p>
          )}
        </>
      )}
    </div>
  );
}
