import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config';
import { type Game, GameStats, Stats, type PlayerData, type AvailableCommander, type CommanderName, type CommanderData } from './model.ts';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function fetchRecentGames(limit: number = 10): Promise<Game[]> {
  const { data: games, error } = await supabase
    .from('raw_games')
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
    player.unique_commanders
  ));
}

export async function fetchCommanderStats(limit: number = 8): Promise<GameStats[]> {
  const { data: commanders, error } = await supabase
    .from('commander_stats')
    .select('commander, games_played, games_won, games_started, games_won_and_started')
    .order('games_played', { ascending: false })
    .limit(limit);

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
    commander.games_won_and_started
  ));
}

export async function fetchCombos(limit: number = 8): Promise<GameStats[]> {
  const { data: combos, error } = await supabase
    .from('player_commander_combos')
    .select('*')
    .order('games_played', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error loading player+commander combos:', error);
    return [];
  }

  return (combos || []).map(combo => new GameStats(
    combo.player,
    combo.commander,
    combo.games_played,
    combo.games_won,
    combo.games_started,
    combo.games_won_and_started
  ));
}

export async function fetchStats(): Promise<Stats> {
  const { data: stats, error } = await supabase
    .from('stats')
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
    .from('raw_games')
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
  const { error } = await supabase.from('raw_games').insert([{
    player_data: gameData.playerData,
    winner: gameData.winner,
    starting_player: gameData.startingPlayer,
    game_date: gameData.gameDate
  }]);

  return { error };
}

export async function fetchCommanderNames(searchTerm: string, limit: number = 5): Promise<CommanderName[]> {
  const { data, error } = await supabase
    .from('commander_names')
    .select('name, has_been_played')
    .ilike('name', `%${searchTerm}%`)
    .limit(limit);

  if (error) {
    console.error('Error loading commander names:', error);
    return [];
  }

  return data || [];
}

export async function fetchAvailableCommanders(searchTerm: string, limit: number = 5): Promise<AvailableCommander[]> {
  const { data, error } = await supabase
    .from('available_commanders')
    .select('name, color_identity, image_uri')
    .ilike('name', `%${searchTerm}%`)
    .limit(limit);

  if (error) {
    console.error('Error loading available commanders:', error);
    return [];
  }

  return data || [];
}

export async function fetchPreviousCommanders(searchTerm: string, limit: number = 5): Promise<string[]> {
  const { data, error } = await supabase
    .from('commanders')
    .select('commander')
    .ilike('commander', `%${searchTerm}%`)
    .limit(limit);

  if (error) {
    console.error('Error loading previous commanders:', error);
    return [];
  }

  return (data || []).map(c => c.commander);
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

  return data || [];
}
