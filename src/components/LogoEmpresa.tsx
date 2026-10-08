import Link from "next/link";
import { EMPRESA } from "@/lib/empresa";

// Símbolo del logo: un pico de montaña (la "cumbre") con una bandera verde en la punta.
// Solo formas, sin degradados propios, para poder repetirlo en una misma página sin problemas.
export function SimboloCumbre({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-marca to-blue-600 shadow-sm ring-1 ring-white/10 ${className}`}
    >
      <svg viewBox="0 0 48 48" className="h-full w-full">
        {/* montaña de atrás */}
        <path d="M22 48 L35 22 L48 48 Z" fill="#60a5fa" />
        {/* montaña principal: cara clara, cara en sombra y punta nevada */}
        <path d="M0 48 L19 14 L38 48 Z" fill="#dbeafe" />
        <path d="M19 14 L38 48 L25 48 Z" fill="#93c5fd" />
        <path d="M19 14 L12.85 25 L16 22.5 L19 26.5 L22 22.5 L25.15 25 Z" fill="#ffffff" />
        {/* lomada verde al frente */}
        <path d="M0 48 L0 41.5 Q9 38.5 18 44 L23 48 Z" fill="#22c55e" />
        {/* bandera en la cumbre */}
        <path d="M19 14 V5.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M19.8 6 L27 8.6 L19.8 11.2 Z" fill="#22c55e" />
      </svg>
    </span>
  );
}

// Logo completo: símbolo + nombre en dos líneas ("GRUPO" arriba, "Cumbre" abajo).
// Al tocarlo se vuelve a la página principal.
export function LogoEmpresa({ claro = false }: { claro?: boolean }) {
  const [primera, ...resto] = EMPRESA.split(" ");
  const segunda = resto.join(" ");
  return (
    <Link href="/" aria-label={`${EMPRESA}: ir al inicio`} className="flex items-center gap-2.5">
      <SimboloCumbre />
      <span className="flex flex-col leading-none">
        {segunda && (
          <span
            className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.32em] ${claro ? "text-blue-200" : "text-blue-700"}`}
          >
            {primera}
          </span>
        )}
        <span className={`text-xl font-extrabold tracking-tight ${claro ? "text-white" : "text-marca"}`}>
          {segunda || primera}
        </span>
      </span>
    </Link>
  );
}
