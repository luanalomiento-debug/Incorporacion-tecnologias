// Ajustes del análisis con IA. Se cambian acá, en un solo lugar.

// Modelo más económico de Claude. Para probar con uno más capaz, solo se cambia este valor
// (por ejemplo "claude-sonnet-5-5").
export const MODELO_IA = "claude-haiku-5-5";

// Tope de análisis automáticos por persona en 24 horas.
export const TOPE_DIARIO_POR_PERSONA = 5;

// Máximo de vacantes abiertas que se comparan con cada CV (las más recientes).
export const MAX_VACANTES_POR_ANALISIS = 30;

// Se sugiere otra vacante si le queda al menos así de bien (0-100)...
export const AFINIDAD_MINIMA_SUGERENCIA = 60;
// ...y supera a la vacante a la que se postuló por al menos esta diferencia.
export const DIFERENCIA_PARA_SUGERIR = 15;

// En "candidatos sugeridos" de cada puesto solo se muestran afinidades desde este valor.
export const AFINIDAD_MINIMA_LISTA = 50;
// Cuántos candidatos sugeridos se muestran por puesto.
export const MAX_CANDIDATOS_POR_PUESTO = 5;

// Un análisis "en curso" que lleva más de esto se considera fallido.
export const MINUTOS_ANALISIS_VENCIDO = 10;

// Cuántos CVs se re-analizan por vez con el botón "Re-analizar CVs".
export const LOTE_REANALISIS = 10;
// Cuántos se procesan al mismo tiempo dentro de ese lote.
export const CONCURRENCIA_REANALISIS = 5;

// Tiempo máximo de espera a la respuesta de Claude (milisegundos).
export const TIEMPO_MAXIMO_CLAUDE_MS = 40_000;
