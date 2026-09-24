import Link from "next/link";
import { cerrarSesion } from "@/lib/acciones/auth";
import type { Perfil } from "@/lib/auth";

export type EnlaceMenu = { href: string; texto: string };

export function Encabezado({
  perfil,
  enlaces,
}: {
  perfil: Perfil;
  enlaces: EnlaceMenu[];
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Portal de Reclutamiento</p>
          <p className="text-xs text-slate-500">
            {perfil.nombre} {perfil.apellido} ·{" "}
            {perfil.rol === "reclutador" ? "Reclutador/a" : "Postulante"}
          </p>
        </div>
        <form action={cerrarSesion}>
          <button type="submit" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Cerrar sesión
          </button>
        </form>
        {enlaces.length > 0 && (
          <nav className="flex w-full gap-1 overflow-x-auto">
            {enlaces.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {e.texto}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
