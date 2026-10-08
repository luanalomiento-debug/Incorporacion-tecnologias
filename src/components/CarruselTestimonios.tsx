import { TESTIMONIOS, type Testimonio } from "@/lib/testimonios";

function Tarjeta({ t }: { t: Testimonio }) {
  return (
    <figure className="mr-5 flex w-72 shrink-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-md sm:w-80">
      <blockquote className="text-slate-700">“{t.texto}”</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-acento text-sm font-bold text-white"
        >
          {t.nombre.charAt(0)}
        </span>
        <div>
          <p className="font-semibold text-marca">{t.nombre}</p>
          <p className="text-sm text-slate-500">Se postuló a {t.puesto}</p>
        </div>
      </figcaption>
    </figure>
  );
}

// Tarjetas que se mueven solas. La lista se repite dos veces para que el
// recorrido sea continuo; la copia es solo visual y se oculta a lectores de pantalla.
export function CarruselTestimonios() {
  return (
    <section aria-label="Testimonios" className="relative pb-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-marca">Lo que cuentan quienes ya se postularon</h2>
        <p className="mt-2 text-slate-600">Experiencias de personas que usaron el portal.</p>
      </div>

      <div className="carrusel mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="carrusel-pista">
          {TESTIMONIOS.map((t) => (
            <Tarjeta key={t.nombre} t={t} />
          ))}
          <div aria-hidden className="flex">
            {TESTIMONIOS.map((t) => (
              <Tarjeta key={`copia-${t.nombre}`} t={t} />
            ))}
          </div>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-6xl px-4 text-xs text-slate-400">
        Testimonios de ejemplo, creados para este proyecto académico.
      </p>
    </section>
  );
}
