import { esEtapa, type Etapa } from "@/lib/etapas";
import { nombreCompleto, type PostulacionDashboard } from "@/lib/dashboard";

export type Filtros = { q: string; etapa: Etapa | ""; min: number };

type ParamsBusqueda = { [clave: string]: string | string[] | undefined };

function unico(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function leerFiltros(params: ParamsBusqueda): Filtros {
  const etapa = unico(params.etapa);
  const min = Number(unico(params.min));
  return {
    q: unico(params.q).trim().slice(0, 80),
    etapa: esEtapa(etapa) ? etapa : "",
    min: Number.isFinite(min) && min > 0 ? Math.min(100, min) : 0,
  };
}

export function hayFiltros(f: Filtros) {
  return f.q !== "" || f.etapa !== "" || f.min > 0;
}

function sinTildes(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function aplicarFiltros(lista: PostulacionDashboard[], f: Filtros) {
  const q = sinTildes(f.q);
  return lista.filter((p) => {
    if (f.etapa && p.etapa !== f.etapa) return false;
    if (f.min > 0 && (p.afinidad === null || Number(p.afinidad) < f.min)) return false;
    if (q) {
      const texto = sinTildes(`${nombreCompleto(p.postulante)} ${p.postulante?.email ?? ""}`);
      if (!texto.includes(q)) return false;
    }
    return true;
  });
}
