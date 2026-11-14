# K. Evidencias para la defensa · L. Problemas priorizados · M. Preguntas del profesor · N. Información no verificable

Regla general para todas las capturas: **ocultar** claves y secretos (valores de variables de entorno, `service_role`, API keys), correos y nombres reales de candidatos, URLs firmadas completas, ids de usuario reales si identifican a alguien, y datos de facturación. Mostrar siempre fecha y hora del sistema cuando sea posible.

---

# K. Evidencias a reunir

## K.1 GitHub
| # | Qué demuestra | Dónde / pantalla | Qué debe verse | Ocultar |
|---|---|---|---|---|
| G1 | Control de versiones y trabajo en equipo | Repo → *Commits* | Historial con autores y mensajes | Correos personales |
| G2 | Flujo de PR y merges a `main` | Repo → *Pull requests* → *Closed/Merged* | PR #4 a #22 fusionados | — |
| G3 | Migraciones versionadas | Carpeta `supabase/migrations/` | 11 archivos con fecha | — |
| G4 | Ausencia de secretos en el repo | `.gitignore` y `.env.example` | `.env*` ignorado, ejemplo sin valores | Cualquier valor real |
| G5 | Rama de producción | Settings → Branches (default `main`) | Rama por defecto y reglas | — |
| G6 | Dependencias vulnerables (honestidad técnica) | Security → Dependabot (si está habilitado) o salida de `npm audit` | Aviso sobre `next` | — |

## K.2 Vercel
| # | Qué demuestra | Dónde | Qué debe verse | Ocultar |
|---|---|---|---|---|
| V1 | Despliegue en producción desde `main` | Project → Deployments | Despliegue *Production* READY con commit de `main` | — |
| V2 | Previews por rama | Deployments → filtro por rama | Despliegues *Preview* | — |
| V3 | Rama de producción configurada | Settings → Environments → Production → Branch Tracking | `main` | — |
| V4 | Variables de entorno (sólo nombres) | Settings → Environment Variables | Nombres y entornos; valor *Sensitive* oculto | Todo valor |
| V5 | Tarea programada | Settings → Cron Jobs | `/api/limpieza` `0 6 * * *`, con historial de ejecución | — |
| V6 | Logs sin datos sensibles | Logs / Runtime Logs | Mensajes de error sin contenido de CV | Cualquier dato personal |
| V7 | Rollback | Deployments → menú ⋯ de un despliegue anterior → *Promote/Instant Rollback* (no ejecutar; sólo mostrar la opción) | Opción disponible | — |
| V8 | Plan | Settings / Billing | Plan Hobby | Datos de pago |

## K.3 Supabase – Base de datos
| # | Qué demuestra | Dónde | Qué debe verse | Ocultar |
|---|---|---|---|---|
| D1 | Modelo de datos | Table Editor o *Database → Schema Visualizer* | 9 tablas y sus relaciones | Filas con datos personales |
| D2 | RLS activa | *Authentication → Policies* (o `select tablename, rowsecurity from pg_tables where schemaname='public'`) | 9 tablas con RLS | — |
| D3 | Políticas por rol | Policies por tabla | `es_reclutador()` y `auth.uid()` en las condiciones | — |
| D4 | Funciones seguras | *Database → Functions* | `search_path` vacío, `SECURITY DEFINER` | — |
| D5 | Advisores de seguridad | *Advisors → Security* | Lista y estado (WARN explicados) | — |
| D6 | Backups | *Database → Backups* | Lo que muestre (puede estar vacío en plan free) | — |
| D7 | Esquema `respaldo` | SQL Editor: `select table_name from information_schema.tables where table_schema='respaldo'` | 9 copias | — |
| D8 | Registro de migraciones | *Database → Migrations* | Sólo 4 de 11 (mostrarlo con honestidad, L-7) | — |
| D9 | Consultas de recuento (sin datos personales) | SQL Editor: `select count(*) …` por tabla | Totales | Cualquier columna con nombre/email |

