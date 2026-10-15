"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reanalizarCv, reanalizarPendientes } from "@/lib/acciones/ia";
import { estilosReclutador } from "@/components/reclutador/estilos";

// Sin `postulanteId`, re-analiza un lote de CVs pendientes; con él, el CV de esa persona.
export function BotonReanalizar({
  postulanteId,
  texto,
  claro = false,
}: {
  postulanteId?: string;
  texto: string;
  claro?: boolean;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");

  async function apretar() {
    setEnviando(true);
    setAviso("");
    const resultado = postulanteId ? await reanalizarCv(postulanteId) : await reanalizarPendientes();
    setEnviando(false);
    setAviso(resultado.error ?? resultado.mensaje ?? "");
    router.refresh();
  }

  const estilo = claro
    ? "inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-marca shadow-sm transition hover:bg-blue-50 disabled:opacity-60"
    : `${estilosReclutador.botonSecundario} !px-3 !py-1.5 text-xs`;

  return (
    <div className="space-y-2">
      <button type="button" onClick={apretar} disabled={enviando} className={estilo}>
        {enviando ? "Enviando…" : texto}
      </button>
      {aviso && <p className={`text-xs ${claro ? "text-blue-100" : "text-slate-600"}`}>{aviso}</p>}
    </div>
  );
}
