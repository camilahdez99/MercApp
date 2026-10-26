# DEVLOG — MercApp

Historial de sesiones de trabajo. Una entrada por sesión, la más reciente arriba.
Formato: fecha — semana del cronograma, entregable, estado, hecho, pendiente, decisiones/bloqueos.

## 2026-10-26 — Semana 3 (19 al 25 de octubre)
**Entregable de la semana:** Creación de la base de datos y del registro de usuarios.
**Estado:** código de la app completo y verificado (typecheck + bundle de Metro); falta probarlo en vivo y aplicar/validar las migraciones porque el proyecto Supabase está pausado.

### Hecho hoy
- **Proyecto Expo creado en la raíz del repo** (SDK 58, React Native 0.88, Expo Router, NativeWind 4, TypeScript). `package.json`, `app.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js` (tokens del Design Brief), `global.css`, `tsconfig.json` (alias `@/*`), `.env.example`, `CLAUDE.md`. `.npmrc` con `legacy-peer-deps=true` (conflicto de parche react/react-dom en las deps web de expo-router).
- **Estructura:** `app/(auth)` (login, registro, recuperar), `app/(onboarding)/hogar`, `app/(tabs)` (inicio, comparar, escanear, lista, tiendas) + `app/selector-hogar` (modal). `src/lib/supabase.ts`, `src/types/database.types.ts`, `src/theme/colors.ts`, `src/components/ui.tsx` + `EncabezadoHogar`, `src/providers/AuthProvider.tsx`.
- **Auth y hogares (act. 20–24):** cliente supabase-js con AsyncStorage; `AuthProvider` lleva sesión + perfil + hogares y redirige (Gate en `_layout`): sin sesión → `(auth)`, sin hogar → `(onboarding)`, con hogar → `(tabs)`. Login, registro (con `nombre` en metadata para `fn_nuevo_usuario`), recuperación de contraseña, cierre de sesión. Crear hogar / unirse con código vía RPC `crear_hogar` / `unirse_hogar`; selector de hogar con cambio de hogar activo, invitación (`generar_invitacion` + Share) y salir. Tab bar de 5 destinos con botón de cámara central y estados vacíos (act. 19).
- **Migraciones (act. 16):** los scripts `01`–`10` pasaron a `supabase/migrations/` (`20261019000000_esquema_inicial`, `..000100_semilla_categorias`, `20261026000000_alertas_corregidas`).
- **Correcciones de advisors (act. 17):** nueva migración `20261026000100_correcciones_advisors.sql` — `search_path` en `fn_tocar_lista_item`; `revoke execute` a `anon`/`public` en `es_miembro`/`es_admin` y a todas las funciones de trigger; políticas de `perfiles`, `hogar_miembros`, `precios`, `alertas_config`, `notificaciones` con `(select auth.uid())`; índices para las 19 FK sin índice. **No aplicada aún** (proyecto pausado).
- **Verificación:** `npm run typecheck` en verde; `npx expo export --platform android` empaqueta sin errores (bundle de 5MB, 45 assets). Se resolvieron en el camino: versiones del SDK con `expo install`, `babel-preset-expo` y `react-native-worklets` faltantes (Reanimated 4 usa `react-native-worklets/plugin`, que `babel-preset-expo` añade solo → se quitó el plugin manual del `babel.config`).

### Pendiente para la próxima sesión
- **Reactivar el proyecto Supabase** (está pausado, free tier) y:
  - Aplicar la migración de correcciones de advisors (el resto del esquema ya estaba a mano; registrar el estado con `supabase migration repair --status applied` en las migraciones del esquema para no reaplicarlas).
  - Regenerar `src/types/database.types.ts` con `npm run db:types` y ampliarlo (hoy solo cubre hogares/perfiles/miembros/categorías, lo que usa la semana 3).
  - Poner la `anon key` real en `.env`.
- **Pruebas de RLS (act. 25)** contra el proyecto ya activo: registro, login y que cada hogar solo vea sus datos. El esquema ya se validó en PGlite en la semana 2.
- Probar la app en vivo (Expo Go / emulador): el criterio de salida de la semana (registrarse → crear/unirse a hogar → cambiar de hogar → tab bar).
- Semana 4 (26 oct–1 nov): módulo de tiendas y productos.

