import { cerrarSesion } from "@/lib/acciones/auth";
import type { Perfil } from "@/lib/auth";
import { LogoEmpresa } from "@/components/LogoEmpresa";
import { NavReclutador } from "@/components/reclutador/NavReclutador";

// Barra de arriba: logo a la izquierda; nombre y "Cerrar sesión" a la derecha.
export function EncabezadoReclutador({ perfil }: { perfil: Perfil }) {
  const iniciales = `${perfil.nombre.charAt(0)}${perfil.apellido.charAt(0)}`.toUpperCase();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="px-4 sm:px-8">
        <div className="flex items-center justify-between gap-3 py-3">
          <LogoEmpresa />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-acento text-sm font-bold text-white"
              >
                {iniciales || "?"}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-marca">
                  {perfil.nombre} {perfil.apellido}
                </p>
                <p className="text-xs text-slate-500">Reclutador/a</p>
              </div>
            </div>
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-marca"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
        <NavReclutador />
      </div>
    </header>
  );
}
