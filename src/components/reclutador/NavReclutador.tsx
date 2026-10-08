"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES = [
  {
    href: "/reclutador",
    texto: "Vacantes",
    activo: (r: string) =>
      (r === "/reclutador" || r.startsWith("/reclutador/vacantes")) &&
      r !== "/reclutador/vacantes/nueva" &&
      !r.endsWith("/postulaciones"),
  },
  { href: "/reclutador/vacantes/nueva", texto: "Nueva vacante", activo: (r: string) => r === "/reclutador/vacantes/nueva" },
  {
    href: "/reclutador/dashboard",
    texto: "Dashboard",
    activo: (r: string) => r.startsWith("/reclutador/dashboard") || r.endsWith("/postulaciones"),
  },
];

// Menú con la sección actual resaltada.
export function NavReclutador() {
  const ruta = usePathname();
  return (
    <nav aria-label="Secciones" className="flex gap-1 overflow-x-auto pb-3">
      {ENLACES.map((e) => {
        const activo = e.activo(ruta);
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              activo ? "bg-marca text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-marca"
            }`}
          >
            {e.texto}
          </Link>
        );
      })}
    </nav>
  );
}