### Decisiones o bloqueos
- **Bloqueo:** proyecto Supabase pausado → no se pudieron aplicar migraciones ni correr las pruebas de RLS esta sesión. El código de la app asume el esquema ya documentado y validado.
- Decidido: Expo Router + NativeWind; `AuthProvider` como única fuente de verdad de sesión/hogar; tipos de BD a mano mientras el proyecto esté pausado; `legacy-peer-deps` a nivel de proyecto.

## 2026-10-16 — Semana del 12 al 18 de octubre
**Entregable de la semana:** Requerimientos, diseño de la base de datos y bocetos de pantallas.
**Estado:** completo, salvo la sección 3 del Word de requerimientos (hallazgos con familias), que aportan las estudiantes

### Hecho hoy
- FTG con prototipos: nueva sección "PROTOTIPOS DE PANTALLAS:" antes de REFERENCIAS, con el formato de la FTG (título Arial 14 negrita, texto Arial 11 justificado), dos párrafos de introducción y las 20 pantallas en cuadrícula de 3 por fila. Pasó de 5 a 10 páginas. Guardada como `Desktop/FTG_completa_v3.docx` (la v2 estaba abierta en Word); copia + PDF en `docs/referencias/`.
- Scripts SQL de Supabase en `scripts/` (01–09 para la semana 3, 10 para alertas en la semana 7, 99 de verificación) + README con orden de ejecución. Validados en PGlite con pruebas de RLS entre hogares. Se corrigió un hueco: los triggers de "mismo hogar" no saltaban con datos invisibles por RLS (ahora `security definer` + `is distinct from`).
- Proyecto Supabase `dglxvtxsmqzrotumdwan` creado y servidor MCP `supabase` conectado (`.mcp.json`). Revisión de solo lectura (no se cambió nada en la base): el esquema **ya estaba aplicado a mano** (SQL Editor), scripts 01–09 **y también el 10**.
  - OK: 16 tablas con RLS activa y políticas (1–3 c/u), 4 vistas con `security_invoker=true`, RPC `crear_hogar` / `generar_invitacion` / `unirse_hogar` / `es_miembro` / `es_admin`, 12 categorías, bucket `etiquetas` privado (5 MB, solo imágenes) con política `etiquetas_rw`, Realtime en `lista_items`, `listas` y `notificaciones`, trigger `trg_nuevo_usuario` en `auth.users`.
  - Del script 10 (semana 7) quedaron: `pg_net` y `pg_cron`, `fn_llamar_enviar_alertas`, `fn_revisar_alertas`, trigger `trg_precio_nuevo` en `precios` y cron `revisar-promos-por-vencer` (13:00 UTC, activo). **Vault está vacío** (no hay `url_enviar_alertas` ni `service_role_key`).
  - Historial de migraciones vacío (`list_migrations` = []), porque no se aplicó con migraciones.
  - Advisors de seguridad (WARN): `fn_tocar_lista_item` sin `search_path` fijo; `pg_net` instalada en `public`; funciones `security definer` ejecutables por `anon` (`es_miembro`, `es_admin`, `fn_nuevo_usuario`, funciones de validación y `fn_revisar_alertas`), lo que contradice el ajuste 4 del README (RPC solo para `authenticated`). Las RPC ejecutables por `authenticated` son esperadas.
  - Advisors de rendimiento: 7 políticas con `auth.uid()` sin `(select ...)` (`perfiles`, `hogar_miembros`, `precios`, `alertas_config`, `notificaciones`); 19 FK sin índice (INFO); índices sin uso (normal, la base está vacía).

### Pendiente para la próxima sesión
- Lo mismo de la entrada del 2026-10-15 (ya no hace falta crear el proyecto Supabase ni migrar el esquema).
- **Decidir qué hacer con el script 10 aplicado antes de tiempo.** Sin los secretos en Vault, `trg_precio_nuevo` llama a `net.http_post` con URL nula en cada `insert` en `precios`; probablemente falle y bloquee el registro de precios. El cron diario también fallará. Opciones: quitar trigger, cron y funciones hasta la semana 7, o cargar los secretos cuando exista `enviar-alertas`. Probar un `insert` en `precios` antes de usar la app.
- Corregir advisors de seguridad en los scripts y en la base: `revoke execute ... from public, anon` en las funciones `security definer`, `set search_path` en `fn_tocar_lista_item`, `pg_net` en el esquema `extensions`.
- Optimizar políticas con `(select auth.uid())` y, si conviene, índices para las FK.
- Historial de migraciones: cuando se use Supabase CLI, registrar el estado actual (`supabase db pull` o `supabase migration repair`) para no reaplicar los scripts.

