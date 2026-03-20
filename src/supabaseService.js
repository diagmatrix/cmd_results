import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export class Player {
    constructor(player, games_played, games_won, games_started, games_won_and_started) {
        this.player = player;
        this.games = games_played;
        this.wins = games_won;
        this.started = games_started;
        this.startedWon = games_won_and_started;
    }

    winrate() {
        return this.games > 0 ? ((this.wins / this.games) * 100).toFixed(0) : 0;
    }
}

export class Commander {
    constructor(commander, games_played, games_won, games_started, games_won_and_started) {
        this.commander = commander;
        this.games = games_played;
        this.wins = games_won;
        this.started = games_started;
        this.startedWon = games_won_and_started;
    }

    winrate() {
        return this.games > 0 ? ((this.wins / this.games) * 100).toFixed(0) : 0;
    }
}

export class PlayerCommander {
    constructor(player, commander, games_played, games_won, games_started, games_won_and_started) {
        this.player = player;
        this.commander = commander;
        this.games = games_played;
        this.wins = games_won;
        this.started = games_started;
        this.startedWon = games_won_and_started;
    }

    winrate() {
        return this.games > 0 ? ((this.wins / this.games) * 100).toFixed(0) : 0;
    }
}

export class Stats {
    constructor(games, players, commanders) {
        this.games = games;
        this.players = players;
        this.commanders = commanders;
    }
}

/**
 * Fetches recent games from the database.
 * @param {number} limit - Maximum number of games to fetch.
 * @returns {Promise<Array>} Array of game objects.
 */
export async function fetchRecentGames(limit = 10) {
    const { data: games, error } = await supabase
        .from('raw_games')
        .select('*')
        .order('game_date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error loading games:', error);
        return [];
    }

    return games;
}

/**
 * Fetches players from the database.
 * @param {Number} limit Maximum number of players to fetch
 * @returns {Promise<Array<Player>>} Array of player objects.
 */
export async function fetchPlayers(limit = 8) {
    const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .order('games_played', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error loading players:', error);
        return [];
    }

    return players.map(player => new Player(
        player.player,
        player.games_played,
        player.games_won,
        player.games_started,
        player.games_won_and_started
    ));
}

/**
 * Fetches commanders from the database.
 * @param {Number} limit Maximum number of commanders to fetch
 * @returns {Promise<Array<Commander>>} Array of commander objects.
 */
export async function fetchCommanders(limit = 8) {
    const { data: commanders, error } = await supabase
        .from('commanders')
        .select('*')
        .order('games_played', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error loading commanders:', error);
        return [];
    }

    return commanders.map(commander => new Commander(
        commander.commander,
        commander.games_played,
        commander.games_won,
        commander.games_started,
        commander.games_won_and_started
    ));
}

/**
 * Fetches player-commander combos from the database.
 * @param {Number} limit Maximum number of player-commander combos to fetch
 * @returns {Promise<Array<PlayerCommander>>} Array of player-commander objects
 */
export async function fetchCombos(limit = 8) {
    const { data: combos, error } = await supabase
        .from('player_commander_combos')
        .select('*')
        .order('games_played', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error loading player+commander combos:', error);
        return [];
    }

    return combos.map(combo => new PlayerCommander(
        combo.player,
        combo.commander,
        combo.games_played,
        combo.games_won,
        combo.games_started,
        combo.games_won_and_started
    ));
}

export async function fetchStats() {
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

/**
 * Fetches all games from the database.
 * @returns {Promise<Array>} Array of game objects.
 */
export async function fetchAllGames() {
    const { data: games, error } = await supabase
        .from('raw_games')
        .select('*')
        .order('game_date', { ascending: false });

    if (error) {
        console.error('Error loading games:', error);
        return [];
    }

    return games;
}

/**
 * Inserts a new game into the database.
 * @param {Object} gameData - The game data to insert.
 * @param {Array} gameData.playerData - Array of player objects with player and commander.
 * @param {string} gameData.winner - The winner's name.
 * @param {string} gameData.startingPlayer - The starting player's name.
 * @param {string} gameData.createdAt - The game date.
 * @returns {Promise<Object>} The result object with error if any.
 */
export async function insertGame(gameData) {
    const { error } = await supabase.from('raw_games').insert([{
        player_data: gameData.playerData,
        winner: gameData.winner,
        starting_player: gameData.startingPlayer,
        created_at: gameData.createdAt
    }]);

    return { error };
}
