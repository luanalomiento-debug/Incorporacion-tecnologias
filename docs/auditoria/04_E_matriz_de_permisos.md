# E. Matriz de autenticación, roles y permisos

Fuente de los permisos: políticas RLS, privilegios de tabla y de columna y permisos de ejecución **leídos de la base desplegada** (5/11/2026) y contrastados con las migraciones. No se ejecutó ninguna prueba que modifique datos. Marca [V] salvo indicación.

## E.1 Cómo funciona la autenticación (resumen técnico)

| Aspecto | Implementación | Evidencia |
|---|---|---|
| Registro | `supabase.auth.signUp({ email, password, options: { data: { nombre, apellido } } })`. No se envía rol. Mínimo de 6 caracteres validado en la app | `src/lib/acciones/auth.ts:50-69`, `:61` |
| Perfil automático | Disparador `AFTER INSERT ON auth.users`; el rol se escribe como constante `'postulante'` | `20260924120000_perfiles.sql:44-66`; disparador verificado en la base |
| Inicio de sesión | `signInWithPassword` desde una Server Action; en error, mensaje traducido y genérico; el motivo real se registra en el log del servidor | `auth.ts:29-46` |
| Cierre de sesión | `auth.signOut()` + redirección a `/login` | `auth.ts:86-90` |
| Almacenamiento de contraseñas | Gestionado por Supabase Auth (hash). La aplicación nunca ve ni guarda la contraseña | Diseño de Supabase Auth |
| Token | JWT de Supabase, en cookies manejadas por `@supabase/ssr`; `proxy.ts` lo renueva y valida (`getClaims`) en cada solicitud | `src/lib/supabase/proxy.ts:10-40` |
| Identificación del usuario en cada solicitud | `obtenerSesion()` lee `claims.sub` y consulta `perfiles` con RLS (`cache` evita repetir la consulta en el mismo pedido) | `src/lib/auth.ts:22-36` |
| Determinación del rol | Columna `perfiles.rol` | `auth.ts:28-35` |
| Control en frontend | Los menús de cada rol están separados, pero **no son una barrera**: el control real está en servidor y base | `src/components/*/Nav*.tsx` |
| Control en backend | `exigirRol(rol)` en los 2 layouts de rol y en 13 Server Actions; `obtenerSesion` en `actualizarPerfil` y `/cv/[id]` | `src/lib/auth.ts:40-45` |
| Redirecciones | Sin sesión en `/postulante` o `/reclutador` → `/login`; con sesión en `/login` o `/registro` → `/`; rol incorrecto → `/` | `proxy.ts:52-57`, `auth.ts:43` |
| Configuración propia de Auth (confirmación de email, longitud mínima real de contraseña, vencimiento de sesión, protección de contraseñas filtradas) | **[X]**: no accesible. El asesor de Supabase informa **protección de contraseñas filtradas desactivada** | Asesor de seguridad |

**Cómo se evita que un usuario cambie su propio rol** (cuatro barreras independientes, todas verificadas):
1. `GRANT UPDATE (nombre, apellido) ON perfiles TO authenticated`: el rol no es una columna escribible.
2. Política `perfiles_update_propio`: solo la fila propia.
3. No existe privilegio de `INSERT` ni `DELETE` sobre `perfiles` para `authenticated`/`anon`.
4. El rol no se lee de `user_metadata` (modificable por el usuario) sino de `perfiles`.

## E.2 Matriz rol × recurso × operación

Roles: **anon** (sin sesión), **postulante** (`authenticated` con `rol = 'postulante'`), **reclutador** (`authenticated` con `rol = 'reclutador'`), **servidor** (`service_role`, clave secreta, solo en código de servidor; se salta RLS).
Leyenda: ✔ permitido, ✖ denegado, ◐ condicionado (se explica).

### E.2.1 Tablas

