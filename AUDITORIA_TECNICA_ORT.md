# Auditoría técnica: plataforma de reclutamiento con IA (Grupo Cumbre)

Materia: Incorporación Estratégica de Tecnologías, Universidad ORT Uruguay.
Fecha de la auditoría: 5 de noviembre de 2026.
Alcance: repositorio completo, base de datos desplegada en Supabase, proyecto desplegado en Vercel, repositorio en GitHub.
Restricciones respetadas: no se modificó código ni configuración, no se cambiaron permisos, no se ejecutaron migraciones, no se hicieron despliegues, no se escribió ni borró ningún registro, no se muestran secretos ni datos personales de candidatos (solo cantidades).

Este documento es el **índice y la parte inicial** del informe (leyenda, método, inventario y arquitectura). El resto está en archivos numerados dentro de `docs/auditoria/`.

| Archivo | Secciones |
|---|---|
| `AUDITORIA_TECNICA_ORT.md` (este) | Leyenda, método, A (inventario), B (arquitectura) |
| `docs/auditoria/02_C_auditoria_de_los_10_puntos.md` | C (los 10 puntos exigidos) |
| `docs/auditoria/03_D_modelo_de_datos.md` | D (modelo de datos completo y representación textual del MER) |
| `docs/auditoria/04_E_matriz_de_permisos.md` | E (autenticación, roles y permisos) |
| `docs/auditoria/05_F_flujos_tecnicos.md` | F (flujos A a J) |
| `docs/auditoria/06_G_requerimientos.md` | G (14 RF y 5 RNF) |
| `docs/auditoria/07_H_I_J_despliegue_seguridad_escalabilidad.md` | H (despliegue y ambientes), I (seguridad, backups y protección de datos), J (escalabilidad y costos) |
| `docs/auditoria/08_K_L_M_N_evidencias_problemas_preguntas.md` | K (evidencias), L (problemas), M (preguntas del profesor), N (no verificable) |

---

## Leyenda de estados (se usa en todo el informe)

| Marca | Significado |
|---|---|
| **[V]** | **Implementado y verificado.** Hay evidencia en código o configuración y se comprobó, ya sea consultando directamente el sistema real (base de datos, Vercel, GitHub) o con datos reales existentes que prueban que la función ya se ejecutó en producción. |
| **[C]** | **Implementado en código, no verificado en producción.** Se encontró la implementación, pero no hay evidencia de que se haya ejecutado en producción. En varios casos se probó localmente con servicios simulados (ver "Pruebas realizadas" más abajo). |
| **[P]** | **Documentado o planificado.** Figura como intención o propuesta, sin implementación comprobada. |
| **[N]** | **No implementado.** Se comprobó que falta. |
| **[X]** | **No verificable.** No hay acceso suficiente para confirmarlo; se indica qué revisar a mano. |

## Método y fuentes de evidencia

1. **Código fuente:** lectura de los archivos del repositorio (`src/`, `supabase/`, configuración). Las referencias se dan como `ruta:línea`.
2. **Base de datos real (Supabase):** consultas **solo de lectura** al catálogo de PostgreSQL del proyecto desplegado (`information_schema`, `pg_constraint`, `pg_indexes`, `pg_policies`, `pg_trigger`, `pg_proc`, `storage.buckets`), listado de migraciones registradas, asesores de seguridad y rendimiento de Supabase y **conteos** de filas (sin leer datos personales).
3. **Vercel:** proyecto, despliegues, variables de entorno (solo nombres y tipo), dominios y detalle del último despliegue de producción, mediante la API.
4. **GitHub:** ramas y pull requests mediante la API; historial de `git` local.
5. **Dependencias:** versiones del `package-lock.json` y `npm audit` (base de avisos consultada en vivo); lectura de los avisos oficiales de GitHub Security Advisories.
6. **Comprobaciones locales de esta sesión:** `tsc`, `eslint` y `next build` pasaron sin errores sobre el estado actual del repositorio (último build completo: 18 páginas generadas, tras eliminar archivos sin uso). Se hicieron además pruebas de navegador con Supabase y Claude **simulados**; esos scripts **no están versionados en el repositorio** (ver L-11) y por eso no se citan como evidencia de producción.

