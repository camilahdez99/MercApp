-- =============================================================================
-- MercApp · 03 · Funciones de apoyo, RPC y triggers de consistencia
-- Fuente: docs/BACKEND_SCHEMA.md §3
-- Ajustes frente al documento (ver scripts/README.md):
--   * Los triggers de validación son SECURITY DEFINER y comparan con
--     IS DISTINCT FROM: con RLS activa, un grupo/producto de otro hogar es
--     invisible para el usuario, la consulta devolvía NULL y `NULL <> x` no
--     lanzaba la excepción.
--   * Nuevas validaciones de mismo hogar para lista_items y compra_items.
-- =============================================================================

-- ¿El usuario actual es miembro de este hogar? (security definer evita recursión de RLS)
create or replace function public.es_miembro(p_hogar uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from hogar_miembros
                 where hogar_id = p_hogar and usuario_id = auth.uid());
$$;

create or replace function public.es_admin(p_hogar uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from hogar_miembros
                 where hogar_id = p_hogar and usuario_id = auth.uid() and rol = 'admin');
$$;

-- -----------------------------------------------------------------------------
-- Perfil automático al registrarse en Auth
-- -----------------------------------------------------------------------------
create or replace function public.fn_nuevo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger trg_nuevo_usuario
after insert on auth.users
for each row execute function public.fn_nuevo_usuario();

-- -----------------------------------------------------------------------------
-- RPC de hogares (la app las llama con supabase.rpc(...))
-- -----------------------------------------------------------------------------

-- Crear hogar: inserta el hogar, agrega al creador como admin y lo deja como hogar activo
create or replace function public.crear_hogar(p_nombre text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'no autenticado'; end if;
  if coalesce(trim(p_nombre), '') = '' then raise exception 'el nombre del hogar es obligatorio'; end if;
  insert into hogares (nombre) values (trim(p_nombre)) returning id into v_id;
  insert into hogar_miembros (hogar_id, usuario_id, rol) values (v_id, auth.uid(), 'admin');
  update perfiles set hogar_activo_id = v_id where id = auth.uid();
  return v_id;
end;
$$;

-- Generar código de invitación de 6 caracteres (solo miembros del hogar)
create or replace function public.generar_invitacion(p_hogar uuid) returns text
language plpgsql security definer set search_path = public as $$
declare v_codigo text;
begin
  if not es_miembro(p_hogar) then raise exception 'no eres miembro de este hogar'; end if;
  loop
    v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));  -- 6 caracteres 0-9/A-F
    exit when not exists (select 1 from invitaciones where codigo = v_codigo);
  end loop;
  insert into invitaciones (codigo, hogar_id, creado_por) values (v_codigo, p_hogar, auth.uid());
  return v_codigo;
end;
$$;

-- Unirse con un código (el invitado aún no es miembro, por eso security definer)
create or replace function public.unirse_hogar(p_codigo text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_hogar uuid;
begin
  if auth.uid() is null then raise exception 'no autenticado'; end if;
  select hogar_id into v_hogar from invitaciones
   where codigo = upper(trim(p_codigo)) and expira_en > now();
  if v_hogar is null then raise exception 'código inválido o vencido'; end if;
  insert into hogar_miembros (hogar_id, usuario_id) values (v_hogar, auth.uid())
  on conflict do nothing;
  update perfiles set hogar_activo_id = v_hogar where id = auth.uid();
  return v_hogar;
end;
$$;

-- -----------------------------------------------------------------------------
-- Triggers de consistencia
-- -----------------------------------------------------------------------------

-- Producto: unidad compatible con su grupo y grupo del mismo hogar
create or replace function public.fn_validar_producto() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_tipo text; v_hogar uuid;
begin
  select tipo_medida, hogar_id into v_tipo, v_hogar from grupos_equivalencia where id = new.grupo_id;
  if v_hogar is distinct from new.hogar_id then raise exception 'el grupo pertenece a otro hogar'; end if;
  if (v_tipo = 'peso'    and new.unidad not in ('g','kg'))
  or (v_tipo = 'volumen' and new.unidad not in ('ml','l'))
  or (v_tipo = 'unidad'  and new.unidad <> 'und') then
    raise exception 'unidad % no corresponde a un grupo de tipo %', new.unidad, v_tipo;
  end if;
  return new;
end;
$$;

create trigger trg_validar_producto
before insert or update on public.productos
for each row execute function public.fn_validar_producto();

-- Precios y promociones: el producto y la tienda deben ser del mismo hogar
create or replace function public.fn_validar_mismo_hogar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select hogar_id from productos where id = new.producto_id)
     is distinct from (select hogar_id from tiendas where id = new.tienda_id) then
    raise exception 'producto y tienda pertenecen a hogares distintos';
  end if;
  return new;
