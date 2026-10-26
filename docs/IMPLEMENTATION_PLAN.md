# Plan de implementación — MercApp (para ejecutar con Claude Code)

> Versión 2.1 (2026-10-15). Las fases ahora coinciden **semana a semana con el cronograma de la FTG** entregado al asesor (Dennis Garro). El cronograma no se corre; si algo se atrasa, se registra en `/DEVLOG.md` y se cierra antes de abrir alcance nuevo.

Documentos de contexto en `/docs`: PRD, TRD, APP_FLOW, DESIGN_BRIEF, BACKEND_SCHEMA. Historial de sesiones en `/DEVLOG.md`.

## 0. Preparación
- [x] Repositorio git local enlazado a `https://github.com/camilahdez99/MercApp` (rama `main`).
- [x] Documentos en `/docs`.
- [x] Crear proyecto en Supabase (`dglxvtxsmqzrotumdwan`); copiar `SUPABASE_URL` / `ANON_KEY` al `.env` (plantilla en `.env.example`).
- [ ] Sacar API key de Gemini — necesario antes de la semana 6.
- [x] Crear `CLAUDE.md` en la raíz.

## Semana 1 — 5 al 11 de octubre: Propuesta (FTG)
- [x] Entrega y ajuste de la FTG.

## Semana 2 — 12 al 18 de octubre: Requerimientos, diseño de BD y bocetos
- [x] Ajustar PRD/TRD/APP_FLOW/DESIGN_BRIEF/BACKEND_SCHEMA al documento de requerimientos del profesor.
- [x] Corregir el esquema (RLS completa, vistas con `security_invoker`, catálogo por hogar, grupos de equivalencia, compras) y validarlo en Postgres.
- [x] Documento de requerimientos en **Word**: `docs/entregables/Semana2_Requerimientos_MercApp.docx` (+ PDF). 45 RF, 14 RNF, 14 reglas de negocio, 9 historias, ER, diccionario, prototipos, trazabilidad y cronograma.
- [x] Wireframes **HTML** de 20 pantallas: `docs/wireframes/index.html` (`?solo=<id>` muestra una sola).
- [x] Cronograma de la FTG actualizado con columna de semana (`Desktop/FTG_completa_v2.docx`, copia en `docs/referencias/`).
- [ ] Completar en el Word la sección 3 con los hallazgos de las conversaciones con familias y la revisión de apps similares (lo aportan las estudiantes).

**Criterio de salida:** documento Word y wireframes listos para revisión del asesor.

## Semana 3 — 19 al 25 de octubre: Base de datos y registro de usuarios
- [x] Proyecto Expo + TypeScript + Expo Router; NativeWind con los tokens de color del Design Brief (`tailwind.config.js`, `src/theme/colors.ts`).
- [x] Estructura: `app/(auth)`, `app/(onboarding)`, `app/(tabs)`, `src/lib/supabase.ts`, `src/types/`, `src/providers/`, `src/components/`.
- [x] `supabase/migrations/` con el esquema completo (01–08), semilla de categorías (09), alertas corregidas (10) y la migración de correcciones de advisors. Migraciones de correcciones **aplicadas** en el proyecto; advisors limpios salvo 5 de seguridad intencionales (RPC de hogares + `es_miembro`/`es_admin`) y `unused_index` (INFO, base vacía).
- [x] Tipos de BD en `src/types/database.types.ts` generados desde el proyecto activo (`npm run db:types`).
- [ ] Pruebas de RLS con usuarios reales (el esquema ya se validó en PGlite en la semana 2).
- [x] Login / Registro / recuperación de contraseña / cierre de sesión, crear hogar, unirse con código, selector de hogar, tab bar de 5 destinos con estados vacíos.

**Criterio de salida:** un usuario se registra, crea un hogar (o se une con código), cambia de hogar y entra a una tab bar vacía. *(Código listo y con typecheck; falta probarlo en vivo cuando Supabase vuelva a estar activo.)*

## Semana 4 — 26 de octubre al 1 de noviembre: Tiendas y productos
- [ ] Tiendas: listar, crear, editar, eliminar, favorita, activa/inactiva, ubicación básica.
- [ ] Grupos de equivalencia y productos: nombre, marca, categoría, grupo, cantidad, unidad.
- [ ] Registro de precio manual (*propuesto para esta semana: el cronograma no lo nombra, pero las semanas 5 y 6 lo necesitan*).
- [ ] Vista `v_precio_actual` mostrada en detalle de producto/tienda.

