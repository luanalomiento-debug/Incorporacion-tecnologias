import Link from "next/link";
import { EMPRESA } from "@/lib/empresa";

const PASOS = [
  { titulo: "Creá tu cuenta", detalle: "Solo con tu email y una contraseña." },
  { titulo: "Cargá tu CV", detalle: "En PDF, de hasta 5 MB." },
  { titulo: "Elegí una vacante y postulate", detalle: "Después ves todas tus postulaciones en un solo lugar." },
];

const boton =
  "inline-flex items-center justify-center rounded-lg bg-acento px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-acento-oscuro";
const botonSecundario =
  "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-marca hover:bg-slate-50";

// Página de inicio para quien todavía no inició sesión.
export function PaginaInicio() {
  return (
    <div className="relative flex-1 overflow-hidden bg-white">
      {/* Fondo con degradé celeste, solo decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-sky-200 via-blue-400 to-blue-600 opacity-50 blur-3xl sm:h-[40rem] sm:w-[40rem]"
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-acento text-lg font-bold text-white">
            {EMPRESA.charAt(0)}
          </span>
          <span className="text-lg font-bold text-marca">{EMPRESA}</span>
        </div>
        <Link href="/login" className={`${boton} !px-5 !py-2.5`}>
          Iniciar
        </Link>
      </header>

      <main className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-8 lg:grid-cols-2 lg:pt-16">
        <section>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
            <span aria-hidden className="h-2 w-2 rounded-full bg-blue-500" />
            Trabajá con nosotros
          </p>
          <h1 className="text-4xl font-bold leading-tight text-marca sm:text-5xl lg:text-6xl">
            Sumate al equipo de {EMPRESA}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-slate-700">
            Mirá las vacantes abiertas, cargá tu CV y postulate en pocos pasos.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/registro" className={boton}>
              Crear cuenta y postularme
            </Link>
            <Link href="/login" className={botonSecundario}>
              Ya tengo cuenta
            </Link>
          </div>
        </section>

        <section aria-label="Cómo postularte" className="rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur">
          <div className="flex items-center gap-1.5 border-b border-slate-200 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </div>
          <div className="p-6">
            <h2 className="text-xl font-bold text-marca">Postularte es muy simple</h2>
            <ol className="mt-5 space-y-4">
              {PASOS.map((paso, i) => (
                <li key={paso.titulo} className="flex items-start gap-4 rounded-xl bg-slate-50 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-acento text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-marca">{paso.titulo}</p>
                    <p className="text-sm text-slate-600">{paso.detalle}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}
