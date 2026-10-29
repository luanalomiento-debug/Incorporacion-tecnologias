import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { agruparPorVacante, cargarEstadosCv, cargarPostulaciones, nombreCompleto, resumenAfinidad, traerTodo } from "@/lib/dashboard";
import {
  DIAS_ESTANCADA,
  DIAS_SIN_REVISAR,
  DIAS_VACANTE_SIN_POSTULACIONES,
  ETAPAS,
  ETAPAS_EN_CURSO,
  MS_DIA,
  ahoraMs,
  diasDesde,
  textoDias,
} from "@/lib/etapas";
import { AFINIDAD_BUEN_MATCH, AFINIDAD_MINIMA_LISTA } from "@/lib/ia/config";
import { COLUMNAS_VACANTE, type Vacante } from "@/lib/tipos";
import { GraficoBarras } from "@/components/reclutador/GraficoBarras";
import { GraficoSemanal } from "@/components/reclutador/GraficoSemanal";
import { TarjetaDato } from "@/components/reclutador/TarjetaDato";
import { estilosReclutador } from "@/components/reclutador/estilos";

const PERIODOS = [
  { valor: "30", texto: "Últimos 30 días", dias: 30 },
  { valor: "90", texto: "Últimos 90 días", dias: 90 },
  { valor: "todo", texto: "Todo el período", dias: null },
] as const;

const SEMANAS = 8;
const MAX_EN_ALERTA = 5;

