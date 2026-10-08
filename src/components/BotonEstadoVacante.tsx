import { cambiarEstadoVacante } from "@/lib/acciones/vacantes";
import { estilosReclutador } from "@/components/reclutador/estilos";

export function BotonEstadoVacante({ id, activa }: { id: string; activa: boolean }) {
  return (
    <form action={cambiarEstadoVacante}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="activa" value={String(!activa)} />
      <button
        type="submit"
        className={`${activa ? estilosReclutador.botonSecundario : estilosReclutador.boton} !px-4 !py-2 text-sm`}
      >
        {activa ? "Desactivar" : "Activar"}
      </button>
    </form>
  );
}
