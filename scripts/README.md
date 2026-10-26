# Scripts de base de datos — MercApp (Supabase)

Crean el esquema de `docs/BACKEND_SCHEMA.md` (v2) en un proyecto Supabase **vacío**.

## Cómo correrlos

En el dashboard de Supabase → **SQL Editor** → pegar y ejecutar cada archivo **en este orden**:

| # | Archivo | Qué hace |
| --- | --- | --- |
| 1 | `01_extensiones.sql` | `pg_trgm` (búsqueda por similitud) |
| 2 | `02_tablas.sql` | Las 16 tablas |
| 3 | `03_funciones_y_triggers.sql` | `es_miembro`, `es_admin`, RPC `crear_hogar` / `generar_invitacion` / `unirse_hogar`, perfil automático, triggers de consistencia |
| 4 | `04_vistas.sql` | `v_precio_actual`, `v_historial_resumen`, `v_promociones_vigentes`, `v_estadisticas_mes` |
| 5 | `05_indices.sql` | Índices |
| 6 | `06_rls_y_permisos.sql` | RLS en todas las tablas + permisos para `authenticated` |
| 7 | `07_storage.sql` | Bucket privado `etiquetas` + política por hogar |
| 8 | `08_realtime.sql` | Publica `lista_items`, `listas` y `notificaciones` en Realtime |
| 9 | `09_semilla.sql` | 12 categorías |
| — | `10_alertas_semana7.sql` | **Solo en la semana 7**, cuando exista la Edge Function `enviar-alertas` (pg_net, pg_cron, Vault) |
| — | `99_verificacion.sql` | Consultas de solo lectura para confirmar que todo quedó creado |

Los scripts 01–09 asumen una base vacía: si uno falla a mitad, lo más simple es
**Settings → General → Reset database** (o crear un proyecto nuevo) y volver a empezar.

## Con Supabase CLI (semana 3, recomendado por el plan)

El plan pide migraciones versionadas. Los mismos archivos sirven como contenido:

```bash
supabase init
supabase migration new esquema_inicial   # pegar 01 a 08 en el archivo creado
supabase migration new semilla_categorias # pegar 09
supabase db push
```

## Ajustes frente a BACKEND_SCHEMA.md

Validados en Postgres 16 (PGlite) con pruebas de RLS entre dos hogares.

1. **Triggers de validación como `security definer` + `is distinct from`.** Con RLS, un grupo o producto de otro hogar es invisible; la consulta del trigger devolvía `NULL`, `NULL <> x` no es verdadero y la validación **no** saltaba: se podía registrar un precio con un producto ajeno si se conocía su id.
2. **Validaciones nuevas de mismo hogar** en `lista_items` (grupo, productos, tienda, promo), `compra_items` (producto, promo) y `compras` (tienda, lista).
3. **`on delete set null`** en `lista_items.producto_preferido_id / producto_asignado_id / tienda_asignada_id` (antes impedían borrar un producto o tienda usados en una lista) y **`on delete cascade`** en `invitaciones.creado_por`.
4. **Permisos explícitos:** las RPC solo para `authenticated` (no `anon`); `grant` de tablas y vistas a `authenticated` y nada a `anon`. Las políticas usan `to authenticated`.
5. **`crear_hogar`** rechaza nombres vacíos; **`unirse_hogar`** acepta el código con espacios o en minúsculas.
6. **Índices extra:** `hogar_miembros(usuario_id)` (lo usa `es_miembro` en cada consulta), `promociones(producto_id)`, `compra_items(producto_id)`, `invitaciones(hogar_id)`.
7. **Storage:** el bucket se crea por SQL con límite de 5 MB y solo imágenes.
8. **Alertas:** la llamada HTTP quedó en `fn_llamar_enviar_alertas(jsonb)`, reutilizada por el trigger y por el `pg_cron` diario. `pg_net` y `pg_cron` se habilitan solo en la semana 7.
