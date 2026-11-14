# C. Auditoría detallada de los 10 puntos exigidos

Convención: `ruta:línea` apunta al repositorio. Las marcas [V] [C] [P] [N] [X] están definidas en `AUDITORIA_TECNICA_ORT.md`. El detalle completo de cada punto está en las secciones D a J; acá se resume el estado y se dejan las evidencias principales.

---

## C.1 Base de datos: modelo de datos

**Estado general: [V]** (esquema real consultado en el catálogo de PostgreSQL).

- **9 tablas en `public`**, todas con clave primaria `uuid` y RLS activado: `perfiles`, `vacantes`, `cvs`, `postulaciones`, `afinidades_cv_vacante`, `analisis_ia_intentos`, `postulacion_movimientos`, `notas_postulacion`, `preguntas_entrevista`. Inventario con columnas, tipos, claves y restricciones en la sección D.
- **Relaciones:** `auth.users` 1:1 `perfiles`; `perfiles` 1:0..1 `cvs`; `vacantes` N:M `perfiles` resuelta por `postulaciones` (UNIQUE `(vacante_id, postulante_id)`); `afinidades_cv_vacante` es otra tabla asociativa N:M entre `vacantes` y `perfiles` (UNIQUE `(vacante_id, postulante_id)`); `postulaciones` 1:N `postulacion_movimientos` y `notas_postulacion`; `postulaciones` 1:0..1 `preguntas_entrevista`.
- **Cómo se evitan duplicados e inconsistencias:** claves únicas (`postulaciones_unica`, `cvs_postulante_id_key`, `afinidades_cv_vacante_unico`); `CHECK` (afinidad 0 a 100, etapas válidas, rol válido, estado de CV, forma de JSON, ruta del CV coherente con su dueño, "listo" con fecha); claves foráneas con política de borrado definida; disparadores que mantienen datos derivados (`etapa_actualizada_en`, `actualizado_en`, `cerrada_en`, email del perfil, historial de etapas).
- **Controles de consistencia ejecutados sobre los datos reales (conteos):** usuarios sin perfil = 0; perfiles con email distinto al de `auth.users` = 0; filas de `cvs` sin archivo en Storage = 0; archivos de Storage sin fila en `cvs` = 0; postulaciones sin afinidad calculada = 0.
- **Diferencias repositorio vs. base desplegada:** no hay diferencias de estructura en tablas, columnas, restricciones, índices, políticas ni disparadores. Sí hay tres diferencias de *gestión*: (1) el registro de migraciones de Supabase solo tiene 4 entradas de 11 archivos; (2) la migración de seguridad figura con otra versión (`20261105123648` en la base, `20261105130000` en el repositorio); (3) el esquema `respaldo` (9 tablas) existe en la base y no está en las migraciones (se creó con un script manual).
- **Normalización:** el modelo está en 3FN salvo redundancias deliberadas y documentadas en D.8.
- **Archivos frente a metadatos:** el PDF vive en Storage (`cvs/<postulante_id>/cv.pdf`); la tabla `cvs` guarda ruta, nombre, fechas y datos derivados del análisis. Entre ambos **no hay clave foránea** (son sistemas distintos); la coherencia se controla con la restricción `cvs_ruta_propia` y la limpieza diaria.

## C.2 Hosting, arquitectura y despliegue

**Estado general: [V] para la configuración de Vercel y GitHub; [X] para logs y ejecución del cron.**