## K.4 Supabase – Auth
| # | Qué demuestra | Dónde | Qué debe verse | Ocultar |
|---|---|---|---|---|
| A1 | Proveedor email/contraseña | *Authentication → Providers* | Email habilitado | — |
| A2 | Confirmación de email | *Authentication → Providers → Email* | Estado de "Confirm email" | — |
| A3 | Protección contra contraseñas filtradas y longitud mínima | *Authentication → Sign In / Providers → Email* (o Attack Protection) | Estado actual | — |
| A4 | URL de sitio y redirecciones | *Authentication → URL Configuration* | URL de producción | — |
| A5 | Usuarios (existencia, no datos) | *Authentication → Users* | Cantidad y fecha de alta | Emails (taparlos) |
| A6 | Límites de tasa | *Authentication → Rate Limits* | Valores configurados | — |

## K.5 Supabase – Storage
| # | Qué demuestra | Dónde | Qué debe verse | Ocultar |
|---|---|---|---|---|
| S1 | Bucket privado | *Storage → cvs → configuración* | Público: no; 5 MB; MIME `application/pdf` | — |
| S2 | Políticas del bucket | *Storage → Policies* | 3 políticas (select/insert/update), sin delete | — |
| S3 | Estructura por usuario | *Storage → cvs* | Carpetas con uuid | Nombres de archivos reales |
| S4 | Acceso directo denegado | Abrir en incógnito una URL de objeto sin firma | Error 400/404 (no el PDF) | La URL completa |

## K.6 Código fuente (mostrar en el editor, con número de línea)
`src/lib/auth.ts:22-45` (roles) · `src/proxy.ts` y `src/lib/supabase/proxy.ts` (sesión) · `src/lib/supabase/admin.ts` (+ `server-only`) · `src/lib/ia/analizar.ts:29-148` (pipeline de IA) · `src/lib/ia/config.ts` (parámetros) · `src/lib/ia/esquema.ts` (validación) · `src/app/cv/[postulanteId]/route.ts` (URL firmada) · `supabase/migrations/20260924120000_perfiles.sql:23-66` (rol y trigger) · `20260924140000_cvs.sql:81-120` (bucket y políticas).

## K.7 Anthropic Console
| # | Qué demuestra | Dónde | Qué debe verse | Ocultar |
|---|---|---|---|---|
| I1 | Uso real de la IA | Console → Usage | Llamadas por día y modelo `claude-haiku-5-5` | — |
| I2 | Costo real | Console → Usage/Cost | Gasto acumulado | Datos de pago |
| I3 | Clave dedicada y límite de gasto | Console → API Keys / Limits | Nombre de la clave, límite mensual | **El valor de la clave** (nunca mostrarlo) |
| I4 | Política de datos | Documentación/Términos de la API vigentes | Retención y uso de datos | — |

## K.8 Funcionamiento de la aplicación (grabación o capturas con cuentas de prueba)
1. Registro de un postulante de prueba → fila en `perfiles` con rol `postulante`.
2. Login de postulante → vista de postulante; intento de abrir `/reclutador` → redirección.
3. Login de reclutadora → panel; creación de una vacante.
4. Carga de un PDF de prueba (sin datos reales) → "CV guardado".
5. Postulación → aparece en el panel con etapa "nuevo".
6. Análisis de IA: afinidad, "coincide / inferido / falta", resumen.
7. Sugerencia de otra vacante y comparación de candidatos.
8. Cambio de etapa, nota, preguntas de entrevista.
9. Re-análisis para una vacante nueva (matching histórico bajo demanda).
10. Prueba negativa: sesión de postulante intentando `/cv/<id de otro>` → sin acceso.
- **Usar siempre CVs ficticios** creados para la defensa. Hoy la base contiene datos de pruebas del equipo: verificar que no sean datos de terceros antes de proyectar pantallas.

---

# L. Problemas priorizados

