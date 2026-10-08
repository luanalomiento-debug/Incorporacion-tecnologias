import Link from "next/link";
import { formatearFecha, type Vacante } from "@/lib/tipos";
import { Icono } from "@/components/postulante/Icono";
import { estilosPostulante } from "@/components/postulante/estilos";

export function TarjetaVacante({ vacante, postulado }: { vacante: Vacante; postulado: boolean }) {
  return (
    <Link
      href={`/postulante/vacantes/${vacante.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-acento" />
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
          <Icono nombre="maletin" />
        </span>
        {postulado && (
          <span className={estilosPostulante.etiquetaOk}>
            <Icono nombre="check" className="h-3.5 w-3.5" /> Postulado
          </span>
        )}
      </div>
      <h2 className="mt-4 text-lg font-bold text-marca">{vacante.titulo}</h2>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{vacante.descripcion}</p>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="min-w-0 text-xs text-slate-500">Publicada el {formatearFecha(vacante.creado_en)}</span>
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-semibold text-acento-oscuro">
          Ver detalle
          <Icono nombre="flecha" className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
