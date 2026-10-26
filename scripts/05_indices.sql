-- =============================================================================
-- MercApp · 05 · Índices
-- Fuente: docs/BACKEND_SCHEMA.md §8
-- =============================================================================

create index idx_precios_producto_tienda_fecha on public.precios(producto_id, tienda_id, fecha desc);
create index idx_precios_tienda on public.precios(tienda_id);
create index idx_promociones_tienda_fechas on public.promociones(tienda_id, inicio, fin);
create index idx_promociones_producto on public.promociones(producto_id);
create index idx_lista_items_lista on public.lista_items(lista_id);
create index idx_tiendas_hogar on public.tiendas(hogar_id);
create index idx_productos_hogar on public.productos(hogar_id);
create index idx_productos_grupo on public.productos(grupo_id);
create index idx_grupos_hogar on public.grupos_equivalencia(hogar_id);
create index idx_listas_hogar on public.listas(hogar_id);
create index idx_compras_hogar_fecha on public.compras(hogar_id, fecha);
create index idx_compra_items_compra on public.compra_items(compra_id);
create index idx_compra_items_producto on public.compra_items(producto_id);
create index idx_notificaciones_usuario on public.notificaciones(usuario_id, leida);
create index idx_hogar_miembros_usuario on public.hogar_miembros(usuario_id);  -- es_miembro() por usuario
create index idx_invitaciones_hogar on public.invitaciones(hogar_id);

create unique index uq_productos_codigo_barras on public.productos(hogar_id, codigo_barras)
  where codigo_barras is not null;

-- Búsqueda por similitud (pg_trgm vive en el esquema extensions en Supabase)
create index idx_productos_nombre_trgm on public.productos
  using gin (nombre extensions.gin_trgm_ops);
create index idx_grupos_nombre_trgm on public.grupos_equivalencia
  using gin (nombre extensions.gin_trgm_ops);
