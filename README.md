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
  - Crea vacantes (puesto, descripción, requisitos, habilidades, información relevante), las **edita** cuando hace falta y las activa o desactiva. Las vacantes no se borran.
  - Tiene su **perfil**, donde puede editar su nombre y apellido.
  - Tiene un **Dashboard** aparte, con dos vistas separadas: **Postulaciones** (los puestos a los que ya se postularon personas, con sus postulantes y el acceso al CV de cada uno) y **Recomendaciones de IA** (puestos y candidatos sugeridos).
  - Desde cada vacante puede ver el dashboard con solo las postulaciones de ese puesto, y desde el dashboard puede volver al detalle de cada puesto.
  - Los campos de inteligencia artificial (afinidad, análisis, vacante sugerida) aparecen como "Pendiente de análisis". El análisis con IA **no está implementado en esta etapa**; solo quedó preparada la base de datos.

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

   Cada una tiene que terminar con "Success". No hace falta crear el bucket a mano: la tercera migración lo crea.
3. **Desactivá la confirmación de email (solo para desarrollo).** En **Authentication → Sign In / Providers → Email**, desactivá "Confirm email". Si está activada, quien se registre tendrá que confirmar su correo antes de poder entrar.
4. **Copiá las claves.** En **Project Settings → API Keys**, copiá:
   - la **Project URL** (en la página principal del proyecto o en Settings → API),
   - la clave **Publishable key** (empieza con `sb_publishable_`).

   **No uses** la clave `secret` ni `service_role`. Esta app no las necesita y nunca deben ir en variables que empiecen con `NEXT_PUBLIC_`.
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
    acciones/                  Acciones del servidor (auth, vacantes, CV, postulaciones)
    supabase/                  Conexión con Supabase
    auth.ts                    Lectura de sesión y control de roles
  proxy.ts                     Mantiene la sesión actualizada
supabase/
  migrations/                  Archivos SQL de la base de datos
```

## 8. Fuera de esta etapa

El análisis de CV con IA (Claude API) y el cálculo de afinidad **todavía no están implementados**. Las columnas `perfil_estructurado` y `resumen` (tabla `cvs`), `afinidad`, `analisis` y `vacante_sugerida_id` (tabla `postulaciones`) y la tabla `candidatos_sugeridos` ya existen, vacías y sin permiso de escritura desde la app, listas para esa etapa.
