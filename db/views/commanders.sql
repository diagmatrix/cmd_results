DROP VIEW IF EXISTS public.commanders;
CREATE OR REPLACE VIEW public.commanders AS
WITH commander_players AS (
	SELECT
		commander,
		jsonb_build_object(
			'player', player, 
			'games', count(*), 
			'wins', sum(CASE WHEN won THEN 1 ELSE 0 END)
		) AS player_data
	FROM public.players_and_commanders
	GROUP BY player, commander	
),
players AS (
	SELECT
		commander,
		array_agg(player_data ORDER BY player_data ->> 'games' DESC) AS player_data
	FROM commander_players
	GROUP BY commander
),
commander_games AS (
	SELECT
		commander,
		jsonb_build_object(
			'date', game_date,
			'games', count(*),
			'wins', sum(CASE WHEN won THEN 1 ELSE 0 END)
		) AS games_played
	FROM public.players_and_commanders
	GROUP BY game_date, commander
),
games AS (
	SELECT
		commander,
		array_agg(games_played ORDER BY games_played ->> 'date') AS game_dates
	FROM commander_games
	GROUP BY commander
)
SELECT
	c.commander,
	c.games_played,
	c.games_won,
	p.player_data,
	g.game_dates,
	ac.color_identity,
	ac.image_uri
FROM public.commander_stats c
INNER JOIN players p
	ON c.commander = p.commander
INNER JOIN games g
	ON c.commander = g.commander
LEFT JOIN public.available_commanders ac
	ON c.commander = ac.name;
