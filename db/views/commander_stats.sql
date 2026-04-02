DROP VIEW IF EXISTS public.commander_stats;
CREATE OR REPLACE VIEW public.commander_stats WITH(security_invoker = on) AS
SELECT
    g.commander,
    count(*) AS games_played,
    sum(CASE WHEN g.is_winner THEN 1 ELSE 0 END) AS games_won,
    sum(CASE WHEN g.is_starting THEN 1 ELSE 0 END) AS games_started,
    sum(CASE WHEN g.is_winner AND g.is_starting THEN 1 ELSE 0 END) AS games_won_and_started,
    cn.color_identity
FROM public.games g
LEFT JOIN public.commander_names cn 
    ON g.commander = cn.name
GROUP BY g.commander, cn.color_identity;
