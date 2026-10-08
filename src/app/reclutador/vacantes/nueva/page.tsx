import Link from "next/link";
import { crearVacante } from "@/lib/acciones/vacantes";
import { FormularioVacante } from "@/components/reclutador/FormularioVacante";
import { Icono } from "@/components/postulante/Icono";
import { estilosReclutador } from "@/components/reclutador/estilos";

export default function NuevaVacantePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/reclutador" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">
          <Icono nombre="flecha" className="h-4 w-4 rotate-180" /> Volver a las vacantes
        </Link>
        <h1 className={`${estilosReclutador.titulo} mt-3`}>Nueva vacante</h1>
        <p className="mt-1 text-slate-600">Completá los datos del puesto. Los postulantes van a ver esta información.</p>
      </div>

      <FormularioVacante accion={crearVacante} textoBoton="Publicar vacante" textoEnviando="Publicando…" />
    </div>
  );
}
