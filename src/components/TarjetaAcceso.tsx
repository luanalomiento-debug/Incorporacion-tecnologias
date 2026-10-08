import Link from "next/link";
import { EMPRESA } from "@/lib/empresa";
import { LogoEmpresa } from "@/components/LogoEmpresa";

const VENTAJAS = [
  "Cargá tu CV una sola vez",
  "Postulate a las vacantes que te interesen",
  "Mirá todas tus postulaciones en un solo lugar",
];

// Pantalla de acceso (login y registro): panel de bienvenida a la izquierda
// en computadora, y la tarjeta con el formulario a la derecha.
export function TarjetaAcceso({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-marca via-blue-900 to-blue-600 p-12 text-white lg:flex lg:w-[45%] lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-400/30 blur-2xl" />
        <div aria-hidden className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-green-400/20 blur-3xl" />
        <div className="relative">
          <LogoEmpresa claro />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight">Tu próximo paso profesional empieza acá</h2>
          <ul className="mt-8 space-y-4">
            {VENTAJAS.map((v) => (
              <li key={v} className="flex items-start gap-3 text-blue-50">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-acento text-sm font-bold text-white">
                  ✓
                </span>
                {v}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-blue-100">Trabajá con nosotros en {EMPRESA}</p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-white px-4 py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-sky-200 via-blue-300 to-blue-500 opacity-40 blur-3xl"
        />
        <div className="relative w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <div className="lg:invisible">
              <LogoEmpresa />
            </div>
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-marca">
              ← Volver al inicio
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl sm:p-8">
            <h1 className="text-2xl font-bold text-marca">{titulo}</h1>
            <p className="mb-6 mt-1 text-slate-600">{subtitulo}</p>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
