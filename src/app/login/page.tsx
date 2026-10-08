"use client";

import Link from "next/link";
import { useActionState } from "react";
import { iniciarSesion, type EstadoFormulario } from "@/lib/acciones/auth";
import { TarjetaAcceso } from "@/components/TarjetaAcceso";
import { estilos, estilosAcceso } from "@/components/estilos";

export default function LoginPage() {
  const [estado, accion, enviando] = useActionState<EstadoFormulario, FormData>(
    iniciarSesion,
    {},
  );

  return (
    <TarjetaAcceso titulo="Iniciar sesión" subtitulo="Ingresá con tu email y contraseña.">
      <form action={accion} className="space-y-4">
        <div>
          <label htmlFor="email" className={estilos.etiqueta}>Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className={estilosAcceso.input} />
        </div>
        <div>
          <label htmlFor="password" className={estilos.etiqueta}>Contraseña</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={estilosAcceso.input} />
        </div>
        {estado.error && <p className={estilos.error}>{estado.error}</p>}
        <button type="submit" disabled={enviando} className={estilosAcceso.boton}>
          {enviando ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className={estilosAcceso.enlace}>
          Registrate
        </Link>
      </p>
    </TarjetaAcceso>
  );
}
