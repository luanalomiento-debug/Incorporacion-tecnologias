// Datos de conexión con Supabase, leídos de las variables de entorno.
// Se "limpian" para que un error al copiarlos no rompa el inicio de sesión:
// a la URL se le quitan espacios, barras finales y tramos de más
// (por ejemplo "https://xxx.supabase.co/" o ".../rest/v1" quedan como "https://xxx.supabase.co").
export function urlSupabase(): string {
  const bruta = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  try {
    return new URL(bruta).origin;
  } catch {
    return bruta;
  }
}

export function claveSupabase(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
}
