-- Esquema inicial de MercApp (scripts/01 a 08). Ya estaba aplicado a mano en el proyecto
-- remoto: allí se marca como aplicado con 'supabase migration repair --status applied'.

-- =============================================================================
-- MercApp · 01 · Extensiones
-- Fuente: docs/BACKEND_SCHEMA.md §1
-- pg_net y pg_cron (alertas, semana 7) se habilitan en 10_alertas_semana7.sql.
-- =============================================================================

-- Búsqueda por similitud de nombre (sugerir producto existente al leer una etiqueta)
create extension if not exists pg_trgm with schema extensions;

-- =============================================================================
-- MercApp · 02 · Tablas
-- Fuente: docs/BACKEND_SCHEMA.md §2
-- La unidad central es el HOGAR: tiendas, catálogo, listas, promociones,
-- precios y compras pertenecen a un hogar.
-- =============================================================================

create table public.hogares (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  presupuesto_mensual numeric check (presupuesto_mensual > 0),  -- null = sin presupuesto
  creado_en timestamptz not null default now()
);

-- Perfiles (extiende auth.users; se crea por trigger al registrarse)
create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  push_token text,
  hogar_activo_id uuid references public.hogares(id) on delete set null,
  creado_en timestamptz not null default now()
);

create table public.hogar_miembros (
  hogar_id uuid not null references public.hogares(id) on delete cascade,
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  rol text not null default 'miembro' check (rol in ('admin','miembro')),
  unido_en timestamptz not null default now(),
  primary key (hogar_id, usuario_id)
);

create table public.invitaciones (
  codigo text primary key check (codigo ~ '^[A-Z0-9]{6}$'),
  hogar_id uuid not null references public.hogares(id) on delete cascade,
  creado_por uuid not null references public.perfiles(id) on delete cascade,
  expira_en timestamptz not null default now() + interval '7 days'
);

create table public.tiendas (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references public.hogares(id) on delete cascade,
  nombre text not null,
  tipo text not null default 'otro'
    check (tipo in ('supermercado','tienda_barrio','minimercado','descuento','otro')),
  direccion text,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  favorita boolean not null default false,
  activa boolean not null default true,     -- desactivar temporalmente: no entra en comparaciones
  creado_en timestamptz not null default now()
);

-- Lista fija global (semilla), solo lectura para los usuarios
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique
);

-- Agrupa productos intercambiables: "Arroz blanco", "Leche entera", "Huevos AA"
create table public.grupos_equivalencia (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references public.hogares(id) on delete cascade,
  nombre text not null,
  categoria_id uuid references public.categorias(id),
  tipo_medida text not null check (tipo_medida in ('peso','volumen','unidad')),
  creado_en timestamptz not null default now(),
  unique (hogar_id, nombre)
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references public.hogares(id) on delete cascade,
  grupo_id uuid not null references public.grupos_equivalencia(id),
  nombre text not null,
  marca text,
  cantidad numeric not null check (cantidad > 0),   -- p. ej. 500, 1, 30
  unidad text not null check (unidad in ('g','kg','ml','l','und')),
  codigo_barras text,
  creado_en timestamptz not null default now()
);

create table public.precios (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  tienda_id uuid not null references public.tiendas(id) on delete cascade,
  valor numeric not null check (valor > 0),
  fecha timestamptz not null default now(),      -- en foto: fecha de captura
  origen text not null check (origen in ('manual','foto')),
  foto_path text,                                 -- ruta en el bucket privado 'etiquetas'
  lectura_ia jsonb,     -- lo que devolvió la IA: {nombre, marca, cantidad, unidad, precio, precio_unidad_etiqueta, tienda_detectada}
  confianza_ia jsonb,   -- {nombre: 0.9, precio: 0.95, ...}
  registrado_por uuid not null default auth.uid() references public.perfiles(id),
  check (origen = 'manual' or foto_path is not null)
  -- nunca se actualiza una fila: cada precio nuevo es un insert (historial completo)
);

-- valor según tipo:
--   descuento_pct -> % de descuento (0-100)
--   precio_fijo   -> precio promocional por unidad
--   n_por_valor   -> precio total por 'cantidad_requerida' unidades ("2 por $X")
--   2x1           -> sin valor (lleva 2, paga 1)
create table public.promociones (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  tienda_id uuid not null references public.tiendas(id) on delete cascade,
  tipo text not null check (tipo in ('2x1','descuento_pct','precio_fijo','n_por_valor')),
  valor numeric,
  cantidad_requerida integer check (cantidad_requerida >= 2),
  descripcion text,
  inicio date not null,
  fin date not null,
  creado_por uuid not null default auth.uid() references public.perfiles(id),
  check (fin >= inicio),
  check (
    (tipo = '2x1'           and valor is null and cantidad_requerida is null) or
    (tipo = 'descuento_pct' and valor > 0 and valor < 100 and cantidad_requerida is null) or
    (tipo = 'precio_fijo'   and valor > 0 and cantidad_requerida is null) or
    (tipo = 'n_por_valor'   and valor > 0 and cantidad_requerida is not null)
  )
);

