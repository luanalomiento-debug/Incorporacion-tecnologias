import Link from "next/link";
import { estilos } from "@/components/estilos";

export default function NoEncontrado() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className={`${estilos.tarjeta} max-w-sm text-center`}>
        <h1 className="text-xl font-bold text-slate-900">No encontramos esta página</h1>
        <p className="mt-2 text-sm text-slate-600">
          Puede que la vacante ya no esté disponible o que el enlace sea incorrecto.
        </p>
        <Link href="/" className={`${estilos.boton} mt-5`}>
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
