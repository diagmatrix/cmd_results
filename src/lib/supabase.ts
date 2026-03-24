import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface PlayerData {
  player: string;
  commander: string;
}

export interface Game {
  id: string;
  game_date: string;
  player_data: PlayerData[];
  winner: string;
  starting_player: string;
  created_at: string;
}

export class Player {
  player: string;
  games: number;
  wins: number;
  started: number;
  startedWon: number;

  constructor(player: string, games_played: number, games_won: number, games_started: number, games_won_and_started: number) {
    this.player = player;
    this.games = games_played;
    this.wins = games_won;
    this.started = games_started;
    this.startedWon = games_won_and_started;
  }

  winrate(): string {
    return this.games > 0 ? ((this.wins / this.games) * 100).toFixed(0) : '0';
  }
}

export class Commander {
  commander: string;
  games: number;
  wins: number;
  started: number;
  startedWon: number;

  constructor(commander: string, games_played: number, games_won: number, games_started: number, games_won_and_started: number) {
    this.commander = commander;
    this.games = games_played;
    this.wins = games_won;
    this.started = games_started;
    this.startedWon = games_won_and_started;
  }

  winrate(): string {
    return this.games > 0 ? ((this.wins / this.games) * 100).toFixed(0) : '0';
  }
}

export class PlayerCommander {
  player: string;
  commander: string;
  games: number;
  wins: number;
  started: number;
  startedWon: number;

  constructor(player: string, commander: string, games_played: number, games_won: number, games_started: number, games_won_and_started: number) {
    this.player = player;
    this.commander = commander;
    this.games = games_played;
    this.wins = games_won;
    this.started = games_started;
    this.startedWon = games_won_and_started;
  }

  winrate(): string {
    return this.games > 0 ? ((this.wins / this.games) * 100).toFixed(0) : '0';
  }
}

export class Stats {
  games: number;
  players: number;
  commanders: number;

  constructor(games: number, players: number, commanders: number) {
    this.games = games;
    this.players = players;
    this.commanders = commanders;
  }
}

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

export async function fetchPlayers(limit: number = 8): Promise<Player[]> {
  const { data: players, error } = await supabase
    .from('players')
    .select('*')
    .order('games_played', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error loading players:', error);
    return [];
  }

  return (players || []).map(player => new Player(
    player.player,
    player.games_played,
    player.games_won,
    player.games_started,
    player.games_won_and_started
  ));
}

export async function fetchCommanders(limit: number = 8): Promise<Commander[]> {
  const { data: commanders, error } = await supabase
    .from('commanders')
    .select('*')
    .order('games_played', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error loading commanders:', error);
    return [];
  }

  return (commanders || []).map(commander => new Commander(
    commander.commander,
    commander.games_played,
    commander.games_won,
    commander.games_started,
    commander.games_won_and_started
  ));
}

export async function fetchCombos(limit: number = 8): Promise<PlayerCommander[]> {
  const { data: combos, error } = await supabase
    .from('player_commander_combos')
    .select('*')
    .order('games_played', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error loading player+commander combos:', error);
    return [];
  }

  return (combos || []).map(combo => new PlayerCommander(
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
  createdAt: string;
}

export async function insertGame(gameData: GameFormData): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('raw_games').insert([{
    player_data: gameData.playerData,
    winner: gameData.winner,
    starting_player: gameData.startingPlayer,
    created_at: gameData.createdAt
  }]);

  return { error };
}