**Límites del acceso (detalle en la sección N):**
- Los registros de ejecución de Vercel (runtime logs, errores) y los registros de compilación devolvieron error 403/404: **no se pudieron leer**.
- No se pudo consultar el sitio publicado desde el entorno de la auditoría (el proxy del entorno bloquea el dominio), por lo que las cabeceras HTTP y el comportamiento sin sesión de las URL públicas **no se verificaron en vivo**. Sí se verificó por SQL que el rol anónimo no tiene privilegios sobre ninguna tabla.
- La configuración de **Supabase Auth** (confirmación de email, política de contraseñas, vencimiento de sesión), los **backups** del proyecto y el detalle del **plan** más allá de "free" no son accesibles con las herramientas disponibles.
- La consola de **Anthropic** (facturación, tope de gasto, alcance de la clave) no es accesible.

---

# A. Inventario técnico del proyecto

## A.1 Repositorio

| Dato | Valor | Evidencia |
|---|---|---|
| Repositorio | `luanalomiento-debug/Incorporacion-tecnologias` | `git remote -v` |
| Ramas | `main`, `claude/audit-recruitment-app-ir583k` (trabajo), `parte-1-autenticacion`, `parte-2-vacantes`, `parte-3-cv`. Ninguna protegida | API de GitHub (`protected: false`) **[V]** |
| Commits | 60 en la rama de trabajo (primero: 2026-09-24 "Initial commit"; último de esta auditoría: 2026-11-05) | `git log` |
| Autores de los commits | `Claude` (35), `vale.alori.git` (18), `luanalomiento-debug` (4), `matilde-abuchalja` (3) | `git log --format=%an` |
| Pull requests | 22, todos cerrados y fusionados a `main`. #1 a #3 de `matilde-abuchalja` (partes 1 a 3: autenticación, vacantes, CV); #4 a #22 de `valealori-web` | API de GitHub **[V]** |
| CI / GitHub Actions | **No existe** (`.github/` ausente) | `git ls-files \| grep ^.github` → 0 **[N]** |
| Pruebas automáticas versionadas | **No existen** (sin carpeta de tests ni script `test` en `package.json:5-10`) | **[N]** |

## A.2 Código fuente

| Elemento | Cantidad | Detalle |
|---|---|---|
| Líneas en `src/` | ≈ 5.490 (TypeScript, TSX y CSS) | `wc -l` sobre archivos versionados |
| Rutas (`page.tsx` / `route.ts`) | 24 + 2 layouts de rol + layout raíz | Ver tabla A.3 |
| Archivos de Server Actions (`"use server"`) | 7 | `src/lib/acciones/{auth,cv,ia,perfil,postulaciones,seguimiento,vacantes}.ts` |
| Server Actions exportadas | 17 | Ver A.4 |
| Módulos solo servidor (`import "server-only"`) | 4 | `src/lib/supabase/admin.ts`, `src/lib/ia/{analizar,claude,preguntas}.ts` |
| Componentes de cliente (`"use client"`) | 14 | `login`, `registro`, `BotonPostularse`, `SubirCv`, `DatosPersonales`, `NavPostulante`, `ActualizarSiAnalizando`, `BotonEliminarVacante`, `BotonPreguntas`, `BotonReanalizar`, `FormularioVacante`, `NavReclutador`, `NotasPostulacion`, `SelectorEtapa` |
| Migraciones SQL | 11 en `supabase/migrations/` | Ver A.5 |
| Scripts SQL auxiliares | 2 en `supabase/scripts/` | `inspeccionar_esquema.sql`, `respaldo_antes_de_optimizar.sql` |
| Documentación | `README.md`, `docs/base-de-datos.md`, `docs/presentacion-tecnica-cuerpo.md`, `AGENTS.md`, `CLAUDE.md` | |
| Configuración | `package.json`, `next.config.ts` (vacío: sin opciones, línea 3-5), `tsconfig.json` (modo `strict`, línea 7), `eslint.config.mjs`, `postcss.config.mjs`, `vercel.json`, `.env.example`, `.gitignore` | |

