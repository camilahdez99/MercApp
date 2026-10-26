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