Ninguno fue corregido (instrucción: "No corrijas nada todavía"). Escala: CRÍTICO / ALTO / MEDIO / BAJO. Complejidad: S (horas), M (1–2 días), L (varios días).

## L.0 Tabla resumen
| ID | Prioridad | Título | Antes de la defensa |
|---|---|---|---|
| L-1 | CRÍTICO | `next@16.3.6` en rango con vulnerabilidades críticas | Sí |
| L-2 | CRÍTICO | Cron de limpieza puede borrar PDFs válidos (error no comprobado + sin paginación) | Sí |
| L-16 | ALTO | Camino de escritura de IA actual no verificado con Claude real | Sí (probar) |
| L-17 | ALTO | Análisis en lote puede superar el límite de 60 s de la función | Sí (verificar) |
| L-19 | ALTO | Ajustes de Supabase Auth sin verificar (confirmación de email, contraseñas filtradas) | Sí (revisar) |
| L-20 | ALTO | Sin respaldo independiente ni de archivos | Parcial (documentar) |
| L-22 | ALTO | Envío de CV a un tercero sin aviso de privacidad/consentimiento | Sí (texto) |
| L-12 | ALTO | El usuario no puede borrar su CV/postulación/cuenta | No (declarar) |
| L-6 | MEDIO | Sin limitación de tasa propia | No |
| L-4 | MEDIO | Acciones de IA sin tope para reclutadores (abuso de costo) | No |
| L-3 | MEDIO | Todos los reclutadores pueden todo (sin alcance) | No (declarar) |
| L-5 | MEDIO | Sin cabeceras de seguridad; cookies sin verificar | No |
| L-7 | MEDIO | Registro de migraciones incompleto (4 de 11) | No |
| L-8 | MEDIO | PDF validado por MIME declarado | No |
| L-11 | MEDIO | Sin pruebas automatizadas ni CI versionados | No |
| L-13 | MEDIO | Baja física con cascada | No |
| L-21 | MEDIO | Sin ambiente QA con base propia | No |
| L-9 | BAJO | `INSERT` permitido sobre columnas automáticas de `vacantes` | No |
| L-10 | BAJO | Enumeración de cuentas en el registro | No |
| L-14 | BAJO | `console.*` repartidos (7), sin logging estructurado | No |
| L-15 | BAJO | Acceso a datos disperso en páginas | No |
| L-18 | BAJO | No se registra el uso (tokens) de la IA | No |

## L.1 Detalle

### L-1 · CRÍTICO — Dependencia `next` vulnerable
- **Descripción:** `npm audit` informa 3 vulnerabilidades (1 crítica en `next`, 2 altas en `sharp` y `source-map-js`). `next@16.3.6` cae en el rango afectado `16.0.0–16.4.0`; corregido en `16.4.1`.
- **Evidencia:** `package-lock.json` (versión instalada), salida de `npm audit` en la auditoría.
- **Impacto:** depende del aviso concreto (leer el texto de cada advisory); en el peor caso, ejecución o evasión de controles en el servidor.
- **Probabilidad:** media (app pública en internet).
- **Recomendación:** actualizar `next` a ≥ 16.4.1 (y `sharp`/`source-map-js` por `npm audit fix` revisado), compilar, probar el recorrido completo y desplegar. **Atención:** este proyecto usa una versión de Next.js con cambios incompatibles (ver `AGENTS.md`); leer la guía en `node_modules/next/dist/docs/` antes de actualizar.
- **Complejidad:** S–M. **Antes de la defensa:** sí.

