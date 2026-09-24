import type { Vacante } from "@/lib/tipos";

const SECCIONES: { campo: keyof Vacante; titulo: string }[] = [
  { campo: "descripcion", titulo: "Descripción" },
  { campo: "requisitos", titulo: "Requisitos" },
  { campo: "habilidades", titulo: "Habilidades y conocimientos" },
  { campo: "informacion_adicional", titulo: "Información relevante de la posición" },
];

// Muestra los textos de una vacante, respetando los saltos de línea.
export function DetalleVacante({ vacante }: { vacante: Vacante }) {
  return (
    <div className="space-y-5">
      {SECCIONES.map(({ campo, titulo }) =>
        vacante[campo] ? (
          <section key={campo}>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {titulo}
            </h2>
            <p className="whitespace-pre-line text-slate-800">{String(vacante[campo])}</p>
          </section>
        ) : null,
      )}
    </div>
  );
}

export function EtiquetaEstado({ activa }: { activa: boolean }) {
  return activa ? (
    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
      Activa
    </span>
  ) : (
    <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
      Inactiva
    </span>
  );
}
