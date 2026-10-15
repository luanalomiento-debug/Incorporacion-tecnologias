import type { EstadoCv } from "@/lib/dashboard";
import type { MotivosAfinidad } from "@/lib/ia/esquema";

// Número de 0 a 100 con una barra (un solo color: es una sola medida).
export function MedidorAfinidad({ valor }: { valor: number }) {
  const v = Math.min(100, Math.max(0, Math.round(valor)));
  return (
    <div className="flex items-center gap-3" aria-label={`Afinidad ${v} de 100`}>
      <span className="text-lg font-bold text-marca">{v}</span>
      <span className="-ml-2 text-xs text-slate-500">/100</span>
      <span className="h-2 w-24 rounded-full bg-slate-200">
        <span className="block h-2 rounded-full bg-blue-600" style={{ width: `${v}%` }} />
      </span>
    </div>
  );
}

// Qué decir cuando todavía no hay afinidad.
export function EstadoAnalisis({ estado }: { estado: EstadoCv | undefined }) {
  if (estado === "analizando")
    return (
      <span className="inline-flex items-center gap-2 text-blue-700">
        <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-blue-600" /> Analizando…
      </span>
    );
  if (estado === "error") return <span className="text-slate-600">No se pudo analizar este CV</span>;
  return <span className="text-slate-400">Pendiente de análisis</span>;
}

// Los motivos: qué coincide con el puesto, qué falta, y la conclusión.
export function MotivosDeAfinidad({ motivos }: { motivos: MotivosAfinidad }) {
  return (
    <details className="group rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
      <summary className="cursor-pointer text-sm font-semibold text-blue-700 marker:text-blue-700">
        Ver los motivos
      </summary>
      <div className="mt-3 space-y-3 text-sm text-slate-700">
        {motivos.conclusion && <p>{motivos.conclusion}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="font-semibold text-marca">Coincide</p>
            {motivos.coincide.length === 0 ? (
              <p className="text-slate-400">—</p>
            ) : (
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {motivos.coincide.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="font-semibold text-marca">Falta</p>
            {motivos.falta.length === 0 ? (
              <p className="text-slate-400">—</p>
            ) : (
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {motivos.falta.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500">
          La IA orienta, no decide: esta evaluación la tiene que revisar una persona.
        </p>
      </div>
    </details>
  );
}
