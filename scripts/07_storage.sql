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
