# G. Auditoría funcional: 14 requerimientos funcionales y 5 no funcionales

Criterio: un requerimiento sólo se considera implementado si existe lógica funcional detrás (no basta con un botón o una pantalla). Estados: **[V]** verificado · **[C]** código, no verificado en producción · **[P]** planificado · **[N]** no implementado · **[X]** no verificable. "Parcial" se indica aparte.

Resumen:

| Req. | Estado | Observación corta |
|---|---|---|
| RF01 Registro e inicio de sesión | [C] (esquema Auth y trigger [V]) | Falta confirmar ajustes de Auth en el panel |
| RF02 Dos roles | [V] en base (columnas, RLS, trigger) / [C] en app | Alta de reclutadores solo manual |
| RF03 Publicar vacantes | [C] | Tabla y RLS [V] |
| RF04 Ver vacantes | [C] | |
| RF05 Carga y almacenamiento de CV | [C] (bucket y políticas [V]) | MIME declarado (L-8); sin borrado propio (L-12) |
| RF06 Postulación | [C] | Reglas en la base [V] |
| RF07 Registro persistente | [V] (6 postulaciones y 2 movimientos reales) | |
| RF08 Análisis del CV por IA | [C] | 7 CVs analizados / 25 afinidades históricas [V]; ruta de escritura nueva sin probar con Claude real |
| RF09 Afinidad candidato–vacante | [C] | Persistida en `afinidades_cv_vacante` |
| RF10 Comparación con otras vacantes | [C] | Sugerencia calculada al mostrar |
| RF11 Matching histórico al publicar | **Parcial** | Manual (botón), no automático al publicar |
| RF12 Dashboard del reclutador | [C] | Datos reales, sin datos inventados |
| RF13 Resumen del candidato por IA | [C] | `cvs.resumen` y `perfil_estructurado` |
| RF14 Preguntas de entrevista | [C] | Sin tope propio |
| RNF01 Seguridad por rol | [V] RLS / [C] app | Ver E |
| RNF02 Protección de datos | Parcial | Sin política de retención formal ni consentimiento registrado |
| RNF03 Persistencia | [V] | Postgres gestionado; backups [X] |
| RNF04 Usabilidad | [C] | Sin pruebas de usabilidad formales |
| RNF05 Disponibilidad vía navegador | [C] | Vercel; URLs no comprobadas desde el sandbox |

---

## RF01 Registro e inicio de sesión — [C]
- **Archivos/funciones:** `src/app/registro/page.tsx`, `src/app/login/page.tsx`; `registrarse`, `iniciarSesion`, `cerrarSesion` en `src/lib/acciones/auth.ts:29,50,86`; `src/proxy.ts`, `src/lib/supabase/proxy.ts:13-54`.
- **Tablas:** `auth.users` (Supabase), `public.perfiles`.
- **Flujo:** ver F.A y F.B.
- **Evidencia:** código; trigger `al_crear_usuario` y 9 tablas con RLS [V catálogo]; usuarios reales en `perfiles` [V, recuento sin datos personales].
- **Prueba a realizar:** crear una cuenta nueva en producción (desde navegador incógnito), comprobar fila en `perfiles` con rol `postulante`, cerrar e iniciar sesión, acceder a `/reclutador` y verificar la redirección.
- **Limitaciones:** contraseña mínima de 6 caracteres; sin recuperación de contraseña [N] (no hay pantalla ni acción); sin MFA [N]; confirmación de email **[X]**.

## RF02 Gestión de los dos roles — [V] base / [C] aplicación
- **Archivos:** `src/lib/auth.ts:22-40` (`obtenerSesion`, `exigirRol`); layouts de `reclutador` y `postulante`; función `es_reclutador()` (`20260924120000_perfiles.sql:23-37`).
- **Tablas:** `perfiles.rol` (valores `postulante`/`reclutador`).
- **Flujo:** rol leído de `perfiles` en cada página/acción; RLS usa `es_reclutador()`; escalada de rol bloqueada por permisos de columna (ver E.3).
- **Evidencia:** políticas y grants consultados en el catálogo real.
- **Prueba:** con una cuenta postulante, intentar abrir `/reclutador/dashboard` y `/cv/<otro id>`; con la consola de Supabase, comprobar que un `update perfiles set rol='reclutador'` hecho como usuario autenticado falla (hacerlo sólo en un entorno de prueba).
- **Limitaciones:** no existe pantalla para crear reclutadores [N]: se promueve manualmente en la base.

## RF03 Publicación de vacantes — [C]
- **Archivos:** `src/app/reclutador/vacantes/nueva/page.tsx`, `crearVacante/editarVacante/cambiarEstadoVacante/eliminarVacante` en `src/lib/acciones/vacantes.ts:13,59,44,93`.
- **Tablas:** `vacantes` (el trigger `vacantes_registrar_cambios` solo mantiene las fechas `actualizado_en`/`cerrada_en`; no hay tabla de historial de vacantes, ver D.10).
- **Flujo:** F.C.
- **Prueba:** crear una vacante como reclutadora, verla en el listado del postulante, desactivarla y comprobar que deja de aparecer.
- **Limitaciones:** baja física con cascada (L-13); no hay borrador/aprobación.

