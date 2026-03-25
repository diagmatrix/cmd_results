DROP VIEW IF EXISTS public.available_commanders;
CREATE OR REPLACE VIEW public.available_commanders WITH(security_invoker = on) AS
SELECT DISTINCT ON (name)
 name,
 set_code,
 coalesce(nullif(array_to_string(color_identity, ''), ''), 'C') AS color_identity,
 CASE
    WHEN image_uris IS NOT NULL
        THEN image_uris ->> 'large'
    ELSE
        (coalesce(raw_card ->> 'card_faces', '[]')::jsonb -> 1 ->> 'image_uris')::jsonb ->> 'large'
END AS image_uri
FROM public.cards
ORDER BY name, released_at ASC NULLS LAST;