### L-2 · CRÍTICO — Cron `/api/limpieza` puede borrar archivos válidos
- **Descripción:** `src/app/api/limpieza/route.ts:37` lee `cvs` sin paginar (`select("ruta_archivo")`) y **no comprueba el error** de la consulta (`const { data: filas }`). Si la consulta falla o supera el máximo de filas por respuesta de PostgREST (1000 por defecto), el conjunto `conCv` queda vacío o incompleto y todos los PDF «no reconocidos» con más de `EDAD_MINIMA_MS` se envían a `storage.remove` (borrado irreversible; no hay versionado del bucket).
- **Evidencia:** `route.ts:36-50`; bucket con `versioning_status = DISABLED`.
- **Impacto:** pérdida irreversible de CVs.
- **Probabilidad:** baja con 7 CVs (el tope no se alcanza) pero **no nula** por el error no comprobado; crece con el volumen. Ejecución real del cron **[X]**.
- **Recomendación:** comprobar `error` y abortar; paginar con `traerTodo`; borrar sólo si el listado de `cvs` fue completo; (opcional) modo "solo informar" antes de borrar.
- **Complejidad:** S. **Antes de la defensa:** sí (o, como mínimo, desactivar el cron hasta corregirlo, decisión del equipo).

### L-3 · MEDIO — Sin alcance por reclutador
- **Descripción:** toda política usa `es_reclutador()`: cualquier reclutador lee y edita todo (vacantes ajenas, postulaciones, CVs). `vacantes.creado_por` existe pero no limita escritura.
- **Evidencia:** políticas `vacantes_update_reclutador`, `*_select_reclutador` (E.2.1).
- **Impacto:** bajo con un solo reclutador (hoy 1); alto si hay equipos.
- **Recomendación:** declararlo como decisión de diseño; si se necesitan equipos, añadir tabla de pertenencia.
- **Complejidad:** M. **Antes de la defensa:** no (explicarlo).

### L-4 · MEDIO — Acciones de IA sin tope para reclutadores
- **Descripción:** `reanalizarCv`, `reanalizarPendientes`, `reanalizarParaVacante` y `generarPreguntas` usan el cliente de servicio y no tienen tope diario (el tope sólo aplica a `origen = "automatico"`); `reanalizarCv` no verifica que el id corresponda a un postulante con CV (lo hace `analizarCv` internamente).
- **Evidencia:** `acciones/ia.ts:22-90`, `analizar.ts:~50`, `seguimiento.ts:52`.
- **Impacto:** gasto no controlado si una cuenta de reclutador se compromete o se usa mal; DoS económico.
- **Recomendación:** tope diario por reclutador y límite de gasto en Anthropic Console (I3).
- **Complejidad:** S. **Antes de la defensa:** conviene fijar el límite de gasto en la consola (acción de panel, sin código).

