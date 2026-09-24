import { cambiarEstadoVacante } from "@/lib/acciones/vacantes";
import { estilos } from "@/components/estilos";

export function BotonEstadoVacante({ id, activa }: { id: string; activa: boolean }) {
  return (
    <form action={cambiarEstadoVacante}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="activa" value={String(!activa)} />
      <button type="submit" className={activa ? estilos.botonSecundario : estilos.boton}>
        {activa ? "Desactivar" : "Activar"}
      </button>
    </form>
  );
}
