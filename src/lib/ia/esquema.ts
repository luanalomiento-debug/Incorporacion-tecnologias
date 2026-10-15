import { z } from "zod";

// Forma exacta de la respuesta que se le pide a Claude.
// Nota: no se guardan datos de contacto (teléfono, email, dirección) en el perfil.
export const EsquemaAnalisis = z.object({
  resumen: z.string(),
  perfil: z.object({
    formacion: z.array(z.string()),
    experiencia: z.array(
      z.object({
        puesto: z.string(),
        empresa: z.string(),
        periodo: z.string(),
        descripcion: z.string(),
      }),
    ),
    habilidades: z.array(z.string()),
    idiomas: z.array(z.string()),
  }),
  vacantes: z.array(
    z.object({
      vacante_id: z.string(),
      afinidad: z.number(),
      coincide: z.array(z.string()),
      falta: z.array(z.string()),
      conclusion: z.string(),
    }),
  ),
});

export type ResultadoAnalisis = z.infer<typeof EsquemaAnalisis>;

// Motivos de una afinidad, tal como se guardan y se muestran.
export type MotivosAfinidad = {
  coincide: string[];
  falta: string[];
  conclusion: string;
};