## A.3 Rutas de la aplicación

| Ruta | Archivo | Tipo | Quién | Acceso a datos / acción |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` | Server Component | Público | Sin sesión: portada. Con sesión: redirige según rol (`inicioDelRol`, `src/lib/auth.ts:47-49`) |
| `/login` | `src/app/login/page.tsx` | Cliente | Público (con sesión redirige) | Server Action `iniciarSesion` |
| `/registro` | `src/app/registro/page.tsx` | Cliente | Público (con sesión redirige) | Server Action `registrarse` |
| `/postulante` | `src/app/postulante/page.tsx` | Servidor | Postulante | Lista vacantes activas (`:17-21`) |
| `/postulante/vacantes/[id]` | `.../vacantes/[id]/page.tsx` | Servidor | Postulante | Detalle de vacante y botón de postulación |
| `/postulante/mis-postulaciones` | `.../mis-postulaciones/page.tsx` | Servidor | Postulante | `postulaciones` propias (`:19`) |
| `/postulante/perfil` | `.../perfil/page.tsx` | Servidor | Postulante | Datos personales y carga de CV |
| `/postulante/mi-cv` | `.../mi-cv/page.tsx` | Servidor | Postulante | Redirige a `/postulante/perfil#cv` |
| `/reclutador` | `src/app/reclutador/page.tsx` | Servidor | Reclutador | Lista de vacantes con acciones |
| `/reclutador/vacantes/nueva`, `/[id]`, `/[id]/editar` | `vacantes/...` | Servidor + formulario cliente | Reclutador | Crear, ver y editar vacantes |
| `/reclutador/vacantes/[id]/postulaciones` | `.../postulaciones/page.tsx` | Servidor | Reclutador | Postulantes de una vacante, filtros, comparación |
| `/reclutador/vacantes/[id]/comparar` | `.../comparar/page.tsx` | Servidor | Reclutador | Comparación lado a lado de 2 a 4 postulaciones |
| `/reclutador/postulaciones` | `.../postulaciones/page.tsx` | Servidor | Reclutador | Postulaciones agrupadas por vacante |
| `/reclutador/postulaciones/[id]` | `.../postulaciones/[id]/page.tsx` | Servidor | Reclutador | Ficha del candidato (etapa, IA, notas, preguntas, historial) |
| `/reclutador/postulaciones/ia` | `.../postulaciones/ia/page.tsx` | Servidor | Reclutador | Recomendaciones de IA |
| `/reclutador/dashboard` | `.../dashboard/page.tsx` | Servidor | Reclutador | Dashboard de gestión |
| `/reclutador/dashboard/ia` | `.../dashboard/ia/page.tsx` | Servidor | Reclutador | Redirige a `/reclutador/postulaciones/ia` |
| `/reclutador/perfil` | `.../perfil/page.tsx` | Servidor | Reclutador | Datos personales |
| `/cv/[postulanteId]` | `src/app/cv/[postulanteId]/route.ts` | Route Handler `GET` | Sesión (propio o reclutador) | Genera enlace firmado de 60 s y redirige (`:6`, `:32-43`) |
| `/api/limpieza` | `src/app/api/limpieza/route.ts` | Route Handler `GET` | Vercel Cron (secreto `CRON_SECRET`) | Borra PDF huérfanos e intentos viejos (`:27-62`) |

Protección de rutas: `src/proxy.ts` (archivo de interceptación de Next.js 16) llama a `actualizarSesion` (`src/lib/supabase/proxy.ts:10-60`), que renueva la sesión y redirige a `/login` si no hay sesión en `/postulante` o `/reclutador` (`:5`, `:52-54`), y a `/` si hay sesión en `/login` o `/registro` (`:55-57`). La verificación **de rol** está en los layouts (`src/app/reclutador/layout.tsx:5`, `src/app/postulante/layout.tsx:5`) y en cada Server Action.

## A.4 Server Actions (puntos de entrada de escritura)

