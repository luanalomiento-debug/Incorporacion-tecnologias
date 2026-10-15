import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { agruparPorVacante, cargarEstadosCv, cargarPostulaciones, resumenAfinidad } from "@/lib/dashboard";
import { AFINIDAD_BUEN_MATCH } from "@/lib/ia/config";
import { COLUMNAS_VACANTE, type Vacante } from "@/lib/tipos";
import { GraficoBarras } from "@/components/reclutador/GraficoBarras";
import { TarjetaDato } from "@/components/reclutador/TarjetaDato";
import { estilosReclutador } from "@/components/reclutador/estilos";

const MAX_BARRAS = 10;

function porcentaje(parte: number, total: number) {
  return total === 0 ? 0 : Math.round((parte / total) * 100);
}

// Dashboard estratégico: cómo venimos en general. Solo números globales, sin nombres ni listas
// de personas (eso se opera en las pestañas Vacantes y Postulaciones).
export default async function DashboardEstrategicoPage() {
  const supabase = await crearClienteServidor();
  const [{ data: dataVacantes }, postulaciones, { data: dataCandidatos }, estadosCv] = await Promise.all([
    supabase.from("vacantes").select(COLUMNAS_VACANTE).order("creado_en", { ascending: false }),
    cargarPostulaciones(supabase),
    supabase.from("candidatos_sugeridos").select("vacante_id, postulante_id, afinidad"),
    cargarEstadosCv(supabase),
  ]);
  const vacantes = (dataVacantes ?? []) as Vacante[];
  const candidatos = (dataCandidatos ?? []) as { vacante_id: string; postulante_id: string; afinidad: number | null }[];

  const porVacante = agruparPorVacante(postulaciones);
  const activas = vacantes.filter((v) => v.activa);
  const idsActivas = new Set(activas.map((v) => v.id));
  const sinPostulaciones = activas.filter((v) => !porVacante.has(v.id));

  // --- Lo que ya pasó: postulaciones y su match
  const global = resumenAfinidad(postulaciones);
  const buenMatch = postulaciones.filter((p) => p.afinidad !== null && Number(p.afinidad) >= AFINIDAD_BUEN_MATCH).length;

  // --- El valor extra de la IA
  const conOtraSugerida = postulaciones.filter((p) => p.vacante_sugerida_id !== null).length;
  const yaPostulados = new Set(postulaciones.map((p) => `${p.vacante_id}|${p.postulante_id}`));
  const buenosSinPostular = candidatos.filter(
    (c) =>
      c.afinidad !== null &&
      Number(c.afinidad) >= AFINIDAD_BUEN_MATCH &&
      idsActivas.has(c.vacante_id) &&
      !yaPostulados.has(`${c.vacante_id}|${c.postulante_id}`),
  );
  const personasSinPostular = new Set(buenosSinPostular.map((c) => c.postulante_id)).size;
  const vacantesCubribles = sinPostulaciones.filter((v) =>
    candidatos.some((c) => c.vacante_id === v.id && c.afinidad !== null && Number(c.afinidad) >= AFINIDAD_BUEN_MATCH),
  ).length;

  const hayAnalisis = global.analizadas > 0 || candidatos.length > 0;
  const cvsListos = [...estadosCv.values()].filter((e) => e === "listo").length;

  // --- Gráficos
  const barrasPostulaciones = vacantes
    .filter((v) => v.activa || porVacante.has(v.id))
    .map((v) => ({
      id: v.id,
      etiqueta: v.titulo,
      valor: porVacante.get(v.id)?.length ?? 0,
      href: `/reclutador/vacantes/${v.id}/postulaciones`,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, MAX_BARRAS);
  const barrasMatching = vacantes
    .map((v) => ({ v, resumen: resumenAfinidad(porVacante.get(v.id) ?? []) }))
    .filter((x) => x.resumen.promedio !== null)
    .map((x) => ({
      id: x.v.id,
      etiqueta: x.v.titulo,
      valor: x.resumen.promedio as number,
      href: `/reclutador/vacantes/${x.v.id}/postulaciones`,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, MAX_BARRAS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={estilosReclutador.titulo}>Dashboard estratégico</h1>
        <p className="mt-1 text-slate-600">
          Cómo venimos en general. Para operar (ver postulantes, escribirles o analizar CVs) usá{" "}
          <Link href="/reclutador/postulaciones" className="font-semibold text-blue-700 hover:underline">
            Postulaciones
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaDato
          etiqueta="Postulaciones recibidas"
          valor={postulaciones.length}
          detalle={`En ${porVacante.size} ${porVacante.size === 1 ? "vacante" : "vacantes"}`}
        />
        <TarjetaDato
          etiqueta="Promedio de matching"
          valor={global.promedio === null ? "—" : global.promedio}
          detalle={
            global.promedio === null
              ? "Todavía no hay CVs analizados"
              : `${global.analizadas} de ${postulaciones.length} postulaciones analizadas`
          }
        />
        <TarjetaDato
          etiqueta={`Buen match (${AFINIDAD_BUEN_MATCH}+)`}
          valor={global.analizadas === 0 ? "—" : buenMatch}
          detalle={global.analizadas === 0 ? "Pendiente de análisis" : `${porcentaje(buenMatch, global.analizadas)}% de las analizadas`}
        />
        <TarjetaDato
          etiqueta="Vacantes activas"
          valor={activas.length}
          detalle={sinPostulaciones.length === 0 ? "Todas tienen postulaciones" : `${sinPostulaciones.length} sin postulaciones`}
        />
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-marca via-blue-900 to-blue-600 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/30 blur-2xl" />
        <div className="relative">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
            El valor extra de la IA
          </span>
          <h2 className="mt-3 text-xl font-bold sm:text-2xl">Lo que aporta además de las postulaciones</h2>

          {!hayAnalisis ? (
            <p className="mt-3 text-blue-100">
              Pendiente de análisis: cuando haya CVs analizados, acá vas a ver cuántas personas y vacantes la IA
              ayudó a conectar.
            </p>
          ) : (
            <>
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-5xl font-bold">{conOtraSugerida}</p>
                  <p className="mt-2 text-sm text-blue-100">
                    {conOtraSugerida === 1 ? "postulación" : "postulaciones"} en las que la IA encontró otra vacante
                    que le encaja mejor a la persona
                  </p>
                </div>
                <div>
                  <p className="text-5xl font-bold">{personasSinPostular}</p>
                  <p className="mt-2 text-sm text-blue-100">
                    {personasSinPostular === 1 ? "persona" : "personas"} con buen match en vacantes a las que no se
                    postularon
                  </p>
                </div>
                <div>
                  <p className="text-5xl font-bold">{vacantesCubribles}</p>
                  <p className="mt-2 text-sm text-blue-100">
                    {vacantesCubribles === 1 ? "vacante sin postulaciones" : "vacantes sin postulaciones"} que la IA
                    ya tiene candidatos para cubrir
                  </p>
                </div>
              </div>
              <p className="mt-6 text-xs text-blue-200">
                Un buen match es una afinidad de {AFINIDAD_BUEN_MATCH} o más (sobre 100). Hay {cvsListos}{" "}
                {cvsListos === 1 ? "CV analizado" : "CVs analizados"} de {estadosCv.size}.
              </p>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={estilosReclutador.tarjeta}>
          <h2 className="font-bold text-marca">Postulaciones por vacante</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">Tocá una barra para ver las postulaciones de ese puesto.</p>
          {barrasPostulaciones.length === 0 ? (
            <p className="text-sm text-slate-500">Todavía no hay vacantes.</p>
          ) : (
            <GraficoBarras filas={barrasPostulaciones} unidad="postulaciones" />
          )}
        </section>

        <section className={estilosReclutador.tarjeta}>
          <h2 className="font-bold text-marca">Promedio de matching por vacante</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">Afinidad promedio (de 0 a 100) de quienes se postularon.</p>
          {barrasMatching.length === 0 ? (
            <p className="text-sm text-slate-400">Pendiente de análisis</p>
          ) : (
            <GraficoBarras filas={barrasMatching} unidad="de afinidad promedio" maximo={100} />
          )}
        </section>
      </div>
    </div>
  );
}
