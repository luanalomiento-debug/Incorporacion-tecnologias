import { crearClienteServidor } from "@/lib/supabase/server";

type Cliente = Awaited<ReturnType<typeof crearClienteServidor>>;

export type Postulante = { nombre: string; apellido: string; email: string } | null;

export type PostulacionDashboard = {
  id: string;
  vacante_id: string;
  postulante_id: string;
  creado_en: string;
  afinidad: number | null;
  analisis: unknown;
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