- Framework real: **Next.js 16.3.6 (App Router) con React 19.2.8 y TypeScript** (`package.json:11-20`). Frontend y backend viven en el **mismo proyecto Vercel**. No hay servidor propio ni máquina virtual.
- Frontend: Server Components + componentes cliente. Backend: Server Actions (`src/lib/acciones`), Route Handlers (`/cv/[postulanteId]`, `/api/limpieza`) y un `proxy.ts` de sesión.
- Despliegue: proyecto `incorporacion-tecnologias` en el equipo `ob-integracion` (Hobby), framework `nextjs`, Node 24.x, funciones en `iad1`. Último despliegue de producción: `dpl_ESG4h8NU…`, estado READY, desde `main` (commit `0f08bac`), creado el 2026-11-05, compilación de ~20 s (`buildingAt` a `ready`).
- Rama de producción: **`main`** (cambio realizado el 5/11/2026; antes era la rama de trabajo). Verificado empíricamente: un push posterior a la rama de trabajo salió como *preview* (`target: null`) y el merge a `main` generó un despliegue `target: production`.
- Dominio: solo `incorporacion-tecnologias.vercel.app` (sin dominio propio).
- Migraciones: **no se aplican con el despliegue**; son manuales (ver H.4).
- Rollback: Vercel conserva los despliegues previos como candidatos de rollback (`isRollbackCandidate: true` en varios). La base **no** tiene rollback automático (ver H.6).
- Si falla una compilación, el despliegue queda en error y el alias de producción sigue apuntando al último despliegue READY (comportamiento documentado de Vercel; **no se produjo ningún despliegue fallido** en los últimos despliegues consultados, todos READY).

## C.3 Autenticación, autorización y roles

**Estado general: [V] en código y en la base; configuración de Auth [X].**

- Registro e inicio de sesión: **Supabase Auth con email y contraseña** (`src/lib/acciones/auth.ts:29-84`). Contraseñas gestionadas por Supabase (hash en `auth.users`; la app nunca las almacena).
- Sesión: JWT en cookies gestionadas por `@supabase/ssr`; `proxy.ts` la renueva en cada solicitud y valida con `getClaims()` (`src/lib/supabase/proxy.ts:38`).
- Rol: columna `perfiles.rol` (`CHECK` en `('postulante','reclutador')`). Se fija en **`'postulante'` de forma fija** en el disparador `crear_perfil_nuevo_usuario` (`20260924120000_perfiles.sql:51-58`); el valor que mande el navegador no se usa. Los reclutadores se crean a mano en Supabase (README, sección 4).
- Un usuario **no puede cambiar su rol**: la base solo le concede `UPDATE (nombre, apellido)` sobre `perfiles` (verificado en la base real: `perfiles → authenticated:UPDATE(apellido), authenticated:UPDATE(nombre)`).
- Control de acceso en capas: (1) `proxy.ts` por sesión; (2) layouts y Server Actions con `exigirRol` (`src/lib/auth.ts:40-45`); (3) RLS y permisos por columna en cada tabla; (4) políticas de Storage.
- Matriz completa rol × recurso × operación en la sección E.
- **Funciones `SECURITY DEFINER`:** `es_reclutador`, `crear_perfil_nuevo_usuario`, `postulaciones_registrar_etapa`, `sincronizar_email_perfil`; todas con `search_path` vacío (`set search_path = ''`). Permisos de ejecución verificados en la base: solo `es_reclutador` es ejecutable por `authenticated` (necesario para RLS); las otras tres solo por `service_role`.
- **Asesor de seguridad de Supabase** (consultado el 5/11/2026): 2 avisos de nivel WARN (`es_reclutador` ejecutable por usuarios autenticados: **intencional**; protección contra contraseñas filtradas desactivada) y avisos INFO de "RLS habilitado sin políticas" en `analisis_ia_intentos` (intencional: solo el servidor la usa) y en las copias del esquema `respaldo`. Un tercer aviso (`postulaciones_registrar_etapa` ejecutable vía API) se corrigió durante la sesión.
- Brechas de autorización encontradas: ver L-3, L-4, L-9, L-12.

## C.4 Backups, recuperación y disponibilidad

**Estado general: respaldo del código [V]; respaldo manual de datos [V]; respaldo automático de la base [X]; respaldo de archivos [N]; respaldo de secretos [N].**

| Pieza | Mecanismo real | Estado |
|---|---|---|
| Código fuente | Historial de Git en GitHub (60 commits en la rama de trabajo, 22 PR en `main`) | [V] |
| Migraciones y configuración de despliegue | En el repositorio (`supabase/migrations`, `vercel.json`) | [V] |
| Base de datos PostgreSQL | **Copia manual** `respaldo.*`: 9 tablas copiadas dentro del **mismo proyecto** con `supabase/scripts/respaldo_antes_de_optimizar.sql` antes de las migraciones del 29/10 (esquema `respaldo` existente, 9 tablas, verificado) | [V] (manual, puntual) |
| Base de datos: backups automáticos del proveedor | El proyecto está en el plan **free**; no hay herramienta para consultar backups ni PITR | [X] (revisar Database → Backups) |
| Archivos PDF (Storage) | Ninguno. El bucket tiene `versioning_status = DISABLED` (verificado) | [N] |
| Variables de entorno y secretos | Viven en Vercel (Sensitive) y en la máquina de desarrollo; no hay copia gestionada | [N] |
| Infraestructura | No hay infraestructura propia; la configuración está en los paneles de Vercel y Supabase | [X] |

