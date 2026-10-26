-- =============================================================================
-- MercApp · Correcciones de los advisors de Supabase (cronograma, actividad 17)
-- Revisión del 2026-10-16 (DEVLOG). Idempotente.
--   Seguridad:
--     * fn_tocar_lista_item sin search_path fijo (advisor 0011).
--     * Funciones security definer ejecutables por anon (0028) y, las de
--       trigger, también por authenticated (0029). Las funciones de trigger
--       no necesitan permiso de ejecución para dispararse.
--     * pg_net en public: lo corrige 20261026000000_alertas_corregidas.sql.
--   Rendimiento:
--     * Políticas con auth.uid() sin (select ...) (0003): se evaluaba por fila.
--     * 19 llaves foráneas sin índice (0001).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) search_path fijo
-- -----------------------------------------------------------------------------
alter function public.fn_tocar_lista_item() set search_path = public;

-- -----------------------------------------------------------------------------
-- 2) Permisos de ejecución
-- -----------------------------------------------------------------------------
-- Las usan las políticas de RLS y Storage: solo authenticated
revoke execute on function public.es_miembro(uuid) from public, anon;
revoke execute on function public.es_admin(uuid)   from public, anon;
grant  execute on function public.es_miembro(uuid) to authenticated;
grant  execute on function public.es_admin(uuid)   to authenticated;

-- Funciones de trigger: nadie las llama por la API
revoke execute on function public.fn_nuevo_usuario()        from public, anon, authenticated;
revoke execute on function public.fn_validar_producto()     from public, anon, authenticated;
revoke execute on function public.fn_validar_mismo_hogar()  from public, anon, authenticated;
revoke execute on function public.fn_validar_lista_item()   from public, anon, authenticated;
revoke execute on function public.fn_validar_compra_item()  from public, anon, authenticated;
revoke execute on function public.fn_validar_tienda_hogar() from public, anon, authenticated;
revoke execute on function public.fn_tocar_lista_item()     from public, anon, authenticated;

-- Las RPC de hogares ya estaban solo para authenticated (03); se repite por si
-- la base se armó a mano sin esa parte.
revoke execute on function public.crear_hogar(text)        from public, anon;
revoke execute on function public.generar_invitacion(uuid) from public, anon;
revoke execute on function public.unirse_hogar(text)       from public, anon;
grant  execute on function public.crear_hogar(text)        to authenticated;
grant  execute on function public.generar_invitacion(uuid) to authenticated;
grant  execute on function public.unirse_hogar(text)       to authenticated;

-- -----------------------------------------------------------------------------
-- 3) Políticas con (select auth.uid()): se evalúa una vez por consulta
-- -----------------------------------------------------------------------------
drop policy if exists perfiles_select on public.perfiles;
create policy perfiles_select on public.perfiles for select to authenticated using (
  id = (select auth.uid()) or exists (
    select 1 from public.hogar_miembros m where m.usuario_id = perfiles.id and es_miembro(m.hogar_id)));

drop policy if exists perfiles_update on public.perfiles;
create policy perfiles_update on public.perfiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and (hogar_activo_id is null or es_miembro(hogar_activo_id)));

drop policy if exists miembros_delete on public.hogar_miembros;
create policy miembros_delete on public.hogar_miembros for delete to authenticated
  using (usuario_id = (select auth.uid()) or es_admin(hogar_id));

drop policy if exists precios_insert on public.precios;
create policy precios_insert on public.precios for insert to authenticated
  with check (es_miembro((select hogar_id from public.tiendas t where t.id = tienda_id))
              and registrado_por = (select auth.uid()));

drop policy if exists alertas_all on public.alertas_config;
create policy alertas_all on public.alertas_config for all to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

drop policy if exists notificaciones_select on public.notificaciones;
create policy notificaciones_select on public.notificaciones for select to authenticated
  using (usuario_id = (select auth.uid()));

drop policy if exists notificaciones_update on public.notificaciones;
create policy notificaciones_update on public.notificaciones for update to authenticated
  using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- 4) Índices para las llaves foráneas (borrados en cascada y joins)
-- -----------------------------------------------------------------------------
create index if not exists idx_perfiles_hogar_activo        on public.perfiles(hogar_activo_id);
create index if not exists idx_invitaciones_creado_por      on public.invitaciones(creado_por);
create index if not exists idx_grupos_categoria             on public.grupos_equivalencia(categoria_id);
create index if not exists idx_precios_registrado_por       on public.precios(registrado_por);
create index if not exists idx_promociones_creado_por       on public.promociones(creado_por);
create index if not exists idx_listas_creada_por            on public.listas(creada_por);
create index if not exists idx_lista_items_grupo            on public.lista_items(grupo_id);
create index if not exists idx_lista_items_preferido        on public.lista_items(producto_preferido_id);
create index if not exists idx_lista_items_asignado         on public.lista_items(producto_asignado_id);
create index if not exists idx_lista_items_tienda           on public.lista_items(tienda_asignada_id);
create index if not exists idx_lista_items_promocion        on public.lista_items(promocion_id);
create index if not exists idx_lista_items_sustituto        on public.lista_items(sustituto_id);
create index if not exists idx_lista_items_actualizado_por  on public.lista_items(actualizado_por);
create index if not exists idx_notificaciones_producto      on public.notificaciones(producto_id);
create index if not exists idx_notificaciones_promocion     on public.notificaciones(promocion_id);
create index if not exists idx_compras_lista                on public.compras(lista_id);
create index if not exists idx_compras_tienda               on public.compras(tienda_id);
create index if not exists idx_compras_registrada_por       on public.compras(registrada_por);
create index if not exists idx_compra_items_promocion       on public.compra_items(promocion_id);
