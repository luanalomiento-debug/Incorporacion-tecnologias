// Tarjeta con un dato destacado (por ejemplo, el total de postulaciones).
// Con `texto`, el valor es una palabra o un nombre (más chico y con puntos suspensivos si no entra).
export function TarjetaDato({
  etiqueta,
  valor,
  detalle,
  texto = false,
}: {
  etiqueta: string;
  valor: string | number;
  detalle?: string;
  texto?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{etiqueta}</p>
      <p className={`mt-1 font-bold text-marca ${texto ? "truncate text-xl leading-9" : "text-3xl"}`} title={String(valor)}>
        {valor}
      </p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
    </div>
  );
}