- **Máquinas virtuales:** ninguna **[V]** (arquitectura serverless: Vercel + Supabase + API externa).
- **Qué respalda y qué no el respaldo manual:** protege contra errores humanos o migraciones fallidas; **no protege** contra la pérdida del proyecto de Supabase, porque está dentro del mismo proyecto. Y **no incluye los archivos de Storage**.
- Esquema de respaldo apropiado (propuesto, no implementado) en la sección I.3.
- Puntos únicos de falla: un único proyecto de Supabase (base + auth + storage en una región), un único proyecto de Vercel, una única cuenta dueña de Vercel (plan Hobby con un solo miembro) y un único proveedor de IA. Ver I.4.

## C.5 Protección de datos, archivos y APIs

**Estado general: controles de acceso a archivos [V]; controles de privacidad de IA parcialmente [C]/[N].**

- **Storage:** bucket `cvs` **privado**, 5 MB máximo y solo `application/pdf` (verificado en `storage.buckets`); políticas de Storage: insertar solo en la propia carpeta y solo postulantes, actualizar en la propia carpeta, leer la propia carpeta o ser reclutador (tres políticas verificadas; **no hay política de borrado**).
- **Acceso a un CV:** ruta `/cv/[postulanteId]` (`src/app/cv/[postulanteId]/route.ts`): exige sesión, consulta `cvs` con el cliente del usuario (RLS) y crea un enlace firmado con vencimiento de **60 segundos** (`:6`, `:32-37`) y `Cache-Control: no-store` (`:44`).
- **Validación de archivos:** en el navegador (`SubirCv.tsx:26-35`, tipo y 5 MB), en el bucket (MIME declarado y tamaño) y `registrarCv` comprueba que el objeto existe (`acciones/cv.ts:17-18`). **El tipo se valida por el MIME declarado por el cliente, no por el contenido** y `SubirCv.tsx:51` fuerza `contentType: "application/pdf"`: un archivo que no sea PDF con ese encabezado pasaría el bucket (ver L-8).
- **Datos enviados a Anthropic:** el **PDF completo** del CV (que incluye los datos de contacto que contenga) y el texto de las vacantes (`analizar.ts:75-90`, `claude.ts:62-82`). Las instrucciones piden no incluir datos de contacto en el perfil extraído (`claude.ts:19`) y no usar datos personales sensibles para la afinidad (`claude.ts:24`), pero **el PDF entero sale hacia el proveedor**.
- **Aviso al postulante:** existe un texto informativo en el formulario de carga (`SubirCv.tsx:88-91`). **No hay casilla de consentimiento ni política de privacidad** [N].
- **Retención y eliminación:** el CV se conserva mientras exista la cuenta; el postulante **no puede borrar su CV ni retirar una postulación** (no hay políticas DELETE sobre `cvs`, `postulaciones` ni `perfiles`) [N]. El borrado de cuenta se hace desde Supabase y elimina los datos en cascada; el archivo PDF lo elimina la limpieza diaria (`api/limpieza/route.ts:36-51`), **si el cron corre** [X].
- **Prompt injection:** hay una instrucción explícita de tratar el CV como dato (`claude.ts:23`, `:95`), salida con esquema validado (Zod) y filtrado de identificadores (`analizar.ts:93-96`). **La eficacia contra inyecciones reales no se probó en producción** [C]; el riesgo residual es que un texto escondido en un CV sesgue el puntaje.
- **Errores y exposición:** los mensajes mostrados al usuario son genéricos y traducidos (`acciones/auth.ts:8-23`); los errores internos se registran solo con su mensaje (`analizar.ts:139`, `preguntas.ts:49`).

## C.6 Seguridad de credenciales y secretos

