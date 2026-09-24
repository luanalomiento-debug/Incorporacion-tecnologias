import { exigirRol } from "@/lib/auth";
import { Encabezado } from "@/components/Encabezado";

export default async function LayoutReclutador({ children }: LayoutProps<"/reclutador">) {
  const perfil = await exigirRol("reclutador");

  return (
    <>
      <Encabezado perfil={perfil} enlaces={[{ href: "/reclutador", texto: "Panel" }]} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
