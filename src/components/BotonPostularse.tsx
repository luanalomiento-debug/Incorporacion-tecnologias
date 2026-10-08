"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postularse } from "@/lib/acciones/postulaciones";
import { estilos } from "@/components/estilos";
import { estilosPostulante } from "@/components/postulante/estilos";

export function BotonPostularse({ vacanteId }: { vacanteId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar() {
    setEnviando(true);
    setError("");
    const resultado = await postularse(vacanteId);
    setEnviando(false);
    if (resultado.error) {
      setError(resultado.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <p className={estilos.error}>{error}</p>}
      <button type="button" onClick={enviar} disabled={enviando} className={`${estilosPostulante.boton} w-full`}>
        {enviando ? "Enviando…" : "Postularme con mi CV"}
      </button>
    </div>
  );
}
