import Link from "next/link";
import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha } from "@/lib/tipos";
import { estilos } from "@/components/estilos";

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
      <h1 className={estilos.titulo}>Mis postulaciones</h1>

      {postulaciones.length === 0 ? (
        <p className={`${estilos.tarjeta} text-slate-600`}>
          Todavía no te postulaste a ninguna vacante.{" "}
          <Link href="/postulante" className="font-semibold text-indigo-600 hover:underline">
            Ver vacantes
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {postulaciones.map((p) => (
            <li key={p.id} className={`${estilos.tarjeta} flex flex-wrap items-center justify-between gap-3`}>
              <div className="min-w-0">
                {p.vacante ? (
                  <Link
                    href={`/postulante/vacantes/${p.vacante.id}`}
                    className="font-semibold text-slate-900 hover:text-indigo-700 hover:underline"
                  >
                    {p.vacante.titulo}
                  </Link>
                ) : (
                  <p className="font-semibold text-slate-700">Vacante cerrada</p>
                )}
                <p className="mt-1 text-sm text-slate-500">Te postulaste el {formatearFecha(p.creado_en)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
