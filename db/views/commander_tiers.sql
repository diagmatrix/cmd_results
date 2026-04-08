DROP VIEW IF EXISTS public.commander_tiers;
CREATE OR REPLACE VIEW public.commander_tiers WITH (security_invoker = on) AS
WITH qualified AS (
    SELECT
        commander,
        games_played,
        winrate,
        color_identity
    FROM public.commander_stats
    WHERE 
        games_played >= 4
),
ranked AS (
    SELECT
        *,
        winrate - 25 AS winrate_delta,
        ntile(4) OVER (ORDER BY winrate DESC) AS tier_bucket
    FROM qualified
)
SELECT
    commander,
    games_played,
    winrate,
    color_identity,
    winrate_delta,
    CASE tier_bucket
        WHEN 1 
            THEN 'S'
        WHEN 2 
            THEN 'A'
        WHEN 3 
            THEN 'B'
        WHEN 4 
            THEN 'C'
    END AS tier
FROM ranked
ORDER BY tier_bucket, winrate DESC;
