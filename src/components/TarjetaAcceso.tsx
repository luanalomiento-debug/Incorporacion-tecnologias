// Contenedor centrado para las pantallas de login y registro.
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
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Portal de Reclutamiento
        </p>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">{titulo}</h1>
          <p className="mt-1 mb-5 text-sm text-slate-600">{subtitulo}</p>
          {children}
        </div>
      </div>
    </main>
  );
}
