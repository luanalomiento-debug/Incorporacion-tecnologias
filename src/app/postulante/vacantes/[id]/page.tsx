import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COLUMNAS_VACANTE, formatearFecha, type Vacante } from "@/lib/tipos";
import { BotonPostularse } from "@/components/BotonPostularse";
import { DetalleVacantePostulante } from "@/components/postulante/DetalleVacantePostulante";
import { Icono } from "@/components/postulante/Icono";
import { estilosPostulante } from "@/components/postulante/estilos";

export default async function VacantePostulantePage({
  params,
}: PageProps<"/postulante/vacantes/[id]">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data: vacante } = await supabase
    .from("vacantes")
    .select(COLUMNAS_VACANTE)
    .eq("id", id)
    .eq("activa", true)
    .maybeSingle<Vacante>();

  if (!vacante) notFound();

  const perfil = await exigirRol("postulante");
  const [{ data: postulacion }, { data: cv }] = await Promise.all([
    supabase
      .from("postulaciones")
      .select("id")
      .eq("vacante_id", vacante.id)
      .eq("postulante_id", perfil.id)
      .maybeSingle(),
    supabase.from("cvs").select("id").eq("postulante_id", perfil.id).maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/postulante" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">
        <Icono nombre="flecha" className="h-4 w-4 rotate-180" /> Volver a las vacantes
      </Link>

      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-marca via-blue-900 to-blue-600 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/30 blur-2xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
            <span aria-hidden className="h-2 w-2 rounded-full bg-green-400" /> Vacante abierta
          </p>
          <h1 className="mt-3 text-2xl font-bold sm:text-4xl">{vacante.titulo}</h1>
          <p className="mt-2 text-sm text-blue-100">Publicada el {formatearFecha(vacante.creado_en)}</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DetalleVacantePostulante vacante={vacante} />
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className={`${estilosPostulante.tarjeta} space-y-4`}>
            {postulacion ? (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <Icono nombre="check" className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-bold text-marca">Ya te postulaste a esta vacante</p>
                  <p className="mt-1 text-sm text-slate-600">Enviamos tu CV. Podés ver todas tus postulaciones en un solo lugar.</p>
                </div>
                <Link href="/postulante/mis-postulaciones" className={`${estilosPostulante.botonSecundario} w-full`}>
                  Ver mis postulaciones
                </Link>
              </>
            ) : cv ? (
              <>
                <div>
                  <p className="font-bold text-marca">¿Te interesa esta vacante?</p>
                  <p className="mt-1 text-sm text-slate-600">Te postulás con el CV que tenés guardado.</p>
                </div>
                <BotonPostularse vacanteId={vacante.id} />
              </>
            ) : (
              <>
                <div>
                  <p className="font-bold text-marca">Para postularte, primero subí tu CV</p>
                  <p className="mt-1 text-sm text-slate-600">Lo cargás una sola vez y lo usás en todas tus postulaciones.</p>
                </div>
                <Link href="/postulante/perfil#cv" className={`${estilosPostulante.boton} w-full`}>
                  <Icono nombre="subir" className="h-5 w-5" /> Ir a mi perfil
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