| Función | Archivo:línea | Control de rol | Efecto |
|---|---|---|---|
| `iniciarSesion` | `acciones/auth.ts:29` | Público | `signInWithPassword` |
| `registrarse` | `acciones/auth.ts:50` | Público | `signUp` (solo envía nombre y apellido) |
| `cerrarSesion` | `acciones/auth.ts:86` | Cualquiera | `signOut` |
| `actualizarPerfil` | `acciones/perfil.ts:11` | Sesión válida (`obtenerSesion`) | Edita nombre y apellido propios |
| `registrarCv` | `acciones/cv.ts:12` | `exigirRol("postulante")` | Upsert en `cvs` y análisis de IA en segundo plano |
| `postularse` | `acciones/postulaciones.ts:10` | `exigirRol("postulante")` | Inserta en `postulaciones` |
| `crearVacante` | `acciones/vacantes.ts:13` | `exigirRol("reclutador")` | Inserta en `vacantes` |
| `cambiarEstadoVacante` | `acciones/vacantes.ts:44` | `exigirRol("reclutador")` | Activa o desactiva |
| `editarVacante` | `acciones/vacantes.ts:59` | `exigirRol("reclutador")` | Edita textos |
| `eliminarVacante` | `acciones/vacantes.ts:93` | `exigirRol("reclutador")` | Borra (cascada) |
| `cambiarEtapa` | `acciones/seguimiento.ts:18` | `exigirRol("reclutador")` | Actualiza `postulaciones.etapa` |
| `agregarNota` / `eliminarNota` | `acciones/seguimiento.ts:28`, `:41` | `exigirRol("reclutador")` | Notas internas |
| `generarPreguntas` | `acciones/seguimiento.ts:52` | `exigirRol("reclutador")` | Llama a Claude |
| `reanalizarCv`, `reanalizarPendientes`, `reanalizarParaVacante` | `acciones/ia.ts:22`, `:35`, `:72` | `exigirRol("reclutador")` | Análisis de IA en segundo plano |

## A.5 Migraciones SQL (orden y contenido)

| # | Archivo | Contenido principal |
|---|---|---|
| 1 | `20260924120000_perfiles.sql` | `perfiles`, `es_reclutador()`, `crear_perfil_nuevo_usuario()`, disparador `al_crear_usuario`, RLS, permisos por columna |
| 2 | `20260924130000_vacantes.sql` | `vacantes`, índice `vacantes_activa_idx`, RLS |
| 3 | `20260924140000_cvs.sql` | `cvs`, disparador `cvs_al_reemplazar`, bucket `cvs` y 3 políticas de Storage |
| 4 | `20260924150000_postulaciones.sql` | `postulaciones`, `candidatos_sugeridos` |
| 5 | `20261008120000_editar_vacantes.sql` | Permiso de edición de textos de vacantes |
| 6 | `20261015120000_analisis_ia.sql` | Estados de análisis en `cvs`, `analisis_ia_intentos`, permisos de `service_role` |
| 7 | `20261022120000_eliminar_vacantes.sql` | Permiso y política de borrado de vacantes |
| 8 | `20261029120000_seguimiento.sql` | Etapas, `postulacion_movimientos`, `notas_postulacion`, `preguntas_entrevista` |
| 9 | `20261105120000_optimizacion_modelo.sql` | Restricciones, índices, `actualizado_en`/`cerrada_en`, sincronización de email, columna `modelo` |
| 10 | `20261105130000_revocar_ejecucion_trigger.sql` | Revoca ejecución pública de `postulaciones_registrar_etapa()` |
| 11 | `20261112120000_resultados_ia_una_sola_fuente.sql` | Renombra a `afinidades_cv_vacante`; elimina columnas de IA de `postulaciones` |

**Estado en la base real:** el registro de migraciones de Supabase solo contiene `perfiles`, `vacantes`, `cvs` (20260924...) y `revocar_ejecucion_trigger` (versión `20261105123648`, aplicada durante esta sesión). Las migraciones 4 a 9 y 11 **se aplicaron manualmente en el SQL Editor y no figuran en ese registro**, aunque sus efectos están presentes en la base (verificado contra el catálogo, sección D). Detalle y riesgo en D.9 y L-7.

## A.6 Servicios externos y cuentas

