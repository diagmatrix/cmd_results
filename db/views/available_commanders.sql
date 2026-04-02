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
    END AS image_uri,
    raw_card ->> 'oracle_text' AS oracle_text,
    raw_card ->> 'keywords' AS keywords,
    id,
    type_line
FROM public.cards
WHERE
    set_code NOT IN ('unk', 'mb1', 'mb2')
ORDER BY name, released_at ASC NULLS LAST, collector_number ASC;
