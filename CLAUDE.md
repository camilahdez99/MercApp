# CLAUDE.md — MercApp

App móvil para comparar precios de mercado entre tiendas y optimizar la lista de compras. Trabajo de grado. Dos estudiantes (Camila, Silenia), asesor Dennis Garro.

## Qué es esto
- **App:** React Native + Expo (Expo Router), TypeScript, NativeWind. Carpeta `app/` (rutas) y `src/` (lógica, componentes, tipos).
- **Backend:** Supabase (Postgres + Auth + Storage + Realtime + Edge Functions). Proyecto `dglxvtxsmqzrotumdwan`.
- **Documentos de diseño:** `docs/` (PRD, TRD, APP_FLOW, DESIGN_BRIEF, BACKEND_SCHEMA, IMPLEMENTATION_PLAN).
- **Esquema SQL:** `scripts/` (01–10, legibles) y `supabase/migrations/` (versionado para el CLI).
- **Bitácora:** `DEVLOG.md`, una entrada por sesión. Cronograma en `Cronograma MercApp detallado.xlsx` (Escritorio).

## Reglas de trabajo
- El cronograma manda: una funcionalidad por semana, no abrir alcance nuevo sin cerrar lo anterior. Si algo se atrasa, se anota en `DEVLOG.md`.
- **Leer el doc relevante de `docs/` antes de generar código** — no inventar convenciones nuevas.
- Migraciones: `supabase migration new <nombre>`, nunca editar el esquema a mano en el dashboard.
- RLS en todas las tablas: un usuario solo ve datos de los hogares a los que pertenece. Las vistas usan `security_invoker = true`.
- Secretos (`.env`, llaves de IA) nunca se commitean. Llaves de servidor solo en Supabase.
- Textos de la interfaz en español claro y cercano (ver DESIGN_BRIEF §6).
- Al final de cada sesión: entrada nueva en `DEVLOG.md`.

## Comandos
```bash
npm install            # dependencias
npx expo install       # alinear versiones nativas al SDK (si algo no cuadra)
npm start              # servidor de desarrollo (Expo Go / web)
npm run typecheck      # tsc --noEmit
npm run db:types       # regenerar src/types/database.types.ts desde Supabase
```

## Configuración
Copiar `.env.example` a `.env` y poner `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`
(Dashboard de Supabase → Project Settings → API).

## Paleta (Design Brief)
`primary #1E8E4F` · `primary-dark #0F5C30` · `primary-tint #E6F4EC` · `accent #E8872E` ·
`ink #1A1A1A` · `ink-muted #6B7280` · `surface #FFFFFF` · `background #F7F8F7` · `error #D64545`.
Definida en `tailwind.config.js` (clases NativeWind) y `src/theme/colors.ts` (valores sueltos).
