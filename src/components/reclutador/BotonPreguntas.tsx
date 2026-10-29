"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generarPreguntas } from "@/lib/acciones/seguimiento";
import { estilosReclutador } from "@/components/reclutador/estilos";

export function BotonPreguntas({ postulacionId, hayPreguntas }: { postulacionId: string; hayPreguntas: boolean }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function apretar() {
    setEnviando(true);
    setError("");
    const r = await generarPreguntas(postulacionId);
    setEnviando(false);
    if (r.error) setError(r.error);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={apretar} disabled={enviando} className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}>
        {enviando ? "La IA está pensando las preguntas… (puede tardar unos segundos)" : hayPreguntas ? "Generar otras preguntas" : "Generar preguntas de entrevista"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