function unico(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

// Dashboard del reclutador: qué está pasando, qué necesita atención y qué hacer ahora.
// Todos los números salen de los datos reales de la plataforma (definiciones al final de la página).
export default async function DashboardPage({ searchParams }: PageProps<"/reclutador/dashboard">) {
  const params = await searchParams;
  const supabase = await crearClienteServidor();
  const [{ data: dataVacantes }, todas, dataCandidatos, estadosCv, dataMov] = await Promise.all([
    supabase.from("vacantes").select(COLUMNAS_VACANTE).order("creado_en", { ascending: false }),
    cargarPostulaciones(supabase),
    traerTodo<{ vacante_id: string; postulante_id: string; afinidad: number | null }>((desde, hasta) =>
      supabase.from("afinidades_cv_vacante").select("vacante_id, postulante_id, afinidad").order("id").range(desde, hasta),
    ),
    cargarEstadosCv(supabase),
    traerTodo<{ postulacion_id: string; creado_en: string }>((desde, hasta) =>
      supabase
        .from("postulacion_movimientos")
        .select("postulacion_id, creado_en")
        .order("creado_en", { ascending: true })
        .order("id")
        .range(desde, hasta),
    ),
  ]);
  const vacantes = (dataVacantes ?? []) as Vacante[];
  const candidatos = dataCandidatos;

  // --- Filtros (vacante y período)
  const vacanteFiltro = vacantes.find((v) => v.id === unico(params.vacante)) ?? null;
  const periodo = PERIODOS.find((p) => p.valor === unico(params.periodo)) ?? PERIODOS[2];
  const ahora = ahoraMs();
  const desde = periodo.dias === null ? 0 : ahora - periodo.dias * MS_DIA;

  const deLaVacante = vacanteFiltro ? todas.filter((p) => p.vacante_id === vacanteFiltro.id) : todas;
  const enPeriodo = deLaVacante.filter((p) => new Date(p.creado_en).getTime() >= desde);
  const vacantesVisibles = vacanteFiltro ? [vacanteFiltro] : vacantes;
  const titulos = new Map(vacantes.map((v) => [v.id, v.titulo]));
  const porVacante = agruparPorVacante(deLaVacante);

  // --- Qué necesita atención (siempre al día de hoy, sin filtro de período)
  const sinRevisar = deLaVacante
    .filter((p) => p.etapa === "nuevo" && diasDesde(p.creado_en, ahora) >= DIAS_SIN_REVISAR)
    .sort((a, b) => a.creado_en.localeCompare(b.creado_en));
  const estancadas = deLaVacante
    .filter((p) => ETAPAS_EN_CURSO.includes(p.etapa) && diasDesde(p.etapa_actualizada_en, ahora) >= DIAS_ESTANCADA)
    .sort((a, b) => a.etapa_actualizada_en.localeCompare(b.etapa_actualizada_en));
  const vacantesSinPostulaciones = vacantesVisibles.filter(
    (v) => v.activa && !porVacante.has(v.id) && diasDesde(v.creado_en, ahora) >= DIAS_VACANTE_SIN_POSTULACIONES,
  );
  const estados = [...estadosCv.values()];
  const cvsConProblema = estados.filter((e) => e === "error" || e === "pendiente").length;
  const cvsListos = estados.filter((e) => e === "listo").length;

  // --- El valor extra de la IA
  const idsActivas = new Set(vacantes.filter((v) => v.activa).map((v) => v.id));
  const yaPostulados = new Set(todas.map((p) => `${p.vacante_id}|${p.postulante_id}`));
  const extras = candidatos.filter(
    (c) =>
      c.afinidad !== null &&
      Number(c.afinidad) >= AFINIDAD_MINIMA_LISTA &&
      idsActivas.has(c.vacante_id) &&
      !yaPostulados.has(`${c.vacante_id}|${c.postulante_id}`) &&
      (!vacanteFiltro || c.vacante_id === vacanteFiltro.id),
  );
  const matchesExtra = extras.length;
  const buenosExtra = extras.filter((c) => Number(c.afinidad) >= AFINIDAD_BUEN_MATCH);
  const personasExtra = new Set(buenosExtra.map((c) => c.postulante_id)).size;
  const vacantesCubribles = vacantesVisibles.filter(
    (v) => v.activa && !porVacante.has(v.id) && buenosExtra.some((c) => c.vacante_id === v.id),
  ).length;
  const hayAnalisis = cvsListos > 0 || candidatos.length > 0;

  // --- Indicadores del período
  const global = resumenAfinidad(enPeriodo);
  const buenMatch = enPeriodo.filter((p) => p.afinidad !== null && Number(p.afinidad) >= AFINIDAD_BUEN_MATCH).length;
  const activasVisibles = vacantesVisibles.filter((v) => v.activa);
  const vacantesSinPostulacionesTotal = activasVisibles.filter((v) => !porVacante.has(v.id)).length;
  const enProceso = enPeriodo.filter((p) => ETAPAS_EN_CURSO.includes(p.etapa)).length;
  const contratados = enPeriodo.filter((p) => p.etapa === "contratado").length;
  const primerMovimiento = new Map<string, string>();
  for (const m of dataMov) if (!primerMovimiento.has(m.postulacion_id as string)) primerMovimiento.set(m.postulacion_id as string, m.creado_en as string);
  const tiempos = enPeriodo
    .filter((p) => primerMovimiento.has(p.id))
    .map((p) => (new Date(primerMovimiento.get(p.id)!).getTime() - new Date(p.creado_en).getTime()) / MS_DIA);
  const tiempoRevision = tiempos.length > 0 ? Math.round((tiempos.reduce((a, b) => a + b, 0) / tiempos.length) * 10) / 10 : null;

  const embudo = ETAPAS.map((e) => ({
    id: e.valor,
    etiqueta: e.texto,
    valor: enPeriodo.filter((p) => p.etapa === e.valor).length,
    href: `/reclutador/postulaciones?etapa=${e.valor}`,
  }));

  // --- Tendencia: postulaciones por semana (últimas 8 semanas, con el filtro de vacante)
  const semanas = Array.from({ length: SEMANAS }, (_, i) => {
    const fin = ahora - (SEMANAS - 1 - i) * 7 * MS_DIA;
    const ini = fin - 7 * MS_DIA;
    const valor = deLaVacante.filter((p) => {
      const t = new Date(p.creado_en).getTime();
      return t > ini && t <= fin;
    }).length;
    const etiqueta = new Date(fin).toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "America/Montevideo" });
    return { etiqueta, valor };
  });
  const totalSemanas = semanas.reduce((a, s) => a + s.valor, 0);

  // --- Comparación entre vacantes
  const filasVacantes = vacantesVisibles
    .filter((v) => v.activa || porVacante.has(v.id))
    .map((v) => {
      const lista = (porVacante.get(v.id) ?? []).filter((p) => new Date(p.creado_en).getTime() >= desde);
      const nuevas = lista.filter((p) => p.etapa === "nuevo");
      const ultima = lista.length > 0 ? Math.max(...lista.map((p) => new Date(p.creado_en).getTime())) : null;
      return {
        v,
        total: lista.length,
        sinRevisar: nuevas.filter((p) => diasDesde(p.creado_en, ahora) >= DIAS_SIN_REVISAR).length,
        enProceso: lista.filter((p) => ETAPAS_EN_CURSO.includes(p.etapa)).length,
        promedio: resumenAfinidad(lista).promedio,
        ultima,
      };
    })
    .sort((a, b) => b.sinRevisar - a.sinRevisar || b.total - a.total);

  const hayAlertas =
    sinRevisar.length + estancadas.length + vacantesSinPostulaciones.length > 0 || cvsConProblema > 0;
  const campo =
    "selector rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={estilosReclutador.titulo}>Dashboard</h1>
          <p className="mt-1 text-slate-600">Qué está pasando, qué necesita tu atención y qué podés hacer ahora.</p>
        </div>
        <form method="get" className="flex flex-wrap items-end gap-3" aria-label="Filtros del dashboard">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Vacante
            <select name="vacante" defaultValue={vacanteFiltro?.id ?? ""} className={campo}>
              <option value="">Todas</option>
              {vacantes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.titulo}
                  {v.activa ? "" : " (inactiva)"}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Período
            <select name="periodo" defaultValue={periodo.valor} className={campo}>
              {PERIODOS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.texto}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={`${estilosReclutador.boton} !px-4 !py-2 text-sm`}>
            Aplicar
          </button>
        </form>
      </div>

      <section aria-labelledby="atencion" className={`${estilosReclutador.tarjeta} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="atencion" className="text-lg font-bold text-marca">
            Requiere tu atención
          </h2>
          <span className="text-xs text-slate-500">Situación de hoy{vacanteFiltro ? ` · ${vacanteFiltro.titulo}` : ""}</span>
        </div>

        {!hayAlertas ? (
          <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            Todo al día: no hay candidatos esperando revisión ni procesos estancados.
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {sinRevisar.length > 0 && (
              <li className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="font-semibold text-marca">
                  {sinRevisar.length} {sinRevisar.length === 1 ? "candidato espera" : "candidatos esperan"} revisión hace {DIAS_SIN_REVISAR} días o más
                </p>
                <ul className="space-y-1 text-sm">
                  {sinRevisar.slice(0, MAX_EN_ALERTA).map((p) => (
                    <li key={p.id}>
                      <Link href={`/reclutador/postulaciones/${p.id}`} className="font-semibold text-blue-700 hover:underline">
                        {nombreCompleto(p.postulante)}
                      </Link>{" "}
                      <span className="text-slate-600">
                        · {titulos.get(p.vacante_id) ?? "—"} · {textoDias(diasDesde(p.creado_en, ahora))}
                        {p.afinidad !== null ? ` · afinidad ${Number(p.afinidad)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/reclutador/postulaciones?etapa=nuevo" className="inline-block text-sm font-semibold text-blue-700 hover:underline">
                  Ver todos los nuevos →
                </Link>
              </li>
            )}
            {estancadas.length > 0 && (
              <li className="space-y-2 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                <p className="font-semibold text-marca">
                  {estancadas.length} {estancadas.length === 1 ? "proceso estancado" : "procesos estancados"} (sin cambios hace {DIAS_ESTANCADA} días o más)
                </p>
                <ul className="space-y-1 text-sm">
                  {estancadas.slice(0, MAX_EN_ALERTA).map((p) => (
                    <li key={p.id}>
                      <Link href={`/reclutador/postulaciones/${p.id}`} className="font-semibold text-blue-700 hover:underline">
                        {nombreCompleto(p.postulante)}
                      </Link>{" "}
                      <span className="text-slate-600">
                        · {titulos.get(p.vacante_id) ?? "—"} · {ETAPAS.find((e) => e.valor === p.etapa)?.texto.toLowerCase()}{" "}
                        {textoDias(diasDesde(p.etapa_actualizada_en, ahora))}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            )}
            {vacantesSinPostulaciones.length > 0 && (
              <li className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-marca">
                  {vacantesSinPostulaciones.length} {vacantesSinPostulaciones.length === 1 ? "vacante activa sin postulaciones" : "vacantes activas sin postulaciones"} hace {DIAS_VACANTE_SIN_POSTULACIONES} días o más
                </p>
                <ul className="space-y-1 text-sm">
                  {vacantesSinPostulaciones.slice(0, MAX_EN_ALERTA).map((v) => (
                    <li key={v.id}>
                      <Link href={`/reclutador/vacantes/${v.id}`} className="font-semibold text-blue-700 hover:underline">
                        {v.titulo}
                      </Link>{" "}
                      <span className="text-slate-600">· publicada {textoDias(diasDesde(v.creado_en, ahora))}. Revisá el texto de la vacante o buscá candidatos en Recomendaciones de IA.</span>
                    </li>
                  ))}
                </ul>
              </li>
            )}
            {cvsConProblema > 0 && (
              <li className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-marca">
                  {cvsConProblema} {cvsConProblema === 1 ? "CV sin analizar o con error" : "CVs sin analizar o con error"}
                </p>
                <p className="text-sm text-slate-600">Hasta que se analicen no tienen afinidad ni recomendaciones.</p>
                <Link href="/reclutador/postulaciones/ia" className="inline-block text-sm font-semibold text-blue-700 hover:underline">
                  Ir a analizarlos →
                </Link>
              </li>
            )}
          </ul>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <TarjetaDato
          etiqueta="Postulaciones recibidas"
          valor={enPeriodo.length}
          detalle={`${periodo.texto.toLowerCase()} · ${activasVisibles.length} ${activasVisibles.length === 1 ? "vacante activa" : "vacantes activas"}${vacantesSinPostulacionesTotal > 0 ? `, ${vacantesSinPostulacionesTotal} sin postulaciones` : ""}`}
        />
        <TarjetaDato
          etiqueta="En proceso"
          valor={enProceso}
          detalle="Preseleccionados, en entrevista o finalistas"
        />
        <TarjetaDato etiqueta="Contratados" valor={contratados} detalle={contratados === 0 ? "Todavía ninguno" : "En el período"} />
        <TarjetaDato
          etiqueta="Promedio de matching"
          valor={global.promedio === null ? "—" : global.promedio}
          detalle={
            global.promedio === null
              ? "Todavía no hay CVs analizados"
              : `${global.analizadas} de ${enPeriodo.length} analizadas · ${buenMatch} con ${AFINIDAD_BUEN_MATCH}+`
          }
        />
        <TarjetaDato
          etiqueta="Tiempo hasta 1.ª revisión"
          valor={tiempoRevision === null ? "—" : `${tiempoRevision} d`}
          detalle={tiempoRevision === null ? "Aún no hay postulaciones revisadas" : `Promedio sobre ${tiempos.length} revisadas`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={estilosReclutador.tarjeta}>
          <h2 className="font-bold text-marca">Embudo de selección</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">Dónde está cada candidato. Tocá una barra para ver esa etapa.</p>
          {enPeriodo.length === 0 ? (
            <p className="text-sm text-slate-500">No hay postulaciones en este período.</p>
          ) : (
            <GraficoBarras filas={embudo} unidad="candidatos" />
          )}
        </section>
        <section className={estilosReclutador.tarjeta}>
          <h2 className="font-bold text-marca">Postulaciones por semana</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">
            Últimas {SEMANAS} semanas{totalSemanas === 0 ? ": todavía no hubo postulaciones" : ` · ${totalSemanas} en total`}.
          </p>
          <GraficoSemanal semanas={semanas} />
        </section>
      </div>

      <section className={`${estilosReclutador.tarjeta} space-y-4`}>
        <div>
          <h2 className="font-bold text-marca">Vacantes: dónde concentrar el esfuerzo</h2>
          <p className="mt-1 text-sm text-slate-500">Ordenadas por candidatos pendientes de revisión. Tocá una vacante para ver sus postulantes.</p>
        </div>
        {filasVacantes.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no hay vacantes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="py-2 pr-3 font-semibold">Vacante</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Postulaciones</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Sin revisar</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">En proceso</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Matching prom.</th>
                  <th scope="col" className="py-2 pl-3 text-right font-semibold">Última postulación</th>
                </tr>
              </thead>
              <tbody>
                {filasVacantes.map((f) => (
                  <tr key={f.v.id} className="border-b border-slate-100 last:border-0">
                    <th scope="row" className="py-3 pr-3 font-semibold">
                      <Link href={`/reclutador/vacantes/${f.v.id}/postulaciones`} className="text-blue-700 hover:underline">
                        {f.v.titulo}
                      </Link>
                      {!f.v.activa && <span className="ml-2 text-xs font-normal text-slate-500">(inactiva)</span>}
                    </th>
                    <td className="px-3 py-3 text-right">{f.total}</td>
                    <td className={`px-3 py-3 text-right ${f.sinRevisar > 0 ? "font-bold text-amber-700" : ""}`}>{f.sinRevisar}</td>
                    <td className="px-3 py-3 text-right">{f.enProceso}</td>
                    <td className="px-3 py-3 text-right">{f.promedio ?? "—"}</td>
                    <td className="py-3 pl-3 text-right text-slate-600">
                      {f.ultima === null ? "—" : textoDias(Math.floor((ahora - f.ultima) / MS_DIA))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-marca via-blue-900 to-blue-600 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/30 blur-2xl" />
        <div className="relative">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
            El valor extra de la IA
          </span>
          <h2 className="mt-3 text-xl font-bold sm:text-2xl">Lo que aporta además de las postulaciones</h2>

          {!hayAnalisis ? (
            <p className="mt-3 text-blue-100">
              Pendiente de análisis: cuando haya CVs analizados, acá vas a ver cuántas personas y vacantes la IA ayudó a conectar.
            </p>
          ) : (
            <>
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-5xl font-bold">{matchesExtra}</p>
                  <p className="mt-2 text-sm text-blue-100">
                    {matchesExtra === 1 ? "match extra" : "matches extra"} que encontró la IA en vacantes a las que la persona no se postuló
                  </p>
                </div>
                <div>
                  <p className="text-5xl font-bold">{personasExtra}</p>
                  <p className="mt-2 text-sm text-blue-100">
                    {personasExtra === 1 ? "persona" : "personas"} con buen match en vacantes a las que no se postularon
                  </p>
                </div>
                <div>
                  <p className="text-5xl font-bold">{vacantesCubribles}</p>
                  <p className="mt-2 text-sm text-blue-100">
                    {vacantesCubribles === 1 ? "vacante sin postulaciones" : "vacantes sin postulaciones"} que la IA ya tiene candidatos para cubrir
                  </p>
                </div>
              </div>
              <Link
                href="/reclutador/postulaciones/ia"
                className="mt-6 inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-marca shadow-sm transition hover:bg-blue-50"
              >
                Ver las recomendaciones
              </Link>
              <p className="mt-4 text-xs text-blue-200">
                Hay {cvsListos} {cvsListos === 1 ? "CV analizado" : "CVs analizados"} de {estadosCv.size}.
              </p>
            </>
          )}
        </div>
      </section>

      <details className={`${estilosReclutador.tarjeta} text-sm text-slate-700`}>
        <summary className="cursor-pointer font-semibold text-blue-700">Cómo se calcula cada indicador</summary>
        <dl className="mt-3 space-y-2">
          <div><dt className="inline font-semibold text-marca">Postulaciones recibidas: </dt><dd className="inline">postulaciones creadas dentro del período y de la vacante elegidos.</dd></div>
          <div><dt className="inline font-semibold text-marca">En proceso: </dt><dd className="inline">postulaciones en etapa Preseleccionado, En entrevista o Finalista.</dd></div>
          <div><dt className="inline font-semibold text-marca">Promedio de matching: </dt><dd className="inline">promedio de la afinidad (0 a 100) calculada por la IA, solo sobre las postulaciones ya analizadas.</dd></div>
          <div><dt className="inline font-semibold text-marca">Tiempo hasta 1.ª revisión: </dt><dd className="inline">días promedio entre que llega la postulación y la primera vez que se le cambia la etapa. Solo cuenta las que ya se movieron.</dd></div>
          <div><dt className="inline font-semibold text-marca">Sin revisar: </dt><dd className="inline">postulaciones en etapa Nuevo con {DIAS_SIN_REVISAR} días o más.</dd></div>
          <div><dt className="inline font-semibold text-marca">Proceso estancado: </dt><dd className="inline">candidato en Preseleccionado, En entrevista o Finalista sin cambio de etapa hace {DIAS_ESTANCADA} días o más.</dd></div>
          <div><dt className="inline font-semibold text-marca">Match extra: </dt><dd className="inline">afinidad de {AFINIDAD_MINIMA_LISTA} o más que la IA calculó para una vacante abierta a la que la persona no se postuló. «Buen match» es {AFINIDAD_BUEN_MATCH} o más.</dd></div>
          <div><dt className="inline font-semibold text-marca">Afinidad: </dt><dd className="inline">estimación de la IA basada en los requisitos de la vacante y lo que dice el CV. Es una orientación: la decisión es siempre de una persona.</dd></div>
        </dl>
      </details>
    </div>
  );
}
