# F. Flujos técnicos (A–J)

Leyenda de estado: **[V]** verificado · **[C]** código, no verificado en producción · **[P]** planificado · **[N]** no implementado · **[X]** no verificable.
Todas las rutas son relativas a la raíz del repositorio. Las líneas corresponden al estado de la rama de trabajo al momento de la auditoría.

Nota de método: lo que figura como **[V]** se comprobó contra el catálogo real de Supabase (consultas de solo lectura) o contra la API de GitHub/Vercel. El recorrido funcional completo de la app se probó antes en un entorno local con servidores simulados (scripts no versionados, ver L-11), por lo que el comportamiento de extremo a extremo en producción queda como **[C]** salvo que se indique otra cosa.

---

## F.A Registro de usuario — [C]

| Aspecto | Detalle |
|---|---|
| Componente | Página `src/app/registro/page.tsx` (formulario) → Server Action `registrarse` (`src/lib/acciones/auth.ts:50`) |
| Validaciones | Campos obligatorios y contraseña ≥ 6 caracteres (`auth.ts:~58-63`). No valida formato de email en el servidor (lo hace Supabase Auth). Sin validación de complejidad de contraseña [N] |
| Llamada | `supabase.auth.signUp({ email, password, options: { data: { nombre, apellido } } })` con el cliente de servidor |
| Qué se guarda | Fila en `auth.users` (Supabase). El disparador `al_crear_usuario` (`supabase/migrations/20260924120000_perfiles.sql:44-66`) crea la fila en `public.perfiles` con rol `postulante` forzado: **ignora cualquier rol enviado en los metadatos** |
| Rol | Siempre `postulante`. Las cuentas de reclutador se crean/ascienden manualmente en la base (no hay pantalla de alta de reclutadores [N]) |
| APIs externas | Supabase Auth (y su servicio de email si la confirmación está activa) |
| Errores | `traducirError` convierte los mensajes de Supabase a español; se anota `console.error` con el mensaje (sin contraseñas) |
| Resultado | Si hay sesión: `redirect("/")`; si requiere confirmar email: mensaje "Te enviamos un email". Si la confirmación está activa **[X]** (ajuste de Auth en el panel) |
| Límite | Sin rate limiting propio (L-6); depende de los límites de Supabase Auth **[X]** |

## F.B Inicio de sesión y redirección por rol — [C]

1. `iniciarSesion` (`auth.ts:29`) → `signInWithPassword`. Cookies de sesión las escribe `@supabase/ssr` a través de `src/lib/supabase/server.ts`.
2. `redirect("/")`. `src/app/page.tsx` llama a `obtenerSesion()` (`src/lib/auth.ts:22`) y redirige a `/reclutador` o `/postulante` según `perfiles.rol`.
3. En cada solicitud, `src/proxy.ts` → `src/lib/supabase/proxy.ts` renueva el token y redirige a `/login` si no hay claims; las rutas públicas son solo `/login` y `/registro`.
4. Los layouts `src/app/reclutador/layout.tsx` y `src/app/postulante/layout.tsx` llaman a `exigirRol(...)` (`auth.ts:40`): si el rol no coincide, redirigen a `/`.
- Error de credenciales: mensaje traducido; `console.error("Error de login: …")`.
- Cierre: `cerrarSesion` (`auth.ts:86`) → `signOut` + `redirect("/login")`.
- Atributos de cookies (HttpOnly, Secure, SameSite) **[X]**: los define `@supabase/ssr` por defecto y no se verificaron en producción (L-5).

## F.C Publicación de una vacante — [C]

| Aspecto | Detalle |
|---|---|
| Componente | `src/app/reclutador/vacantes/nueva/page.tsx` → `crearVacante` (`src/lib/acciones/vacantes.ts:13`) |
| Permiso | `exigirRol("reclutador")` + política RLS de inserción en `vacantes` (`es_reclutador()`) |
| Validaciones | Título, descripción, requisitos y habilidades obligatorios; `informacion_adicional` opcional. Restricciones de longitud/no vacío en la tabla (ver D) |
| Tabla | `public.vacantes` (`creado_por = perfil.id`, `activa = true` por defecto); disparador `vacantes_registrar_cambios` registra cambios |
| Edición/estado/baja | `editarVacante` (`:59`), `cambiarEstadoVacante` (`:44`), `eliminarVacante` (`:93`, baja física con cascada, L-13) |
| Efecto sobre la IA | Una vacante nueva **no** dispara análisis. Los CVs ya cargados se comparan con ella recién cuando la reclutadora pulsa "Re-analizar" (`reanalizarParaVacante`, `acciones/ia.ts:72`) o un postulante sube un CV nuevo |
| Resultado | `redirect("/reclutador/vacantes/{id}")` |

