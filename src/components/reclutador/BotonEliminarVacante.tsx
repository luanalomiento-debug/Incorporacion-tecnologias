"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { eliminarVacante } from "@/lib/acciones/vacantes";
import { estilos } from "@/components/estilos";
import { estilosReclutador } from "@/components/reclutador/estilos";

// Botón "Eliminar" con una ventana de confirmación. Borrar es definitivo: la ventana explica
// qué se pierde y, si la vacante tiene postulaciones, pide tildar una casilla antes de poder confirmar.
export function BotonEliminarVacante({
  id,
  titulo,
  postulaciones,
  irA,
  claro = false,
}: {
  id: string;
  titulo: string;
  postulaciones: number;
  // A dónde ir después de borrar (por ejemplo, la lista de vacantes). Sin esto, solo se actualiza la pantalla.
  irA?: string;
  claro?: boolean;
}) {
  const router = useRouter();
  const ventana = useRef<HTMLDialogElement>(null);
  const [entiendo, setEntiendo] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");

  const necesitaTilde = postulaciones > 0;

  function abrir() {
    setEntiendo(false);
    setError("");
    ventana.current?.showModal();
  }

  async function confirmar() {
    setEliminando(true);
    setError("");
    const resultado = await eliminarVacante(id);
    if (resultado.error) {
      setError(resultado.error);
      setEliminando(false);
      return;
    }
    ventana.current?.close();
    setEliminando(false);
    if (irA) router.push(irA);
    else router.refresh();
  }

  const estiloBoton = claro
    ? "inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
    : `${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm !text-red-700 hover:!border-red-300 hover:!bg-red-50`;

  return (
    <>
      <button type="button" onClick={abrir} className={estiloBoton}>
        Eliminar
      </button>

      <dialog
        ref={ventana}
        aria-labelledby={`eliminar-${id}`}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/50"
      >
        <div className="space-y-4 p-6">
          <h2 id={`eliminar-${id}`} className="text-lg font-bold text-marca">
            ¿Eliminar esta vacante?
          </h2>
          <p className="font-semibold text-slate-900">{titulo}</p>
          <p className="text-sm text-slate-700">
            Se borra <strong>para siempre</strong> y no se puede deshacer.
            {necesitaTilde
              ? ` También se borran sus ${postulaciones} ${postulaciones === 1 ? "postulación" : "postulaciones"} y las sugerencias de la IA para este puesto. Las personas que se postularon dejan de verla en "Mis postulaciones".`
              : " Como todavía no tiene postulaciones, no se pierde nada más."}
          </p>
          <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Si solo querés que deje de verse, usá <strong>Desactivar</strong>: se puede volver a activar cuando quieras.
          </p>

          {necesitaTilde && (
            <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={entiendo}
                onChange={(e) => setEntiendo(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
              />
              Entiendo que se borran las {postulaciones} {postulaciones === 1 ? "postulación" : "postulaciones"} de esta vacante.
            </label>
          )}

          {error && <p className={estilos.error}>{error}</p>}

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => ventana.current?.close()}
              disabled={eliminando}
              className={estilosReclutador.botonSecundario}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={eliminando || (necesitaTilde && !entiendo)}
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {eliminando ? "Eliminando…" : "Sí, eliminar definitivamente"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
