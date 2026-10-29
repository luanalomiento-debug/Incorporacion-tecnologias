import { datosEtapa } from "@/lib/etapas";

export function EtiquetaEtapa({ etapa }: { etapa: string }) {
  const e = datosEtapa(etapa);
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${e.clases}`}>{e.texto}</span>;
}
