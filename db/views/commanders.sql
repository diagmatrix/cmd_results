DROP VIEW IF EXISTS public.commanders;
CREATE OR REPLACE VIEW public.commanders WITH(security_invoker = on) AS
SELECT
	commander,
	count(*) AS games_played,
	sum(CASE WHEN player = winner THEN 1 ELSE 0 END) AS games_won,
	sum(CASE WHEN player = starting_player THEN 1 ELSE 0 END) AS games_started,
	sum(CASE WHEN player = winner AND player = starting_player THEN 1 ELSE 0 END) AS games_won_and_started
FROM public.players_and_commanders
GROUP BY commander;
