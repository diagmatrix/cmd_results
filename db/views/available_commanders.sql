DROP VIEW IF EXISTS public.available_commanders;
CREATE OR REPLACE VIEW public.available_commanders WITH(security_invoker = on) AS
SELECT DISTINCT ON (name)
 name,
 coalesce(nullif(array_to_string(color_identity, ''), ''), 'C') AS color_identity,
 image_uris ->> 'small' AS image_uri
FROM public.cards
WHERE
 type_line ILIKE '%Creature%'
 OR type_line ILIKE '%Vehicle%'
 OR type_line ILIKE '%Station%'
ORDER BY name, _created_at DESC;