create table public.listas (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references public.hogares(id) on delete cascade,
  nombre text not null default 'Lista de mercado',
  estado text not null default 'activa' check (estado in ('activa','cerrada')),
  estrategia text check (estrategia in ('una_tienda','varias_tiendas')),  -- la que el usuario aplicó
  creada_por uuid not null default auth.uid() references public.perfiles(id),
  creada_en timestamptz not null default now()
);

-- Cada ítem es una NECESIDAD ("Arroz blanco – 2 kg"). El optimizador llena los campos *_asignado.
create table public.lista_items (
  id uuid primary key default gen_random_uuid(),
  lista_id uuid not null references public.listas(id) on delete cascade,
  grupo_id uuid not null references public.grupos_equivalencia(id),
  cantidad numeric not null default 1 check (cantidad > 0),
  unidad text check (unidad in ('g','kg','ml','l','und')),  -- null = 'cantidad' empaques de la presentación elegida
  producto_preferido_id uuid references public.productos(id) on delete set null,  -- opcional: el usuario fija marca/presentación
  -- resultado del optimizador
  producto_asignado_id uuid references public.productos(id) on delete set null,
  tienda_asignada_id uuid references public.tiendas(id) on delete set null,
  unidades_a_comprar integer check (unidades_a_comprar > 0),
  precio_estimado numeric check (precio_estimado >= 0),
  promocion_id uuid references public.promociones(id) on delete set null,
  -- seguimiento en la compra (lista compartida)
  estado text not null default 'pendiente'
    check (estado in ('pendiente','comprado','no_disponible','sustituido')),
  sustituto_id uuid references public.productos(id),
  actualizado_por uuid references public.perfiles(id) default auth.uid(),
  actualizado_en timestamptz not null default now(),
  check (estado <> 'sustituido' or sustituto_id is not null)
);

create table public.alertas_config (
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  tipo text not null check (tipo in ('precio_minimo','subida_fuerte','bajada','promo_nueva','promo_por_vencer','mas_barato_otra_tienda')),
  activa boolean not null default true,
  umbral_pct numeric default 10 check (umbral_pct > 0),   -- aplica a subida_fuerte y bajada
  primary key (usuario_id, tipo)
);

create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  tipo text not null,
  mensaje text not null,
  producto_id uuid references public.productos(id) on delete cascade,
  promocion_id uuid references public.promociones(id) on delete cascade,
  leida boolean not null default false,
  fecha timestamptz not null default now()
);

-- Una fila por tienda cuando se cierra una lista ("Terminar compra")
create table public.compras (
  id uuid primary key default gen_random_uuid(),
  hogar_id uuid not null references public.hogares(id) on delete cascade,
  lista_id uuid references public.listas(id) on delete set null,
  tienda_id uuid references public.tiendas(id) on delete set null,
  total numeric not null check (total >= 0),
  ahorro numeric not null default 0,   -- vs. la tienda de referencia (PRD §6, D-1)
  registrada_por uuid not null default auth.uid() references public.perfiles(id),
  fecha timestamptz not null default now()
);

create table public.compra_items (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras(id) on delete cascade,
  producto_id uuid not null references public.productos(id),
  unidades integer not null check (unidades > 0),
  precio_unitario numeric not null check (precio_unitario > 0),  -- precio normal del empaque
  subtotal numeric not null check (subtotal >= 0),               -- ya con la promo aplicada
  promocion_id uuid references public.promociones(id) on delete set null
);

-- -----------------------------------------------------------------------------
-- RLS activa desde el primer momento: sin políticas nadie (anon/authenticated)
-- puede leer ni escribir hasta correr 06_rls_y_permisos.sql.
-- -----------------------------------------------------------------------------
alter table public.hogares             enable row level security;
alter table public.perfiles            enable row level security;
alter table public.hogar_miembros      enable row level security;
alter table public.invitaciones        enable row level security;
alter table public.tiendas             enable row level security;
alter table public.categorias          enable row level security;
alter table public.grupos_equivalencia enable row level security;
alter table public.productos           enable row level security;
alter table public.precios             enable row level security;
alter table public.promociones         enable row level security;
alter table public.listas              enable row level security;
alter table public.lista_items         enable row level security;
alter table public.alertas_config      enable row level security;
alter table public.notificaciones      enable row level security;
alter table public.compras             enable row level security;
alter table public.compra_items        enable row level security;

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