- `scripts/10_alertas_semana7.sql` corregido **solo en el archivo** (no se reaplicó en la base): sin secretos en Vault se omite la llamada con un WARNING, y los errores al encolarla también se capturan; `pg_net` va en `extensions`, se aplica `revoke` a `fn_revisar_alertas` y el script es idempotente. Correrlo en Supabase resolvería el riesgo de `trg_precio_nuevo`.
- Diagrama ER del esquema real para informes: `docs/diagramas/er_mercapp.png` (fuente HTML en `docs/diagramas/er_mercapp.html`).

### Decisiones o bloqueos
- Decidido: no tocar la base por ahora; solo se documentó el estado.

## 2026-10-15 — Semana del 12 al 18 de octubre
**Entregable de la semana:** Requerimientos, diseño de la base de datos y bocetos de pantallas.
**Estado:** completo, salvo la sección 3 del Word (hallazgos con familias), que aportan las estudiantes

### Hecho hoy
- Lectura de los docs, el KICKOFF, la FTG y el documento de requerimientos del profesor (copiados en `docs/referencias/`).
- `git init` en `MercApp` (rama `main`), remoto `origin` = github.com/camilahdez99/MercApp (vacío), `.gitignore`. Sin commits ni push todavía.
- PRD v2: decisiones de modelo, alcance ajustado al PDF del profesor, trazabilidad con sus 13 módulos, decisiones pendientes.
- BACKEND_SCHEMA v2: catálogo por hogar, `grupos_equivalencia`, lista por necesidad genérica, `compra_items`, presupuesto, `hogar_activo_id`, promociones con `cantidad_requerida`, vistas `security_invoker`, `fecha_ultimo_cambio`, RLS completa, funciones `crear_hogar`/`generar_invitacion`/`unirse_hogar`, triggers de consistencia, Storage, alertas con Vault, diagrama ER en Mermaid.
- Esquema validado en Postgres 16 (PGlite): todo el SQL corre y las pruebas de RLS entre hogares pasan.
- TRD v2 (IA, algoritmo de `optimizar-lista`, cierre de compra), APP_FLOW v2, DESIGN_BRIEF (componentes nuevos), IMPLEMENTATION_PLAN alineado semana a semana al cronograma.
- D-1 resuelta: ahorro frente a la "tienda de referencia" (la más usada en 90 días → favorita → promedio de una tienda), solo con ítems que tengan precio en ambos lados.
- D-2 resuelta: sustitución → S5; exportar/imprimir → S6; presupuesto y estadísticas → S7. La FTG se actualizó con la columna "Semana N" (`Desktop/FTG_completa_v2.docx`; el original estaba abierto en Word y no se sobrescribió).
- `v_historial_resumen`: "anterior" = último precio distinto (validado: 5.000 → 5.400 da +8 % aunque el 5.400 se repita).
- Wireframes HTML de 20 pantallas en `docs/wireframes/index.html`.
- Entregable Word `docs/entregables/Semana2_Requerimientos_MercApp.docx` (+ PDF, 26 págs): 45 RF, 14 RNF, 14 RN, 9 HU, ER (Mermaid renderizado), diccionario, prototipos, trazabilidad con [P2–P17] y cronograma.

### Pendiente para la próxima sesión
- Semana 3 (19–25 oct): crear proyecto Supabase (falta URL y anon key), proyecto Expo, migración del esquema, auth y hogares.
- Las estudiantes: completar la sección 3 del Word (conversaciones con familias / apps similares) y revisar el documento antes de enviarlo al asesor.
- Commit inicial y push (cuando las estudiantes lo aprueben).
- Actualizar el calendario del `KICKOFF_PROMPT.md` (Desktop) con el nuevo cronograma.

### Decisiones o bloqueos
- Decidido: Word para el entregable, wireframes en HTML, ER en Mermaid, catálogo por hogar, varios hogares por usuario, sin libra (g/kg/ml/l/und), "und" dividido por cantidad, lista por necesidad genérica, presupuesto simple, tabla compras + compra_items.
- FTG: la sección Herramientas aún dice "Figma para prototipos y Google Docs para documentación"; en la práctica se usaron wireframes HTML y Word. Decidir si se ajusta.
- FTG: el presupuesto quedó en el cronograma (S7) pero no aparece en la lista de alcance de la FTG.
- Antes de la semana 3: proyecto Supabase creado.

