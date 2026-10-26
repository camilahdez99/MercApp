-- =============================================================================
-- MercApp · 06 · Row Level Security y permisos
-- Fuente: docs/BACKEND_SCHEMA.md §5
-- Regla: un usuario solo ve/edita datos de los hogares a los que pertenece.
-- =============================================================================

-- (la RLS ya se activó en 02_tablas.sql, junto con cada tabla)

-- Hogares: se crean con crear_hogar(); los miembros ven, el admin edita/borra
create policy hogares_select on public.hogares for select to authenticated using (es_miembro(id));
create policy hogares_update on public.hogares for update to authenticated
  using (es_admin(id)) with check (es_admin(id));
create policy hogares_delete on public.hogares for delete to authenticated using (es_admin(id));

-- Perfiles: ves el tuyo y el de quienes comparten hogar contigo; solo editas el tuyo
create policy perfiles_select on public.perfiles for select to authenticated using (
  id = auth.uid() or exists (
    select 1 from public.hogar_miembros m where m.usuario_id = perfiles.id and es_miembro(m.hogar_id)));
create policy perfiles_update on public.perfiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and (hogar_activo_id is null or es_miembro(hogar_activo_id)));

-- Miembros: se insertan solo vía crear_hogar()/unirse_hogar(); puedes salirte o el admin te saca
create policy miembros_select on public.hogar_miembros for select to authenticated
  using (es_miembro(hogar_id));
create policy miembros_delete on public.hogar_miembros for delete to authenticated
  using (usuario_id = auth.uid() or es_admin(hogar_id));

-- Invitaciones: se crean con generar_invitacion(); los miembros las ven y borran
create policy invitaciones_select on public.invitaciones for select to authenticated
  using (es_miembro(hogar_id));
create policy invitaciones_delete on public.invitaciones for delete to authenticated
  using (es_miembro(hogar_id));

-- Categorías: lectura para cualquier usuario autenticado (la semilla la carga 09_semilla.sql)
create policy categorias_select on public.categorias for select to authenticated using (true);

-- Tablas con hogar_id directo: los miembros hacen todo
create policy tiendas_all on public.tiendas for all to authenticated
  using (es_miembro(hogar_id)) with check (es_miembro(hogar_id));
create policy grupos_all on public.grupos_equivalencia for all to authenticated
  using (es_miembro(hogar_id)) with check (es_miembro(hogar_id));
create policy productos_all on public.productos for all to authenticated
  using (es_miembro(hogar_id)) with check (es_miembro(hogar_id));
create policy listas_all on public.listas for all to authenticated
  using (es_miembro(hogar_id)) with check (es_miembro(hogar_id));
create policy compras_all on public.compras for all to authenticated
  using (es_miembro(hogar_id)) with check (es_miembro(hogar_id));

-- Precios: historial inmutable -> solo leer e insertar (y borrar un registro equivocado)
create policy precios_select on public.precios for select to authenticated
  using (es_miembro((select hogar_id from public.tiendas t where t.id = tienda_id)));
create policy precios_insert on public.precios for insert to authenticated
  with check (es_miembro((select hogar_id from public.tiendas t where t.id = tienda_id))
              and registrado_por = auth.uid());
create policy precios_delete on public.precios for delete to authenticated
  using (es_miembro((select hogar_id from public.tiendas t where t.id = tienda_id)));

-- Promociones: por el hogar de la tienda
create policy promociones_all on public.promociones for all to authenticated
  using (es_miembro((select hogar_id from public.tiendas t where t.id = tienda_id)))
  with check (es_miembro((select hogar_id from public.tiendas t where t.id = tienda_id)));

-- Ítems: por el hogar de la lista / compra
create policy lista_items_all on public.lista_items for all to authenticated
  using (es_miembro((select hogar_id from public.listas l where l.id = lista_id)))
  with check (es_miembro((select hogar_id from public.listas l where l.id = lista_id)));
create policy compra_items_all on public.compra_items for all to authenticated
  using (es_miembro((select hogar_id from public.compras c where c.id = compra_id)))
  with check (es_miembro((select hogar_id from public.compras c where c.id = compra_id)));

-- Alertas y notificaciones: personales
create policy alertas_all on public.alertas_config for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy notificaciones_select on public.notificaciones for select to authenticated
  using (usuario_id = auth.uid());
create policy notificaciones_update on public.notificaciones for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
-- notificaciones se insertan solo desde la Edge Function enviar-alertas (service role, salta RLS)

-- -----------------------------------------------------------------------------
-- Permisos de tabla (la RLS decide QUÉ filas; esto decide si el rol puede tocar la tabla).
-- Se dan explícitos porque los proyectos nuevos de Supabase pueden no exponer
-- automáticamente las tablas de public a la Data API. anon no recibe nada:
-- la app siempre trabaja con sesión iniciada.
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.v_precio_actual, public.v_historial_resumen,
                public.v_promociones_vigentes, public.v_estadisticas_mes to authenticated;
