CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID NOT NULL,
    game_date DATE NOT NULL,
    player TEXT NOT NULL,
    commander TEXT NOT NULL,
    is_winner BOOLEAN NOT NULL DEFAULT FALSE,
    is_starting BOOLEAN NOT NULL DEFAULT FALSE,
    _created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Anyone can insert games" ON public.games FOR INSERT WITH CHECK (true);