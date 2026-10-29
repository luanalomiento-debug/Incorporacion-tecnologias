"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { agregarNota, eliminarNota } from "@/lib/acciones/seguimiento";
import { estilosReclutador } from "@/components/reclutador/estilos";

export type NotaVista = { id: string; texto: string; fecha: string; autor: string; propia: boolean };

export function NotasPostulacion({ postulacionId, notas }: { postulacionId: string; notas: NotaVista[] }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    const r = await agregarNota(postulacionId, texto);
    setEnviando(false);
    if (r.error) return setError(r.error);
    setTexto("");
    router.refresh();
  }

  async function borrar(id: string) {
    const r = await eliminarNota(id);
    if (r.error) setError(r.error);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={guardar} className="space-y-2">
        <label htmlFor="nota" className="sr-only">
          Nueva nota
        </label>
        <textarea
          id="nota"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Observaciones de la entrevista, acuerdos, próximos pasos…"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={enviando || !texto.trim()} className={`${estilosReclutador.boton} !px-4 !py-2 text-sm`}>
          {enviando ? "Guardando…" : "Guardar nota"}
        </button>
      </form>
      {notas.length === 0 ? (
        <p className="text-sm text-slate-500">Todavía no hay notas. Solo las ve el equipo de selección, nunca la persona.</p>
      ) : (
        <ul className="space-y-3">
          {notas.map((n) => (
            <li key={n.id} className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <p className="whitespace-pre-wrap text-slate-800">{n.texto}</p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {n.autor} · {n.fecha}
                {n.propia && (
                  <button type="button" onClick={() => borrar(n.id)} className="font-semibold text-red-700 hover:underline">
                    Borrar
                  </button>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
