import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COLUMNAS_VACANTE, formatearFecha, type Vacante } from "@/lib/tipos";
import { BotonEstadoVacante } from "@/components/BotonEstadoVacante";
import { Icono } from "@/components/postulante/Icono";
import { EtiquetaEstado } from "@/components/reclutador/EtiquetaEstado";
import { estilosReclutador } from "@/components/reclutador/estilos";

export default async function PanelReclutadorPage() {
  const supabase = await crearClienteServidor();
  const [{ data }, { data: postulaciones }] = await Promise.all([
    supabase.from("vacantes").select(COLUMNAS_VACANTE).order("creado_en", { ascending: false }),
    supabase.from("postulaciones").select("vacante_id"),
  ]);
  const vacantes = (data ?? []) as Vacante[];
  const cantidades = new Map<string, number>();
  for (const p of postulaciones ?? []) {
    cantidades.set(p.vacante_id, (cantidades.get(p.vacante_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={estilosReclutador.titulo}>Vacantes publicadas</h1>
          <p className="mt-1 text-slate-600">Creá vacantes, activalas o desactivalas y mirá sus postulaciones.</p>
        </div>
        <Link href="/reclutador/vacantes/nueva" className={estilosReclutador.boton}>
          + Nueva vacante
        </Link>
      </div>

      {vacantes.length === 0 ? (
        <div className={`${estilosReclutador.tarjeta} flex flex-col items-center py-12 text-center`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Icono nombre="maletin" className="h-7 w-7" />
          </span>
          <p className="mt-4 font-semibold text-marca">Todavía no creaste ninguna vacante</p>
          <Link href="/reclutador/vacantes/nueva" className={`${estilosReclutador.boton} mt-5`}>
            Crear la primera
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {vacantes.map((v) => {
            const cantidad = cantidades.get(v.id) ?? 0;
            return (
              <li
                key={v.id}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-acento" />
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icono nombre="maletin" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/reclutador/vacantes/${v.id}`}
                          className="text-lg font-bold text-marca hover:text-blue-700 hover:underline"
                        >
                          {v.titulo}
                        </Link>
                        <EtiquetaEstado activa={v.activa} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        Creada el {formatearFecha(v.creado_en)} · {cantidad}{" "}
                        {cantidad === 1 ? "postulación" : "postulaciones"}
                      </p>
                    </div>
                  </div>
                  <BotonEstadoVacante id={v.id} activa={v.activa} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Link href={`/reclutador/vacantes/${v.id}`} className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}>
                    Ver detalle
                  </Link>
                  <Link href={`/reclutador/vacantes/${v.id}/postulaciones`} className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}>
                    Ver postulaciones
                  </Link>
                  <Link href={`/reclutador/vacantes/${v.id}/editar`} className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}>
                    Editar
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
