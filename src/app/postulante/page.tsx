import Link from "next/link";
import { exigirRol } from "@/lib/auth";
import { EMPRESA } from "@/lib/empresa";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COLUMNAS_VACANTE, type Vacante } from "@/lib/tipos";
import { Icono } from "@/components/postulante/Icono";
import { TarjetaVacante } from "@/components/postulante/TarjetaVacante";
import { estilosPostulante } from "@/components/postulante/estilos";

export default async function VacantesPostulantePage() {
  const perfil = await exigirRol("postulante");
  const supabase = await crearClienteServidor();

  // RLS ya filtra las inactivas; el filtro explícito deja clara la intención.
  const [{ data }, { data: postulaciones }, { data: cv }] = await Promise.all([
    supabase
      .from("vacantes")
      .select(COLUMNAS_VACANTE)
      .eq("activa", true)
      .order("creado_en", { ascending: false }),
    supabase.from("postulaciones").select("vacante_id").eq("postulante_id", perfil.id),
    supabase.from("cvs").select("id").eq("postulante_id", perfil.id).maybeSingle(),
  ]);
  const vacantes = (data ?? []) as Vacante[];
  const postuladas = new Set((postulaciones ?? []).map((p) => p.vacante_id));

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-marca via-blue-900 to-blue-600 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/30 blur-2xl" />
        <div aria-hidden className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-green-400/20 blur-3xl" />
        <div className="relative max-w-xl">
          <h1 className="text-2xl font-bold sm:text-3xl">Hola, {perfil.nombre}</h1>
          <p className="mt-2 text-blue-100">
            Estas son las vacantes abiertas en {EMPRESA}. Elegí la que más te interese y postulate.
          </p>
          <div className="mt-5">
            {cv ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold backdrop-blur">
                <Icono nombre="check" className="h-4 w-4" /> CV cargado, ya podés postularte
              </span>
            ) : (
              <Link
                href="/postulante/perfil#cv"
                className="inline-flex items-center gap-2 rounded-xl bg-acento px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-acento-oscuro"
              >
                <Icono nombre="subir" className="h-4 w-4" /> Subí tu CV para poder postularte
              </Link>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-xl font-bold text-marca">Vacantes abiertas</h2>
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-semibold text-blue-800">
            {vacantes.length}
          </span>
        </div>

        {vacantes.length === 0 ? (
          <div className={`${estilosPostulante.tarjeta} flex flex-col items-center py-12 text-center`}>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Icono nombre="maletin" className="h-7 w-7" />
            </span>
            <p className="mt-4 font-semibold text-marca">No hay vacantes abiertas en este momento</p>
            <p className="mt-1 text-sm text-slate-600">¡Volvé a revisar pronto!</p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vacantes.map((v) => (
              <li key={v.id}>
                <TarjetaVacante vacante={v} postulado={postuladas.has(v.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
