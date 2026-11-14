"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { estadoAnalisis, reanalizarPendientes } from "@/lib/acciones/ia";
import { estilosReclutador } from "@/components/reclutador/estilos";

const CADA_MS = 4000; // cada cuánto se consulta el avance
const ESPERA_MAXIMA_MS = 3 * 60 * 1000; // pasado este tiempo se deja de esperar y se avisa

type Seguimiento = { lote: string[]; desde: string; iniciado: number };

// Analiza los CVs pendientes (sin analizar, con error o sin comparar con alguna vacante abierta).
// Después de pedir el análisis, muestra el avance y avisa cuando termina.
export function BotonReanalizar({ texto, claro = false, grande = false }: { texto: string; claro?: boolean; grande?: boolean }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [seguimiento, setSeguimiento] = useState<Seguimiento | null>(null);
  const [avance, setAvance] = useState<{ terminados: number; total: number } | null>(null);

  async function apretar() {
    setEnviando(true);
    setAviso("");
    setAvance(null);
    const resultado = await reanalizarPendientes();
    setEnviando(false);
    setAviso(resultado.error ?? resultado.mensaje ?? "");
    if (resultado.lote && resultado.lote.length > 0 && resultado.desde) {
      setAvance({ terminados: 0, total: resultado.lote.length });
      setSeguimiento({ lote: resultado.lote, desde: resultado.desde, iniciado: Date.now() });
    }
    router.refresh();
  }

  // Mientras hay un análisis en marcha, consulta cuántos CVs ya terminaron.
  useEffect(() => {
    if (!seguimiento) return;
    let activo = true;
    let consultando = false;

    const id = setInterval(async () => {
      if (consultando) return;
      consultando = true;
      try {
        const estado = await estadoAnalisis(seguimiento.lote, seguimiento.desde);
        if (!activo) return;
        if (estado.error) {
          setSeguimiento(null);
          setAvance(null);
          return;
        }
        setAvance({ terminados: estado.terminados, total: estado.total });
        if (estado.terminados >= estado.total) {
          setSeguimiento(null);
          setAviso(
            estado.total === 1
              ? "Análisis terminado. Ya está el resultado."
              : `Análisis terminado: ${estado.total} CVs analizados.`,
          );
          router.refresh();
        } else if (Date.now() - seguimiento.iniciado > ESPERA_MAXIMA_MS) {
          setSeguimiento(null);
          setAviso(
            `Terminaron ${estado.terminados} de ${estado.total}. El resto sigue en proceso o falló: actualizá la página en un rato.`,
          );
          router.refresh();
        }
      } catch {
        // Si falla una consulta puntual (por ejemplo, sin conexión), se reintenta en la próxima vuelta.
      } finally {
        consultando = false;
      }
    }, CADA_MS);

    return () => {
      activo = false;
      clearInterval(id);
    };
  }, [seguimiento, router]);

  const analizando = seguimiento !== null;
  const estilo = claro
    ? "inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-marca shadow-sm transition hover:bg-blue-50 disabled:opacity-60"
    : `${estilosReclutador.botonSecundario} ${grande ? "!px-4 !py-2 text-sm" : "!px-3 !py-1.5 text-xs"}`;
  const textoAviso = analizando && avance ? `Analizando… ${avance.terminados} de ${avance.total}` : aviso;

  return (
    <div className="space-y-2">
      <button type="button" onClick={apretar} disabled={enviando || analizando} className={estilo}>
        {enviando ? "Enviando…" : analizando ? "Analizando…" : texto}
      </button>
      {textoAviso && (
        <p role="status" aria-live="polite" className={`text-xs ${claro ? "text-blue-100" : "text-slate-600"}`}>
          {textoAviso}
        </p>
      )}
    </div>
  );
}
