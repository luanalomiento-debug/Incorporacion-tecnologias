# H. Despliegue y ambientes · I. Seguridad, backups y protección de datos · J. Escalabilidad y costos

Estados: **[V]** verificado · **[C]** código, no verificado en producción · **[P]** planificado/propuesto · **[N]** no implementado · **[X]** no verificable.

---

# H. Despliegue y ambientes

## H.1 Recorrido real de un cambio hasta producción — [V]
1. Cambio en la rama de trabajo (`claude/audit-recruitment-app-ir583k`), escrito con Claude Code.
2. `git push` → la integración Vercel–GitHub genera un **despliegue de *preview*** automático (verificado con un push de prueba).
3. Pull request hacia `main` y **merge** por la API de GitHub (19 PR fusionados, #4 a #22).
4. Al fusionar en `main` (rama de producción desde el 5/11/2026), Vercel construye y publica **producción** (verificado con el merge del PR 21).
5. **Migraciones de base de datos:** *no* forman parte del despliegue. Se aplican a mano en el SQL Editor de Supabase (o con el conector de Supabase) y sólo 4 de 11 quedaron en el registro `supabase_migrations` (L-7). No existe un paso automático que ejecute `supabase/migrations/` en cada despliegue.
6. **Variables de entorno:** se cambian en el panel de Vercel; requieren un nuevo despliegue para tomar efecto.

Resultado: **el código y el esquema de la base pueden desincronizarse** (un despliegue de código que espera una columna que aún no existe falla en ejecución). Mitigación actual: orden manual "migración primero, merge después" (se aplicó en la práctica, pero depende de la disciplina humana).

## H.2 Qué corre y dónde — [V/C]
| Pieza | Dónde | Evidencia |
|---|---|---|
| Aplicación (SSR, Server Actions, Route Handlers) | Vercel Functions (Node.js, plan Hobby) | `package.json` scripts `build/start`; API de Vercel |
| Tarea diaria de limpieza | Vercel Cron `0 6 * * *` (UTC) → `GET /api/limpieza` | `vercel.json`; `src/app/api/limpieza/route.ts` |
| Base, Auth, Storage | Supabase (proyecto `OBLIGATORIO-ORT`, plan free, us-east-1, Postgres 17) | API de Supabase |
| IA | API de Anthropic (externa, por internet) | `src/lib/ia/claude.ts` |
| Región de las funciones de Vercel | **[X]** (no consultada; afecta latencia contra us-east-1) | |

Duración máxima de función: `export const maxDuration = 60` en 5 páginas y en `/api/limpieza` (`postulante/perfil`, `reclutador/vacantes/[id]/postulaciones`, `reclutador/postulaciones/[id]`, `.../ia`, `.../postulaciones`). El tope efectivo depende del plan **[X]**; el análisis en segundo plano usa `after()` dentro de esas funciones, de modo que un análisis (hasta 40 s por llamada) debe terminar dentro del límite de la función que lo originó. Un lote de 10 CVs con concurrencia 5 son dos tandas: ~80 s en el peor caso, **posible exceso del límite de 60 s** (L-17).

## H.3 Control de calidad previo al despliegue — [N]
- No hay `.github/workflows` (sin CI en GitHub). Vercel ejecuta `next build` (que incluye comprobación de tipos de TypeScript y, según configuración, lint) en cada despliegue.
- No hay script de pruebas en `package.json` ni carpeta de tests versionada (L-11). Las pruebas realizadas (Postgres local + servidores simulados de Supabase/Claude + Playwright) **no están en el repositorio**.
- No hay protección de la rama `main` verificable desde esta auditoría **[X]** (revisar Settings → Branches).

## H.4 Rollback — [V] mecanismo / [P] procedimiento
- Aplicación: Vercel conserva despliegues anteriores; el botón *Promote/Rollback* del panel (o `request_rollback`) restaura una versión previa al instante. También sirve `git revert` + merge.
- Base de datos: **no hay rollback automático**; las migraciones son sólo "hacia adelante". El respaldo `respaldo.*` permite restaurar datos de antes de las migraciones del 29/10 y del 5/11, no de estados posteriores.
- Un rollback de código puede dejar de ser compatible con el esquema nuevo (p. ej. tras la consolidación `20261112120000`).

## H.5 Ambientes DEV / QA / PROD — situación y propuesta
Situación real (ver C.8): un único proyecto de Supabase, *previews* sin variables de Supabase, producción = `main`. **No existe un ambiente QA con base propia.**

Propuesta mínima [P] (no implementada): (1) segundo proyecto de Supabase gratuito "QA/STAGING"; (2) variables de entorno de *Preview* apuntando a QA y de *Production* a PROD (Vercel permite definirlas por entorno); (3) migraciones aplicadas primero a QA; (4) datos de prueba ficticios sólo en QA. Complejidad: media; costo: ninguno en planes gratuitos (hasta el límite de proyectos de la organización).

## H.6 Variables de entorno (sólo nombre, propósito, clasificación)
Ver tabla completa en C.6. Resumen: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (públicas por diseño; el acceso lo limita RLS); `SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET` (privadas, solo servidor). Ningún valor se reproduce en este informe.

---

# I. Seguridad, backups y protección de datos

## I.1 Resumen de controles existentes
| Control | Estado | Evidencia |
|---|---|---|
| RLS activada en las 9 tablas | [V] | Catálogo (`pg_class.relrowsecurity`) |
| Permisos por columna (impiden escalar de rol y alterar campos de IA) | [V] | Catálogo; E.3 |
| Funciones `SECURITY DEFINER` con `search_path` vacío | [V] | Catálogo; D.7 |
| Bucket privado, 5 MB, solo PDF, sin borrado, URL firmada 60 s | [V] | Catálogo; `cv/[postulanteId]/route.ts` |
| Clave de servicio solo en servidor (`server-only`) | [C] | `src/lib/supabase/admin.ts` |
| Validación de salida de IA con Zod; ids de vacantes filtrados | [C] | `analizar.ts`, `esquema.ts` |
| Instrucción anti *prompt injection* | [C] | `claude.ts` |
| Tope diario de análisis automáticos | [C] | `analizar.ts:~50-62` |
| Cron protegido con `CRON_SECRET` | [C] | `limpieza/route.ts` |
| Logs sin contenido de CV | [C] | `console.error` con `mensajeDe(e)` |
| Secretos fuera del código y del historial de Git (búsqueda de patrones en 60 commits sin hallazgos) | [V] | Búsqueda realizada en la auditoría |
| Cabeceras de seguridad (CSP, HSTS propia, X-Frame-Options) | [N] | Ausentes en `next.config` (L-5) |
| *Rate limiting* propio | [N] | L-6 |
| MFA, recuperación de contraseña | [N] | |
| Auditoría de acciones de usuarios | Parcial | Solo etapas (`postulacion_movimientos`) |

## I.2 Backups y recuperación
Detalle de estado en C.4. Resumen: código [V]; copia manual en el mismo proyecto [V]; backups automáticos de Supabase **[X]** (plan free: según la documentación del proveedor los backups diarios/PITR dependen del plan; **comprobar** en Database → Backups); PDFs sin respaldo [N].

**Objetivos realistas hoy (sin inventar cifras del proveedor):** RPO = desde el último respaldo manual (días a semanas) y RTO = horas con intervención humana. Para la demo es aceptable; para producción real no.

**Esquema de backup propuesto [P] (no implementado):**
1. Exportación periódica (`pg_dump` con el CLI de Supabase) a almacenamiento externo cifrado, guardada con retención definida.
2. Copia de los PDFs del bucket a otro almacenamiento (script con la API de Storage).
3. Prueba de restauración trimestral en un proyecto de QA.
4. Gestor de secretos o copia cifrada de variables de entorno.
Complejidad: media. Costo: depende del almacenamiento elegido y del plan de Supabase (consultar precios vigentes).

## I.3 Protección de datos personales
- **Datos tratados:** nombre, apellido, email, CV completo (PDF con posibles datos sensibles: dirección, teléfono, fecha de nacimiento, foto), notas de evaluación y puntajes de IA.
- **Quién accede:** el propio postulante (su perfil y CV); reclutadores (todo). Los puntajes de afinidad **no** son visibles para el postulante [V].
- **Transferencia a terceros:** el PDF completo se envía a Anthropic para cada análisis y para generar preguntas. Debe constar en el aviso de privacidad; revisar las condiciones de retención/entrenamiento de la API contratada **[X]** (cuenta de Anthropic Console).
- **Ubicación:** datos en us-east-1 (EE. UU.); transferencia internacional de datos: considerar la Ley 18.331 y la autoridad uruguaya (URCDP). Esta auditoría no es asesoramiento legal.
- **Supresión:** el borrado de un usuario en `auth.users` cascada a `perfiles`, `cvs`, `postulaciones`, etc. (según D.4), pero el archivo en Storage se elimina recién con el cron nocturno (que borra archivos huérfanos); no hay botón de "eliminar mi cuenta/mi CV" para el usuario (L-12).
- **Propuesta [P] (no implementada):** aviso de privacidad y consentimiento registrado (campo `consentimiento_en` en `perfiles`), política de retención (p. ej. eliminar CVs inactivos tras N meses), función de exportación/eliminación a pedido, y seudonimización del PDF antes de enviarlo a la IA.

## I.4 Puntos únicos de falla y dependencias
Un proyecto de Supabase, un proyecto y un dueño en Vercel (Hobby, un miembro), un proveedor de IA, una cuenta de GitHub. Si la API de Anthropic falla, la app sigue funcionando sin análisis (el error se contiene y el CV queda en `error`) [C].

---

# J. Escalabilidad y costos

Base de partida real (conteos): 9 usuarios, 7 CVs, 6 vacantes, 6 postulaciones, 25 afinidades, 13 análisis; base de 12 MB. **Nada se probó bajo carga**: todo lo siguiente es análisis de diseño [P].

## J.1 Cuellos de botella por componente
| Componente | Límite / riesgo | Evidencia |
|---|---|---|
| Análisis de IA en `after()` | Dentro del límite de la función (60 s configurado); lotes de 10 con concurrencia 5 pueden excederlo (L-17) | `ia.ts`, `config.ts:27-29` |
| Costo de IA | Una llamada con PDF completo por CV y por re-análisis; crece linealmente con CVs y clics | `analizar.ts` |
| Dashboard | Carga todas las filas del lado servidor paginando de a 1000 (`traerTodo`) y calcula en memoria | `dashboard.ts:32` |
| Cron de limpieza | Selecciona `cvs` sin paginar: tope de 1000 filas por defecto de PostgREST → con más de 1000 CVs podría considerar "huérfanos" archivos válidos (L-2) | `limpieza/route.ts:~37` |
| Prompt | 30 vacantes máximo por análisis (`MAX_VACANTES_POR_ANALISIS`) | `config.ts:11` |
| Base de datos | Sin índices extra necesarios al volumen actual; 5 índices sin uso hoy (por bajo volumen, no por error) | D.3 |
| Supabase free | Límites de conexión, almacenamiento (base y archivos), ancho de banda, usuarios activos y pausa por inactividad según el plan | **[X]** consultar límites vigentes |
| Vercel Hobby | Límites de ejecución, invocaciones, uso comercial restringido | **[X]** consultar términos vigentes |

## J.2 Escenarios
**100 usuarios** (≈ 90 postulantes, pocos reclutadores): el diseño actual alcanza. Riesgo principal: que varias personas suban CV a la vez y se exceda el límite de la función o el de la API de Anthropic. Conviene confirmar límites de tasa de la cuenta de Anthropic **[X]**.

**1.000 usuarios:** el dashboard empieza a leer miles de filas por visita; recomendar mover agregaciones a vistas o funciones SQL, paginar listados, y reemplazar `after()` por una cola de trabajos persistente (p. ej. tabla `trabajos_ia` + procesador programado) para tener reintentos y sin límite de 60 s. Corregir el cron (L-2). Pasar de los planes gratuitos probablemente sea necesario (límites del proveedor **[X]**). Agregar *rate limiting* y CAPTCHA al registro.

**100.000 usuarios:** requiere rediseño: cola con *workers*, almacenamiento de archivos con ciclo de vida, réplicas de lectura o particionado, índices revisados con `EXPLAIN` sobre datos reales, monitoreo y alertas, pruebas de carga, entornos separados, y análisis incremental (solo CVs/vacantes nuevas, preselección por *embeddings* o filtros antes de llamar al LLM para controlar el costo).

## J.3 Cómo estimar el costo de IA (sin inventar precios)
Costo mensual ≈ (CVs nuevos + re-análisis + preguntas generadas) × (tokens de entrada por llamada × precio de entrada + tokens de salida × precio de salida).
- Tokens de entrada = PDF (páginas × tokens por página) + texto de hasta 30 vacantes + instrucciones.
- Tokens de salida = JSON con afinidades por vacante (hasta 30) + perfil + resumen.
- **Cómo medirlo:** consultar la Anthropic Console (Usage) tras ejecutar 5–10 análisis reales y dividir el gasto por la cantidad de llamadas; el SDK devuelve `usage` en cada respuesta (hoy **no se registra** en la base: mejora propuesta, L-18).
- Precios del modelo: consultar la página oficial de precios de Anthropic al momento de la cuenta; este informe no los fija.
- Palancas de ahorro ya implementadas: modelo económico, `effort: "low"`, `maxRetries: 0`, tope diario de 5 análisis automáticos por persona, lotes de 10.
- Costos de infraestructura: Vercel y Supabase tienen planes gratuitos y pagos; **consultar los precios vigentes de cada plan** y compararlos con el uso real (almacenamiento, ancho de banda, invocaciones).
