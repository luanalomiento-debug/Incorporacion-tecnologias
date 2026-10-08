import { exigirRol } from "@/lib/auth";
import { EncabezadoReclutador } from "@/components/reclutador/EncabezadoReclutador";

export default async function LayoutReclutador({ children }: LayoutProps<"/reclutador">) {
  const perfil = await exigirRol("reclutador");

  return (
    <div className="relative flex flex-1 flex-col overflow-clip bg-gradient-to-b from-sky-50 via-white to-white">
      {/* Manchas de color de fondo, solo decorativas */}
      <div aria-hidden className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-32 top-[28rem] h-80 w-80 rounded-full bg-green-300/20 blur-3xl" />
      <EncabezadoReclutador perfil={perfil} />
      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