## F.D Carga del CV — [C]

1. **Navegador** (`src/components/SubirCv.tsx`): valida tipo (`application/pdf`) y tamaño (≤ 5 MB, `TAMANO_MAXIMO_CV`) del lado cliente (comodidad, no seguridad).
2. **Subida directa a Storage** con el cliente de navegador: `supabase.storage.from("cvs").upload(rutaCv(postulanteId), archivo, { upsert: true, contentType: "application/pdf" })` (`SubirCv.tsx:46-52`). La ruta es fija por persona (`{uuid}/cv.pdf`, `src/lib/tipos.ts`), de modo que reemplazar sobrescribe.
3. **Control real en el servidor de Storage**: bucket `cvs` privado, límite 5 MB, MIME permitido `application/pdf`, 3 políticas (insert/update/select) que exigen que la primera carpeta sea `auth.uid()`; **sin política de borrado** [V, `supabase/migrations/20260924140000_cvs.sql:81-120` y catálogo].
4. **Server Action `registrarCv`** (`src/lib/acciones/cv.ts:12`): `exigirRol("postulante")`, verifica con `storage.exists(ruta)`, hace `upsert` en `cvs` (`onConflict: postulante_id`), `revalidatePath`.
5. El disparador `cvs_al_reemplazar` reinicia el estado de análisis cuando cambia el archivo.
6. `after(() => analizarCv(perfil.id, "automatico"))` encola el análisis en segundo plano (ver F.F).
- Limitación: el tipo PDF se valida por el MIME declarado, no por el contenido (L-8).
- Errores: mensajes claros al usuario; el análisis nunca bloquea la carga.

## F.E Postulación a una vacante — [C]

- UI: `src/app/postulante/vacantes/[id]/page.tsx` → botón → `postularse` (`src/lib/acciones/postulaciones.ts:10`).
- Validaciones en la acción: rol postulante; existencia de CV en `cvs`.
- Reglas en la base (no sólo en la app): restricción única `(vacante_id, postulante_id)` → código `23505` → "Ya te postulaste"; política de inserción exige vacante activa, CV cargado y `postulante_id = auth.uid()` (`20260924150000_postulaciones.sql`). 
- Tablas: `postulaciones` (etapa inicial por defecto), `postulacion_movimientos` (trigger `postulaciones_registrar_etapa`).
- La postulación **no dispara** una llamada a IA propia: el análisis ocurre al cargar el CV. Un postulante nuevo a una vacante creada después no tendrá afinidad hasta el re-análisis (limitación funcional).
- El postulante **no ve** puntajes de afinidad: ninguna página bajo `src/app/postulante/` consulta `afinidades_cv_vacante` (verificado con búsqueda en el código) y la política de lectura de esa tabla es sólo para reclutadores [V catálogo].

## F.F Envío del CV a la IA — [C] (cadena de escritura nueva: no verificada con Claude real en producción)

Función central `analizarCv(postulanteId, origen)` (`src/lib/ia/analizar.ts:29`). Orden exacto:
1. Cliente administrador (`crearClienteAdmin`, `service_role`; sólo servidor, protegido con `server-only`).
2. Lee `cvs` (ruta del archivo y versión `subido_en`).
3. **Tope diario**: sólo si `origen = "automatico"` cuenta filas de `analisis_ia_intentos` de las últimas 24 h; si ≥ 5 marca `error` y sale (`TOPE_DIARIO_POR_PERSONA`, `config.ts:8`). Las acciones de la reclutadora no tienen este tope (sólo el lote de 10).
4. Inserta un intento y marca `analisis_estado = 'analizando'` (con condición `subido_en` para no pisar una versión nueva).
5. Descarga el PDF del bucket privado y lo convierte a base64.
6. Trae hasta 30 vacantes activas más recientes (`MAX_VACANTES_POR_ANALISIS`).
7. `pedirAnalisis` (`src/lib/ia/claude.ts:52`): SDK `@anthropic-ai/sdk` 0.134.0, modelo `claude-haiku-5-5` (`config.ts:5`), `messages.parse` con `zodOutputFormat(EsquemaAnalisis)` (`esquema.ts:5`), `effort: "low"`, `max_tokens: 16000`, `maxRetries: 0`, timeout 40 s; el PDF viaja como bloque `document` base64. Las instrucciones de sistema declaran que CV y vacantes son datos y no instrucciones (defensa básica contra *prompt injection*).
8. Filtra ids de vacantes inventados o repetidos, recorta listas a 6 elementos, acota la afinidad a 0–100 (`limitarAfinidad`).
9. Guarda en `cvs` el perfil estructurado, resumen y estado `listo` (condicionado a que el CV no haya sido reemplazado).
10. `upsert` en `afinidades_cv_vacante` (clave `vacante_id,postulante_id`, columnas `afinidad`, `analisis` jsonb con `coincide / inferido / falta / conclusion`, `modelo`) y luego borra las filas de vacantes que ya no se compararon.
- Errores: `try/catch` global; se anota sólo el mensaje (nunca el CV) y el CV queda en `error`. Un análisis "analizando" más de 10 minutos se considera vencido (`MINUTOS_ANALISIS_VENCIDO`).
- Qué datos salen del sistema: el PDF completo del CV y el texto de las vacantes, hacia Anthropic. **No** se envían nombre/email como campos separados, pero el PDF puede contenerlos (ver I.4).
- Estado en producción: la tabla `afinidades_cv_vacante` tiene 25 filas (7 CVs) con `modelo` NULL (analizadas antes de agregar la columna) [V]; el nuevo camino de escritura (con `modelo`) no se comprobó con una llamada real [X] → ver problema L-16 / paso de verificación en K.

