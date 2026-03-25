DROP VIEW IF EXISTS public.commanders;
CREATE OR REPLACE VIEW public.commanders WITH (security_invoker = on) AS
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
),
partner_commanders AS (
	SELECT
		commander,
		CASE
			WHEN commander LIKE '% | %' THEN string_to_array(commander, ' | ')
			ELSE ARRAY[commander]
		END AS parts
	FROM commander_stats
),
matched_partners AS (
	SELECT
		sc.commander,
		ac.color_identity,
		ac.image_uri
	FROM partner_commanders sc
	CROSS JOIN LATERAL (
		SELECT ac.name, ac.color_identity, ac.image_uri
		FROM public.available_commanders ac
		WHERE ac.name = sc.parts[1]
		  OR (array_length(sc.parts, 1) > 1 AND ac.name = sc.parts[2])
		LIMIT 2
	) ac
),
aggregated_partners AS (
	SELECT
		commander,
		array_agg(image_uri) FILTER (WHERE image_uri IS NOT NULL) AS image_uris,
		CASE
			WHEN array_agg(color_identity::text) FILTER (WHERE color_identity IS NOT NULL) = array[]::text[] THEN NULL
			ELSE array_to_string(
				ARRAY(
					SELECT DISTINCT unnest
					FROM unnest(array_agg(color_identity::text) FILTER (WHERE color_identity IS NOT NULL))
					ORDER BY 1
				),
				''
			)
		END AS combined_colors
	FROM matched_partners
	GROUP BY commander
)
SELECT
	c.commander,
	c.games_played,
	c.games_won,
	p.player_data,
	g.game_dates,
	coalesce(ac.color_identity, ap.combined_colors) AS color_identity,
	coalesce([ac.image_uri], ap.image_uris) AS image_uris
FROM public.commander_stats c
INNER JOIN players p 
	ON c.commander = p.commander
INNER JOIN games g 
	ON c.commander = g.commander
LEFT JOIN public.available_commanders ac 
	ON c.commander = ac.name
LEFT JOIN aggregated_partners ap 
	ON c.commander = ap.commander;