## RF04 Visualización de vacantes — [C]
- **Archivos:** `src/app/postulante/vacantes/[id]/page.tsx`, `src/app/postulante/page.tsx`, `src/app/reclutador/vacantes/*`.
- **Tablas:** `vacantes` (política de lectura: autenticados ven activas; reclutadores ven todas).
- **Prueba:** como postulante, comprobar que sólo se ven las activas; como reclutadora, también las inactivas.
- **Limitaciones:** sin búsqueda/paginación del lado del postulante (volumen bajo).

## RF05 Carga y almacenamiento de CV — [C]
- **Archivos:** `src/components/SubirCv.tsx:30-110`, `registrarCv` (`src/lib/acciones/cv.ts:12`), `src/lib/tipos.ts` (`rutaCv`, `TAMANO_MAXIMO_CV`).
- **Tablas/almacenamiento:** `cvs`; bucket privado `cvs` (5 MB, `application/pdf`, 3 políticas) [V].
- **Flujo:** F.D.
- **Prueba:** subir un PDF válido; intentar un archivo >5 MB y un no-PDF (debe rechazarlo Storage); comprobar que otra cuenta no puede leer la ruta (URL firmada de 60 s solo para reclutadores).
- **Limitaciones:** validación de tipo por MIME declarado (L-8); el postulante no puede borrar su CV (L-12); un CV por persona (reemplazo).

## RF06 Postulación a una vacante específica — [C]
- **Archivos:** `postularse` (`src/lib/acciones/postulaciones.ts:10`), `src/app/postulante/vacantes/[id]/page.tsx`, `src/app/postulante/mis-postulaciones/page.tsx`.
- **Tablas:** `postulaciones`, `postulacion_movimientos`.
- **Reglas:** unicidad `(vacante_id, postulante_id)`; vacante activa y CV cargado exigidos por RLS (F.E).
- **Prueba:** postularse dos veces (segunda debe fallar con mensaje claro); postularse a una vacante inactiva (debe fallar).
- **Limitaciones:** el postulante no puede retirar su postulación (L-12).

## RF07 Registro persistente de postulaciones — [V]
- **Evidencia:** la base real contiene filas en `postulaciones` y movimientos; tablas con claves foráneas y trigger de historial [V catálogo y recuentos].
- **Tablas:** `postulaciones`, `postulacion_movimientos`, `notas_postulacion`.
- **Prueba:** crear postulación, recargar y consultar desde otra sesión de reclutadora; verificar el movimiento inicial.
- **Limitaciones:** persistencia depende de Supabase (plan gratuito, ver I.2).

## RF08 Análisis del CV mediante IA — [C]
- **Archivos:** `src/lib/ia/analizar.ts:29-148`, `claude.ts:52`, `esquema.ts:5`, `config.ts`.
- **Tablas:** `cvs` (estado, `perfil_estructurado`, `resumen`), `analisis_ia_intentos` (tope diario).
- **Flujo:** F.F.
- **Evidencia:** 7 CVs en estado `listo` y 25 filas de afinidad generadas con el flujo anterior [V recuentos]; el camino actual (con `modelo` e `inferido`) no se probó con Claude real [X].
- **Prueba:** re-analizar un CV de prueba desde el panel y comprobar `analisis_estado = 'listo'`, `modelo = 'claude-haiku-5-5'`, filas nuevas en `afinidades_cv_vacante`, y registro en Anthropic Console (uso/costo).
- **Limitaciones:** modelo económico con esfuerzo bajo; resultados no deterministas; sin evaluación sistemática de calidad (sin conjunto de prueba etiquetado) [N]; PDF escaneado sin texto puede dar resultados pobres.

## RF09 Cálculo de afinidad candidato–vacante — [C]
- **Archivos:** `analizar.ts` (pasos 7–10), `esquema.ts` (rango y campos), `limitarAfinidad`.
- **Tablas:** `afinidades_cv_vacante (vacante_id, postulante_id, afinidad, analisis jsonb, modelo, creado_en)`.
- **Aclaración técnica:** el puntaje es una **estimación del modelo de lenguaje** con criterios definidos por el prompt; no es una métrica calculada por fórmula determinista. Es auditable por el campo `analisis` (`coincide`, `inferido`, `falta`, `conclusion`).
- **Prueba:** comparar manualmente 3 CVs con una vacante y verificar que el orden de afinidad sea razonable.
- **Limitaciones:** posible sesgo del modelo; sin calibración formal.

## RF10 Comparación con otras vacantes activas — [C]
- **Archivos:** `src/lib/ia/sugerencia.ts` (`mejorVacanteAlternativa`), `src/app/reclutador/postulaciones/ia/page.tsx`, `src/app/reclutador/vacantes/[id]/comparar/page.tsx`.
- **Flujo:** el análisis ya compara con hasta 30 vacantes activas; la sugerencia se calcula al mostrar (afinidad ≥ 60 y +15 puntos sobre la vacante postulada).
- **Prueba:** con un postulante a la vacante A que tenga mayor afinidad con la B, ver la sugerencia en el panel IA.
- **Limitaciones:** tope de 30 vacantes por análisis; si hay más, las más antiguas no se comparan.

