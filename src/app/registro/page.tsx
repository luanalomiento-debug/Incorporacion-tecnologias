"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registrarse, type EstadoFormulario } from "@/lib/acciones/auth";
import { TarjetaAcceso } from "@/components/TarjetaAcceso";
import { estilos, estilosAcceso } from "@/components/estilos";

export default function RegistroPage() {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    registrarse,
    {},
  );

  return (
    <TarjetaAcceso
      titulo="Crear cuenta"
      subtitulo="Registrate para ver las vacantes y postularte."
    >
      {estado.mensaje ? (
        <p className={estilos.exito}>{estado.mensaje}</p>
      ) : (
        <form action={accion} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className={estilos.etiqueta}>Nombre</label>
              <input id="nombre" name="nombre" autoComplete="given-name" required className={estilosAcceso.input} />
            </div>
            <div>
              <label htmlFor="apellido" className={estilos.etiqueta}>Apellido</label>
              <input id="apellido" name="apellido" autoComplete="family-name" required className={estilosAcceso.input} />
            </div>
          </div>
          <div>
            <label htmlFor="email" className={estilos.etiqueta}>Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className={estilosAcceso.input} />
          </div>
          <div>
            <label htmlFor="password" className={estilos.etiqueta}>Contraseña</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required className={estilosAcceso.input} />
            <p className="mt-1 text-xs text-slate-500">Mínimo 6 caracteres.</p>
          </div>
          {estado.error && <p className={estilos.error}>{estado.error}</p>}
          <button type="submit" disabled={enviando} className={estilosAcceso.boton}>
            {enviando ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-slate-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className={estilosAcceso.enlace}>
          Iniciá sesión
        </Link>
      </p>
    </TarjetaAcceso>
  );
}
