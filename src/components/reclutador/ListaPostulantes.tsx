import { formatearFecha } from "@/lib/tipos";
import { nombreCompleto, type PostulacionDashboard } from "@/lib/dashboard";
import { Icono } from "@/components/postulante/Icono";
import { estilosReclutador } from "@/components/reclutador/estilos";

function Pendiente() {
  return <span className="text-slate-400">Pendiente de análisis</span>;
}

// Postulantes de una vacante, con acceso al CV y los campos de IA (todavía vacíos).
export function ListaPostulantes({
  postulaciones,
  titulosVacantes,
}: {
  postulaciones: PostulacionDashboard[];
  titulosVacantes: Map<string, string>;
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
            <dl className="grid gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-medium text-slate-500">Afinidad</dt>
                <dd>{p.afinidad === null ? <Pendiente /> : p.afinidad}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Análisis</dt>
                <dd>{p.analisis === null ? <Pendiente /> : "Disponible"}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Vacante sugerida</dt>
                <dd>
                  {p.vacante_sugerida_id === null ? (
                    <Pendiente />
                  ) : (
                    (titulosVacantes.get(p.vacante_sugerida_id) ?? "—")
                  )}
                </dd>
              </div>
            </dl>
          </li>
        );
      })}
    </ul>
  );
}