## RF11 Matching de CV históricos al publicar nuevas vacantes — **Parcial**
- **Implementado:** botones "Re-analizar CVs" y "Re-analizar para esta vacante" (`reanalizarPendientes`, `reanalizarParaVacante`, `src/lib/acciones/ia.ts:35,72`), que comparan CVs ya almacenados con las vacantes abiertas en lotes de 10.
- **No implementado [N]:** disparo **automático** al publicar una vacante; cola persistente; notificación al reclutador o a los candidatos.
- **Prueba:** crear una vacante nueva y pulsar "Re-analizar para esta vacante"; comprobar filas nuevas en `afinidades_cv_vacante` para esa vacante.
- **Cómo presentarlo:** "matching histórico bajo demanda", no "automático".

## RF12 Dashboard del reclutador — [C]
- **Archivos:** `src/app/reclutador/dashboard/page.tsx`, `src/lib/dashboard.ts` (`cargarPostulaciones`, `cargarEstadosCv`, `resumenAfinidad`, `traerTodo`), `src/lib/etapas.ts`, `src/lib/filtros.ts`.
- **Tablas:** `vacantes`, `postulaciones`, `afinidades_cv_vacante`, `cvs`, `postulacion_movimientos`.
- **Datos:** solo datos reales (sin cifras inventadas).
- **Prueba:** comparar los totales del panel con `select count(*)` en el SQL Editor (sin mostrar datos personales).
- **Limitaciones:** cálculo en el servidor sobre todas las filas (paginando por 1000); con decenas de miles de filas habría que pasar a agregaciones en SQL (J).

## RF13 Resumen del candidato mediante IA — [C]
- **Archivos:** campo `resumen` y `perfil_estructurado` guardados en `analizar.ts`; mostrados en `src/app/reclutador/postulaciones/[id]/page.tsx:62` y en `.../comparar/page.tsx:66-86`.
- **Tablas:** `cvs`.
- **Prueba:** abrir el detalle de una postulación con CV analizado y verificar el resumen.
- **Limitaciones:** resumen generado por IA, puede omitir datos; la decisión final es humana (aviso visible en `SubirCv.tsx`).

## RF14 Generación de preguntas de entrevista — [C]
- **Archivos:** `generarPreguntas` (`src/lib/acciones/seguimiento.ts:52`), `src/lib/ia/preguntas.ts:8`, `claude.ts:103`, `esquema.ts:46`.
- **Tablas:** `preguntas_entrevista`.
- **Flujo:** F.J.
- **Prueba:** pulsar "Generar preguntas" en una postulación; comprobar 6–8 preguntas con "para verificar"; recargar y ver que persisten.
- **Limitaciones:** sin tope diario propio; el prompt prohíbe datos personales, pero no hay verificación posterior del contenido [N].

---

## RNF01 Seguridad por rol — [V] base / [C] aplicación
Defensa en dos capas: comprobación en la app (`exigirRol`, 13 Server Actions) y RLS + permisos por columna en Postgres (ver E). Brechas de autorización secundarias: L-3, L-4, L-9, L-12. Prueba: matriz de E.2 con dos cuentas.

## RNF02 Protección de datos personales y CV — Parcial
- Implementado: bucket privado, URLs firmadas de 60 s, RLS, claves en variables de entorno, logs sin contenido de CV [C/V].
- No implementado [N]: política de retención escrita, consentimiento explícito registrado, derecho de supresión por el usuario (L-12), cifrado con clave propia, cabeceras de seguridad (L-5). Los CV se envían a un tercero (Anthropic) como PDF completo: debe constar en el aviso de privacidad (Ley 18.331 de Uruguay; verificar el texto legal con el docente/asesor). Ver I.4.

## RNF03 Persistencia de información — [V]
Datos en Postgres gestionado de Supabase (us-east-1) y archivos en Storage. Backups automáticos y PITR **[X]** (dependen del plan y del panel); respaldo manual en el esquema `respaldo` en el mismo proyecto (no es respaldo independiente). Ver I.2.

## RNF04 Usabilidad — [C]
Interfaz en español rioplatense, `lang="es"` (`src/app/layout.tsx:17`), diseño responsive con Tailwind, mensajes de error traducidos, atributos ARIA en 56 lugares del código. Sin pruebas con usuarios ni auditoría de accesibilidad formal [N]. Prueba: recorrido por 3 personas no técnicas con una lista de tareas y tiempos.

## RNF05 Disponibilidad mediante navegador web — [C]
App web servida por Vercel (HTTPS). Desde este entorno no se pudo hacer una petición HTTP a `*.vercel.app` (el proxy lo bloquea), por lo que el estado en línea se infiere de la API de Vercel (despliegues en estado READY) y **no** de una prueba directa **[X]**. Prueba: abrir la URL de producción desde un celular y una computadora, en incógnito.
