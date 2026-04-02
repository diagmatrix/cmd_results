CREATE TABLE IF NOT EXISTS public.active_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    image_uri TEXT
);

ALTER TABLE public.active_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active players" ON public.active_players FOR SELECT USING (true);