| Recurso | Operación | anon | postulante | reclutador | servidor | Mecanismo de control |
|---|---|---|---|---|---|---|
| `perfiles` | SELECT | ✖ | ◐ solo el propio | ✔ todos | ✔ | Sin privilegios para `anon`; política `perfiles_select_propio_o_reclutador` |
| `perfiles` | INSERT | ✖ | ✖ | ✖ | ✔ (el disparador crea las filas) | Sin privilegio `INSERT`; disparador `SECURITY DEFINER` |
| `perfiles` | UPDATE | ✖ | ◐ propio, solo `nombre` y `apellido` | ◐ propio, solo `nombre` y `apellido` | ✔ | `GRANT UPDATE (nombre, apellido)` + política `perfiles_update_propio` |
| `perfiles` | DELETE | ✖ | ✖ | ✖ | ✔ | Sin privilegio |
| `vacantes` | SELECT | ✖ | ◐ solo `activa = true` | ✔ todas | ✔ | Política `vacantes_select_activas_o_reclutador` |
| `vacantes` | INSERT | ✖ | ✖ | ◐ con `creado_por = su id` | ✖ (no se usa) | Política `vacantes_insert_reclutador` |
| `vacantes` | UPDATE | ✖ | ✖ | ✔ columnas `activa`, `titulo`, `descripcion`, `habilidades`, `informacion_adicional`, `requisitos` | ✖ | Privilegios por columna + política `vacantes_update_reclutador` |
| `vacantes` | DELETE | ✖ | ✖ | ✔ | ✖ | Política `vacantes_delete_reclutador` |
| `cvs` | SELECT | ✖ | ◐ el propio | ✔ todos | ✔ | Política `cvs_select_propio_o_reclutador` |
| `cvs` | INSERT | ✖ | ◐ propio, con `ruta = <id>/cv.pdf`, no reclutador | ✖ | ✖ | Política `cvs_insert_propio` + CHECK `cvs_ruta_propia` |
| `cvs` | UPDATE | ✖ | ◐ propio, columnas `postulante_id`, `ruta_archivo`, `nombre_archivo`, `subido_en` (no las de IA) | ✖ | ✔ (escribe resultados y estados de IA) | Privilegios por columna + política `cvs_update_propio` |
| `cvs` | DELETE | ✖ | ✖ | ✖ | ✖ (solo cascada) | Sin privilegio |
| `postulaciones` | SELECT | ✖ | ◐ las propias | ✔ todas | ✔ | Política `postulaciones_select_propia_o_reclutador` |
| `postulaciones` | INSERT | ✖ | ◐ a su nombre, vacante activa y con CV cargado, no reclutador | ✖ | ✖ | Política `postulaciones_insert_propia` + `GRANT INSERT (vacante_id, postulante_id)` + UNIQUE |
| `postulaciones` | UPDATE | ✖ | ✖ | ◐ solo la columna `etapa` | ✖ | `GRANT UPDATE (etapa)` + política `postulaciones_update_reclutador` + CHECK de etapas |
| `postulaciones` | DELETE | ✖ | ✖ | ✖ | ✖ (solo cascada) | Sin privilegio (el postulante **no puede retirar** su postulación) |
| `afinidades_cv_vacante` | SELECT | ✖ | ✖ | ✔ | ✔ | Política `afinidades_select_reclutador` |
| `afinidades_cv_vacante` | INSERT/UPDATE/DELETE | ✖ | ✖ | ✖ | ✔ | Solo `service_role` tiene el privilegio de escritura |
| `analisis_ia_intentos` | todas | ✖ | ✖ | ✖ | ✔ | RLS activado **sin políticas** (denegación total); privilegios solo para `service_role` |
| `postulacion_movimientos` | SELECT | ✖ | ✖ | ✔ | ✔ | Política `movimientos_select_reclutador` |
| `postulacion_movimientos` | INSERT | ✖ | ✖ | ✖ (lo hace el disparador) | ✔ | Disparador `SECURITY DEFINER`; sin privilegio de escritura para `authenticated` |
| `notas_postulacion` | SELECT | ✖ | ✖ | ✔ | ✔ | Política `notas_select_reclutador` |
| `notas_postulacion` | INSERT | ✖ | ✖ | ◐ con `autor_id = su id` | ✖ | Política `notas_insert_reclutador` + `GRANT INSERT (postulacion_id, texto)` |
| `notas_postulacion` | UPDATE | ✖ | ✖ | ✖ | ✖ | Sin privilegio |
| `notas_postulacion` | DELETE | ✖ | ✖ | ◐ solo las propias | ✖ | Política `notas_delete_propia` |
| `preguntas_entrevista` | SELECT | ✖ | ✖ | ✔ | ✔ | Política `preguntas_select_reclutador` |
| `preguntas_entrevista` | INSERT/UPDATE | ✖ | ✖ | ✖ | ✔ | Solo el servidor (`upsert` en `preguntas.ts`) |

### E.2.2 Archivos (Storage, bucket `cvs`)

| Operación | anon | postulante | reclutador | servidor | Mecanismo |
|---|---|---|---|---|---|
| Listar / leer / enlace firmado | ✖ | ◐ solo su carpeta `<id>/` | ✔ todos | ✔ | Política `cvs_storage_select_propio_o_reclutador`; bucket no público |
| Subir | ✖ | ◐ solo su carpeta | ✖ (política excluye reclutadores) | ✔ | Política `cvs_storage_insert_propio` |
| Reemplazar (`upsert`) | ✖ | ◐ solo su carpeta | ✖ | ✔ | Política `cvs_storage_update_propio` |
| Borrar | ✖ | ✖ | ✖ | ✔ (cron de limpieza) | **No existe política de DELETE** para usuarios |
| Tipo y tamaño | — | PDF y ≤ 5 MB (por MIME declarado) | — | — | `allowed_mime_types = {application/pdf}`, `file_size_limit = 5242880` |

### E.2.3 Funciones, rutas y acciones

