import Link from "next/link";
import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha } from "@/lib/tipos";
import { Icono } from "@/components/postulante/Icono";
import { estilosPostulante } from "@/components/postulante/estilos";

type Fila = {
  id: string;
  creado_en: string;
  vacante: { id: string; titulo: string; activa: boolean } | null;
};

export default async function MisPostulacionesPage() {
  const perfil = await exigirRol("postulante");
  const supabase = await crearClienteServidor();
  // Un postulante solo ve vacantes activas: si una se cerró, "vacante" llega vacío.
  const { data } = await supabase
    .from("postulaciones")
    .select("id, creado_en, vacante:vacantes!postulaciones_vacante_id_fkey(id, titulo, activa)")
    .eq("postulante_id", perfil.id)
    .order("creado_en", { ascending: false });
  const postulaciones = (data ?? []) as unknown as Fila[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={estilosPostulante.titulo}>Mis postulaciones</h1>
        <p className="mt-1 text-slate-600">Las vacantes a las que ya enviaste tu CV.</p>
      </div>

      {postulaciones.length === 0 ? (
        <div className={`${estilosPostulante.tarjeta} flex flex-col items-center py-12 text-center`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Icono nombre="documento" className="h-7 w-7" />
          </span>
          <p className="mt-4 font-semibold text-marca">Todavía no te postulaste a ninguna vacante</p>
          <p className="mt-1 text-sm text-slate-600">Cuando lo hagas, van a aparecer acá.</p>
          <Link href="/postulante" className={`${estilosPostulante.boton} mt-5`}>
            Ver vacantes
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {postulaciones.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icono nombre="maletin" />
                </span>
                <div className="min-w-0">
                  {p.vacante ? (
                    <Link
                      href={`/postulante/vacantes/${p.vacante.id}`}
                      className="font-bold text-marca hover:text-blue-700 hover:underline"
                    >
                      {p.vacante.titulo}
                    </Link>
                  ) : (
                    <p className="font-bold text-slate-500">Vacante cerrada</p>
                  )}
                  <p className="text-sm text-slate-500">Te postulaste el {formatearFecha(p.creado_en)}</p>
                </div>
              </div>
              <span className={estilosPostulante.etiquetaOk}>
                <Icono nombre="check" className="h-3.5 w-3.5" /> Postulación enviada
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
