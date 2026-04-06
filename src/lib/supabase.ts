import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config';
import { type Game, GameStats, Stats, type PlayerData, type CommanderName, CommanderData } from './model.ts';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function fetchRecentGames(limit: number = 10): Promise<Game[]> {
  const { data: games, error } = await supabase
    .from('game_results')
    .select('*')
    .order('game_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error loading games:', error);
    return [];
  }

  return games || [];
}

export async function fetchPlayers(limit: number = 8): Promise<GameStats[]> {
  const { data: players, error } = await supabase
    .from('players')
    .select('*')
    .order('games_played', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error loading players:', error);
    return [];
  }

  return (players || []).map(player => new GameStats(
    player.player,
    undefined,
    player.games_played,
    player.games_won,
    player.games_started,
    player.games_won_and_started,
    player.unique_commanders,
    undefined,
    player.winrate,
    player.image_uri
  ));
}

export async function fetchCommanderStats(limit: number = 8, orderBy: string = 'games_played', minGames?: number): Promise<GameStats[]> {
  let query = supabase
    .from('commander_stats')
    .select('*');

  if (minGames !== undefined) {
    query = query.gt('games_played', minGames);
  }

  query = query.order(orderBy, { ascending: false });

  // Secondary sort by games_played for tie-breaking
  if (orderBy !== 'games_played') {
    query = query.order('games_played', { ascending: false });
  }

  query = query.limit(limit);

  const { data: commanders, error } = await query;

  if (error) {
    console.error('Error loading commanders:', error);
    return [];
  }

  return (commanders || []).map(commander => new GameStats(
    undefined,
    commander.commander,
    commander.games_played,
    commander.games_won,
    commander.games_started,
    commander.games_won_and_started,
    undefined,
    commander.color_identity,
    commander.winrate
  ));
}

export async function fetchStats(): Promise<Stats> {
  const { data: stats, error } = await supabase
    .from('overall_stats')
    .select('*')
    .single();
  
  if (error) {
    console.error('Error loading stats:', error);
    return new Stats(0, 0, 0);
  }

  return new Stats(stats.games, stats.players, stats.commanders);
}

export async function fetchAllGames(): Promise<Game[]> {
  const { data: games, error } = await supabase
    .from('game_results')
    .select('*')
    .order('game_date', { ascending: false });

  if (error) {
    console.error('Error loading games:', error);
    return [];
  }

  return games || [];
}

export interface GameFormData {
  playerData: PlayerData[];
  winner: string;
  startingPlayer: string;
  gameDate: string;
}

export async function insertGame(gameData: GameFormData): Promise<{ error: Error | null }> {
  const gameId = crypto.randomUUID();
  
  const participants = gameData.playerData.map(pd => ({
    game_id: gameId,
    game_date: gameData.gameDate,
    player: pd.player,
    commander: pd.commander,
    is_winner: gameData.winner === pd.player,
    is_starting: gameData.startingPlayer === pd.player
  }));

  const { error } = await supabase.from('games').insert(participants);
  return { error };
}

export async function fetchCommanderNames(searchTerm: string, limit: number = 5): Promise<CommanderName[]> {
  const { data, error } = await supabase
    .from('commander_names')
    .select('name, has_been_played')
    .ilike('name', `%${searchTerm}%`)
    .order('has_been_played', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error loading commander names:', error);
    return [];
  }

  return data || [];
}

export async function fetchAllCommanders(): Promise<CommanderData[]> {
  const { data, error } = await supabase
    .from('commanders')
    .select('*')
    .order('games_played', { ascending: false });

  if (error) {
    console.error('Error loading commanders:', error);
    return [];
  }

  return (data || []).map(c => new CommanderData(
    c.commander,
    c.games_played,
    c.games_won,
    c.games_started,
    c.games_won_and_started,
    c.players,
    c.game_dates,
    c.color_identity,
    c.image_uris
  ));
}
