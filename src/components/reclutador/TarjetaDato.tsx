// Tarjeta con un número destacado (por ejemplo, el total de postulaciones).
export function TarjetaDato({ etiqueta, valor, detalle }: { etiqueta: string; valor: string | number; detalle?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{etiqueta}</p>
      <p className="mt-1 text-3xl font-bold text-marca">{valor}</p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </div>
  );
}
