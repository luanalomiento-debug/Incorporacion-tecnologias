# Portal de Reclutamiento

Proyecto universitario (Obligatorio Incorporación de Tecnologías). Es una plataforma web donde una empresa publica vacantes y las personas interesadas cargan su CV y se postulan.

**Tecnologías:** Next.js (App Router) con TypeScript, Tailwind CSS, Supabase (autenticación, base de datos PostgreSQL y almacenamiento de archivos), GitHub y Vercel.

---

## 1. Qué hace la app

Hay dos tipos de usuario (roles):

- **Postulante**
  - Se registra con email y contraseña.
  - Ve las vacantes activas y el detalle de cada una.
  - Sube su CV en PDF (máximo 5 MB). Si sube uno nuevo, reemplaza al anterior.
  - Se postula a una vacante con su CV (una sola vez por vacante).
  - Ve sus postulaciones en "Mis postulaciones".
- **Reclutador**
  - Crea vacantes (puesto, descripción, requisitos, habilidades, información relevante), las **edita** cuando hace falta y las activa o desactiva. También puede **eliminarlas** (con una ventana de confirmación): se borran para siempre, junto con sus postulaciones y las sugerencias de la IA. Si solo quiere que dejen de verse, conviene desactivarlas.
  - Tiene su **perfil**, donde puede editar su nombre y apellido.
  - La vista tiene una parte para **operar** y otra **estratégica**:
    - **Vacantes** y **Nueva vacante** (crear, editar, activar o desactivar).
    - **Postulaciones**: quiénes se postularon a cada puesto, ordenados por afinidad, con el acceso a su CV y un botón para **enviar un correo** (abre tu programa de correo con el mensaje empezado). Dentro de esta pestaña están las **Recomendaciones de IA**.
    - **Dashboard** (estratégico): un resumen global, sin nombres ni listas de personas: postulaciones recibidas, promedio de matching, cuántas postulaciones hicieron un buen match, y el **valor extra de la IA** (cuántas personas y vacantes conectó además de las postulaciones). 
  - Desde cada vacante, el botón **Ver postulaciones** lleva a las postulaciones de ese puesto, con el **mejor match** y el **promedio de matching**; el botón volver lleva a Vacantes.
  - Ve la **afinidad (0 a 100)** de cada postulante con el puesto, con los motivos (qué coincide y qué falta), los **candidatos sugeridos** para cada vacante abierta y las **otras vacantes sugeridas**. Todo lo calcula la IA (ver sección 8). Mientras un CV no se analizó, figura como "Pendiente de análisis".

**Cómo se define el rol:** el registro público crea **siempre** cuentas de postulante. Las cuentas de reclutador se crean a mano desde el panel de Supabase (ver sección 4). Nadie puede elegir ser reclutador desde la app.

**Seguridad:** todas las tablas tienen Row Level Security (RLS) activado. Los CV viven en un bucket privado y se abren con enlaces temporales de 60 segundos, generados en el servidor al hacer clic.

---

## 2. Cómo correrla en tu computadora

