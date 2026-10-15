import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cargarEstadosCv, cargarPostulaciones, nombreCompleto, type Postulante } from "@/lib/dashboard";
import { AFINIDAD_MINIMA_LISTA, MAX_CANDIDATOS_POR_PUESTO } from "@/lib/ia/config";
import type { MotivosAfinidad } from "@/lib/ia/esquema";
import { COLUMNAS_VACANTE, type Vacante } from "@/lib/tipos";
import { Icono } from "@/components/postulante/Icono";
import { ActualizarSiAnalizando } from "@/components/reclutador/ActualizarSiAnalizando";
import { MedidorAfinidad, MotivosDeAfinidad } from "@/components/reclutador/Afinidad";
import { BotonReanalizar } from "@/components/reclutador/BotonReanalizar";
import { EtiquetaEstado } from "@/components/reclutador/EtiquetaEstado";
import { PestanasDashboard } from "@/components/reclutador/PestanasDashboard";
import { estilosReclutador } from "@/components/reclutador/estilos";

// Los análisis con IA que se disparan desde esta pantalla pueden tardar: se amplía el tiempo.
export const maxDuration = 60;

type Sugerido = {
  id: string;
  vacante_id: string;
  postulante_id: string;
  afinidad: number | null;
  analisis: MotivosAfinidad | null;
  postulante: Postulante;
};

function Pendiente({ texto = "Pendiente de análisis" }: { texto?: string }) {
  return <span className="text-slate-400">{texto}</span>;
}

// Dashboard 2: puestos y recomendaciones de la IA. Cada CV se analiza solo al subirlo,
// comparándolo con todas las vacantes abiertas en ese momento.
export default async function DashboardIaPage() {
  const supabase = await crearClienteServidor();
  const [{ data: dataVacantes }, { data: dataSugeridos }, postulaciones, estadosCv] = await Promise.all([
    supabase.from("vacantes").select(COLUMNAS_VACANTE).order("creado_en", { ascending: false }),
    supabase
      .from("candidatos_sugeridos")
      .select(
        "id, vacante_id, postulante_id, afinidad, analisis, postulante:perfiles!candidatos_sugeridos_postulante_id_fkey(nombre, apellido, email)",
      )
      .order("afinidad", { ascending: false }),
    cargarPostulaciones(supabase),
    cargarEstadosCv(supabase),
  ]);
  const vacantes = (dataVacantes ?? []) as Vacante[];
  const sugeridos = (dataSugeridos ?? []) as unknown as Sugerido[];
  const titulos = new Map(vacantes.map((v) => [v.id, v.titulo]));
  const yaSePostulo = new Set(postulaciones.map((p) => `${p.vacante_id}|${p.postulante_id}`));
  const reubicaciones = postulaciones.filter((p) => p.vacante_sugerida_id !== null);

  const cuenta = { listo: 0, pendiente: 0, analizando: 0, error: 0 };
  for (const estado of estadosCv.values()) cuenta[estado] += 1;
  const total = estadosCv.size;

  return (
    <div className="space-y-6">
      <ActualizarSiAnalizando activo={cuenta.analizando > 0} />
      <div className="space-y-4">
        <div>
          <h1 className={estilosReclutador.titulo}>Dashboard</h1>
          <p className="mt-1 text-slate-600">Los puestos y las recomendaciones que hace la IA.</p>
        </div>
        <PestanasDashboard activa="ia" />
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-marca via-blue-900 to-blue-600 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/30 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
              {cuenta.listo > 0 ? "Análisis con IA" : "Pendiente de análisis"}
            </span>
            <h2 className="mt-3 text-xl font-bold sm:text-2xl">
              {total === 0
                ? "Todavía no hay CVs para analizar"
                : `${cuenta.listo} de ${total} ${total === 1 ? "CV analizado" : "CVs analizados"}`}
            </h2>
            <p className="mt-2 text-blue-100">
              Cada CV nuevo se analiza solo, apenas se sube, y se compara con todas las vacantes abiertas en ese
              momento. Si creás vacantes nuevas, usá el botón para volver a comparar los CVs.
            </p>
            {total > 0 && (
              <p className="mt-2 text-sm text-blue-100">
                {cuenta.analizando > 0 && `${cuenta.analizando} analizándose ahora · `}
                {cuenta.pendiente > 0 && `${cuenta.pendiente} pendientes · `}
                {cuenta.error > 0 && `${cuenta.error} con error · `}
                {cuenta.listo} listos
              </p>
            )}
          </div>
          {total > 0 && <BotonReanalizar texto="Re-analizar CVs pendientes" claro />}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-marca">Candidatos sugeridos por puesto</h2>
        {vacantes.length === 0 ? (
          <p className={`${estilosReclutador.tarjeta} text-slate-600`}>Todavía no hay vacantes publicadas.</p>
        ) : (
          vacantes.map((v) => {
            const deEstaVacante = sugeridos.filter((s) => s.vacante_id === v.id && s.afinidad !== null);
            const lista = deEstaVacante
              .filter((s) => Number(s.afinidad) >= AFINIDAD_MINIMA_LISTA)
              .slice(0, MAX_CANDIDATOS_POR_PUESTO);
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

                {lista.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    {cuenta.listo === 0 ? (
                      <Pendiente />
                    ) : !v.activa && deEstaVacante.length === 0 ? (
                      <span className="text-slate-600">Vacante inactiva: no se compara con los CVs.</span>
                    ) : deEstaVacante.length === 0 ? (
                      <Pendiente texto="Todavía no se compararon los CVs con esta vacante: usá «Re-analizar CVs pendientes»." />
                    ) : (
                      <span className="text-slate-600">
                        Ningún CV analizado llega a la afinidad mínima ({AFINIDAD_MINIMA_LISTA}).
                      </span>
                    )}
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {lista.map((s) => (
                      <li key={s.id} className="space-y-3 py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 font-semibold text-marca">
                              {nombreCompleto(s.postulante)}
                              {yaSePostulo.has(`${v.id}|${s.postulante_id}`) && (
                                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                                  Ya se postuló
                                </span>
                              )}
                            </p>
                            {s.postulante && <p className="break-all text-sm text-slate-600">{s.postulante.email}</p>}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <MedidorAfinidad valor={Number(s.afinidad)} />
                            <a
                              href={`/cv/${s.postulante_id}`}
                              target="_blank"
                              rel="noopener"
                              className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}
                            >
                              <Icono nombre="documento" className="h-4 w-4" /> Ver CV
                            </a>
                          </div>
                        </div>
                        {s.analisis && <MotivosDeAfinidad motivos={s.analisis} />}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-marca">Postulantes con otra vacante sugerida</h2>
        <div className={`${estilosReclutador.tarjeta} text-sm`}>
          {reubicaciones.length === 0 ? (
            <Pendiente texto={cuenta.listo === 0 ? "Pendiente de análisis" : "Por ahora ninguna postulación tiene una vacante que le encaje claramente mejor."} />
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
