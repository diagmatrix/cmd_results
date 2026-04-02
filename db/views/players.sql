DROP VIEW IF EXISTS public.players;
CREATE OR REPLACE VIEW public.players WITH(security_invoker = on) AS
WITH player_stats AS (
    SELECT
        player,
        count(*) AS games_played,
        sum(CASE WHEN is_winner THEN 1 ELSE 0 END) AS games_won,
        sum(CASE WHEN is_starting THEN 1 ELSE 0 END) AS games_started,
        sum(CASE WHEN is_winner AND is_starting THEN 1 ELSE 0 END) AS games_won_and_started,
        count(DISTINCT commander) AS unique_commanders
        
    FROM public.games
    GROUP BY player
)
SELECT
    ps.*,
    CASE 
        WHEN ps.games_played > 0 
            THEN round((ps.games_won::numeric / ps.games_played) * 100, 2) 
        ELSE 0 
    END AS winrate,
    coalesce(
        ap.image_uri,
        'https://cards.scryfall.io/art_crop/front/e/c/ec8e4142-7c46-4d2f-aaa6-6410f323d9f0.jpg?1561851198' -- Totally Lost
    ) AS image_uri
FROM player_stats ps
LEFT JOIN public.active_players ap
    ON ps.player = ap.name;
