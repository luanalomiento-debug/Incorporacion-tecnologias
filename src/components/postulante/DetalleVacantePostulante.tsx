import type { Vacante } from "@/lib/tipos";
import { Icono, type NombreIcono } from "@/components/postulante/Icono";

const SECCIONES: { campo: keyof Vacante; titulo: string; icono: NombreIcono; chips?: boolean }[] = [
  { campo: "descripcion", titulo: "Descripción", icono: "texto" },
  { campo: "requisitos", titulo: "Requisitos", icono: "lista" },
  { campo: "habilidades", titulo: "Habilidades y conocimientos", icono: "rayo", chips: true },
  { campo: "informacion_adicional", titulo: "Información relevante de la posición", icono: "info" },
];

// Si el texto es una lista corta de habilidades, se muestra como etiquetas;
// si son oraciones largas, queda como párrafo.
function comoEtiquetas(texto: string): string[] | null {
  const partes = texto
    .split(/[\n,;]+/)
    .map((p) => p.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
  return partes.length >= 2 && partes.every((p) => p.length <= 40) ? partes : null;
}

export function DetalleVacantePostulante({ vacante }: { vacante: Vacante }) {
  return (
    <div className="space-y-4">
      {SECCIONES.map(({ campo, titulo, icono, chips }) => {
        const valor = String(vacante[campo] ?? "");
        if (!valor) return null;
        const etiquetas = chips ? comoEtiquetas(valor) : null;
        return (
          <section key={campo} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-3 text-lg font-bold text-marca">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icono nombre={icono} className="h-5 w-5" />
              </span>
              {titulo}
            </h2>
            {etiquetas ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {etiquetas.map((e) => (
                  <li key={e} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800">
                    {e}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 whitespace-pre-line text-slate-700">{valor}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
