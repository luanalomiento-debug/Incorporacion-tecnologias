export type Vacante = {
  id: string;
  titulo: string;
  descripcion: string;
  requisitos: string;
  habilidades: string;
  informacion_adicional: string;
  activa: boolean;
  creado_en: string;
};

export const COLUMNAS_VACANTE =
  "id, titulo, descripcion, requisitos, habilidades, informacion_adicional, activa, creado_en";

// Las fechas se muestran en hora local (UTC-3), también cuando la app corre en Vercel.
export function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Montevideo",
  });
}
