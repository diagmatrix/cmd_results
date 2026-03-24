DROP VIEW IF EXISTS public.players_and_commanders;
CREATE OR REPLACE VIEW public.players_and_commanders WITH(security_invoker = on) AS
WITH unnested_games AS (
	SELECT
		id AS game_id,
		jsonb_array_elements(player_data) AS player_commander,
		winner,
		starting_player,
		game_date
	FROM public.raw_games
),
player_commander AS (
	SELECT
		game_id,
		player_commander ->> 'player' AS player,
		player_commander ->> 'commander' AS commander,
		winner,
		starting_player,
		game_date
	FROM unnested_games
)
SELECT
	game_id,
	game_date,
	player,
	commander,
	winner = player AS won,
	starting_player = player AS started
FROM player_commander;
