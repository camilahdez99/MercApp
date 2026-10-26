-- =============================================================================
-- MercApp · 08 · Realtime
-- Fuente: docs/TRD.md §2 y §7, docs/IMPLEMENTATION_PLAN.md (lista compartida)
-- Realtime respeta la RLS: cada miembro solo recibe cambios de sus hogares.
-- =============================================================================

alter publication supabase_realtime add table public.lista_items;    -- lista compartida en el súper
alter publication supabase_realtime add table public.listas;         -- cierre de lista ("Terminar compra")
alter publication supabase_realtime add table public.notificaciones; -- contador de no leídas en la app
