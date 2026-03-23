DROP VIEW IF EXISTS public.players_and_commanders;
CREATE OR REPLACE VIEW public.players_and_commanders WITH(security_invoker = on) AS
WITH player_commander AS (
	SELECT
		id AS game_id,
		jsonb_array_elements(player_data) AS player_commander,
		winner,
		starting_player
	FROM public.raw_games
)
SELECT
	game_id,
	player_commander ->> 'player' AS player,
	player_commander ->> 'commander' AS commander,
	winner,
	starting_player
FROM player_commander;
