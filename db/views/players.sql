DROP VIEW IF EXISTS public.players;
CREATE OR REPLACE VIEW public.players WITH(security_invoker = on) AS
SELECT
    player,
    count(*) AS games_played,
    sum(CASE WHEN is_winner THEN 1 ELSE 0 END) AS games_won,
    sum(CASE WHEN is_starting THEN 1 ELSE 0 END) AS games_started,
    sum(CASE WHEN is_winner AND is_starting THEN 1 ELSE 0 END) AS games_won_and_started,
    count(DISTINCT commander) AS unique_commanders,
    ROUND(sum(CASE WHEN is_winner THEN 1 ELSE 0 END)::numeric / count(*)::numeric * 100, 2) AS winrate
FROM public.games
GROUP BY player;
