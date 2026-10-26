-- =============================================================================
-- MercApp · 99 · Verificación (solo lectura)
-- Correr al final en el SQL Editor para confirmar que todo quedó creado.
-- =============================================================================

-- 1) Tablas de public y si tienen RLS activa (todas deben decir true)
select c.relname as tabla, c.relrowsecurity as rls_activa,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as politicas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;

-- 2) Vistas con security_invoker (todas deben mostrar security_invoker=true)
select c.relname as vista, c.reloptions
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
order by 1;

-- 3) Funciones RPC disponibles
select p.proname as funcion, pg_get_function_identity_arguments(p.oid) as argumentos,
       p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by 1;

-- 4) Semilla de categorías (deben ser 12)
select count(*) as categorias from public.categorias;

-- 5) Bucket de etiquetas (debe existir y ser privado)
select id, public from storage.buckets where id = 'etiquetas';

-- 6) Tablas publicadas en Realtime
select tablename from pg_publication_tables
where pubname = 'supabase_realtime' order by 1;
