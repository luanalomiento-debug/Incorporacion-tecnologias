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

export type Cv = {
  id: string;
  postulante_id: string;
  ruta_archivo: string;
  nombre_archivo: string;
  subido_en: string;
};

export const TAMANO_MAXIMO_CV = 5 * 1024 * 1024; // 5 MB, igual que el bucket

// Cada postulante tiene un único archivo, en su propia carpeta del bucket "cvs".
export function rutaCv(postulanteId: string) {
  return `${postulanteId}/cv.pdf`;
}

// Las fechas se muestran en hora local (UTC-3), también cuando la app corre en Vercel.
export function formatearFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Montevideo",
  });
}
