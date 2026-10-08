import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha, type Cv } from "@/lib/tipos";
import { SubirCv } from "@/components/SubirCv";
import { Icono } from "@/components/postulante/Icono";
import { estilosPostulante } from "@/components/postulante/estilos";

export default async function MiCvPage() {
  const perfil = await exigirRol("postulante");
  const supabase = await crearClienteServidor();
  const { data: cv } = await supabase
    .from("cvs")
    .select("id, postulante_id, ruta_archivo, nombre_archivo, subido_en")
    .eq("postulante_id", perfil.id)
    .maybeSingle<Cv>();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className={estilosPostulante.titulo}>Mi CV</h1>
        <p className="mt-1 text-slate-600">
          Este es el CV que se envía cuando te postulás a una vacante.
        </p>
      </div>

      <section className={estilosPostulante.tarjeta}>
        <h2 className="mb-4 font-bold text-marca">CV actual</h2>
        {cv ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                <Icono nombre="documento" className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-marca">{cv.nombre_archivo}</p>
                <p className="text-sm text-slate-500">Subido el {formatearFecha(cv.subido_en)}</p>
                <span className={`${estilosPostulante.etiquetaOk} mt-1`}>
                  <Icono nombre="check" className="h-3.5 w-3.5" /> Listo para postularte
                </span>
              </div>
            </div>
            <a href={`/cv/${perfil.id}`} target="_blank" rel="noopener" className={estilosPostulante.botonSecundario}>
              Ver mi CV
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
              <Icono nombre="documento" className="h-6 w-6" />
            </span>
            <p className="text-slate-600">Todavía no subiste tu CV. Lo necesitás para postularte.</p>
          </div>
        )}
      </section>

      <section className={estilosPostulante.tarjeta}>
        <SubirCv postulanteId={perfil.id} tieneCv={Boolean(cv)} />
      </section>
    </div>
  );
}
