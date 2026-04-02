DROP VIEW IF EXISTS public.commanders;
CREATE OR REPLACE VIEW public.commanders WITH (security_invoker = on) AS
WITH commander_games AS (
	SELECT
		commander,
		jsonb_build_object(
			'date', game_date,
			'games', count(*),
			'wins', sum(CASE WHEN is_winner THEN 1 ELSE 0 END)
		) AS games_played
	FROM public.games
	GROUP BY game_date, commander
),
games AS (
	SELECT
		commander,
		array_agg(games_played ORDER BY games_played ->> 'date') AS game_dates
	FROM commander_games
	GROUP BY commander
),
players AS (
    SELECT
        commander,
        array_agg(DISTINCT player) AS players
    FROM public.players_and_commanders
    GROUP BY commander
)
SELECT
    games_stats.*,
    games.game_dates,
    players.players,
	commander_names.image_uris
FROM public.commander_stats games_stats
INNER JOIN games 
    ON games_stats.commander = games.commander
INNER JOIN players
    ON games_stats.commander = players.commander
INNER JOIN public.commander_names
    ON games_stats.commander = commander_names.name
ORDER BY games_stats.games_played DESC;