| Servicio | Identificación | Evidencia |
|---|---|---|
| Supabase | Organización "Obligatorio ORT", proyecto `OBLIGATORIO-ORT`, región `us-east-1`, PostgreSQL 17, estado `ACTIVE_HEALTHY`, creado el 2026-09-24, **plan `free`** | API de Supabase **[V]** |
| Vercel | Equipo `ob-integracion` (plan **Hobby**, un solo miembro con rol Owner), proyecto `incorporacion-tecnologias`, framework Next.js, Node 24.x, región de funciones `iad1`. Existe además un proyecto duplicado `incorporacion-tecnologias-th4v` | API de Vercel **[V]** |
| GitHub | Repositorio privado/público no determinado; remoto `https://github.com/luanalomiento-debug/Incorporacion-tecnologias` | **[V]** |
| Anthropic | API con el modelo `claude-haiku-5-5` (`src/lib/ia/config.ts:5`) | Código **[V]**; cuenta **[X]** |

---

# B. Arquitectura general y componentes

## B.1 Vista general

```
                        ┌───────────────────────────────────────────────┐
  Navegador  ───HTTPS──▶│ VERCEL (región iad1)                          │
 (postulante /          │  proxy.ts → renueva sesión y redirige         │
  reclutador)           │  Next.js 16 App Router                        │
                        │   · Server Components (páginas, consultas)    │
        ┌───────────────│   · Server Actions (escrituras, reglas)       │
        │ subida directa│   · Route Handlers: /cv/[id], /api/limpieza   │
        │ del PDF       │   · after(): análisis de IA en segundo plano  │
        ▼               └──────┬───────────────┬───────────────┬────────┘
┌──────────────────┐   sesión del usuario   clave secreta      │ solo servidor
│ SUPABASE         │◀── + RLS (publishable) ──┘ (service_role) │
│  PostgreSQL 17   │◀──────────────────────────────────────────┘      ┌──────────────────────┐
│  Auth            │                                                   │ API de Anthropic     │
│  Storage (cvs)   │◀── PDF descargado por el servidor ───────────────▶│ claude-haiku-5-5     │
└──────────────────┘                                                   └──────────────────────┘
        ▲
        │ merge a main → despliegue automático
   GitHub (código + migraciones SQL) ──▶ Vercel
```

## B.2 Dónde se ejecuta cada componente

| Componente | Dónde corre | Evidencia | Estado |
|---|---|---|---|
| Pantallas (HTML/React) | Vercel: se generan en el servidor (Server Components) y se hidratan en el navegador los componentes `"use client"` | `src/app/**/page.tsx` | [V] código; despliegue [V] (estado READY) |
| Lógica de negocio de escritura | Vercel, como Server Actions | `src/lib/acciones/*` (todas con `"use server"` en la línea 1) | [V] |
| Lógica de IA | Vercel, solo servidor | `src/lib/ia/*` con `import "server-only"` (`analizar.ts:1`, `claude.ts:1`, `preguntas.ts:1`) | [V] |
| Rutas API | Vercel, Route Handlers | `src/app/cv/[postulanteId]/route.ts`, `src/app/api/limpieza/route.ts` | [V] código |
| Tarea programada | Vercel Cron: `0 6 * * *` (06:00 UTC) sobre `/api/limpieza` | `vercel.json:2` | Configuración en el repositorio [V]; **registro del cron en Vercel y ejecuciones reales [X]** |
| Base de datos | Supabase (PostgreSQL 17, us-east-1) | Consultas al catálogo | [V] |
| Autenticación | Supabase Auth; sesión en cookies gestionadas por `@supabase/ssr` | `src/lib/supabase/{server,proxy,client}.ts` | [V] código |
| Archivos | Supabase Storage, bucket privado `cvs` | `storage.buckets` (público: false, 5.242.880 bytes, solo `application/pdf`) | [V] |
| Modelo de IA | API de Anthropic (externo) | `src/lib/ia/claude.ts:58-70` | [V] código; ejecución real [V] por datos (ver F.G y F.J) |
| Procesamiento del CV | Servidor de Vercel: descarga el PDF desde Storage con la clave secreta, lo codifica en base64 y lo envía a Claude | `src/lib/ia/analizar.ts:75-78` | [V] código |

