import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirRol } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { enlaceCorreo } from "@/lib/correo";
import { cargarPostulaciones, nombreCompleto } from "@/lib/dashboard";
import { datosEtapa, diasDesde, textoDias } from "@/lib/etapas";
import type { PreguntaEntrevista } from "@/lib/ia/esquema";
import { formatearFecha } from "@/lib/tipos";
import { Icono } from "@/components/postulante/Icono";
import { ActualizarSiAnalizando } from "@/components/reclutador/ActualizarSiAnalizando";
import { BloquesDeMotivos, MedidorAfinidad } from "@/components/reclutador/Afinidad";
import { BotonPreguntas } from "@/components/reclutador/BotonPreguntas";
import { BotonReanalizar } from "@/components/reclutador/BotonReanalizar";
import { EtiquetaEtapa } from "@/components/reclutador/EtiquetaEtapa";
import { NotasPostulacion } from "@/components/reclutador/NotasPostulacion";
import { SelectorEtapa } from "@/components/reclutador/SelectorEtapa";
import { estilosReclutador } from "@/components/reclutador/estilos";

// Generar las preguntas de entrevista con IA puede tardar: se amplía el tiempo.
export const maxDuration = 60;

type PerfilCv = {
  formacion?: string[];
  experiencia?: { puesto: string; empresa: string; periodo: string; descripcion: string }[];
  habilidades?: string[];
  idiomas?: string[];
} | null;

