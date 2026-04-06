CREATE TABLE IF NOT EXISTS users.active_players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    image_uri TEXT
);

ALTER TABLE users.active_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active players" ON users.active_players FOR SELECT USING (true);
