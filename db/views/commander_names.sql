DROP VIEW IF EXISTS public.commander_names;
CREATE OR REPLACE VIEW public.commander_names WITH (security_invoker = 'on') AS
WITH possible_commanders AS (
    SELECT
        name,
        color_identity,
        ARRAY[image_uri] AS image_uris
    FROM public.available_commanders
    UNION ALL
    SELECT
        name,
        color_identity,
        image_uri AS image_uris
    FROM public.partners
),
played_commanders AS (
    SELECT
        DISTINCT commander AS name
    FROM public.players_and_commanders
)
SELECT
    pos_cmd.name,
    ply_cmd.name IS NOT NULL AS has_been_played,
    pos_cmd.color_identity,
    pos_cmd.image_uris
FROM possible_commanders pos_cmd
LEFT JOIN played_commanders ply_cmd
    ON pos_cmd.name = ply_cmd.name
ORDER BY ply_cmd.name NULLS LAST, pos_cmd.name;

