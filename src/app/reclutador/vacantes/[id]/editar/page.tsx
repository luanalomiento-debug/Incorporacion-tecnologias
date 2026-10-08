import Link from "next/link";
import { notFound } from "next/navigation";
import { editarVacante } from "@/lib/acciones/vacantes";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COLUMNAS_VACANTE, type Vacante } from "@/lib/tipos";
import { FormularioVacante } from "@/components/reclutador/FormularioVacante";
import { Icono } from "@/components/postulante/Icono";
import { estilosReclutador } from "@/components/reclutador/estilos";

export default async function EditarVacantePage({
  params,
}: PageProps<"/reclutador/vacantes/[id]/editar">) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data: vacante } = await supabase
    .from("vacantes")
    .select(COLUMNAS_VACANTE)
    .eq("id", id)
    .maybeSingle<Vacante>();

  if (!vacante) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/reclutador/vacantes/${vacante.id}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline"
        >
          <Icono nombre="flecha" className="h-4 w-4 rotate-180" /> Volver a la vacante
        </Link>
        <h1 className={`${estilosReclutador.titulo} mt-3`}>Editar vacante</h1>
        <p className="mt-1 text-slate-600">
          Los cambios se ven enseguida para los postulantes. Para activarla o desactivarla, usá el botón del detalle.
        </p>
      </div>

      <FormularioVacante
        accion={editarVacante.bind(null, vacante.id)}
        vacante={vacante}
        textoBoton="Guardar cambios"
        textoEnviando="Guardando…"
      />
    </div>
  );
}