## B.3 Clientes de Supabase y qué permisos usa cada uno

| Cliente | Archivo | Credencial | Se salta RLS | Usos |
|---|---|---|---|---|
| Servidor con sesión | `src/lib/supabase/server.ts:7-31` | Clave pública (publishable) + cookies del usuario | **No** (rol `authenticated`) | Casi todas las lecturas y escrituras de la app |
| Navegador | `src/lib/supabase/client.ts:5-10` | Clave pública | **No** | Solo `SubirCv.tsx:46-52` (subida directa del PDF) |
| Administración | `src/lib/supabase/admin.ts:8-14` | `SUPABASE_SECRET_KEY` | **Sí** (`service_role`) | Análisis de IA (`analizar.ts`, `preguntas.ts`) y limpieza (`/api/limpieza`) |
| Renovación de sesión | `src/lib/supabase/proxy.ts:13-35` | Clave pública + cookies de la solicitud | No | `proxy.ts` en cada solicitud |

La URL y la clave pública se leen de variables de entorno en `src/lib/supabase/config.ts:5-16`; la URL se normaliza con `new URL(...).origin`.

## B.4 Recorrido de una solicitud típica

**Lectura de una página protegida (ej. `/reclutador/dashboard`):**
1. El navegador pide la URL a Vercel.
2. `src/proxy.ts` ejecuta `actualizarSesion`: crea un cliente de Supabase con las cookies de la solicitud, llama a `auth.getClaims()` (valida el JWT) y, si no hay sesión, redirige a `/login` (`proxy.ts:38-54`).
3. El layout `src/app/reclutador/layout.tsx:5` llama `exigirRol("reclutador")` → `obtenerSesion()` (`src/lib/auth.ts:22-36`) lee las claims y consulta `perfiles` (con RLS) para obtener el rol. Si el rol no coincide, redirige a `/`.
4. La página ejecuta consultas con el cliente del servidor (JWT del usuario). **PostgREST** aplica las políticas RLS de cada tabla usando `auth.uid()` y `es_reclutador()`.
5. El HTML se devuelve al navegador.

**Escritura (ej. cambiar etapa):** el componente cliente `SelectorEtapa` invoca la Server Action `cambiarEtapa` (`acciones/seguimiento.ts:18`): verifica el rol, valida el UUID y la etapa, hace `update` con el cliente del usuario (RLS + permiso por columna `UPDATE (etapa)`), el disparador `postulaciones_registrar_etapa` registra el movimiento, y se revalidan las pantallas.

**Análisis de IA:** ver flujos F.D, F.F y F.G en `05_F_flujos_tecnicos.md`.

## B.5 Claude Code → GitHub → Vercel → Supabase → Anthropic

- **Claude Code** es una herramienta de **desarrollo**: escribió código y migraciones y empujó commits a la rama de trabajo. No forma parte de lo que corre en producción. Evidencia: 35 de los 60 commits tienen autor `Claude`; las menciones `Co-Authored-By` figuran en los mensajes.
- **GitHub:** guarda el código y las migraciones. El flujo real fue una rama de trabajo única (`claude/audit-recruitment-app-ir583k`) con 19 pull requests fusionados a `main` mediante merge (de #4 a #22), más las ramas `parte-1/2/3` de los primeros tres PR.
- **Vercel:** conectado al repositorio por la integración con GitHub. Cada push genera un despliegue (los de la rama de trabajo, *preview*; los de `main`, *producción* desde el cambio de rama de producción hecho el 5/11/2026). Detalle en H.
- **Supabase:** recibe las migraciones por **aplicación manual** (SQL Editor) en la mayoría de los casos; las tres primeras quedaron registradas, lo que sugiere que la integración GitHub–Supabase las aplicó automáticamente al fusionar (el bucket `cvs` se creó a las 13:53:01 del 24/09, 37 segundos después del merge del PR #3 a las 13:52:24). Si esa integración sigue activa **[X]**: revisar en Supabase → Integrations.
- **Anthropic:** recibe del servidor de Vercel el PDF del CV (base64) y el texto de las vacantes y devuelve un JSON validado con Zod.
