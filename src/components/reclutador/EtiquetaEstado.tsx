export function EtiquetaEstado({ activa }: { activa: boolean }) {
  return activa ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-green-500" /> Activa
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Inactiva
    </span>
  );
}
