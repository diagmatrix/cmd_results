-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  game_date date not null default current_date,
  player_data jsonb not null,
  winner text not null,
  starting_player text not null
);

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read all games
CREATE POLICY "Anyone can read games" ON games FOR SELECT USING (true);

-- Policy: Anyone can insert games
CREATE POLICY "Anyone can insert games" ON games FOR INSERT WITH CHECK (true);
