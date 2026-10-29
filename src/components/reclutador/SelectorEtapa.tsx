"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cambiarEtapa } from "@/lib/acciones/seguimiento";
import { ETAPAS, datosEtapa } from "@/lib/etapas";

// Cambia la etapa de un candidato con un clic.
export function SelectorEtapa({ postulacionId, etapa, etiqueta = true }: { postulacionId: string; etapa: string; etiqueta?: boolean }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const actual = datosEtapa(etapa);

  async function cambiar(nueva: string) {
    setGuardando(true);
    setError("");
    const r = await cambiarEtapa(postulacionId, nueva);
    setGuardando(false);
    if (r.error) setError(r.error);
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm">
        {etiqueta && <span className="font-medium text-slate-500">Etapa</span>}
        <select
          value={etapa}
          disabled={guardando}
          onChange={(e) => cambiar(e.target.value)}
          aria-label="Etapa del candidato"
          className={`selector rounded-full border-0 py-1.5 pl-3 text-xs font-semibold ring-1 ring-inset ring-slate-200 disabled:opacity-60 ${actual.clases}`}
        >
          {ETAPAS.map((e) => (
            <option key={e.valor} value={e.valor}>
              {e.texto}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