| Recurso | anon | postulante | reclutador | Mecanismo |
|---|---|---|---|---|
| RPC `es_reclutador()` (vía `/rest/v1/rpc`) | ✖ | ✔ (devuelve su propio estado) | ✔ | `REVOKE … FROM public, anon`; `GRANT TO authenticated` (necesario para RLS) |
| Resto de funciones `SECURITY DEFINER` | ✖ | ✖ | ✖ | Solo `service_role` puede ejecutarlas |
| `/postulante/**` | ✖ (→ `/login`) | ✔ | ✖ (→ `/`) | `proxy.ts` + layout con `exigirRol("postulante")` |
| `/reclutador/**` | ✖ (→ `/login`) | ✖ (→ `/`) | ✔ | `proxy.ts` + layout con `exigirRol("reclutador")` |
| `/cv/[postulanteId]` | ✖ (→ `/login`) | ◐ solo su CV | ✔ | `obtenerSesion` + RLS de `cvs` y de Storage |
| `/api/limpieza` | ✖ | ✖ | ✖ | Exige `Authorization: Bearer <CRON_SECRET>`; sin secreto configurado devuelve 401 (`route.ts:28-31`) |
| Server Actions del reclutador (13) | ✖ | ✖ (`exigirRol` redirige) | ✔ | `exigirRol("reclutador")` al comienzo de cada una |
| Server Actions `registrarCv` y `postularse` | ✖ | ✔ | ✖ | `exigirRol("postulante")` |

## E.3 Búsqueda de vulnerabilidades de acceso

No se ejecutaron ataques ni pruebas que modifiquen datos; el análisis es por inspección de código y permisos reales.

| Vector | Resultado | Evidencia |
|---|---|---|
| **Escalamiento de privilegios** (volverse reclutador): editar `perfiles.rol` | **Bloqueado** (columna sin permiso de escritura) | Privilegios de columna en `perfiles` |
| Escalamiento: registrarse enviando `rol` en los metadatos | **Bloqueado** (el disparador fija `'postulante'`) | `perfiles.sql:57` |
| Escalamiento: llamar a la función de creación de perfil o de registro de etapa por RPC | **Bloqueado** (sin permiso de ejecución para `anon`/`authenticated`) | Permisos de ejecución verificados |
| **Acceso horizontal:** leer el CV de otro postulante cambiando el identificador en `/cv/<id>` | **Bloqueado** (la consulta a `cvs` y la creación del enlace firmado usan el cliente del usuario con RLS) | `cv/[postulanteId]/route.ts:21-37`; políticas de `cvs` y de Storage |
| Acceso horizontal: leer postulaciones, resultados de IA, notas o preguntas ajenas | **Bloqueado** (RLS) | E.2.1 |
| Acceso horizontal: un postulante leyendo resultados de IA | **Bloqueado** (política solo reclutador); desde la Fase 2 ya no existen columnas de IA en `postulaciones` | Catálogo |
| **Endpoint desprotegido:** `/api/limpieza` | **Protegido** con secreto; comparación no es de tiempo constante (`!==`, `route.ts:29`), riesgo teórico mínimo | `route.ts:28-31` |
| Endpoint desprotegido: Server Actions (cada exportación es invocable por HTTP) | Todas verifican rol o sesión, **salvo** `iniciarSesion`, `registrarse`, `cerrarSesion` que son públicas por naturaleza | A.4 |
| **Validación solo en frontend** | Tipo y tamaño del PDF (cliente + bucket, ver L-8); mínimo de contraseña (cliente y servidor `auth.ts:61`); campos obligatorios de vacante (cliente y servidor `vacantes.ts:28`); longitud de nombre y apellido (cliente y servidor `perfil.ts:22`). El **contenido real** del PDF no se valida | — |
| Enumeración de cuentas | El registro responde "Ya existe una cuenta con ese email" (`auth.ts:12-13`); el inicio de sesión usa un mensaje único (`:10-11`) | L-10 |
| Fuerza bruta / abuso | **No hay limitación de tasa propia**; depende de los límites de Supabase Auth **[X]** | L-6 |
| Cookies de sesión | Las gestiona `@supabase/ssr`; el cliente de navegador necesita leerlas, por lo que normalmente **no son `HttpOnly`** **[X]**: revisar en las herramientas del navegador | L-5 |
| Cabeceras de seguridad (CSP, X-Frame-Options, etc.) | **No configuradas por la aplicación** (`next.config.ts:3-5` vacío) **[N]**; comportamiento de Vercel **[X]** | L-5 |
| Inyección (HTML/JS) | No se usa `dangerouslySetInnerHTML`, `innerHTML` ni `eval` (búsqueda sobre `src/`: 0 resultados); React escapa el contenido | Búsqueda de texto |
| Vulnerabilidades de dependencias | `next@16.3.6` en el rango afectado por avisos críticos (ver L-1) | `npm audit` |

## E.4 Decisiones de diseño con impacto de privacidad

- **Todos los reclutadores ven todos los datos** de todos los postulantes y CV (no hay alcance por vacante ni por equipo). Coherente con una empresa única, pero conviene dejarlo explícito.
- **El postulante puede ver su propia etapa** (incluido "descartado") a través de la API, aunque la pantalla no la muestra hoy.
- **El postulante no puede borrar su CV ni retirar su postulación** (L-12).
