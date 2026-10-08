"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { registrarCv } from "@/lib/acciones/cv";
import { rutaCv, TAMANO_MAXIMO_CV } from "@/lib/tipos";
import { estilos } from "@/components/estilos";
import { Icono } from "@/components/postulante/Icono";
import { estilosPostulante } from "@/components/postulante/estilos";

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
      <p className="font-bold text-marca">{tieneCv ? "Subir un CV nuevo (reemplaza al actual)" : "Subí tu CV"}</p>
      <label
        htmlFor="cv"
        className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-6 py-8 text-center transition hover:border-acento hover:bg-green-50/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-green-300"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
          <Icono nombre="subir" className="h-6 w-6" />
        </span>
        <span className="font-semibold text-marca">
          {archivo ? archivo.name : "Tocá acá para elegir tu PDF"}
        </span>
        <span className="text-xs text-slate-500">Solo PDF, hasta 5 MB.</span>
        <input id="cv" type="file" accept="application/pdf,.pdf" onChange={elegir} className="sr-only" />
      </label>
      {error && <p className={estilos.error}>{error}</p>}
      {exito && <p className={estilos.exito}>{exito}</p>}
      <button type="submit" disabled={!archivo || subiendo} className={`${estilosPostulante.boton} w-full sm:w-auto`}>
        {subiendo ? "Subiendo…" : tieneCv ? "Reemplazar CV" : "Guardar CV"}
      </button>
    </form>
  );
}
