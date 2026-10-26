# TRD — MercApp

> Versión 2 (2026-10-15): arquitectura ajustada a los requerimientos del profesor y a las decisiones de la semana 2 (varios hogares por usuario, catálogo por hogar, lista por necesidad genérica, presupuesto).

## 1. Stack
| Capa | Tecnología |
| --- | --- |
| Lenguaje | TypeScript en toda la base de código (app + funciones de servidor) |
| App móvil | React Native + Expo (Expo Router), Android e iOS desde una sola base |
| UI | NativeWind (Tailwind para React Native) |
| Backend | Supabase: PostgreSQL, Auth, Storage, Realtime, Edge Functions (Deno + TypeScript) |
| IA de lectura de precios | Gemini Flash (API), con Claude Haiku como alterno si falla o lee peor |
| Notificaciones | Expo Notifications (push) + triggers de Postgres |
| PDF y compartir | expo-print + expo-sharing |
| Gráficas (estadísticas) | victory-native |
| Control de versiones | Git + GitHub, tablero en GitHub Projects |
| Build / distribución | EAS Build (APK), Expo Go para desarrollo |

No hay servidor propio: toda la lógica de servidor vive en Supabase Edge Functions.

## 2. Arquitectura (resumen)
- La app usa `supabase-js` directo para datos, login, fotos y tiempo real.
- Operaciones de hogar que requieren privilegios se hacen con funciones RPC de Postgres (`crear_hogar`, `generar_invitacion`, `unirse_hogar`) — ver BACKEND_SCHEMA §3.
- El hogar activo del usuario se guarda en `perfiles.hogar_activo_id`; todas las consultas de la app filtran por ese hogar.
- Todo lo que necesita una llave secreta o cómputo pesado pasa por Edge Functions:
  - `leer-etiqueta`: recibe la ruta de la foto en Storage, llama al modelo de IA y devuelve JSON estructurado (§2.1).
  - `optimizar-lista`: calcula los dos escenarios de la lista de mercado (§2.2).
  - `enviar-alertas`: evalúa condiciones de alerta y dispara push vía Expo.
- Postgres dispara `enviar-alertas` por trigger cuando entra un precio nuevo; `pg_cron` revisa promociones por vencer una vez al día. La URL y la llave se leen de Supabase Vault (nada quemado en el SQL).
- Row Level Security (RLS) en todas las tablas: un usuario solo ve/edita datos de los hogares a los que pertenece. Las vistas se crean con `security_invoker = true` para que también respeten la RLS.

### 2.1 `leer-etiqueta` (IA)
- Entrada: `{ foto_path, hogar_id }`. La función descarga la imagen del bucket privado y la envía a Gemini Flash con un prompt fijo y un schema JSON de salida.
- Salida (cada campo con su confianza 0–1; `null` si no aparece en la foto):
  `nombre, marca, cantidad, unidad, precio, precio_unidad_etiqueta, tienda_detectada`.
- Fecha: la de captura de la foto (EXIF si existe; si no, la hora del envío).
- Tienda: si `tienda_detectada` coincide (similitud de texto) con una tienda activa del hogar se sugiere esa; si no, la más cercana por GPS; si no, la última usada. El usuario siempre puede cambiarla.
- Producto: se sugiere un producto existente del catálogo del hogar por similitud (`pg_trgm`) de nombre + marca + presentación; si no hay, se ofrece crearlo y elegir/crear su grupo.
- Se guarda en `precios.lectura_ia` la respuesta cruda de la IA y en `confianza_ia` las confianzas, para calcular el % de acierto contra lo que confirmó el usuario.

### 2.2 `optimizar-lista` (algoritmo)
Entrada: `lista_id`, `limite_tiendas` opcional. Solo se consideran **tiendas activas** del hogar con precio registrado.

1. **Candidatos por ítem:** productos del grupo del ítem (o solo el producto preferido, si lo hay) con precio actual (`v_precio_actual`) en cada tienda.
2. **Unidades a comprar** de un candidato: si el ítem tiene unidad, `ceil(cantidad_necesaria_en_base / contenido_del_empaque_en_base)`; si no, `cantidad` empaques.
3. **Costo** = unidades × precio, aplicando la promoción vigente si la hay (función pura `costoConPromo`):
   - `descuento_pct`: `u · p · (1 − v/100)`
   - `precio_fijo`: `u · v`
   - `n_por_valor` (N por V): `floor(u/N) · V + (u mod N) · p`
   - `2x1`: `ceil(u/2) · p`
