CREATE TABLE IF NOT EXISTS public.partners (
    first_id UUID NOT NULL REFERENCES public.cards(id),
    second_id UUID NOT NULL REFERENCES public.cards(id),
    name TEXT NOT NULL,
    color_identity TEXT NOT NULL,
    partner_type TEXT NOT NULL,
    image_uri TEXT[] NOT NULL,
    _created_at TIMESTAMP DEFAULT NOW(),
	_updated_at TIMESTAMP,
    PRIMARY KEY (first_id, second_id)
);

DROP TRIGGER IF EXISTS set_timestamp ON public.partners;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read partners" ON public.partners FOR SELECT USING (true);
CREATE POLICY "Service role can insert partners" ON public.partners FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update partners" ON public.partners FOR UPDATE TO service_role USING (true) WITH CHECK (true);
