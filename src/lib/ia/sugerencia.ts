import { AFINIDAD_MINIMA_SUGERENCIA, DIFERENCIA_PARA_SUGERIR } from "@/lib/ia/config";

export type FilaAfinidad = { vacante_id: string; afinidad: number | null };

// Otra vacante abierta que le queda claramente mejor a una persona que ya se postuló a `vacanteId`:
// la de mayor afinidad, siempre que llegue al mínimo y supere a la vacante postulada por la diferencia
// configurada. Se calcula al momento de mostrar, a partir de las afinidades guardadas (única fuente de
// verdad), así que nunca queda desactualizada ni apunta a una vacante cerrada.
export function mejorVacanteAlternativa(
  afinidadesDePersona: FilaAfinidad[],
  vacanteId: string,
  abiertas: Set<string>,
): string | null {
  const propia = afinidadesDePersona.find((f) => f.vacante_id === vacanteId);
  if (!propia) return null;

  const mejor = afinidadesDePersona
    .filter((f) => f.vacante_id !== vacanteId && f.afinidad !== null && abiertas.has(f.vacante_id))
    .sort((a, b) => Number(b.afinidad) - Number(a.afinidad))[0];

  if (
    mejor &&
    Number(mejor.afinidad) >= AFINIDAD_MINIMA_SUGERENCIA &&
    Number(mejor.afinidad) - Number(propia.afinidad ?? 0) >= DIFERENCIA_PARA_SUGERIR
  )
    return mejor.vacante_id;
  return null;
}