## F.G Resultado de afinidad y sugerencias — [C]

- Almacén único: `afinidades_cv_vacante` (consolidación "una sola fuente", migración `20261112120000_resultados_ia_una_sola_fuente.sql`).
- Función pura `mejorVacanteAlternativa` (`src/lib/ia/sugerencia.ts`): sugiere otra vacante abierta si afinidad ≥ 60 y supera a la de postulación por ≥ 15 puntos. Se calcula al mostrar, no se guarda.
- Umbrales: lista de candidatos sugeridos ≥ 50, máximo 5 por puesto, "buen match" ≥ 70 (`config.ts:14-35`).
- Presentación: sólo páginas del reclutador (`reclutador/postulaciones/ia`, `dashboard`, detalle de postulación).

## F.H Consulta del reclutador — [C]

- Rutas: `/reclutador/dashboard` (centro estratégico), `/reclutador/postulaciones` (listado con filtros `src/lib/filtros.ts`), `/reclutador/postulaciones/[id]` (detalle: CV por URL firmada, afinidad, etapas, notas, preguntas), `.../comparar`, `/reclutador/vacantes`.
- Acceso a datos: cliente con la sesión del usuario → RLS (`es_reclutador()`); paginación del lado servidor con `traerTodo` (`src/lib/dashboard.ts:32`, páginas de 1000 filas).
- CV: Route Handler `src/app/cv/[postulanteId]/route.ts` verifica rol de reclutador y genera URL firmada de 60 s (`createSignedUrl`), responde con redirección; el PDF nunca es público.
- Etapas: `cambiarEtapa` (`acciones/seguimiento.ts:18`), notas `agregarNota/eliminarNota`; sólo reclutadores; histórico en `postulacion_movimientos` (sólo lectura, sin políticas de escritura para usuarios).

## F.I Matching histórico (CV frente a vacantes nuevas) — [C] parcial

- Mecanismo: botón **"Re-analizar CVs"** (`reanalizarPendientes`, `acciones/ia.ts:35`) y **"Re-analizar para esta vacante"** (`reanalizarParaVacante`, `:72`). Procesan un lote de 10 con concurrencia 5 en segundo plano (`after`).
- Es un proceso **manual** (disparado por la reclutadora) y de **un solo lote por clic**; no hay cola persistente ni ejecución automática [N]. No existe comparación de vacantes nuevas contra CVs de personas no postuladas sin ese botón, aunque sí contra todos los CVs cargados (el análisis es contra todas las vacantes activas).
- Costo: una llamada a Claude por CV y por clic, independiente del número de vacantes (hasta 30 en el mismo prompt).

## F.J Preguntas de entrevista — [C]

- `generarPreguntas` (`acciones/seguimiento.ts:52`): `exigirRol("reclutador")`, UUID válido, comprueba con la sesión de la reclutadora que la postulación existe y es visible (RLS), luego `generarPreguntasEntrevista` (`src/lib/ia/preguntas.ts:8`) con cliente administrador.
- Entradas: PDF del CV, vacante, análisis previo (recortado). Salida validada con `EsquemaPreguntas` (6–8 preguntas con `para_verificar`). Prompt prohíbe preguntar por datos personales ajenos al puesto (edad, género, religión, salud, etc.).
- Guardado: `upsert` en `preguntas_entrevista` (una fila por postulación; `modelo`, `generado_en`). Política de lectura: sólo reclutadores.
- Sin tope diario propio [N]: cada clic llama a Claude.
