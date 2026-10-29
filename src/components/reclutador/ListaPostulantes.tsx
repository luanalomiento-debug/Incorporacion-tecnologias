import { enlaceCorreo } from "@/lib/correo";
import { formatearFecha } from "@/lib/tipos";
import { nombreCompleto, type EstadoCv, type PostulacionDashboard } from "@/lib/dashboard";
import { Icono } from "@/components/postulante/Icono";
import { EstadoAnalisis, MedidorAfinidad, MotivosDeAfinidad } from "@/components/reclutador/Afinidad";
import { SelectorEtapa } from "@/components/reclutador/SelectorEtapa";
import Link from "next/link";
import { estilosReclutador } from "@/components/reclutador/estilos";

// Postulantes de una vacante, con acceso al CV y los campos de IA (todavía vacíos).
export function ListaPostulantes({
  postulaciones,
  titulosVacantes,
  estadosCv,
  mejorId,
  seleccionable = false,
}: {
  postulaciones: PostulacionDashboard[];
  titulosVacantes: Map<string, string>;
  estadosCv: Map<string, EstadoCv>;
  // Id de la postulación con mejor match de esta lista (se marca con una etiqueta).
  mejorId?: string | null;
  // Muestra una casilla «Comparar» en cada fila (la usa el formulario que envuelve la lista).
  seleccionable?: boolean;
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
                {seleccionable && (
                  <input
                    type="checkbox"
                    name="ids"
                    value={p.id}
                    aria-label={`Comparar a ${nombre}`}
                    className="h-4 w-4 shrink-0 rounded border-slate-300"
                  />
                )}
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-acento text-sm font-bold text-white"
                >
                  {iniciales || "?"}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-marca">
                    {nombre}
                    {mejorId === p.id && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                        Mejor match
                      </span>
                    )}
                  </p>
                  {p.postulante && <p className="break-all text-sm text-slate-600">{p.postulante.email}</p>}
                  <p className="text-xs text-slate-500">Se postuló el {formatearFecha(p.creado_en)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/reclutador/postulaciones/${p.id}`} className={`${estilosReclutador.boton} !px-4 !py-2 text-sm`}>
                  Ver ficha
                </Link>
                {p.postulante && (
                  <a
                    href={enlaceCorreo({
                      email: p.postulante.email,
                      nombre: p.postulante.nombre,
                      puesto: titulosVacantes.get(p.vacante_id) ?? "la vacante",
                    })}
                    className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}
                  >
                    <Icono nombre="correo" className="h-4 w-4" /> Enviar correo
                  </a>
                )}
                <a
                  href={`/cv/${p.postulante_id}`}
                  target="_blank"
                  rel="noopener"
                  className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}
                >
                  <Icono nombre="documento" className="h-4 w-4" /> Ver CV
                </a>
              </div>
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
                      <dt className="mb-1 font-medium text-slate-500">Etapa del proceso</dt>
                      <dd>
                        <SelectorEtapa postulacionId={p.id} etapa={p.etapa} etiqueta={false} />
                      </dd>
                    </div>
                  </dl>
                  {p.analisis && <MotivosDeAfinidad motivos={p.analisis} />}
                  {sugerida && (
                    <p className="text-slate-600">
                      La IA sugiere otra vacante para esta persona: <strong className="text-marca">{sugerida}</strong>
                    </p>
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
