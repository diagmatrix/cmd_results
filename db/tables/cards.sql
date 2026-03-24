CREATE TABLE IF NOT EXISTS public.cards (
	id UUID PRIMARY KEY,
	name TEXT NOT NULL,
	set_code TEXT NOT NULL,
	collector_number TEXT NOT NULL,
	rarity TEXT NOT NULL,
	cmc NUMERIC NOT NULL,
	type_line TEXT NOT NULL,
	released_at DATE NOT NULL,
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