-- =============================================================================
-- MercApp · 04 · Vistas (cálculo, no almacenamiento)
-- Fuente: docs/BACKEND_SCHEMA.md §4
-- Todas con security_invoker = true para que respeten la RLS de quien consulta.
-- =============================================================================

-- Último precio por producto y tienda, con precio normalizado:
--   g/kg -> por kg · ml/l -> por litro · und -> por unidad (valor / cantidad)
create view public.v_precio_actual with (security_invoker = true) as
select distinct on (p.producto_id, p.tienda_id)
  p.producto_id, p.tienda_id, pr.hogar_id, pr.grupo_id,
  p.valor, p.fecha, p.origen,
  pr.cantidad, pr.unidad,
  case pr.unidad when 'g' then 'kg' when 'kg' then 'kg'
                 when 'ml' then 'l' when 'l' then 'l' else 'und' end as unidad_base,
  round(p.valor / (pr.cantidad * case pr.unidad when 'g' then 0.001 when 'ml' then 0.001 else 1 end), 2)
    as precio_unidad_base
from public.precios p
join public.productos pr on pr.id = p.producto_id
order by p.producto_id, p.tienda_id, p.fecha desc;

-- Historial resumido por producto y tienda
--   anterior            = último precio DISTINTO al actual (registrar el mismo precio otra vez no lo cambia)
--   fecha_ultimo_cambio = fecha en que empezó a regir el precio actual
--   variacion_pct       = actual vs. anterior
create view public.v_historial_resumen with (security_invoker = true) as
with ordenados as (
  select producto_id, tienda_id, valor, fecha,
         lag(valor) over (partition by producto_id, tienda_id order by fecha) as valor_previo,
         first_value(valor) over (partition by producto_id, tienda_id order by fecha desc) as valor_actual
  from public.precios
),
resumen as (
  select
    producto_id, tienda_id,
    max(valor_actual) as actual,
    (array_agg(valor order by fecha desc) filter (where valor <> valor_actual))[1] as anterior,
    min(valor) as minimo,
    max(valor) as maximo,
    round(avg(valor), 2) as promedio,
    max(fecha) as ultima_fecha,
    max(fecha) filter (where valor_previo is not null and valor <> valor_previo) as fecha_ultimo_cambio
  from ordenados
  group by producto_id, tienda_id
)
select *,
  round((actual - anterior) / nullif(anterior, 0) * 100, 1) as variacion_pct
from resumen;

-- Promociones vigentes hoy
create view public.v_promociones_vigentes with (security_invoker = true) as
select * from public.promociones
where current_date between inicio and fin;

-- Estadísticas mensuales por hogar (gasto, ahorro, # compras, presupuesto)
create view public.v_estadisticas_mes with (security_invoker = true) as
select
  c.hogar_id,
  date_trunc('month', c.fecha) as mes,
  sum(c.total) as gasto_total,
  sum(c.ahorro) as ahorro_total,
  count(*) as num_compras,
  h.presupuesto_mensual
from public.compras c
join public.hogares h on h.id = c.hogar_id
group by c.hogar_id, date_trunc('month', c.fecha), h.presupuesto_mensual;

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

-- =============================================================================
-- MercApp · 07 · Storage (fotos de etiquetas)
-- Fuente: docs/BACKEND_SCHEMA.md §6
-- Bucket privado 'etiquetas'. Ruta de cada foto: {hogar_id}/{uuid}.jpg
-- La app muestra las fotos con URL firmada de corta duración (createSignedUrl, ~60 s).
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('etiquetas', 'etiquetas', false, 5242880,             -- 5 MB por foto
        array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

-- Un usuario lee/sube/borra un objeto solo si es miembro del hogar del primer segmento de la ruta
create policy etiquetas_rw on storage.objects for all to authenticated
  using (bucket_id = 'etiquetas'
         and public.es_miembro(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'etiquetas'
              and public.es_miembro(((storage.foldername(name))[1])::uuid));

-- =============================================================================
-- MercApp · 08 · Realtime
-- Fuente: docs/TRD.md §2 y §7, docs/IMPLEMENTATION_PLAN.md (lista compartida)
-- Realtime respeta la RLS: cada miembro solo recibe cambios de sus hogares.
-- =============================================================================

alter publication supabase_realtime add table public.lista_items;    -- lista compartida en el súper
alter publication supabase_realtime add table public.listas;         -- cierre de lista ("Terminar compra")
alter publication supabase_realtime add table public.notificaciones; -- contador de no leídas en la app

