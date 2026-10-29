import Link from "next/link";
import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { cargarPostulaciones, nombreCompleto, type PostulacionDashboard } from "@/lib/dashboard";
import type { MotivosAfinidad } from "@/lib/ia/esquema";
import { Icono } from "@/components/postulante/Icono";
import { EtiquetaEtapa } from "@/components/reclutador/EtiquetaEtapa";
import { estilosReclutador } from "@/components/reclutador/estilos";

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAXIMO = 4;

type PerfilCv = { formacion?: string[]; habilidades?: string[]; idiomas?: string[] } | null;

function Items({ items }: { items: string[] | undefined }) {
  if (!items || items.length === 0) return <span className="text-slate-400">—</span>;
  return (
    <ul className="list-disc space-y-1 pl-4">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

// Compara de 2 a 4 candidatos de una misma vacante, lado a lado.
export default async function CompararPage({
  params,
  searchParams,
}: PageProps<"/reclutador/vacantes/[id]/comparar">) {
  const { id } = await params;
  const crudo = (await searchParams).ids;
  const ids = [...new Set((Array.isArray(crudo) ? crudo : crudo ? [crudo] : []).filter((x) => ES_UUID.test(x)))].slice(0, MAXIMO);

  const supabase = await crearClienteServidor();
  const { data: vacante } = await supabase.from("vacantes").select("id, titulo").eq("id", id).maybeSingle();
  if (!vacante) notFound();

  const volver = (
    <Link href={`/reclutador/vacantes/${id}/postulaciones`} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">
      <Icono nombre="flecha" className="h-4 w-4 rotate-180" /> Volver a los postulantes
    </Link>
  );

  if (ids.length < 2) {
    return (
      <div className="space-y-6">
        {volver}
        <div className={`${estilosReclutador.tarjeta} space-y-2 text-center`}>
          <p className="font-semibold text-marca">Elegí al menos 2 postulantes para compararlos</p>
          <p className="text-sm text-slate-600">
            En la lista de postulantes tildá la casilla de cada persona (hasta {MAXIMO}) y tocá «Comparar seleccionados».
          </p>
        </div>
      </div>
    );
  }

  const elegidos = (await cargarPostulaciones(supabase, id, ids)).sort(
    (a, b) => Number(b.afinidad ?? -1) - Number(a.afinidad ?? -1),
  );
  if (elegidos.length < 2) notFound();

  const { data: cvs } = await supabase
    .from("cvs")
    .select("postulante_id, resumen, perfil_estructurado")
    .in("postulante_id", elegidos.map((e) => e.postulante_id));
  const cvDe = new Map((cvs ?? []).map((c) => [c.postulante_id as string, c]));
  const mejor = elegidos[0].afinidad !== null ? elegidos[0].id : null;

  const filas: { titulo: string; celda: (p: PostulacionDashboard) => React.ReactNode }[] = [
    {
      titulo: "Afinidad con el puesto",
      celda: (p) =>
        p.afinidad === null ? (
          <span className="text-slate-400">Pendiente de análisis</span>
        ) : (
          <span className="text-2xl font-bold text-marca">
            {Number(p.afinidad)}
            <span className="text-xs font-normal text-slate-500"> /100</span>
            {p.id === mejor && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 align-middle text-xs font-semibold text-blue-800">Mayor</span>}
          </span>
        ),
    },
    { titulo: "Etapa", celda: (p) => <EtiquetaEtapa etapa={p.etapa} /> },
    { titulo: "Resumen del CV", celda: (p) => cvDe.get(p.postulante_id)?.resumen ?? <span className="text-slate-400">—</span> },
    { titulo: "Figura en el CV", celda: (p) => <Items items={(p.analisis as MotivosAfinidad | null)?.coincide} /> },
    { titulo: "Inferido (a confirmar)", celda: (p) => <Items items={(p.analisis as MotivosAfinidad | null)?.inferido} /> },
    { titulo: "No figura en el CV", celda: (p) => <Items items={(p.analisis as MotivosAfinidad | null)?.falta} /> },
    { titulo: "Habilidades", celda: (p) => <Items items={(cvDe.get(p.postulante_id)?.perfil_estructurado as PerfilCv)?.habilidades} /> },
    { titulo: "Formación", celda: (p) => <Items items={(cvDe.get(p.postulante_id)?.perfil_estructurado as PerfilCv)?.formacion} /> },
    { titulo: "Idiomas", celda: (p) => <Items items={(cvDe.get(p.postulante_id)?.perfil_estructurado as PerfilCv)?.idiomas} /> },
  ];

  return (
    <div className="space-y-6">
      {volver}
      <div>
        <h1 className={estilosReclutador.titulo}>Comparar candidatos</h1>
        <p className="mt-1 text-slate-600">
          Puesto: <strong className="text-marca">{vacante.titulo}</strong>. Ordenados de mayor a menor afinidad. La IA orienta, la decisión
          es de quien selecciona.
        </p>
      </div>
      <div className={`${estilosReclutador.tarjeta} overflow-x-auto !p-0`}>
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th scope="col" className="w-36 px-4 py-3" />
              {elegidos.map((p) => (
                <th key={p.id} scope="col" className="px-4 py-3 align-top">
                  <p className="font-bold text-marca">{nombreCompleto(p.postulante)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link href={`/reclutador/postulaciones/${p.id}`} className="text-xs font-semibold text-blue-700 hover:underline">
                      Ver ficha
                    </Link>
                    <a href={`/cv/${p.postulante_id}`} target="_blank" rel="noopener" className="text-xs font-semibold text-blue-700 hover:underline">
                      Ver CV
                    </a>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.titulo} className="border-b border-slate-100 align-top last:border-0">
                <th scope="row" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {f.titulo}
                </th>
                {elegidos.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-slate-700">
                    {f.celda(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
