import { redirect } from "next/navigation";
import { obtenerSesion, inicioDelRol } from "@/lib/auth";
import { cerrarSesion } from "@/lib/acciones/auth";
import { TarjetaAcceso } from "@/components/TarjetaAcceso";
import { PaginaInicio } from "@/components/PaginaInicio";
import { estilos } from "@/components/estilos";

// Página de entrada: quien no inició sesión ve la página de inicio;
// el resto va a la vista de su rol.
export default async function Inicio() {
  const sesion = await obtenerSesion();

  if (sesion.estado === "sin-sesion") return <PaginaInicio />;
  if (sesion.estado === "ok") redirect(inicioDelRol(sesion.perfil.rol));

  // Hay sesión pero no hay perfil (por ejemplo, un usuario creado antes de la migración).
  return (
    <TarjetaAcceso
      titulo="Tu cuenta no tiene perfil"
      subtitulo="Pedile al administrador que revise tu usuario en Supabase."
    >
      <form action={cerrarSesion}>
        <button type="submit" className={`${estilos.botonSecundario} w-full`}>
          Cerrar sesión
        </button>
      </form>
    </TarjetaAcceso>
  );
}
