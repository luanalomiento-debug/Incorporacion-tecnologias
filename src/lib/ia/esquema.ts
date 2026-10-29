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
      inferido: z.array(z.string()),
      falta: z.array(z.string()),
      conclusion: z.string(),
    }),
  ),
});

export type ResultadoAnalisis = z.infer<typeof EsquemaAnalisis>;

// Motivos de una afinidad, tal como se guardan y se muestran.
// "coincide" es lo que el CV dice de forma explícita; "inferido" lo que se deduce y conviene
// confirmar; "falta" lo que el puesto pide y no figura en el CV. Los análisis anteriores no
// tienen "inferido".
export type MotivosAfinidad = {
  coincide: string[];
  inferido?: string[];
  falta: string[];
  conclusion: string;
};

// Preguntas de entrevista para una persona y un puesto.
export const EsquemaPreguntas = z.object({
  preguntas: z.array(
    z.object({
      pregunta: z.string(),
      para_verificar: z.string(),
    }),
  ),
});

export type PreguntaEntrevista = z.infer<typeof EsquemaPreguntas>["preguntas"][number];
