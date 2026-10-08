import { redirect } from "next/navigation";

// "Mi CV" ahora vive dentro del perfil. Esta dirección se mantiene solo para
// que los enlaces guardados antes sigan funcionando.
export default function MiCvPage() {
  redirect("/postulante/perfil#cv");
}
