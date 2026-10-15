"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Mientras haya CVs analizándose, vuelve a cargar la pantalla cada pocos segundos
// (durante un máximo de 3 minutos) para mostrar los resultados apenas estén.
export function ActualizarSiAnalizando({ activo }: { activo: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!activo) return;
    const inicio = Date.now();
    const id = setInterval(() => {
      if (Date.now() - inicio > 3 * 60 * 1000) clearInterval(id);
      else router.refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [activo, router]);
  return null;
}