Necesitás [Node.js](https://nodejs.org) (versión LTS) y tener el proyecto descargado.

1. Abrí una terminal dentro de la carpeta del proyecto e instalá las dependencias:
   ```bash
   npm install
   ```
2. Copiá el archivo de ejemplo de variables de entorno:
   ```bash
   cp .env.example .env.local
   ```
3. Abrí `.env.local` y completá los dos valores con los de tu proyecto de Supabase (sección 3, paso 4):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx
   ```
   La URL va **sin barra al final** y sin nada después de `.supabase.co`.
   Para probar también el análisis con IA en tu computadora, agregá estas dos líneas (son secretas: nunca las subas ni las compartas):
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
   SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxx
   ```
   Sin ellas la app funciona igual, pero los CVs quedan en "Pendiente de análisis".
4. Iniciá la app:
   ```bash
   npm run dev
   ```
5. Abrí http://localhost:3000 en el navegador.

> `.env.local` **nunca** se sube a GitHub (está en `.gitignore`). Solo se sube `.env.example`, que no tiene claves reales.

---

## 3. Cómo configurar Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com).
2. **Ejecutá las migraciones SQL.** Están en `supabase/migrations/`. En el panel de Supabase abrí **SQL Editor**, pegá el contenido de cada archivo y apretá **Run**, **en este orden**:
   1. `20260924120000_perfiles.sql` (perfiles y roles)
   2. `20260924130000_vacantes.sql` (vacantes)
   3. `20260924140000_cvs.sql` (CV y bucket privado `cvs`)
   4. `20260924150000_postulaciones.sql` (postulaciones y candidatos sugeridos)
   5. `20261008120000_editar_vacantes.sql` (permite editar vacantes ya creadas)
   6. `20261015120000_analisis_ia.sql` (análisis con IA: estado de cada CV, motivos de las sugerencias y tope diario)
   7. `20261022120000_eliminar_vacantes.sql` (permite eliminar vacantes; las borra junto con sus postulaciones)

   Cada una tiene que terminar con "Success". No hace falta crear el bucket a mano: la tercera migración lo crea.
3. **Desactivá la confirmación de email (solo para desarrollo).** En **Authentication → Sign In / Providers → Email**, desactivá "Confirm email". Si está activada, quien se registre tendrá que confirmar su correo antes de poder entrar.
4. **Copiá las claves.** En **Project Settings → API Keys**, copiá:
   - la **Project URL** (en la página principal del proyecto o en Settings → API),
   - la clave **Publishable key** (empieza con `sb_publishable_`).

   Para el análisis con IA (sección 8) también hace falta la **clave secreta** de Supabase (empieza con `sb_secret_`, en la sección **Secret keys**). Es como una llave maestra de la base de datos: va **solo** en las variables del servidor (`SUPABASE_SECRET_KEY`), **nunca** con el prefijo `NEXT_PUBLIC_`, nunca en el código ni en GitHub.
5. Cuando tengas la app publicada (sección 6), agregá su dirección en **Authentication → URL Configuration** (campo Site URL).

---

## 4. Cómo crear una cuenta de reclutador

Las cuentas de reclutador se crean a mano. Hay dos formas; la más simple es convertir una cuenta existente.

**Opción A: convertir una cuenta registrada**
1. Registrate en la app con el email que va a usar la persona (queda como postulante).
2. En el panel de Supabase abrí **Table Editor → tabla `perfiles`**.
3. Buscá la fila con ese email.
4. En la columna `rol`, cambiá `postulante` por `reclutador` y guardá.
5. Cerrá sesión y volvé a entrar: la app te lleva a la vista de reclutador.

**Opción B: crear el usuario desde Supabase**
1. En **Authentication → Users**, apretá **Add user → Create new user**, escribí email y contraseña y marcá "Auto Confirm User".
2. Se crea su perfil automáticamente como `postulante`. Seguí con los pasos 2 a 5 de la opción A.

---

## 5. Cómo subirla a GitHub

1. Creá un repositorio en [github.com](https://github.com) (botón **New**).
2. Desde la terminal, dentro de la carpeta del proyecto:
   ```bash
   git add .
   git commit -m "Mensaje que describa el cambio"
   git push
   ```
3. Antes de subir, comprobá que `.env.local` **no** aparezca en `git status`. Si aparece, no lo subas y revisá el `.gitignore`.

---

## 6. Cómo desplegarla en Vercel

1. Entrá a [vercel.com](https://vercel.com) con "Continue with GitHub" (es gratis).
2. Apretá **Add New → Project** e importá el repositorio.
3. Antes de apretar **Deploy**, abrí **Environment Variables** y cargá **dos** variables. El nombre va en **Key** y el valor en **Value**:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | la Project URL de Supabase, sin barra al final |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | la clave `sb_publishable_...` |

   Si Vercel avisa que las variables con `NEXT_PUBLIC_` quedan expuestas al navegador, elegí el tipo **Config**: estas dos son públicas por diseño.
   Para el análisis con IA, cargá también estas **dos variables secretas** (tipo **Sensitive**, sin `NEXT_PUBLIC_`):

   | Key | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | la clave de la API de Anthropic (`sk-ant-...`) |
   | `SUPABASE_SECRET_KEY` | la clave secreta de Supabase (`sb_secret_...`) |
4. Apretá **Deploy** y esperá a ver **Ready**. Vercel te da una dirección que termina en `.vercel.app`.
5. Agregá esa dirección en Supabase, en **Authentication → URL Configuration → Site URL**.
6. Vercel publica la rama que figure como **Production Branch** (en **Settings → Environments → Production → Branch Tracking**). A partir de ahí, cada `git push` a esa rama redespliega solo.

**Si algo falla en Vercel:**
- Si cambiás una variable, hay que **redesplegar** (Deployments → tres puntitos → Redeploy).
- Para ver errores, abrí **Logs** y filtrá por **Error**.
- El error `Invalid path specified in request URL` significa que `NEXT_PUBLIC_SUPABASE_URL` tiene una barra o un tramo de más al final.

---

## 7. Estructura del proyecto

```
src/
  app/
    login, registro            Acceso
    postulante/                Vistas del postulante (vacantes, Mis postulaciones, Perfil con su CV)
    reclutador/                Vista del reclutador (vacantes, detalle, dashboard de postulaciones y de IA)
    cv/[postulanteId]/         Abre un CV con enlace firmado de 60 segundos
  components/                  Piezas reutilizables de la interfaz
  lib/
    acciones/                  Acciones del servidor (auth, vacantes, CV, postulaciones, perfil, IA)
    ia/                        Análisis con IA: ajustes, pedido a Claude y guardado de resultados
    supabase/                  Conexión con Supabase (admin.ts usa la clave secreta, solo en el servidor)
    auth.ts                    Lectura de sesión y control de roles
  proxy.ts                     Mantiene la sesión actualizada
supabase/
  migrations/                  Archivos SQL de la base de datos
```

## 8. Análisis con IA (Claude)

**Cómo funciona.** Cuando una persona sube su CV, la app lo analiza **sola, en segundo plano** (la persona no espera): el servidor le manda el PDF a Claude junto con **todas las vacantes abiertas** en ese momento. Claude devuelve un resumen, el perfil ordenado (formación, experiencia, habilidades, idiomas) y, para **cada vacante**, una **afinidad de 0 a 100** con los motivos (qué coincide, qué falta). Se guarda todo en la base de datos:

- `cvs`: `resumen`, `perfil_estructurado` y el estado del análisis (`pendiente`, `analizando`, `listo`, `error`).
- `candidatos_sugeridos`: la afinidad y los motivos de ese CV con cada vacante abierta.
- `postulaciones`: la afinidad con la vacante a la que se postuló, y `vacante_sugerida_id` si otra vacante le queda claramente mejor.

La reclutadora lo ve en el **Postulaciones → Recomendaciones de IA** y en el dashboard de cada vacante. Al entrar, la reclutadora ve el **Dashboard**. Si crea una vacante nueva, abre esa vacante y usa **"Re-analizar CVs con esta vacante"** (analiza los CVs que todavía no se compararon con ella, de a 10 por vez); también existe **"Re-analizar CVs pendientes"** (o "Re-analizar este CV" para una sola persona).

**Configuración** (todo en `src/lib/ia/config.ts`):
- Modelo: `claude-haiku-5-5` (el más económico). Para probar uno más capaz, se cambia ese valor.
- **Tope diario:** 5 análisis automáticos por persona en 24 horas.
- Se comparan hasta 30 vacantes abiertas por CV.

**Seguridad y privacidad**
- Las claves `ANTHROPIC_API_KEY` y `SUPABASE_SECRET_KEY` viven **solo en el servidor** (variables de Vercel o `.env.local`). Ningún postulante ni reclutador puede escribir resultados de la IA desde el navegador.
- Un único archivo (`src/lib/supabase/admin.ts`) usa la clave secreta, y la compilación falla si alguien intenta usarlo desde una pantalla.
- El CV tiene datos personales y se envía a Anthropic para procesarlo. Por eso, al subirlo, la persona ve un **aviso de privacidad**. En el perfil estructurado no se guardan datos de contacto.
- La IA **orienta, no decide**: siempre se muestran los motivos, y las instrucciones le indican que trate el contenido del CV como datos (si un CV intenta manipular el puntaje, no se lo premia).
- Poné un **tope de gasto mensual** en la consola de Anthropic y dejá la recarga automática desactivada.

**Si algo falla**
- Un CV con estado `error` se puede reintentar con el botón "Analizar este CV". Las causas más comunes son: no hay saldo en la cuenta de Anthropic, falta alguna de las dos variables secretas, o se alcanzó el tope diario de esa persona.
- Para ver el motivo exacto, abrí **Logs** en Vercel y buscá "Análisis IA".
