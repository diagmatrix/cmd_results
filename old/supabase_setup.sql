-- Create games table
CREATE TABLE IF NOT EXISTS public.raw_games (
	id uuid default gen_random_uuid() primary key,
	game_date date not null default current_date,
	player_data jsonb not null,
	winner text not null,
	starting_player text not null,
	_created_at timestamp with time zone default now()
);

-- Enable RLS
ALTER TABLE public.raw_games ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert games
CREATE POLICY "Anyone can insert games" ON public.raw_games FOR INSERT WITH CHECK (true);

-- Policy: Anyone can read all games
CREATE POLICY "Anyone can read games" ON public.raw_games FOR SELECT USING (true);

-- Create views
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

DROP VIEW IF EXISTS public.players;
CREATE OR REPLACE VIEW public.players WITH(security_invoker = on) AS
SELECT
	player,
	count(*) AS games_played,
	sum(CASE WHEN player = winner THEN 1 ELSE 0 END) AS games_won,
	sum(CASE WHEN player = starting_player THEN 1 ELSE 0 END) AS games_started,
	sum(CASE WHEN player = winner AND player = starting_player THEN 1 ELSE 0 END) AS games_won_and_started
FROM public.players_and_commanders
GROUP BY player;

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

DROP VIEW IF EXISTS public.player_commander_combos;
CREATE OR REPLACE VIEW public.player_commander_combos WITH(security_invoker = on) AS
SELECT
	player,
	commander,
	count(*) AS games_played,
	sum(CASE WHEN player = winner THEN 1 ELSE 0 END) AS games_won,
	sum(CASE WHEN player = starting_player THEN 1 ELSE 0 END) AS games_started,
	sum(CASE WHEN player = winner AND player = starting_player THEN 1 ELSE 0 END) AS games_won_and_started
FROM public.players_and_commanders
GROUP BY player, commander;

DROP VIEW IF EXISTS public.stats;
CREATE OR REPLACE VIEW public.stats WITH(security_invoker = on) AS
SELECT
  count(DISTINCT game_id) AS games,
	count(DISTINCT player) AS players,
	count(DISTINCT commander) AS commanders
FROM public.players_and_commanders;