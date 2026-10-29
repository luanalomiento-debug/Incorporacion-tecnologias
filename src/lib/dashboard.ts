import type { Etapa } from "@/lib/etapas";
import { mejorVacanteAlternativa } from "@/lib/ia/sugerencia";
import { MINUTOS_ANALISIS_VENCIDO } from "@/lib/ia/config";
import type { MotivosAfinidad } from "@/lib/ia/esquema";
import { crearClienteServidor } from "@/lib/supabase/server";

type Cliente = Awaited<ReturnType<typeof crearClienteServidor>>;

export type Postulante = { nombre: string; apellido: string; email: string } | null;

export type PostulacionDashboard = {
  id: string;
  vacante_id: string;
  postulante_id: string;
  creado_en: string;
  afinidad: number | null;
  analisis: MotivosAfinidad | null;
  vacante_sugerida_id: string | null;
  etapa: Etapa;
  etapa_actualizada_en: string;
  postulante: Postulante;
};

export function nombreCompleto(p: Postulante) {
  return p ? `${p.nombre} ${p.apellido}`.trim() || "Postulante" : "Postulante";
}

const TAMANO_PAGINA = 1000;

// Supabase devuelve como máximo 1000 filas por consulta: esto pide página por página hasta traer todo
// (si no, con más de 1000 filas los números del dashboard saldrían silenciosamente incompletos).
export async function traerTodo<T>(
  pedir: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null }>,
): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += TAMANO_PAGINA) {
    const { data } = await pedir(desde, desde + TAMANO_PAGINA - 1);
    const pagina = data ?? [];
    filas.push(...pagina);
    if (pagina.length < TAMANO_PAGINA) break;
  }
  return filas;
}

type FilaAfinidadCompleta = { vacante_id: string; postulante_id: string; afinidad: number | null; analisis: MotivosAfinidad | null };

// Postulaciones con los datos de quien se postuló (el reclutador puede leer todas) y, para cada una, la
// afinidad y los motivos de la IA para SU vacante, que se leen de la tabla de resultados de IA
// (afinidades_cv_vacante: única fuente de verdad). La "otra vacante sugerida" se calcula con esas mismas filas.
export async function cargarPostulaciones(supabase: Cliente, vacanteId?: string, ids?: string[]) {
  const postulaciones = await traerTodo<Omit<PostulacionDashboard, "afinidad" | "analisis" | "vacante_sugerida_id">>(
    (desde, hasta) => {
      let consulta = supabase
        .from("postulaciones")
        .select(
          "id, vacante_id, postulante_id, creado_en, etapa, etapa_actualizada_en, postulante:perfiles!postulaciones_postulante_id_fkey(nombre, apellido, email)",
        )
        .order("creado_en", { ascending: false })
        .order("id")
        .range(desde, hasta);
      if (vacanteId) consulta = consulta.eq("vacante_id", vacanteId);
      if (ids) consulta = consulta.in("id", ids);
      return consulta as unknown as PromiseLike<{ data: Omit<PostulacionDashboard, "afinidad" | "analisis" | "vacante_sugerida_id">[] | null }>;
    },
  );
  if (postulaciones.length === 0) return [] as PostulacionDashboard[];

  const personas = [...new Set(postulaciones.map((p) => p.postulante_id))];
  const [afinidades, { data: abiertasDb }] = await Promise.all([
    traerTodo<FilaAfinidadCompleta>((desde, hasta) => {
      let consulta = supabase
        .from("afinidades_cv_vacante")
        .select("vacante_id, postulante_id, afinidad, analisis")
        .order("id")
        .range(desde, hasta);
      // Con pocas personas se piden solo las suyas; con muchas, todas (evita una dirección demasiado larga).
      if (personas.length <= 200) consulta = consulta.in("postulante_id", personas);
      return consulta as unknown as PromiseLike<{ data: FilaAfinidadCompleta[] | null }>;
    }),
    supabase.from("vacantes").select("id").eq("activa", true),
  ]);

  const abiertas = new Set((abiertasDb ?? []).map((v) => v.id as string));
  const porPersona = new Map<string, FilaAfinidadCompleta[]>();
  for (const f of afinidades) {
    const lista = porPersona.get(f.postulante_id) ?? [];
    lista.push(f);
    porPersona.set(f.postulante_id, lista);
  }

  return postulaciones.map((p) => {
    const filas = porPersona.get(p.postulante_id) ?? [];
    const propia = filas.find((f) => f.vacante_id === p.vacante_id);
    return {
      ...p,
      afinidad: propia?.afinidad ?? null,
      analisis: propia?.analisis ?? null,
      vacante_sugerida_id: mejorVacanteAlternativa(filas, p.vacante_id, abiertas),
    } as PostulacionDashboard;
  });
}

