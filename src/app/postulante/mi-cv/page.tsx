import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha, type Cv } from "@/lib/tipos";
import { SubirCv } from "@/components/SubirCv";
import { estilos } from "@/components/estilos";

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
        <h1 className={estilos.titulo}>Mi CV</h1>
        <p className="mt-1 text-slate-600">
          Este es el CV que se envía cuando te postulás a una vacante.
        </p>
      </div>

      <section className={estilos.tarjeta}>
        <h2 className="mb-3 font-semibold text-slate-900">CV actual</h2>
        {cv ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">📄 {cv.nombre_archivo}</p>
              <p className="text-sm text-slate-500">Subido el {formatearFecha(cv.subido_en)}</p>
            </div>
            <a href={`/cv/${perfil.id}`} target="_blank" rel="noopener" className={estilos.botonSecundario}>
              Ver mi CV
            </a>
          </div>
        ) : (
          <p className="text-slate-600">Todavía no subiste tu CV. Lo necesitás para postularte.</p>
        )}
      </section>

      <section className={estilos.tarjeta}>
        <SubirCv postulanteId={perfil.id} tieneCv={Boolean(cv)} />
      </section>
    </div>
  );
}
