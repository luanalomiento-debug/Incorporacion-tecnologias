"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarPerfil } from "@/lib/acciones/perfil";
import { estilos } from "@/components/estilos";
import { estilosAcceso } from "@/components/estilos";
import { estilosPostulante } from "@/components/postulante/estilos";

type Props = { nombre: string; apellido: string; email: string; miembroDesde: string };

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{etiqueta}</dt>
      <dd className="mt-1 break-words font-semibold text-marca">{valor || "—"}</dd>
    </div>
  );
}

// Datos personales: se ven así, y con "Editar" se pueden cambiar el nombre y el apellido.
export function DatosPersonales({ nombre, apellido, email, miembroDesde }: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valorNombre, setValorNombre] = useState(nombre);
  const [valorApellido, setValorApellido] = useState(apellido);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  function empezar() {
    setValorNombre(nombre);
    setValorApellido(apellido);
    setError("");
    setExito("");
    setEditando(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    const resultado = await actualizarPerfil(valorNombre, valorApellido);
    setGuardando(false);
    if (resultado.error) {
      setError(resultado.error);
      return;
    }
    setEditando(false);
    setExito("Listo, guardamos tus cambios.");
    router.refresh();
  }

  return (
    <section className={estilosPostulante.tarjeta}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-bold text-marca">Datos personales</h2>
        {!editando && (
          <button type="button" onClick={empezar} className={`${estilosPostulante.botonSecundario} !px-4 !py-2 text-sm`}>
            Editar
          </button>
        )}
      </div>

      {exito && !editando && <p className={`${estilos.exito} mb-4`}>{exito}</p>}

      {editando ? (
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className={estilos.etiqueta}>Nombre</label>
              <input
                id="nombre"
                value={valorNombre}
                onChange={(e) => setValorNombre(e.target.value)}
                maxLength={60}
                autoComplete="given-name"
                required
                className={estilosAcceso.input}
              />
            </div>
            <div>
              <label htmlFor="apellido" className={estilos.etiqueta}>Apellido</label>
              <input
                id="apellido"
                value={valorApellido}
                onChange={(e) => setValorApellido(e.target.value)}
                maxLength={60}
                autoComplete="family-name"
                required
                className={estilosAcceso.input}
              />
            </div>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Dato etiqueta="Email" valor={email} />
            <Dato etiqueta="Miembro desde" valor={miembroDesde} />
          </dl>
          <p className="text-xs text-slate-500">El email no se puede cambiar desde acá.</p>
          {error && <p className={estilos.error}>{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={guardando} className={estilosPostulante.boton}>
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              disabled={guardando}
              className={estilosPostulante.botonSecundario}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <dl className="grid gap-3 sm:grid-cols-2">
          <Dato etiqueta="Nombre" valor={nombre} />
          <Dato etiqueta="Apellido" valor={apellido} />
          <Dato etiqueta="Email" valor={email} />
          <Dato etiqueta="Miembro desde" valor={miembroDesde} />
        </dl>
      )}
    </section>
  );
}
