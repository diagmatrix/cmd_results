-- Create tables
CREATE TABLE IF NOT EXISTS public.raw_games (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	game_date DATE NOT NULL DEFAULT CURRENT_DATE,
	player_data JSONB NOT NULL,
	winner TEXT NOT NULL,
	starting_player TEXT,
	_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.raw_games ENABLE ROW LEVEL SECURITY;
-- Policy: Anyone can insert games
CREATE POLICY "Anyone can insert games" ON public.raw_games FOR INSERT WITH CHECK (true);
-- Policy: Anyone can read all games
CREATE POLICY "Anyone can read games" ON public.raw_games FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.cards (
	id UUID PRIMARY KEY,
	name TEXT NOT NULL,
	set_code TEXT NOT NULL,
	collector_number TEXT NOT NULL,
	rarity TEXT NOT NULL,
	cmc NUMERIC NOT NULL,
	type_line TEXT NOT NULL,
	mana_cost TEXT,
	color_identity TEXT[],
	colors TEXT[],
	image_uris JSONB,
	raw_card JSONB,
	_id SERIAL,
	_created_at TIMESTAMP DEFAULT NOW(),
	_updated_at TIMESTAMP
);

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW._updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.cards;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.cards
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read games" ON public.cards FOR SELECT USING (true);
CREATE POLICY "Service role can insert cards" ON public.cards FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update cards" ON public.cards FOR UPDATE TO service_role USING (true) WITH CHECK (true);

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

DROP VIEW IF EXISTS public.available_commanders;
CREATE OR REPLACE VIEW public.available_commanders WITH(security_invoker = on) AS
SELECT DISTINCT ON (name)
 name,
 coalesce(nullif(array_to_string(color_identity, ''), ''), 'C') AS color_identity,
 image_uris ->> 'small' AS image_uri
FROM public.cards
WHERE
 type_line LIKE '%Creature'
 OR type_line LIKE '%Vehicle'
 OR type_line LIKE '%Station'
ORDER BY name, _created_at DESC;
