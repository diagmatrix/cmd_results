DROP VIEW IF EXISTS public.commander_stats;
CREATE OR REPLACE VIEW public.commander_stats WITH(security_invoker = on) AS
SELECT
	commander,
	count(*) AS games_played,
	sum(CASE WHEN won THEN 1 ELSE 0 END) AS games_won,
	sum(CASE WHEN started THEN 1 ELSE 0 END) AS games_started,
	sum(CASE WHEN won AND started THEN 1 ELSE 0 END) AS games_won_and_started
FROM public.players_and_commanders
GROUP BY commander;
