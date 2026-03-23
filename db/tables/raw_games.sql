CREATE TABLE IF NOT EXISTS public.raw_games (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	game_date DATE NOT NULL DEFAULT CURRENT_DATE,
	player_data JSONB NOT NULL,
	winner TEXT NOT NULL,
	starting_player TEXT,
	_created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.raw_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert games" ON public.raw_games FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read games" ON public.raw_games FOR SELECT USING (true);