**Estado general: [V].**

- **Historial de Git:** se buscaron en **todos los commits** patrones de claves de Anthropic (`sk-ant-…`), clave secreta de Supabase (`sb_secret_…`), clave pública (`sb_publishable_…`), JWT (`eyJhbGciOi…`) y URL de conexión a base de datos con credenciales: **0 coincidencias**. El único archivo `.env*` que se agregó alguna vez es `.env.example`. La cadena `service_role` aparece en 4 commits como **texto** en código/migraciones (nombre del rol, no una clave).
- `.gitignore:34-35` excluye `.env*` salvo `.env.example`.
- `.env.example` contiene solo valores de ejemplo (`sk-ant-xxxx`, etc.).
- Variables (solo nombre, finalidad y alcance; **no se muestran valores**):

| Variable | Finalidad | Clasificación | Dónde se usa | En Vercel (nombre, ámbitos, tipo) |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase | **Pública** (por diseño: llega al navegador) | `src/lib/supabase/config.ts:6` | Solo **Production** (tipo config/encriptada) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave pública de Supabase; sin RLS no da acceso | **Pública** | `src/lib/supabase/config.ts:15` | Production y Preview (tipo Sensitive) |
| `SUPABASE_SECRET_KEY` | Clave secreta (rol `service_role`, se salta RLS) | **Privada, solo servidor** | `src/lib/supabase/admin.ts:9` | Production y Preview (Sensitive) |
| `ANTHROPIC_API_KEY` | Clave de la API de Anthropic | **Privada, solo servidor** | La lee el SDK `@anthropic-ai/sdk` desde el entorno (`claude.ts:58` no la pasa explícitamente) | Production y Preview (Sensitive) |
| `CRON_SECRET` | Autoriza la llamada del cron a `/api/limpieza` | **Privada, solo servidor** | `src/app/api/limpieza/route.ts:28-31` | Production, Preview y Development (Sensitive) |

- `SUPABASE_SECRET_KEY` solo se importa desde un módulo marcado `import "server-only"` (`admin.ts:1`): si se importara desde un componente de cliente, **la compilación fallaría**.
- Logs: los `console.*` del proyecto (7, listados con su línea en L-14) escriben solo mensajes de error, sin claves ni contenido de CV.
- Riesgos residuales: `SUPABASE_SECRET_KEY` no está en el ámbito Development (sin impacto en producción); la clave pública figura como "Sensitive" en Vercel (no afecta). Nunca se revisaron los logs de Vercel por falta de acceso [X].

## C.7 Buenas prácticas de programación

**Estado general: estructura en capas [V]; reglas en un solo lugar [V] con excepciones; pruebas [N].**

- **Estructura real:** `src/app` (rutas y páginas), `src/components` (UI), `src/lib/acciones` (escrituras), `src/lib/ia` (IA), `src/lib/supabase` (clientes), `src/lib/*.ts` (utilidades de dominio: `dashboard.ts`, `etapas.ts`, `filtros.ts`, `tipos.ts`, `auth.ts`).
- **Reglas de negocio en un solo lugar (ejemplos reales):**
  - Umbrales de IA: `src/lib/ia/config.ts:1-35` (modelo, tope diario, mínimos de afinidad, tamaños de lote, tiempos).
  - Etapas y plazos de alerta: `src/lib/etapas.ts` (lista de etapas, `DIAS_SIN_REVISAR`, `DIAS_ESTANCADA`).
  - "Otra vacante sugerida": una sola función `mejorVacanteAlternativa` (`src/lib/ia/sugerencia.ts:9-28`), usada desde `cargarPostulaciones` (`dashboard.ts:98`).
  - Control de rol: `exigirRol` (`src/lib/auth.ts:40-45`), usado por los 2 layouts de rol y 13 Server Actions.
  - Carga paginada: `traerTodo` (`dashboard.ts:32-43`).
  - Reglas replicadas en la base (etapas válidas, afinidad 0–100, unicidad).
