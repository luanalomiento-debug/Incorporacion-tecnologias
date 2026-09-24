// Clases de Tailwind reutilizadas en toda la app, para que se vea uniforme.
export const estilos = {
  boton:
    "inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60",
  botonSecundario:
    "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
  input:
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200",
  etiqueta: "mb-1 block text-sm font-medium text-slate-700",
  tarjeta: "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
  titulo: "text-2xl font-bold text-slate-900",
  error: "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700",
  exito: "rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800",
};
