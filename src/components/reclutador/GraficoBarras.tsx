import Link from "next/link";

export type FilaGrafico = { id: string; etiqueta: string; valor: number; href: string };

// Barras horizontales de un solo color: cuántas postulaciones tiene cada vacante.
// Cada fila es un enlace al dashboard de esa vacante.
export function GraficoBarras({ filas, unidad }: { filas: FilaGrafico[]; unidad: string }) {
  const maximo = Math.max(...filas.map((f) => f.valor), 1);
  return (
    <ul className="space-y-1">
      {filas.map((f) => (
        <li key={f.id}>
          <Link
            href={f.href}
            title={`${f.etiqueta}: ${f.valor} ${unidad}`}
            className="group grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-blue-50 sm:grid-cols-[minmax(0,14rem)_1fr]"
          >
            <span className="truncate text-sm text-slate-700">{f.etiqueta}</span>
            <span className="flex items-center gap-3">
              <span className="h-5 flex-1">
                <span
                  className="block h-5 rounded-r-[4px] bg-blue-600 transition group-hover:bg-blue-700"
                  style={{ width: `${Math.max((f.valor / maximo) * 100, 2)}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-right text-sm font-semibold text-marca">{f.valor}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
