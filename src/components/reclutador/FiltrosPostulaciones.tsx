import Link from "next/link";
import { ETAPAS } from "@/lib/etapas";
import { hayFiltros, type Filtros } from "@/lib/filtros";
import { estilosReclutador } from "@/components/reclutador/estilos";

const campo =
  "selector rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

// Búsqueda y filtros por nombre, etapa y afinidad mínima. Es un formulario GET: los filtros
// quedan en la dirección de la página, así que se pueden compartir y no hace falta JavaScript.
export function FiltrosPostulaciones({ filtros, ruta }: { filtros: Filtros; ruta: string }) {
  return (
    <form method="get" action={ruta} className="flex flex-wrap items-end gap-3" role="search" aria-label="Filtrar postulantes">
      <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-medium text-slate-500">
        Buscar por nombre o correo
        <input type="search" name="q" defaultValue={filtros.q} placeholder="Ej.: Sofía" className={campo} />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Etapa
        <select name="etapa" defaultValue={filtros.etapa} className={campo}>
          <option value="">Todas</option>
          {ETAPAS.map((e) => (
            <option key={e.valor} value={e.valor}>
              {e.texto}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
        Afinidad
        <select name="min" defaultValue={filtros.min ? String(filtros.min) : ""} className={campo}>
          <option value="">Cualquiera</option>
          <option value="50">50 o más</option>
          <option value="70">70 o más</option>
          <option value="85">85 o más</option>
        </select>
      </label>
      <button type="submit" className={`${estilosReclutador.boton} !px-4 !py-2 text-sm`}>
        Filtrar
      </button>
      {hayFiltros(filtros) && (
        <Link href={ruta} className="py-2 text-sm font-semibold text-blue-700 hover:underline">
          Limpiar filtros
        </Link>
      )}
    </form>
  );
}