function Lista({ titulo, items }: { titulo: string; items: string[] | undefined }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-marca">{titulo}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

// Ficha de un candidato frente a un puesto: todo lo necesario para decidir y actuar en un solo lugar.
export default async function FichaCandidatoPage({ params }: PageProps<"/reclutador/postulaciones/[id]">) {
  const { id } = await params;
  const yo = await exigirRol("reclutador");
  const supabase = await crearClienteServidor();

  const [p] = await cargarPostulaciones(supabase, undefined, [id]);
  if (!p) notFound();
  const postulante = p.postulante;
  const { data: vacante } = await supabase
    .from("vacantes")
    .select("id, titulo, activa")
    .eq("id", p.vacante_id)
    .maybeSingle<{ id: string; titulo: string; activa: boolean }>();

  const [{ data: cv }, { data: notasDb }, { data: movimientos }, { data: pregs }, { data: sugerida }] = await Promise.all([
    supabase
      .from("cvs")
      .select("resumen, perfil_estructurado, analisis_estado, nombre_archivo")
      .eq("postulante_id", p.postulante_id)
      .maybeSingle(),
    supabase
      .from("notas_postulacion")
      .select("id, texto, creado_en, autor_id, autor:perfiles!notas_postulacion_autor_id_fkey(nombre, apellido)")
      .eq("postulacion_id", id)
      .order("creado_en", { ascending: false }),
    supabase
      .from("postulacion_movimientos")
      .select("id, etapa_anterior, etapa_nueva, creado_en")
      .eq("postulacion_id", id)
      .order("creado_en", { ascending: false }),
    supabase.from("preguntas_entrevista").select("preguntas, generado_en").eq("postulacion_id", id).maybeSingle(),
    p.vacante_sugerida_id
      ? supabase.from("vacantes").select("id, titulo").eq("id", p.vacante_sugerida_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const perfilCv = (cv?.perfil_estructurado ?? null) as PerfilCv;
  const analisis = p.analisis;
  const preguntas = (pregs?.preguntas ?? []) as PreguntaEntrevista[];
  const notas = (notasDb ?? []).map((n) => {
    const autor = n.autor as unknown as { nombre: string; apellido: string } | null;
    return {
      id: n.id as string,
      texto: n.texto as string,
      fecha: formatearFecha(n.creado_en as string),
      autor: autor ? nombreCompleto(autor as never) : "Equipo de selección",
      propia: n.autor_id === yo.id,
    };
  });
  const nombre = nombreCompleto(postulante);
  const dias = diasDesde(p.etapa_actualizada_en);

  return (
    <div className="space-y-6">
      <ActualizarSiAnalizando activo={cv?.analisis_estado === "analizando"} />
      <Link
        href={`/reclutador/vacantes/${p.vacante_id}/postulaciones`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline"
      >
        <Icono nombre="flecha" className="h-4 w-4 rotate-180" /> Volver a los postulantes de {vacante?.titulo ?? "la vacante"}
      </Link>

      <header className={`${estilosReclutador.tarjeta} space-y-4`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className={estilosReclutador.titulo}>{nombre}</h1>
            {postulante && <p className="break-all text-slate-600">{postulante.email}</p>}
            <p className="mt-1 text-sm text-slate-500">
              Se postuló a{" "}
              <Link href={`/reclutador/vacantes/${p.vacante_id}`} className="font-semibold text-blue-700 hover:underline">
                {vacante?.titulo ?? "—"}
              </Link>{" "}
              el {formatearFecha(p.creado_en)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {postulante && (
              <a
                href={enlaceCorreo({ email: postulante.email, nombre: postulante.nombre, puesto: vacante?.titulo ?? "la vacante" })}
                className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}
              >
                <Icono nombre="correo" className="h-4 w-4" /> Enviar correo
              </a>
            )}
            <a href={`/cv/${p.postulante_id}`} target="_blank" rel="noopener" className={`${estilosReclutador.botonSecundario} !px-4 !py-2 text-sm`}>
              <Icono nombre="documento" className="h-4 w-4" /> Ver CV
            </a>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 pt-4">
          <SelectorEtapa postulacionId={id} etapa={p.etapa} />
          <p className="text-sm text-slate-500">
            En «{datosEtapa(p.etapa).texto}» {textoDias(dias)}
          </p>
          {p.afinidad !== null && <MedidorAfinidad valor={Number(p.afinidad)} />}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <section className={`${estilosReclutador.tarjeta} space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-marca">Análisis de la IA para este puesto</h2>
              <BotonReanalizar postulanteId={p.postulante_id} texto={p.afinidad === null ? "Analizar este CV" : "Re-analizar este CV"} />
            </div>
            {cv?.resumen && <p className="text-sm text-slate-700">{cv.resumen}</p>}
            {analisis ? (
              <BloquesDeMotivos motivos={analisis} />
            ) : (
              <p className="text-sm text-slate-500">
                {cv?.analisis_estado === "analizando"
                  ? "Analizando el CV…"
                  : cv?.analisis_estado === "error"
                    ? "No se pudo analizar este CV. Probá de nuevo."
                    : "Pendiente de análisis."}
              </p>
            )}
            {sugerida && (
              <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
                La IA encontró otra vacante que le encaja claramente mejor:{" "}
                <Link href={`/reclutador/vacantes/${sugerida.id}`} className="font-semibold underline">
                  {sugerida.titulo}
                </Link>
                .
              </p>
            )}
          </section>

          <section className={`${estilosReclutador.tarjeta} space-y-4`}>
            <div>
              <h2 className="font-bold text-marca">Preguntas para la entrevista</h2>
              <p className="mt-1 text-sm text-slate-500">
                La IA las arma a partir del CV y de lo que pide el puesto, con foco en lo que conviene confirmar.
              </p>
            </div>
            {preguntas.length > 0 && (
              <ol className="space-y-3">
                {preguntas.map((q, i) => (
                  <li key={q.pregunta} className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    <p className="font-semibold text-marca">
                      {i + 1}. {q.pregunta}
                    </p>
                    <p className="mt-1 text-slate-600">Para confirmar: {q.para_verificar}</p>
                  </li>
                ))}
              </ol>
            )}
            <BotonPreguntas postulacionId={id} hayPreguntas={preguntas.length > 0} />
          </section>
        </div>

        <div className="space-y-6">
          <section className={`${estilosReclutador.tarjeta} space-y-3`}>
            <h2 className="font-bold text-marca">Notas del equipo</h2>
            <NotasPostulacion postulacionId={id} notas={notas} />
          </section>

          <section className={`${estilosReclutador.tarjeta} space-y-4`}>
            <h2 className="font-bold text-marca">Perfil extraído del CV</h2>
            {!perfilCv ? (
              <p className="text-sm text-slate-500">Todavía no hay un análisis del CV.</p>
            ) : (
              <>
                <Lista titulo="Formación" items={perfilCv.formacion} />
                {perfilCv.experiencia && perfilCv.experiencia.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-marca">Experiencia</p>
                    <ul className="mt-1 space-y-2 text-sm text-slate-700">
                      {perfilCv.experiencia.map((e) => (
                        <li key={`${e.puesto}-${e.empresa}-${e.periodo}`}>
                          <span className="font-medium">{e.puesto}</span> · {e.empresa} · {e.periodo}
                          {e.descripcion && <span className="block text-slate-500">{e.descripcion}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Lista titulo="Habilidades" items={perfilCv.habilidades} />
                <Lista titulo="Idiomas" items={perfilCv.idiomas} />
              </>
            )}
          </section>

          <section className={`${estilosReclutador.tarjeta} space-y-3`}>
            <h2 className="font-bold text-marca">Historial de etapas</h2>
            <ul className="space-y-2 text-sm text-slate-700">
              {(movimientos ?? []).map((m) => (
                <li key={m.id as string} className="flex flex-wrap items-center gap-2">
                  <EtiquetaEtapa etapa={m.etapa_anterior as string} /> <span aria-hidden>→</span>
                  <EtiquetaEtapa etapa={m.etapa_nueva as string} />
                  <span className="text-xs text-slate-500">{formatearFecha(m.creado_en as string)}</span>
                </li>
              ))}
              <li className="text-xs text-slate-500">Se postuló el {formatearFecha(p.creado_en)}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
