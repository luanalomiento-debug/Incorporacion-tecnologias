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
  postulante: Postulante;
};

export function nombreCompleto(p: Postulante) {
  return p ? `${p.nombre} ${p.apellido}`.trim() || "Postulante" : "Postulante";
}

// Postulaciones con los datos de quien se postuló (el reclutador puede leer todas).
export async function cargarPostulaciones(supabase: Cliente, vacanteId?: string) {
  let consulta = supabase
    .from("postulaciones")
    .select(
      "id, vacante_id, postulante_id, creado_en, afinidad, analisis, vacante_sugerida_id, postulante:perfiles!postulaciones_postulante_id_fkey(nombre, apellido, email)",
    )
    .order("creado_en", { ascending: false });
  if (vacanteId) consulta = consulta.eq("vacante_id", vacanteId);
  const { data } = await consulta;
  return (data ?? []) as unknown as PostulacionDashboard[];
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
  let consulta = supabase
    .from("cvs")
    .select("postulante_id, analisis_estado, analisis_iniciado_en");
  if (postulanteIds) consulta = consulta.in("postulante_id", postulanteIds);
  const { data } = await consulta;

  const vencido = Date.now() - MINUTOS_ANALISIS_VENCIDO * 60 * 1000;
  const estados = new Map<string, EstadoCv>();
  for (const c of data ?? []) {
    let estado = c.analisis_estado as EstadoCv;
    if (estado === "analizando" && (!c.analisis_iniciado_en || new Date(c.analisis_iniciado_en).getTime() < vencido))
      estado = "error";
    estados.set(c.postulante_id as string, estado);
  }
  return estados;
}
