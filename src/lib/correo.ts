import { EMPRESA } from "@/lib/empresa";

// Arma un enlace "mailto:" que abre el programa de correo de la reclutadora con el mensaje
// ya empezado (asunto y saludo). La app no envía el correo: lo revisa y lo manda ella.
export function enlaceCorreo({ email, nombre, puesto }: { email: string; nombre: string; puesto: string }) {
  const asunto = `Tu postulación a ${puesto} en ${EMPRESA}`;
  const cuerpo = `Hola ${nombre},\n\nTe escribimos de ${EMPRESA} por tu postulación a la vacante «${puesto}».\n\n`;
  return `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}
