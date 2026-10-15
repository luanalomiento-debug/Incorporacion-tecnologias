import Link from "next/link";

// Dentro de la pestaña "Postulaciones": las postulaciones reales y las recomendaciones de la IA.
export function PestanasPostulaciones({ activa }: { activa: "postulaciones" | "ia" }) {
  const base = "rounded-lg px-4 py-2 text-sm font-semibold transition";
  const on = "bg-white text-marca shadow-sm";
  const off = "text-slate-600 hover:text-marca";
  return (
    <div role="tablist" aria-label="Vistas de postulaciones" className="inline-flex rounded-xl bg-slate-100 p-1">
      <Link href="/reclutador/postulaciones" role="tab" aria-selected={activa === "postulaciones"} className={`${base} ${activa === "postulaciones" ? on : off}`}>
        Postulaciones
      </Link>
      <Link href="/reclutador/postulaciones/ia" role="tab" aria-selected={activa === "ia"} className={`${base} ${activa === "ia" ? on : off}`}>
        Recomendaciones de IA
      </Link>
    </div>
  );
}
