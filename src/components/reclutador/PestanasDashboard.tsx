import Link from "next/link";

// Los dos dashboards, separados: postulaciones reales y recomendaciones de la IA.
export function PestanasDashboard({ activa }: { activa: "postulaciones" | "ia" }) {
  const base = "rounded-lg px-4 py-2 text-sm font-semibold transition";
  const on = "bg-white text-marca shadow-sm";
  const off = "text-slate-600 hover:text-marca";
  return (
    <div role="tablist" aria-label="Dashboards" className="inline-flex rounded-xl bg-slate-100 p-1">
      <Link href="/reclutador/dashboard" role="tab" aria-selected={activa === "postulaciones"} className={`${base} ${activa === "postulaciones" ? on : off}`}>
        Postulaciones
      </Link>
      <Link href="/reclutador/dashboard/ia" role="tab" aria-selected={activa === "ia"} className={`${base} ${activa === "ia" ? on : off}`}>
        Recomendaciones de IA
      </Link>
    </div>
  );
}
