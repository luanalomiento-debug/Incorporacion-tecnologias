import Link from "next/link";
import { cerrarSesion } from "@/lib/acciones/auth";
import type { Perfil } from "@/lib/auth";
import { LogoEmpresa } from "@/components/LogoEmpresa";
import { NavPostulante } from "@/components/postulante/NavPostulante";

// Barra de arriba: el logo pegado a la izquierda; el nombre (que lleva al
// perfil) y "Cerrar sesión" pegados a la derecha.
export function EncabezadoPostulante({ perfil }: { perfil: Perfil }) {
  const iniciales = `${perfil.nombre.charAt(0)}${perfil.apellido.charAt(0)}`.toUpperCase();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="px-4 sm:px-8">
        <div className="flex items-center justify-between gap-3 py-3">
          <LogoEmpresa />
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/postulante/perfil"
              aria-label="Ver mi perfil"
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition hover:bg-blue-50 sm:pr-3"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-acento text-sm font-bold text-white"
              >
                {iniciales || "?"}
              </span>
              <span className="hidden text-sm font-semibold text-marca sm:block">
                {perfil.nombre} {perfil.apellido}
              </span>
            </Link>
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
        <NavPostulante />
      </div>
    </header>
  );
}
