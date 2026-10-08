import Link from "next/link";
import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha } from "@/lib/tipos";
import { DatosPersonales } from "@/components/postulante/DatosPersonales";
import { Icono } from "@/components/postulante/Icono";
import { estilosReclutador } from "@/components/reclutador/estilos";

export default async function PerfilReclutadorPage() {
  const perfil = await exigirRol("reclutador");
  const supabase = await crearClienteServidor();

  const [{ data: datos }, { count: publicadas }, { count: activas }] = await Promise.all([
    supabase.from("perfiles").select("creado_en").eq("id", perfil.id).single<{ creado_en: string }>(),
    supabase.from("vacantes").select("id", { count: "exact", head: true }).eq("creado_por", perfil.id),
    supabase.from("vacantes").select("id", { count: "exact", head: true }).eq("creado_por", perfil.id).eq("activa", true),
  ]);

  const iniciales = `${perfil.nombre.charAt(0)}${perfil.apellido.charAt(0)}`.toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-marca via-blue-900 to-blue-600 p-6 text-white shadow-lg sm:p-8">
        <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-400/30 blur-2xl" />
        <div className="relative flex flex-wrap items-center gap-5">
          <span
            aria-hidden
            className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-acento text-3xl font-bold text-white ring-4 ring-white/30"
          >
            {iniciales || "?"}
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">
              {perfil.nombre} {perfil.apellido}
            </h1>
            <p className="mt-1 break-all text-blue-100">{perfil.email}</p>
            <span className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
              Reclutador/a
            </span>
          </div>
        </div>
      </header>

      <DatosPersonales
        nombre={perfil.nombre}
        apellido={perfil.apellido}
        email={perfil.email}
        miembroDesde={datos?.creado_en ? formatearFecha(datos.creado_en) : ""}
      />

      <section className={estilosReclutador.tarjeta}>
        <h2 className="mb-4 font-bold text-marca">Mi actividad</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icono nombre="maletin" className="h-6 w-6" />
            </span>
            <p className="text-slate-700">
              <span className="text-2xl font-bold text-marca">{publicadas ?? 0}</span>{" "}
              {(publicadas ?? 0) === 1 ? "vacante publicada" : "vacantes publicadas"}
              <span className="text-slate-500"> · {activas ?? 0} {(activas ?? 0) === 1 ? "activa" : "activas"}</span>
            </p>
          </div>
          <Link href="/reclutador" className={estilosReclutador.botonSecundario}>
            Ver mis vacantes
          </Link>
        </div>
      </section>
    </div>
  );
}
