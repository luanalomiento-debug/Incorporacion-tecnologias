"use client";

import Link from "next/link";
import { useActionState } from "react";
import { crearVacante } from "@/lib/acciones/vacantes";
import type { EstadoFormulario } from "@/lib/acciones/auth";
import { estilos } from "@/components/estilos";

const CAMPOS = [
  { nombre: "descripcion", etiqueta: "Descripción", ayuda: "¿De qué se trata el puesto?", requerido: true },
  { nombre: "requisitos", etiqueta: "Requisitos", ayuda: "Formación, experiencia, etc. Uno por línea.", requerido: true },
  { nombre: "habilidades", etiqueta: "Habilidades o conocimientos requeridos", ayuda: "Una por línea.", requerido: true },
  { nombre: "informacion_adicional", etiqueta: "Información relevante de la posición", ayuda: "Horario, modalidad, ubicación, beneficios… (opcional)", requerido: false },
];

export default function NuevaVacantePage() {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    crearVacante,
    {},
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/reclutador" className="text-sm text-indigo-600 hover:underline">
          ← Volver al panel
        </Link>
        <h1 className={`${estilos.titulo} mt-2`}>Nueva vacante</h1>
      </div>

      <form action={accion} className={`${estilos.tarjeta} space-y-5`}>
        <div>
          <label htmlFor="titulo" className={estilos.etiqueta}>Nombre del puesto</label>
          <input id="titulo" name="titulo" required className={estilos.input} placeholder="Ej.: Analista de Marketing Digital" />
        </div>

        {CAMPOS.map((c) => (
          <div key={c.nombre}>
            <label htmlFor={c.nombre} className={estilos.etiqueta}>{c.etiqueta}</label>
            <textarea id={c.nombre} name={c.nombre} rows={4} required={c.requerido} className={estilos.input} />
            <p className="mt-1 text-xs text-slate-500">{c.ayuda}</p>
          </div>
        ))}

        <p className="text-sm text-slate-600">La vacante se publica como <strong>activa</strong>. Podés desactivarla cuando quieras.</p>

        {estado.error && <p className={estilos.error}>{estado.error}</p>}

        <button type="submit" disabled={enviando} className={`${estilos.boton} w-full sm:w-auto`}>
          {enviando ? "Publicando…" : "Publicar vacante"}
        </button>
      </form>
    </div>
  );
}
