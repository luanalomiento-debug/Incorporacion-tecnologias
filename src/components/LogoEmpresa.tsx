import Link from "next/link";
import { EMPRESA } from "@/lib/empresa";

// Logo de la empresa: al tocarlo se vuelve a la página principal.
export function LogoEmpresa({ claro = false }: { claro?: boolean }) {
  return (
    <Link href="/" aria-label={`${EMPRESA}: ir al inicio`} className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-acento text-lg font-bold text-white">
        {EMPRESA.charAt(0)}
      </span>
      <span className={`text-lg font-bold ${claro ? "text-white" : "text-marca"}`}>{EMPRESA}</span>
    </Link>
  );
}
