import Link from "next/link";
import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { formatearFecha, type Cv } from "@/lib/tipos";
import { Icono } from "@/components/postulante/Icono";
import { estilosPostulante } from "@/components/postulante/estilos";

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{etiqueta}</dt>
      <dd className="mt-1 break-words font-semibold text-marca">{valor || "—"}</dd>
    </div>
  );
}

export default async function PerfilPostulantePage() {
  const perfil = await exigirRol("postulante");
  const supabase = await crearClienteServidor();

  const [{ data: datos }, { data: cv }, { count }] = await Promise.all([
    supabase.from("perfiles").select("creado_en").eq("id", perfil.id).single<{ creado_en: string }>(),
    supabase
      .from("cvs")
      .select("id, postulante_id, ruta_archivo, nombre_archivo, subido_en")
      .eq("postulante_id", perfil.id)
      .maybeSingle<Cv>(),
    supabase.from("postulaciones").select("id", { count: "exact", head: true }).eq("postulante_id", perfil.id),
  ]);

  const iniciales = `${perfil.nombre.charAt(0)}${perfil.apellido.charAt(0)}`.toUpperCase();
  const cantidad = count ?? 0;

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
              Postulante
            </span>
          </div>
        </div>
      </header>

      <section className={estilosPostulante.tarjeta}>
        <h2 className="mb-4 font-bold text-marca">Datos personales</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Dato etiqueta="Nombre" valor={perfil.nombre} />
          <Dato etiqueta="Apellido" valor={perfil.apellido} />
          <Dato etiqueta="Email" valor={perfil.email} />
          <Dato etiqueta="Miembro desde" valor={datos?.creado_en ? formatearFecha(datos.creado_en) : ""} />
        </dl>
      </section>

      <section className={estilosPostulante.tarjeta}>
        <h2 className="mb-4 font-bold text-marca">Mi CV</h2>
        {cv ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                <Icono nombre="documento" className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-marca">{cv.nombre_archivo}</p>
                <p className="text-sm text-slate-500">Subido el {formatearFecha(cv.subido_en)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`/cv/${perfil.id}`} target="_blank" rel="noopener" className={estilosPostulante.botonSecundario}>
                Ver mi CV
              </a>
              <Link href="/postulante/mi-cv" className={estilosPostulante.botonSecundario}>
                Reemplazar
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
            <p className="text-slate-600">Todavía no subiste tu CV. Lo necesitás para postularte.</p>
            <Link href="/postulante/mi-cv" className={estilosPostulante.boton}>
              <Icono nombre="subir" className="h-5 w-5" /> Subir mi CV
            </Link>
          </div>
        )}
      </section>

      <section className={estilosPostulante.tarjeta}>
        <h2 className="mb-4 font-bold text-marca">Mi actividad</h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icono nombre="maletin" className="h-6 w-6" />
            </span>
            <p className="text-slate-700">
              <span className="text-2xl font-bold text-marca">{cantidad}</span>{" "}
              {cantidad === 1 ? "postulación enviada" : "postulaciones enviadas"}
            </p>
          </div>
          <Link href="/postulante/mis-postulaciones" className={estilosPostulante.botonSecundario}>
            Ver mis postulaciones
          </Link>
        </div>
      </section>
    </div>
  );
}
