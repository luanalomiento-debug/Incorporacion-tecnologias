import { exigirRol } from "@/lib/auth";
import { Encabezado } from "@/components/Encabezado";

export default async function LayoutPostulante({ children }: LayoutProps<"/postulante">) {
  const perfil = await exigirRol("postulante");

  return (
    <>
      <Encabezado perfil={perfil} enlaces={[{ href: "/postulante", texto: "Vacantes" }]} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
