import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Fetches recent games from the database.
 * @param {number} limit - Maximum number of games to fetch.
 * @returns {Promise<Array>} Array of game objects.
 */
export async function fetchRecentGames(limit = 10) {
    const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error loading games:', error);
        return [];
    }

    return games;
}

/**
 * Fetches all games from the database.
 * @returns {Promise<Array>} Array of game objects.
 */
export async function fetchAllGames() {
    const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

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
    const { error } = await supabase.from('games').insert([{
        player_data: gameData.playerData,
        winner: gameData.winner,
        starting_player: gameData.startingPlayer,
        created_at: gameData.createdAt
    }]);

    return { error };
}
