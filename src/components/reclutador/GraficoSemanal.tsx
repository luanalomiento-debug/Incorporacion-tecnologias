// Postulaciones recibidas por semana (columnas de un solo color). Es solo lectura.
export function GraficoSemanal({ semanas }: { semanas: { etiqueta: string; valor: number }[] }) {
  const maximo = Math.max(...semanas.map((s) => s.valor), 1);
  return (
    <ul className="flex h-40 items-end gap-2" aria-label="Postulaciones por semana">
      {semanas.map((s) => (
        <li key={s.etiqueta} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1 text-center" title={`${s.etiqueta}: ${s.valor}`}>
          <span className="text-xs font-semibold text-marca">{s.valor}</span>
          <span
            className="block w-full rounded-t-[4px] bg-blue-600"
            style={{ height: s.valor === 0 ? 2 : `${Math.max((s.valor / maximo) * 100, 4)}%` }}
          />
          <span className="truncate text-[10px] text-slate-500">{s.etiqueta}</span>
        </li>
      ))}
    </ul>
  );
}