end;
$$;

create trigger trg_precios_mismo_hogar before insert or update on public.precios
for each row execute function public.fn_validar_mismo_hogar();
create trigger trg_promos_mismo_hogar before insert or update on public.promociones
for each row execute function public.fn_validar_mismo_hogar();

-- Ítems de lista: grupo, productos, tienda y promoción del mismo hogar que la lista
create or replace function public.fn_validar_lista_item() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_hogar uuid;
begin
  select hogar_id into v_hogar from listas where id = new.lista_id;
  if (select hogar_id from grupos_equivalencia where id = new.grupo_id) is distinct from v_hogar
  or (new.producto_preferido_id is not null and
      (select hogar_id from productos where id = new.producto_preferido_id) is distinct from v_hogar)
  or (new.producto_asignado_id is not null and
      (select hogar_id from productos where id = new.producto_asignado_id) is distinct from v_hogar)
  or (new.sustituto_id is not null and
      (select hogar_id from productos where id = new.sustituto_id) is distinct from v_hogar)
  or (new.tienda_asignada_id is not null and
      (select hogar_id from tiendas where id = new.tienda_asignada_id) is distinct from v_hogar)
  or (new.promocion_id is not null and
      (select t.hogar_id from promociones p join tiendas t on t.id = p.tienda_id
        where p.id = new.promocion_id) is distinct from v_hogar) then
    raise exception 'el ítem referencia datos de otro hogar';
  end if;
  return new;
end;
$$;

create trigger trg_validar_lista_item before insert or update on public.lista_items
for each row execute function public.fn_validar_lista_item();

-- Ítems de compra: producto y promoción del mismo hogar que la compra
create or replace function public.fn_validar_compra_item() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_hogar uuid;
begin
  select hogar_id into v_hogar from compras where id = new.compra_id;
  if (select hogar_id from productos where id = new.producto_id) is distinct from v_hogar
  or (new.promocion_id is not null and
      (select t.hogar_id from promociones p join tiendas t on t.id = p.tienda_id
        where p.id = new.promocion_id) is distinct from v_hogar) then
    raise exception 'el ítem de compra referencia datos de otro hogar';
  end if;
  return new;
end;
$$;

create trigger trg_validar_compra_item before insert or update on public.compra_items
for each row execute function public.fn_validar_compra_item();

-- Listas y compras: la tienda (si la hay) debe ser del mismo hogar
create or replace function public.fn_validar_tienda_hogar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tienda_id is not null and
     (select hogar_id from tiendas where id = new.tienda_id) is distinct from new.hogar_id then
    raise exception 'la tienda pertenece a otro hogar';
  end if;
  if new.lista_id is not null and
     (select hogar_id from listas where id = new.lista_id) is distinct from new.hogar_id then
    raise exception 'la lista pertenece a otro hogar';
  end if;
  return new;
end;
$$;

create trigger trg_validar_compra before insert or update on public.compras
for each row execute function public.fn_validar_tienda_hogar();

-- lista_items: marca de última edición para Realtime (last-write-wins)
create or replace function public.fn_tocar_lista_item() returns trigger
language plpgsql as $$
begin
  new.actualizado_en := now();
  new.actualizado_por := coalesce(auth.uid(), new.actualizado_por);
  return new;
end;
$$;

create trigger trg_tocar_lista_item before update on public.lista_items
for each row execute function public.fn_tocar_lista_item();

-- -----------------------------------------------------------------------------
-- Permisos de ejecución: las RPC solo para usuarios autenticados
-- -----------------------------------------------------------------------------
revoke execute on function public.crear_hogar(text)        from public, anon;
revoke execute on function public.generar_invitacion(uuid) from public, anon;
revoke execute on function public.unirse_hogar(text)       from public, anon;
grant  execute on function public.crear_hogar(text)        to authenticated;
grant  execute on function public.generar_invitacion(uuid) to authenticated;
grant  execute on function public.unirse_hogar(text)       to authenticated;