- **Incumplimientos de "un solo lugar":** `ES_UUID` está definido 3 veces (`acciones/ia.ts:13`, `acciones/seguimiento.ts:11`, `vacantes/[id]/comparar/page.tsx:10`); la función `texto()` está duplicada (`acciones/auth.ts:25`, `acciones/vacantes.ts:9`); la extracción y validación de campos de vacante se repite entre `crearVacante` (`vacantes.ts:19-29`) y `editarVacante` (`:66-75`); el filtro de "CV elegible para re-análisis" se repite entre `reanalizarPendientes` (`ia.ts:45-52`) y `reanalizarParaVacante` (`ia.ts:89-98`); la lista de campos de formulario de vacante aparece también en `FormularioVacante.tsx`.
- **Separación frontend/backend:** las páginas son Server Components (se ejecutan en el servidor); los 14 componentes de cliente solo disparan Server Actions o manejan UI. **No hay lógica de negocio ni acceso a la base en componentes de cliente, salvo la subida del PDF a Storage** (`SubirCv.tsx:46-52`).
- **Acceso a datos disperso:** las consultas a la base están repartidas en 12 páginas (`src/app/**/page.tsx`, lista en B/`F`), no centralizadas en una capa de datos. Es una decisión de estilo de Next.js, pero dificulta el cambio de una regla de consulta (ver L-15).
- **Funciones o archivos grandes:** `src/app/reclutador/dashboard/page.tsx` (440 líneas) contiene la lógica de cálculo de todos los indicadores dentro del componente de página (`:40-130`); `postulaciones/[id]/page.tsx` (245 líneas) y `postulaciones/ia/page.tsx` (185).
- **Validación de entradas:** UUID validados en las acciones del reclutador (`ia.ts:24`, `seguimiento.ts:20,31,43,54`), longitud de notas (`seguimiento.ts:33`), longitud de nombre y apellido (`perfil.ts:7,22`), mínimo de contraseña de 6 caracteres en la app (`auth.ts:61`). **Sin validar:** longitud de los textos de vacante (ni en la app ni en la base), UUID de `postularse`, `cambiarEstadoVacante`, `editarVacante` y `eliminarVacante` (la base los rechaza si no son UUID válidos).
- **Manejo de errores:** respuestas `{ error }` con mensajes en español; `analizarCv` nunca lanza y deja el CV en estado `error` (`analizar.ts:137-146`). **`cambiarEstadoVacante` ignora el error de la base** (`vacantes.ts:51`).
- **Asincronía y condiciones de carrera:** (a) el tope diario consulta el conteo y luego inserta (`analizar.ts:59-72`): no es atómico, dos subidas simultáneas podrían superar el tope por pocas unidades; (b) un CV reemplazado durante el análisis descarta el resultado viejo (`analizar.ts:48-55`, `:113-119`) [C]; (c) el reemplazo de resultados usa `upsert` y luego borra los de vacantes no comparadas (`:121-135`), sin dejar la persona sin datos.
- **Resultados inesperados de la IA:** esquema Zod (`esquema.ts`), recorte de arrays a 6 elementos (`analizar.ts:99-101`), afinidad acotada a 0–100 y redondeada (`:22-25`), ignora identificadores inventados o repetidos (`:93-96`), controla `refusal` y `max_tokens` (`claude.ts:85-86`), sin reintentos (`maxRetries: 0`, `claude.ts:58`), tiempo máximo de 40 s (`config.ts:32`).
- **Pruebas automáticas:** **no hay** [N]. Calidad estática: `tsc` en modo estricto y ESLint (`eslint.config.mjs`) con las reglas de Next.js y TypeScript; ambos pasan.
- **Dependencias:** 8 directas en producción (`next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`, `@anthropic-ai/sdk`, `zod`, `server-only`) y 7 de desarrollo; ninguna parece sobrante.
- **Código no utilizado:** 5 imágenes de la plantilla de Next.js en `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) sin referencias; dos rutas son solo redirecciones heredadas (`postulante/mi-cv`, `reclutador/dashboard/ia`). Los archivos `Encabezado.tsx`, `DetalleVacante.tsx` y `favicon.ico` se eliminaron el 5/11/2026.
- **Separación configuración/lógica:** buena para los parámetros de IA y etapas (archivos de configuración propios); las variables de entorno se leen en solo 4 lugares de 3 archivos (`config.ts:6` y `:15`, `admin.ts:9`, `limpieza/route.ts:28`) y, de forma implícita, el SDK de Anthropic.
- **Truco para el linter:** `ahoraMs()` (`src/lib/etapas.ts`, al final) existe solo para evitar la regla de pureza de React al llamar a `Date.now()` en una página; es una excepción documentable.

## C.8 Ambientes DEV, QA y PROD

**Estado general: [V]. Existen en la práctica dos entornos, no tres, y comparten la base de datos.**

| Ambiente | Existe | Dónde | Base de datos | Datos |
|---|---|---|---|---|
| DEV | Sí, local de cada integrante | `next dev` con `.env.local` | Existe **un único proyecto de Supabase** en la organización [V]; a qué base apunta cada `.env.local` depende de cada integrante [X] | — |
| QA | Parcial: *previews* de Vercel por rama | `*.vercel.app` por despliegue | Solo existe un proyecto de Supabase. Además `NEXT_PUBLIC_SUPABASE_URL` no está definida para Preview [V], por lo que, **por inferencia**, un preview no podría conectarse a Supabase [C] | — |
| PROD | Sí | `main` → producción en Vercel | Proyecto `OBLIGATORIO-ORT` | Datos de la demo |

Detalle y cómo debería implementarse en H.5.

## C.9 Escalabilidad

**Estado general: análisis [P] basado en el diseño y los datos reales; nada se probó bajo carga.** Detalle en la sección J. Datos reales de partida (conteos): 9 usuarios, 7 CV, 6 vacantes, 6 postulaciones, 25 afinidades, 13 análisis registrados; base de **12 MB**.

## C.10 Stack tecnológico

**Estado general: [V]** (versiones tomadas de `package-lock.json`).

| Tecnología | Versión | Función | Uso |
|---|---|---|---|
| TypeScript | 5.9.3 | Lenguaje | Desarrollo y compilación |
| Next.js (App Router) | 16.3.6 | Framework fullstack | Producción |
| React / React DOM | 19.2.8 | Interfaz | Producción |
| Tailwind CSS (+ `@tailwindcss/postcss`) | 4.3.3 | Estilos | Compilación |
| `@supabase/supabase-js` | 2.117.1 | Cliente de Supabase | Producción |
| `@supabase/ssr` | 0.12.7 | Sesión por cookies en Next.js | Producción |
| `@anthropic-ai/sdk` | 0.134.0 | Cliente de la API de Anthropic | Producción |
| Zod | 4.6.7 | Validación de la respuesta de la IA | Producción |
| `server-only` | 0.0.1 | Impide importar módulos de servidor desde el cliente | Compilación |
| ESLint + `eslint-config-next` | 9.39.5 / 16.3.6 | Calidad de código | Desarrollo |
| `@types/node`, `@types/react*` | 20.x / 19.x | Tipos | Desarrollo |
| `sharp` | 0.35.4 | Procesamiento de imágenes (dependencia de Next.js) | Producción (opcional) |
| PostgreSQL | 17 (versión 17.6.1.166 según la API) | Base de datos | Producción |
| Supabase Auth / Storage | (gestionados) | Usuarios y archivos | Producción |
| Vercel (funciones, Cron, hosting) | (gestionado) | Despliegue | Producción |
| GitHub | — | Repositorio y PR | Desarrollo |
| Claude Code | — | Asistente de programación | Solo desarrollo |
| Modelo de IA | **`claude-haiku-5-5`** (`src/lib/ia/config.ts:5`) | Análisis y preguntas | Producción |

- **Prompting y salida estructurada:** `messages.parse` con `output_config: { effort: "low", format: zodOutputFormat(...) }` (`claude.ts:65-70`, `:109-113`), `max_tokens: 16000`, PDF como bloque `document` en base64 (`:72-80`), sin `temperature` ni `top_p`. Dos esquemas: análisis (`EsquemaAnalisis`) y preguntas (`EsquemaPreguntas`) en `src/lib/ia/esquema.ts`.
- **Hallazgo de seguridad de dependencias:** `npm audit` marca **3 vulnerabilidades (1 crítica en `next`, 2 altas en `sharp` y `source-map-js`)**: `next@16.3.6` está dentro del rango afectado `16.0.0–16.4.0`, corregido en `16.4.1`. Ver L-1.
