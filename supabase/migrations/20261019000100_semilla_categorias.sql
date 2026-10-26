-- =============================================================================
-- MercApp · 09 · Datos semilla
-- Fuente: docs/BACKEND_SCHEMA.md §9
-- Categorías: lista fija global, solo lectura para los usuarios.
-- =============================================================================

insert into public.categorias (nombre) values
  ('Granos y cereales'),
  ('Lácteos y huevos'),
  ('Carnes y embutidos'),
  ('Frutas y verduras'),
  ('Aceites y grasas'),
  ('Panadería'),
  ('Bebidas'),
  ('Café y chocolate'),
  ('Enlatados y conservas'),
  ('Aseo del hogar'),
  ('Aseo personal'),
  ('Otros')
on conflict (nombre) do nothing;
