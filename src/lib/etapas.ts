// Etapas del proceso de selección, en orden. "descartado" queda aparte del recorrido normal.
export const ETAPAS = [
  { valor: "nuevo", texto: "Nuevo", clases: "bg-slate-100 text-slate-700", barra: "bg-slate-400" },
  { valor: "preseleccionado", texto: "Preseleccionado", clases: "bg-blue-50 text-blue-700", barra: "bg-blue-500" },
  { valor: "entrevista", texto: "En entrevista", clases: "bg-indigo-50 text-indigo-700", barra: "bg-indigo-500" },
  { valor: "finalista", texto: "Finalista", clases: "bg-amber-50 text-amber-800", barra: "bg-amber-500" },
  { valor: "contratado", texto: "Contratado", clases: "bg-green-50 text-green-700", barra: "bg-green-600" },
  { valor: "descartado", texto: "Descartado", clases: "bg-rose-50 text-rose-700", barra: "bg-rose-400" },
] as const;

export type Etapa = (typeof ETAPAS)[number]["valor"];

export function esEtapa(valor: unknown): valor is Etapa {
  return ETAPAS.some((e) => e.valor === valor);
}

export function datosEtapa(valor: string | null | undefined) {
  return ETAPAS.find((e) => e.valor === valor) ?? ETAPAS[0];
}

// Etapas en las que el proceso sigue abierto (para detectar procesos estancados).
export const ETAPAS_EN_CURSO: Etapa[] = ["preseleccionado", "entrevista", "finalista"];

// Umbrales de las alertas del dashboard. Se cambian acá.
export const DIAS_SIN_REVISAR = 3; // una postulación "nueva" que espera más que esto necesita atención
export const DIAS_ESTANCADA = 10; // un candidato en curso sin cambios por más que esto está estancado
export const DIAS_VACANTE_SIN_POSTULACIONES = 7; // una vacante activa sin postulaciones por más que esto

export const MS_DIA = 24 * 60 * 60 * 1000;

export function diasDesde(iso: string, ahora = Date.now()) {
  return Math.max(0, Math.floor((ahora - new Date(iso).getTime()) / MS_DIA));
}

export function textoDias(dias: number) {
  return dias === 0 ? "hoy" : dias === 1 ? "hace 1 día" : `hace ${dias} días`;
}

// Momento actual (en una función aparte para usarlo desde las páginas del servidor).
export function ahoraMs() {
  return Date.now();
}
