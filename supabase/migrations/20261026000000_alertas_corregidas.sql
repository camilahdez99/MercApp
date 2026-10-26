-- =============================================================================
-- MercApp · 10 · Alertas automáticas  ⚠ SEMANA 7
-- Fuente: docs/BACKEND_SCHEMA.md §7, docs/TRD.md §2
-- La URL y la llave NO se escriben aquí: se leen de Supabase Vault.
--
-- Correcciones (2026-10-16), tras aplicarse antes de tiempo en Supabase:
--   * Sin secretos en Vault la llamada se omite con un WARNING: registrar un
--     precio nunca falla por culpa de las alertas (antes la URL quedaba NULL).
--   * Cualquier error al encolar la llamada HTTP se captura (WARNING) por la
--     misma razón.
--   * pg_net va en el esquema `extensions`, no en `public` (advisor 0014).
--   * fn_revisar_alertas no se puede llamar por RPC (advisors 0028/0029).
--   * Idempotente: se puede volver a correr sin errores.
-- =============================================================================

-- 0) Extensiones. Si pg_net quedó en `public` (versión anterior), se reinstala
--    en `extensions`. Sus funciones siguen en el esquema `net`.
do $$
begin
  if exists (select 1 from pg_extension e
             join pg_namespace n on n.oid = e.extnamespace
             where e.extname = 'pg_net' and n.nspname = 'public') then
    drop extension pg_net;
  end if;
end;
$$;

create extension if not exists pg_net  with schema extensions;  -- llamadas HTTP desde triggers
create extension if not exists pg_cron;                          -- revisión diaria de promos

-- 1) Guardar los secretos en Vault UNA sola vez, desde el SQL Editor, con los
--    valores reales del proyecto (Settings > API), cuando la Edge Function
--    `enviar-alertas` ya esté desplegada. No commitear los valores.
--
-- select vault.create_secret('https://<ref>.supabase.co/functions/v1/enviar-alertas', 'url_enviar_alertas');
-- select vault.create_secret('<service_role_key>', 'service_role_key');

-- 2) Llamada a la Edge Function con un cuerpo JSON (no hace nada si faltan los secretos)
create or replace function public.fn_llamar_enviar_alertas(p_body jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_url   text;
  v_llave text;
begin
  select decrypted_secret into v_url   from vault.decrypted_secrets where name = 'url_enviar_alertas';
  select decrypted_secret into v_llave from vault.decrypted_secrets where name = 'service_role_key';

  if v_url is null or v_llave is null then
    raise warning 'alertas: faltan secretos en Vault (url_enviar_alertas / service_role_key); se omite la llamada';
    return;
  end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'Authorization', 'Bearer ' || v_llave),
    body    := p_body
  );
exception when others then
  raise warning 'alertas: no se pudo encolar la llamada a enviar-alertas: %', sqlerrm;
end;
$$;

-- 3) Cada precio nuevo dispara la revisión de alertas
create or replace function public.fn_revisar_alertas() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform fn_llamar_enviar_alertas(jsonb_build_object('precio_id', new.id));
  return new;
end;
$$;

-- Solo el trigger y pg_cron las usan; nadie las llama por la API
revoke execute on function public.fn_llamar_enviar_alertas(jsonb) from public, anon, authenticated;
revoke execute on function public.fn_revisar_alertas()            from public, anon, authenticated;

drop trigger if exists trg_precio_nuevo on public.precios;
create trigger trg_precio_nuevo
after insert on public.precios
for each row execute function public.fn_revisar_alertas();

-- 4) Diario a las 13:00 UTC (= 8:00 hora Colombia): promociones por vencer.
--    cron.schedule con el mismo nombre reemplaza el job si ya existe.
select cron.schedule(
  'revisar-promos-por-vencer',
  '0 13 * * *',
  $$ select public.fn_llamar_enviar_alertas('{"tipo":"promo_por_vencer"}'::jsonb) $$
);
