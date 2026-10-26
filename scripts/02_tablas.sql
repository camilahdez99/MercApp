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