export function agruparPorVacante(postulaciones: PostulacionDashboard[]) {
  const mapa = new Map<string, PostulacionDashboard[]>();
  for (const p of postulaciones) {
    const lista = mapa.get(p.vacante_id) ?? [];
    lista.push(p);
    mapa.set(p.vacante_id, lista);
  }
  return mapa;
}

export type EstadoCv = "pendiente" | "analizando" | "listo" | "error";

// Estado del análisis de cada CV. Un análisis "en curso" que lleva demasiado tiempo
// se considera fallido, para que nunca quede trabado.
export async function cargarEstadosCv(supabase: Cliente, postulanteIds?: string[]) {
  const data = await traerTodo<{ postulante_id: string; analisis_estado: string; analisis_iniciado_en: string | null }>(
    (desde, hasta) => {
      let consulta = supabase
        .from("cvs")
        .select("postulante_id, analisis_estado, analisis_iniciado_en")
        .order("id")
        .range(desde, hasta);
      if (postulanteIds) consulta = consulta.in("postulante_id", postulanteIds);
      return consulta as unknown as PromiseLike<{
        data: { postulante_id: string; analisis_estado: string; analisis_iniciado_en: string | null }[] | null;
      }>;
    },
  );

  const vencido = Date.now() - MINUTOS_ANALISIS_VENCIDO * 60 * 1000;
  const estados = new Map<string, EstadoCv>();
  for (const c of data) {
    let estado = c.analisis_estado as EstadoCv;
    if (estado === "analizando" && (!c.analisis_iniciado_en || new Date(c.analisis_iniciado_en).getTime() < vencido))
      estado = "error";
    estados.set(c.postulante_id as string, estado);
  }
  return estados;
}

// ---------------------------------------------------------------------------
// Resúmenes de afinidad
// ---------------------------------------------------------------------------

// Mejor match y promedio de una lista de postulaciones (solo cuentan las que ya tienen afinidad).
export function resumenAfinidad(postulaciones: PostulacionDashboard[]) {
  const conAfinidad = postulaciones.filter((p) => p.afinidad !== null);
  const promedio =
    conAfinidad.length > 0
      ? Math.round(conAfinidad.reduce((suma, p) => suma + Number(p.afinidad), 0) / conAfinidad.length)
      : null;
  const mejor = ordenarPorAfinidad(conAfinidad)[0] ?? null;
  return { analizadas: conAfinidad.length, promedio, mejor };
}

// De mayor a menor afinidad; las que todavía no tienen, al final; el empate lo gana la más antigua.
export function ordenarPorAfinidad(postulaciones: PostulacionDashboard[]) {
  return [...postulaciones].sort((a, b) => {
    if (a.afinidad === null && b.afinidad === null) return a.creado_en.localeCompare(b.creado_en);
    if (a.afinidad === null) return 1;
    if (b.afinidad === null) return -1;
    return Number(b.afinidad) - Number(a.afinidad) || a.creado_en.localeCompare(b.creado_en);
  });
}