### L-5 · MEDIO — Cabeceras de seguridad y cookies
- **Descripción:** `next.config.ts` vacío; no hay CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`. Cookies de sesión probablemente sin `HttpOnly` **[X]**.
- **Evidencia:** `next.config.ts:3-5`; cabeceras reales **[X]** (verificar en DevTools → Network).
- **Impacto:** mayor superficie ante XSS/clickjacking. No se encontró uso de `dangerouslySetInnerHTML`.
- **Recomendación:** definir `headers()` en `next.config.ts` y revisar flags de cookie.
- **Complejidad:** M. **Antes de la defensa:** no.

### L-6 · MEDIO — Sin limitación de tasa propia
- **Descripción:** login, registro y acciones sin *rate limiting* (depende de Supabase Auth **[X]**).
- **Impacto/Probabilidad:** abuso, fuerza bruta, costo. Media.
- **Recomendación:** límites en Supabase Auth, y middleware/servicio externo para acciones sensibles; CAPTCHA en registro.
- **Complejidad:** M. **Antes:** no.

### L-7 · MEDIO — Registro de migraciones incompleto
- **Descripción:** sólo 4 de 11 migraciones figuran en `supabase_migrations.schema_migrations`; las demás se aplicaron manualmente.
- **Evidencia:** `list_migrations` vs. `supabase/migrations/` (11 archivos).
- **Impacto:** un entorno nuevo reconstruido con el CLI podría quedar distinto o reaplicar cambios.
- **Recomendación:** registrar las migraciones (o reconstruir el historial con el CLI de Supabase) y adoptar un único método de aplicación.
- **Complejidad:** S–M. **Antes:** no (explicar).

### L-8 · MEDIO — Validación del PDF por MIME declarado
- **Descripción:** el cliente declara `contentType: application/pdf`; Storage valida el MIME declarado, no la firma del archivo.
- **Evidencia:** `SubirCv.tsx:46-52`; `allowed_mime_types` del bucket.
- **Impacto:** un archivo no PDF podría subirse; la IA fallaría o el reclutador descargaría contenido inesperado.
- **Recomendación:** verificar `%PDF-` (cabecera) en `registrarCv` descargando los primeros bytes; antivirus opcional.
- **Complejidad:** S–M. **Antes:** no.

### L-9 · BAJO — `INSERT` sobre columnas automáticas de `vacantes`
- **Descripción:** `authenticated` tiene `INSERT` a nivel de tabla; un reclutador podría fijar `cerrada_en`/`actualizado_en` al crear.
- **Evidencia:** D.10 punto 6.
- **Impacto:** mínimo (sólo reclutadores). **Recomendación:** `REVOKE INSERT` y `GRANT INSERT (columnas)`. **Complejidad:** S. **Antes:** no.

### L-10 · BAJO — Enumeración de cuentas
- **Descripción:** el registro dice "Ya existe una cuenta con ese email" (`auth.ts:12-13`).
- **Recomendación:** mensaje genérico. **Complejidad:** S. **Antes:** no.

### L-11 · MEDIO — Sin pruebas ni CI versionados
- **Descripción:** no hay `test` en `package.json` ni `.github/workflows`; los scripts de prueba usados (Postgres local, servidores simulados, Playwright) se perdieron / no están versionados.
- **Impacto:** regresiones no detectadas; poca reproducibilidad de la evidencia.
- **Recomendación:** pruebas de políticas RLS (SQL) y E2E mínimas con Playwright; workflow con `npm ci`, `lint`, `build`.
- **Complejidad:** M–L. **Antes:** no (reproducir manualmente la matriz de K.8).

### L-12 · ALTO — El usuario no puede borrar su CV, postulación ni cuenta
- **Descripción:** no hay política de DELETE para postulantes en `cvs`, `postulaciones` ni en Storage, ni pantalla de baja de cuenta.
- **Evidencia:** E.2.1, E.2.2; ausencia de acciones correspondientes en `src/lib/acciones/`.
- **Impacto:** incumple el derecho de supresión esperable en protección de datos (RNF02).
- **Recomendación:** acciones "eliminar mi CV", "retirar postulación", "eliminar mi cuenta" con políticas acotadas; procedimiento manual documentado como mitigación.
- **Complejidad:** M. **Antes:** declarar la limitación y el procedimiento manual.

### L-13 · MEDIO — Baja física con cascada
- **Descripción:** `eliminarVacante` borra postulaciones, historial, notas y preguntas (D.4).
- **Recomendación:** baja lógica (`eliminada_en`) o exportación previa. **Complejidad:** M. **Antes:** no (la UI exige confirmación).

### L-14 · BAJO — `console.*` sin estructura
- **Descripción:** 7 llamadas a `console.*` (sólo mensajes de error, sin claves ni contenido de CV).
- **Recomendación:** logger con niveles y correlación. **Complejidad:** S–M.

### L-15 · BAJO — Acceso a datos disperso
- **Descripción:** consultas repartidas en 12 páginas; cambios de reglas obligan a tocar varias.
- **Recomendación:** capa de datos por dominio. **Complejidad:** M.

### L-16 · ALTO — Camino de escritura de IA actual sin verificar con Claude real
- **Descripción:** tras la consolidación (`20261112120000`), el análisis escribe con `upsert` en `afinidades_cv_vacante` y guarda `modelo`; el campo `inferido` del esquema es nuevo. Se probó con servidores simulados, no con la API real en producción. Las 25 filas existentes tienen `modelo` NULL.
- **Impacto:** si falla, la demo de IA no actualiza resultados (el error queda en estado `error`).
- **Probabilidad:** baja–media.
- **Recomendación/prueba:** con una cuenta de prueba, re-analizar un CV y comprobar estado `listo`, `modelo` no nulo y registro en Anthropic Console (K.7).
- **Complejidad:** S. **Antes:** sí.

### L-17 · ALTO — Lotes de re-análisis pueden exceder el límite de la función
- **Descripción:** `after()` ejecuta hasta 10 análisis (concurrencia 5, 40 s máx. por llamada) dentro de funciones con `maxDuration = 60`; dos tandas pueden superar 60 s y cortarse a mitad, dejando CVs en `analizando` hasta que vencen (10 min).
- **Evidencia:** `config.ts:27-32`, `maxDuration` en 5 páginas, `ia.ts`.
- **Impacto:** re-análisis incompleto; reintento manual lo resuelve.
- **Recomendación:** lote de 5 con concurrencia 5 (una sola tanda) o cola en base de datos con procesador programado. **Complejidad:** S (ajuste) / L (cola). **Antes:** sí, probar con 10 CVs reales o reducir el lote.

### L-18 · BAJO — No se registra el uso de tokens
- **Descripción:** la respuesta del SDK trae `usage` y no se guarda; no se puede calcular el costo por llamada desde la base.
- **Recomendación:** columnas `tokens_entrada/salida` en `analisis_ia_intentos`. **Complejidad:** S.

### L-19 · ALTO — Ajustes de Auth sin verificar
- **Descripción:** el asesor de Supabase marcó **protección contra contraseñas filtradas desactivada**; la contraseña mínima de la app es 6; la confirmación de email y los límites de tasa **[X]**.
- **Recomendación:** revisar en el panel (K.4) y activar lo que corresponda.
- **Complejidad:** S (panel). **Antes:** sí (revisar y documentar).

### L-20 · ALTO — Sin respaldo independiente ni de archivos
- Ver C.4/I.2. Los PDFs no tienen copia; el respaldo manual está en el mismo proyecto.
- **Recomendación:** plan de backup propuesto en I.2. **Complejidad:** M. **Antes:** al menos revisar K.D6 y exportar un `pg_dump` manual de la base.

### L-21 · MEDIO — Sin ambiente QA con base propia
- Ver C.8/H.5. **Complejidad:** M. **Antes:** no.

### L-22 · ALTO — Transferencia del CV a un tercero sin aviso ni consentimiento registrado
- **Descripción:** el único texto es el aviso de `SubirCv.tsx` ("se analiza con inteligencia artificial… la decisión final la toma una persona"); no hay política de privacidad, consentimiento registrado ni mención de que el PDF sale hacia Anthropic en EE. UU.
- **Impacto:** riesgo legal/ético (RNF02).
- **Recomendación:** texto de privacidad y casilla de consentimiento registrada. **Complejidad:** S–M. **Antes:** sí (al menos el texto).

---

# M. Preguntas técnicas que podría hacer el profesor (con respuesta honesta basada en la evidencia)

1. **¿Qué impide que un postulante se vuelva reclutador?** No tiene permiso de escritura sobre `perfiles.rol` y el disparador fuerza `postulante` al registrarse (`perfiles.sql:57`). Los permisos de columna se verificaron en el catálogo.
2. **¿Qué pasa si cambio el id en `/cv/<id>`?** La consulta a `cvs` y la URL firmada usan la sesión del usuario: RLS y política de Storage devuelven vacío; sin acceso.
3. **¿Dónde está la clave de la IA y quién puede verla?** En variables de entorno de Vercel (marcadas como sensibles), solo código de servidor; el código está protegido con `server-only`; no aparece en el historial de Git.
4. **¿Qué datos salen hacia la IA?** El PDF completo y el texto de las vacantes, hacia Anthropic. Reconocemos que falta el aviso de privacidad completo (L-22).
5. **¿El puntaje de afinidad es objetivo?** No: lo estima un modelo de lenguaje con criterios del prompt; es auditable por los motivos guardados; la decisión final es humana.
6. **¿Qué pasa si Claude falla o responde mal?** La respuesta se valida con Zod; ante error el CV queda en `error` y se puede reintentar; ids inventados se filtran.
7. **¿Cómo se evita el *prompt injection* desde un CV?** Con la instrucción de tratar CV y vacantes como datos, esquema de salida estricto y sin herramientas ni acciones disponibles para el modelo. No es una garantía absoluta.
8. **¿Hay backups?** Respaldo manual en el mismo proyecto (no independiente) y código en GitHub; backups automáticos del proveedor sin verificar; los PDFs no tienen copia (L-20).
9. **¿Hay QA?** Solo previews; no hay base de QA (L-21). Propuesta en H.5.
10. **¿Cómo escala a 1.000 o 100.000 usuarios?** Ver J: cola de trabajos, agregaciones en SQL, límites de los planes y costo de IA lineal.
11. **¿Cuánto cuesta la IA por CV?** Se mide con la consola de Anthropic (ver J.3); no se fija un precio sin comprobarlo.
12. **¿Por qué Supabase y Vercel?** Auth, RLS, Storage y Postgres integrados; despliegue simple desde GitHub; plan gratuito para prototipo. Contrapartida: dependencia de proveedor y límites de plan.
13. **¿Cómo se despliega un cambio?** PR → merge a `main` → Vercel; las migraciones se aplican a mano antes (L-7).
14. **¿Qué pasa si se borra una vacante?** Se borran en cascada postulaciones, notas y preguntas (L-13); la UI pide confirmación.
15. **¿Qué sabemos que NO funciona o no está probado?** Ver L-1, L-2, L-16, L-17 y la sección N.
16. **¿Qué herramientas de IA se usaron para programar y qué parte es humana?** Claude Code escribió y propuso; las decisiones y revisiones fueron del equipo; 35 de 60 commits figuran con autor Claude.
17. **¿Cumple con la ley de datos personales?** No se afirma cumplimiento; faltan consentimiento, política de retención y derecho de supresión (L-12, L-22).

---

# N. Información no verificable desde esta auditoría (y cómo comprobarla)

| # | Dato | Por qué no se pudo verificar | Cómo comprobarlo (pantalla) |
|---|---|---|---|
| N1 | Ejecución real del cron `/api/limpieza` y su historial | La API de Vercel no expuso logs (403/404) | Vercel → Settings → Cron Jobs / Logs |
| N2 | Logs de ejecución y errores en producción | Runtime logs devolvieron 403 | Vercel → Logs |
| N3 | Que la URL de producción responda | El sandbox bloquea `*.vercel.app` | Abrir desde el navegador |
| N4 | Cabeceras HTTP reales y flags de cookies | Sin acceso HTTP | DevTools → Network / Application → Cookies |
| N5 | Confirmación de email, contraseñas filtradas, límites de tasa | No hay API para leerlos | Supabase → Authentication |
| N6 | Backups automáticos / PITR del proyecto | Sin herramienta de lectura | Supabase → Database → Backups |
| N7 | Integración GitHub–Supabase activa | No consultable | Supabase → Integrations |
| N8 | Protección de la rama `main` | Sin acceso a ajustes de GitHub | GitHub → Settings → Branches |
| N9 | Región de las funciones de Vercel y límite efectivo de duración | No consultado | Vercel → Settings → Functions |
| N10 | Resultado de un análisis real con el código actual | Requiere llamar a Claude (gasto, datos) | Re-analizar un CV de prueba (L-16) |
| N11 | Condiciones de retención de datos de Anthropic para la cuenta | Depende de la cuenta/contrato | Anthropic Console / términos |
| N12 | Variables de entorno de cada integrante en DEV | Locales a cada máquina | Preguntar al equipo (sin mostrar valores) |
| N13 | Rendimiento y límites bajo carga | No se hicieron pruebas de carga | Prueba controlada (J) |
| N14 | Precios de planes y de la IA | No se inventan; cambian | Páginas oficiales de precios |
