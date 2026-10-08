"use client";

import { useActionState } from "react";
import type { EstadoFormulario } from "@/lib/acciones/auth";
import type { Vacante } from "@/lib/tipos";
import { estilos, estilosAcceso } from "@/components/estilos";
import { estilosReclutador } from "@/components/reclutador/estilos";

const CAMPOS = [
  { nombre: "descripcion", etiqueta: "Descripción", ayuda: "¿De qué se trata el puesto?", requerido: true },
  { nombre: "requisitos", etiqueta: "Requisitos", ayuda: "Formación, experiencia, etc. Uno por línea.", requerido: true },
  { nombre: "habilidades", etiqueta: "Habilidades o conocimientos requeridos", ayuda: "Una por línea.", requerido: true },
  { nombre: "informacion_adicional", etiqueta: "Información relevante de la posición", ayuda: "Horario, modalidad, ubicación, beneficios… (opcional)", requerido: false },
] as const;

// Formulario de una vacante. Sirve para crear una nueva (sin `vacante`) y para
// editar una existente (con `vacante`, que llena los campos).
export function FormularioVacante({
  accion,
  vacante,
  textoBoton,
  textoEnviando,
}: {
  accion: (previo: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  vacante?: Vacante;
  textoBoton: string;
  textoEnviando: string;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoFormulario, FormData>(accion, {});

  return (
    <form action={enviar} className={`${estilosReclutador.tarjeta} space-y-5`}>
      <div>
        <label htmlFor="titulo" className={estilos.etiqueta}>Nombre del puesto</label>
        <input
          id="titulo"
          name="titulo"
          required
          defaultValue={vacante?.titulo}
          className={estilosAcceso.input}
          placeholder="Ej.: Analista de Marketing Digital"
        />
      </div>

      {CAMPOS.map((c) => (
        <div key={c.nombre}>
          <label htmlFor={c.nombre} className={estilos.etiqueta}>{c.etiqueta}</label>
          <textarea
            id={c.nombre}
            name={c.nombre}
            rows={4}
            required={c.requerido}
            defaultValue={vacante?.[c.nombre]}
            className={estilosAcceso.input}
          />
          <p className="mt-1 text-xs text-slate-500">{c.ayuda}</p>
        </div>
      ))}

      {!vacante && (
        <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
          La vacante se publica como <strong>activa</strong>. Podés desactivarla cuando quieras.
        </p>
      )}

      {estado.error && <p className={estilos.error}>{estado.error}</p>}

      <button type="submit" disabled={enviando} className={`${estilosReclutador.boton} w-full sm:w-auto`}>
        {enviando ? textoEnviando : textoBoton}
      </button>
    </form>
  );
}