**Criterio de salida:** se registra una tienda, un producto y un precio manual, y se ve el precio normalizado.

## Semana 5 — 2 al 8 de noviembre: Comparador, lista de mercado optimizada y sustitución de productos
- [ ] Buscador (grupos y productos) + comparador por producto y por grupo (solo tiendas activas).
- [ ] Historial de precios + gráfica (victory-native).
- [ ] Mi lista con necesidades genéricas.
- [ ] Funciones puras + pruebas Vitest (unidades, `costoConPromo`, escenarios).
- [ ] Edge Function `optimizar-lista` + pantalla con los dos escenarios (ahorro vs. tienda de referencia, PRD §6).
- [ ] Sustitución de productos: sugerir la alternativa más barata del mismo grupo en comparador y lista.

**Criterio de salida:** una lista con ≥3 necesidades muestra ambos escenarios con total y ahorro.

## Semana 6 — 9 al 15 de noviembre: Registro de precios por foto con IA y exportación de la lista
- [ ] Cámara (`expo-camera`) + compresión (`expo-image-manipulator`) + subida al bucket privado `etiquetas`.
- [ ] Edge Function `leer-etiqueta` (Gemini Flash, prompt fijo, schema JSON con confianza por campo).
- [ ] Formulario de confirmación con indicador de confianza, tienda sugerida y fecha de captura.
- [ ] Guardar `lectura_ia` y `confianza_ia`; medir acierto con ≥20 fotos reales.
- [ ] Exportar, imprimir y compartir la lista (`expo-print` + `expo-sharing`).

**Criterio de salida:** se registra un precio completo tomando solo una foto, con confirmación.

## Semana 7 — 16 al 22 de noviembre: Promociones, alertas, lista compartida, presupuesto y estadísticas
- [ ] Promociones: registro manual, aviso en comparador y lista, cálculo de ahorro real.
- [ ] Alertas: trigger + `enviar-alertas` + Expo push + configuración (secretos en Vault).
- [ ] Lista compartida: Realtime en `lista_items`, estados por ítem, "Terminar compra".
- [ ] Presupuesto mensual.
- [ ] Panel de estadísticas (vistas sobre `compras`/`compra_items` + gráficas).

**Criterio de salida:** dos miembros ven la misma lista en tiempo real y reciben al menos una alerta.

## Semana 8 — 23 al 29 de noviembre: Pruebas con usuarios y corrección de errores
- [ ] Pruebas con usuarios reales (checklist de TRD §6) y medición de acierto de IA con ≥50 fotos.
- [ ] Corrección de errores.
- [ ] APK con EAS Build.

## Semana 9 — 30 de noviembre al 6 de diciembre: Ajustes finales, manual y sustentación
- [ ] Revisión de cada pantalla contra el Design Brief.
- [ ] Manual de usuario (y técnico, a partir de estos documentos).
- [ ] Demo para la sustentación.

## Complementarios que no tenían semana (D-2, resuelta el 2026-10-15)
El cronograma original de la FTG no les daba semana; quedaron así (FTG actualizada):
- Sustitución de productos [P11] → semana 5 (sale de los grupos de equivalencia que ya usa el optimizador).
- Exportar / imprimir / compartir [P13] → semana 6 (funcionalidad pequeña; equilibra la carga de la semana 5).
- Presupuesto [P17] y estadísticas [P14] → semana 7 (dependen de "Terminar compra").

## Convenciones para trabajar con Claude Code
- Un prompt = una funcionalidad completa (pantalla + lógica + conexión a Supabase), nunca "hazme todo el backend".
- Leer el doc relevante antes de generar código, para no inventar convenciones nuevas.
- Ramas por funcionalidad (`feature/auth`, `feature/tiendas`, `feature/comparador`, `feature/foto-ia`…), revisión entre las dos antes de mergear a `main`.
- Migraciones: siempre `supabase migration new <nombre>`, nunca editar el esquema a mano en el dashboard.
- Al final de cada sesión, entrada nueva en `/DEVLOG.md`.
