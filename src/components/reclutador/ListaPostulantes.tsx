import { formatearFecha } from "@/lib/tipos";
import { nombreCompleto, type EstadoCv, type PostulacionDashboard } from "@/lib/dashboard";
import { Icono } from "@/components/postulante/Icono";
import { EstadoAnalisis, MedidorAfinidad, MotivosDeAfinidad } from "@/components/reclutador/Afinidad";
import { BotonReanalizar } from "@/components/reclutador/BotonReanalizar";
import { estilosReclutador } from "@/components/reclutador/estilos";

// Postulantes de una vacante, con acceso al CV y los campos de IA (todavía vacíos).
export function ListaPostulantes({
  postulaciones,
  titulosVacantes,
  estadosCv,
}: {
  postulaciones: PostulacionDashboard[];
  titulosVacantes: Map<string, string>;
  estadosCv: Map<string, EstadoCv>;
}) {
  return (
    <ul className="divide-y divide-slate-100">
      {postulaciones.map((p) => {
        const nombre = nombreCompleto(p.postulante);
        const iniciales = nombre
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((x) => x.charAt(0))
          .join("")
          .toUpperCase();
        return (
          <li key={p.id} className="space-y-3 py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-acento text-sm font-bold text-white"
                >
                  {iniciales || "?"}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-marca">{nombre}</p>
                  {p.postulante && <p className="break-all text-sm text-slate-600">{p.postulante.email}</p>}
                  <p className="text-xs text-slate-500">Se postuló el {formatearFecha(p.creado_en)}</p>
                </div>
              </div>
              <a
                href={`/cv/${p.postulante_id}`}
                target="_blank"
                rel="noopener"
                className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}
              >
                <Icono nombre="documento" className="h-4 w-4" /> Ver CV
              </a>
            </div>
            {(() => {
              const estado = estadosCv.get(p.postulante_id);
              const sugerida = p.vacante_sugerida_id ? (titulosVacantes.get(p.vacante_sugerida_id) ?? "—") : null;
              return (
                <div className="space-y-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="mb-1 font-medium text-slate-500">Afinidad con este puesto</dt>
                      <dd>{p.afinidad === null ? <EstadoAnalisis estado={estado} /> : <MedidorAfinidad valor={Number(p.afinidad)} />}</dd>
                    </div>
                    <div>
                      <dt className="mb-1 font-medium text-slate-500">Otra vacante sugerida</dt>
                      <dd>
                        {sugerida ? (
                          <span className="font-semibold text-marca">{sugerida}</span>
                        ) : p.afinidad === null ? (
                          <span className="text-slate-400">Pendiente de análisis</span>
                        ) : (
                          <span className="text-slate-600">Ninguna: este puesto es de los que mejor encajan</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                  {p.analisis && <MotivosDeAfinidad motivos={p.analisis} />}
                  {estado !== "analizando" && (
                    <BotonReanalizar postulanteId={p.postulante_id} texto={p.afinidad === null ? "Analizar este CV" : "Re-analizar este CV"} />
                  )}
                </div>
              );
            })()}
          </li>
        );
      })}
    </ul>
  );
}
