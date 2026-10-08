import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cargarPostulaciones, nombreCompleto, type Postulante } from "@/lib/dashboard";
import { COLUMNAS_VACANTE, type Vacante } from "@/lib/tipos";
import { Icono } from "@/components/postulante/Icono";
import { EtiquetaEstado } from "@/components/reclutador/EtiquetaEstado";
import { PestanasDashboard } from "@/components/reclutador/PestanasDashboard";
import { estilosReclutador } from "@/components/reclutador/estilos";

type Sugerido = {
  id: string;
  vacante_id: string;
  afinidad: number | null;
  postulante: Postulante;
};

function Pendiente() {
  return <span className="text-slate-400">Pendiente de análisis</span>;
}

// Dashboard 2: puestos y recomendaciones de la IA. Todavía no está implementada,
// así que mientras no haya datos todo figura como "Pendiente de análisis".
export default async function DashboardIaPage() {
  const supabase = await crearClienteServidor();
  const [{ data: dataVacantes }, { data: dataSugeridos }, postulaciones] = await Promise.all([
    supabase.from("vacantes").select(COLUMNAS_VACANTE).order("creado_en", { ascending: false }),
    supabase
      .from("candidatos_sugeridos")
      .select("id, vacante_id, afinidad, postulante:perfiles!candidatos_sugeridos_postulante_id_fkey(nombre, apellido, email)")
      .order("afinidad", { ascending: false }),
    cargarPostulaciones(supabase),
  ]);
  const vacantes = (dataVacantes ?? []) as Vacante[];
  const sugeridos = (dataSugeridos ?? []) as unknown as Sugerido[];
  const titulos = new Map(vacantes.map((v) => [v.id, v.titulo]));
  const reubicaciones = postulaciones.filter((p) => p.vacante_sugerida_id !== null);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className={estilosReclutador.titulo}>Dashboard</h1>
          <p className="mt-1 text-slate-600">Los puestos y las recomendaciones que hace la IA.</p>
        </div>
        <PestanasDashboard activa="ia" />
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-marca via-blue-900 to-blue-600 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/30 blur-2xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
            Pendiente de análisis
          </span>
          <h2 className="mt-3 text-xl font-bold sm:text-2xl">El análisis con IA todavía no está activo</h2>
          <p className="mt-2 text-blue-100">
            Cuando se active, acá vas a ver los candidatos que la IA recomienda para cada puesto y su nivel de afinidad.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-marca">Candidatos sugeridos por puesto</h2>
        {vacantes.length === 0 ? (
          <p className={`${estilosReclutador.tarjeta} text-slate-600`}>Todavía no hay vacantes publicadas.</p>
        ) : (
          vacantes.map((v) => {
            const lista = sugeridos.filter((s) => s.vacante_id === v.id);
            return (
              <article key={v.id} className={`${estilosReclutador.tarjeta} space-y-4`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icono nombre="maletin" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-marca">{v.titulo}</h3>
                      <div className="mt-1">
                        <EtiquetaEstado activa={v.activa} />
                      </div>
                    </div>
                  </div>
                  <Link href={`/reclutador/vacantes/${v.id}`} className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}>
                    Ver detalle del puesto
                  </Link>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  {lista.length === 0 ? (
                    <Pendiente />
                  ) : (
                    <ul className="divide-y divide-slate-200">
                      {lista.map((s) => (
                        <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                          <div>
                            <p className="font-semibold text-marca">{nombreCompleto(s.postulante)}</p>
                            {s.postulante && <p className="break-all text-slate-600">{s.postulante.email}</p>}
                          </div>
                          <span className="text-slate-700">
                            Afinidad: <strong className="text-marca">{s.afinidad ?? "—"}</strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-marca">Postulantes con otra vacante sugerida</h2>
        <div className={`${estilosReclutador.tarjeta} text-sm`}>
          {reubicaciones.length === 0 ? (
            <Pendiente />
          ) : (
            <ul className="divide-y divide-slate-100">
              {reubicaciones.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-marca">{nombreCompleto(p.postulante)}</p>
                    <p className="text-slate-500">Se postuló a {titulos.get(p.vacante_id) ?? "—"}</p>
                  </div>
                  <span className="text-slate-700">
                    La IA sugiere: <strong className="text-marca">{titulos.get(p.vacante_sugerida_id ?? "") ?? "—"}</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
