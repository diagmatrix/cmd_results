DROP VIEW IF EXISTS public.stats;
CREATE OR REPLACE VIEW public.stats WITH(security_invoker = on) AS
SELECT
  count(DISTINCT game_id) AS games,
	count(DISTINCT player) AS players,
	count(DISTINCT commander) AS commanders
FROM public.players_and_commanders;
