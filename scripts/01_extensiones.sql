-- =============================================================================
-- MercApp · 01 · Extensiones
-- Fuente: docs/BACKEND_SCHEMA.md §1
-- pg_net y pg_cron (alertas, semana 7) se habilitan en 10_alertas_semana7.sql.
-- =============================================================================

-- Búsqueda por similitud de nombre (sugerir producto existente al leer una etiqueta)
create extension if not exists pg_trgm with schema extensions;
