DROP VIEW IF EXISTS public.game_results;
CREATE OR REPLACE VIEW public.game_results WITH(security_invoker = on) AS
SELECT
    game_id AS id,
    game_date,
    jsonb_agg(
        jsonb_build_object('player', player, 'commander', commander)
        ORDER BY player
    ) AS player_data,
    MAX(CASE WHEN is_winner THEN player END) AS winner,
    MAX(CASE WHEN is_starting THEN player END) AS starting_player
FROM public.games
GROUP BY game_id, game_date;
