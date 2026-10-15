import { redirect } from "next/navigation";

// Las recomendaciones de IA ahora están en la pestaña "Postulaciones".
// Esta dirección se mantiene solo para que los enlaces guardados antes sigan funcionando.
export default function DashboardIaViejoPage() {
  redirect("/reclutador/postulaciones/ia");
}