4. **Mejor opción por (ítem, tienda):** el candidato de menor costo.
5. **Escenario A — una sola tienda:** para cada tienda, suma del mejor costo de cada ítem; gana la de menor total entre las que cubren todos los ítems. Si ninguna cubre todo, se muestra la que más cubre y los ítems faltantes.
6. **Escenario B — varias tiendas:** cada ítem va a la tienda con menor costo. Si hay `limite_tiendas = N`, se prueban todas las combinaciones de N tiendas (con ≤10 tiendas activas son a lo sumo 252 combinaciones) y gana la de menor total.
7. **Salida:** ambos escenarios con ítems agrupados por tienda, subtotales, total, ahorro frente a la tienda de referencia (PRD §6: solo ítems con precio en ambos lados), promos aplicadas y aviso de presupuesto si el total supera lo que queda del presupuesto del mes.
8. Cuando el usuario elige un escenario, se escriben `producto_asignado_id`, `tienda_asignada_id`, `unidades_a_comprar`, `precio_estimado` y `promocion_id` en `lista_items` y `estrategia` en `listas`.

Las funciones puras (normalización de unidades, unidades a comprar, `costoConPromo`, selección de escenarios) viven en un módulo TypeScript compartido para poder probarlas con Vitest.

### 2.3 Cierre de compra
Al tocar "Terminar compra" en Mi lista, la app crea una fila en `compras` por cada tienda con ítems comprados y sus `compra_items` (producto, unidades, precio, subtotal, promo aplicada), y cierra la lista (`estado = 'cerrada'`). `compras.ahorro` = Σ (precio en la tienda de referencia − subtotal pagado) de los ítems que tienen precio en la tienda de referencia. Esa información alimenta estadísticas, ahorro acumulado y presupuesto.

## 3. Requisitos no funcionales
- **Rendimiento:** el comparador debe responder en <1 s con hasta 10 tiendas y 500 productos (todo resuelto con vistas SQL, no en el cliente).
- **Disponibilidad offline:** no es requisito del MVP; la app asume conexión a internet.
- **Seguridad:** RLS obligatorio; llaves de IA solo en Edge Functions (nunca en el cliente); fotos en Storage con bucket privado, URL firmada de corta duración.
- **Privacidad:** no se piden datos personales más allá de nombre y correo; no se comparten datos entre hogares.
- **Compatibilidad:** Android 8+ e iOS 14+ (rango por defecto de Expo SDK vigente).
- **Accesibilidad básica:** tamaños de texto legibles, contraste AA en los colores principales.

## 4. Integraciones externas
| Servicio | Uso | Plan |
| --- | --- | --- |
| Supabase | BD, auth, storage, realtime, edge functions | Free tier (suficiente para el piloto; se pausa tras ~1 semana sin uso) |
| Gemini API | Lectura de precios desde foto | Free tier (los datos del plan gratis pueden usarse para mejorar el modelo de Google — no enviar datos personales, solo la foto del producto) |
| Claude API (alterno) | Lectura de precios, respaldo si Gemini falla | Pago por uso, fracciones de centavo por foto |
| Expo / EAS | Build y push notifications | Free tier con cupo mensual de builds |

## 5. Configuración de entorno
- Variables en `.env` (nunca commiteadas): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Secrets de servidor (solo en Supabase, vía `supabase secrets set`): `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` (alterno), `EXPO_ACCESS_TOKEN` (para push).
- Migraciones de base de datos versionadas con Supabase CLI (`supabase/migrations/`).

## 6. Estrategia de pruebas
- **Unitarias:** funciones puras (normalización de unidades, cálculo de precio unitario, unidades a comprar, `costoConPromo`, optimizador) con Vitest.
- **Base de datos:** pruebas de RLS por migración (un usuario de otro hogar no ve ni escribe nada; un miembro sí), ejecutadas contra Supabase local (`supabase start`).
- **Edge Functions:** pruebas locales con `supabase functions serve` + casos de ejemplo (fotos de prueba, JSON esperado).
- **Manuales:** checklist por sprint sobre dispositivo real (Expo Go) antes de cada corte.
- **Piloto:** prueba de acierto de IA con ≥50 fotos reales, medido campo por campo (nombre, precio, presentación).

## 7. Manejo de errores
- Falla de lectura de IA → mensaje claro + opción de registrar manual, nunca bloquear al usuario.
- Falla de red → reintento simple con mensaje, sin perder lo que el usuario ya escribió (estado local en el formulario).
- Conflictos de Realtime (dos personas editan el mismo ítem) → gana la última escritura (last-write-wins), sin necesidad de resolución compleja para el MVP.
