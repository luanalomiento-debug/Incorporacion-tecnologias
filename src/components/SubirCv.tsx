"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { registrarCv } from "@/lib/acciones/cv";
import { rutaCv, TAMANO_MAXIMO_CV } from "@/lib/tipos";
import { estilos } from "@/components/estilos";

// El PDF se sube directo del navegador a Storage (las políticas del bucket
// solo permiten escribir en la carpeta del propio usuario) y después se
// registra en la base de datos con una server action.
export function SubirCv({ postulanteId, tieneCv }: { postulanteId: string; tieneCv: boolean }) {
  const router = useRouter();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setExito("");
    const f = e.target.files?.[0] ?? null;
    if (f && f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("El archivo tiene que ser un PDF.");
      setArchivo(null);
      return;
    }
    if (f && f.size > TAMANO_MAXIMO_CV) {
      setError("El archivo pesa más de 5 MB. Probá con uno más liviano.");
      setArchivo(null);
      return;
    }
    setArchivo(f);
  }

  async function subir(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) return;
    setSubiendo(true);
    setError("");
    setExito("");

    const supabase = crearClienteNavegador();
    const { error: errorSubida } = await supabase.storage
      .from("cvs")
      .upload(rutaCv(postulanteId), archivo, {
        upsert: true,
        contentType: "application/pdf",
      });

    if (errorSubida) {
      setError("No se pudo subir el archivo. Revisá que sea un PDF de hasta 5 MB.");
      setSubiendo(false);
      return;
    }

    const resultado = await registrarCv(archivo.name);
    setSubiendo(false);
    if (resultado.error) {
      setError(resultado.error);
      return;
    }
    setArchivo(null);
    (e.target as HTMLFormElement).reset();
    setExito(tieneCv ? "¡Listo! Reemplazaste tu CV." : "¡Listo! Tu CV quedó guardado.");
    router.refresh();
  }

  return (
    <form onSubmit={subir} className="space-y-4">
      <div>
        <label htmlFor="cv" className={estilos.etiqueta}>
          {tieneCv ? "Subir un CV nuevo (reemplaza al actual)" : "Elegí tu CV"}
        </label>
        <input
          id="cv"
          type="file"
          accept="application/pdf,.pdf"
          onChange={elegir}
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <p className="mt-1 text-xs text-slate-500">Solo PDF, hasta 5 MB.</p>
      </div>
      {error && <p className={estilos.error}>{error}</p>}
      {exito && <p className={estilos.exito}>{exito}</p>}
      <button type="submit" disabled={!archivo || subiendo} className={`${estilos.boton} w-full sm:w-auto`}>
        {subiendo ? "Subiendo…" : tieneCv ? "Reemplazar CV" : "Guardar CV"}
      </button>
    </form>
  );
}
