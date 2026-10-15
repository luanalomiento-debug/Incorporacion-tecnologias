"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Dos grupos: lo que se OPERA día a día (vacantes y postulaciones) y lo ESTRATÉGICO (dashboard).
const GRUPOS = [
  [
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
      href: "/reclutador/postulaciones",
      texto: "Postulaciones",
      activo: (r: string) => r.startsWith("/reclutador/postulaciones") || r.endsWith("/postulaciones"),
    },
  ],
  [{ href: "/reclutador/dashboard", texto: "Dashboard", activo: (r: string) => r.startsWith("/reclutador/dashboard") }],
];

// Menú con la sección actual resaltada.
export function NavReclutador() {
  const ruta = usePathname();
  return (
    <nav aria-label="Secciones" className="flex flex-wrap items-center gap-1 pb-3">
      {GRUPOS.map((grupo, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1">
          {i > 0 && <span aria-hidden className="mx-2 hidden h-5 w-px bg-slate-300 sm:block" />}
          {grupo.map((e) => {
            const activo = e.activo(ruta);
            return (
              <Link
                key={e.href}
                href={e.href}
                aria-current={activo ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-semibold transition sm:px-4 sm:text-sm ${
                  activo ? "bg-marca text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-marca"
                }`}
              >
                {e.texto}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
