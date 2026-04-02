DROP VIEW IF EXISTS public.overall_stats;
CREATE OR REPLACE VIEW public.overall_stats WITH(security_invoker = on) AS
SELECT
    count(DISTINCT game_id) AS games,
    count(DISTINCT player) AS players,
    count(DISTINCT commander) AS commanders
FROM public.games;
