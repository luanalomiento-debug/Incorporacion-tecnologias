import { exigirRol } from "@/lib/auth";
import { Encabezado } from "@/components/Encabezado";

export default async function LayoutPostulante({ children }: LayoutProps<"/postulante">) {
  const perfil = await exigirRol("postulante");

  return (
    <>
      <Encabezado perfil={perfil} enlaces={[
          { href: "/postulante", texto: "Vacantes" },
          { href: "/postulante/mis-postulaciones", texto: "Mis postulaciones" },
          { href: "/postulante/mi-cv", texto: "Mi CV" },
        ]} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
