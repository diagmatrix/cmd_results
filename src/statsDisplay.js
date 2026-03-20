import { fetchAllGames } from './supabaseService.js';
import { escapeHtml } from './utils.js';

/**
 * Calculates statistics from all games.
 * @param {Array} games - Array of game objects.
 * @returns {Object} Object containing playerStats, commanderStats, comboStats, and startingWins.
 */
function calculateStats(games) {
    const playerStats = {};
    const commanderStats = {};
    const comboStats = {};
    const startingWins = {};

    games.forEach(game => {
        const winner = game.winner;
        const starting = game.starting_player;

        startingWins[starting] = startingWins[starting] || { games: 0, wins: 0 };
        startingWins[starting].games++;
        if (winner === starting) startingWins[starting].wins++;

        game.player_data.forEach(p => {
            playerStats[p.player] = playerStats[p.player] || { games: 0, wins: 0 };
            playerStats[p.player].games++;
            if (p.player === winner) playerStats[p.player].wins++;

            commanderStats[p.commander] = commanderStats[p.commander] || { games: 0, wins: 0 };
            commanderStats[p.commander].games++;
            if (p.player === winner) commanderStats[p.commander].wins++;

            const comboKey = `${p.player} + ${p.commander}`;
            comboStats[comboKey] = comboStats[comboKey] || { games: 0, wins: 0 };
            comboStats[comboKey].games++;
            if (p.player === winner) comboStats[comboKey].wins++;
        });
    });

    return { playerStats, commanderStats, comboStats, startingWins };
}

/**
 * Renders a stat card for a player.
 * @param {string} player - Player name.
 * @param {Object} s - Stats object with wins and games.
 * @param {Object} startingWins - Starting player win data.
 * @returns {string} HTML string for the player stat card.
 */
function renderPlayerStatCard(player, s, startingWins) {
    return `
      <div class="bg-gray-700 rounded p-3">
        <div class="font-semibold">${escapeHtml(player)}</div>
        <div class="text-2xl font-bold">${s.wins}/${s.games}</div>
        <div class="text-sm text-gray-400">${((s.wins / s.games) * 100).toFixed(0)}% win rate</div>
        <div class="text-xs text-yellow-400 mt-1">${startingWins[player] ? `${startingWins[player].wins}/${startingWins[player].games} going first` : ''}</div>
      </div>
    `;
}

/**
 * Renders a stat card for a commander.
 * @param {string} commander - Commander name.
 * @param {Object} s - Stats object with wins and games.
 * @returns {string} HTML string for the commander stat card.
 */
function renderCommanderStatCard(commander, s) {
    return `
      <div class="bg-gray-700 rounded p-3">
        <div class="font-semibold text-purple-300">${escapeHtml(commander)}</div>
        <div class="text-2xl font-bold">${s.wins}/${s.games}</div>
        <div class="text-sm text-gray-400">${((s.wins / s.games) * 100).toFixed(0)}% win rate</div>
      </div>
    `;
}

/**
 * Renders a stat card for a player+commander combo.
 * @param {string} combo - Combo string in format "player + commander".
 * @param {Object} s - Stats object with wins and games.
 * @returns {string} HTML string for the combo stat card.
 */
function renderComboStatCard(combo, s) {
    const [player, commander] = combo.split(' + ');
    return `
      <div class="bg-gray-700 rounded p-3">
        <div class="font-semibold">${escapeHtml(player)}</div>
        <div class="text-purple-300">${escapeHtml(commander)}</div>
        <div class="flex items-baseline justify-between">
          <div class="text-2xl font-bold">${s.wins}/${s.games}</div>
          <div class="text-gray-400">${((s.wins / s.games) * 100).toFixed(0)}% win rate</div>
        </div>
      </div>
    `;
}

/**
 * Loads and displays all statistics.
 */
export async function loadStats() {
    const games = await fetchAllGames();

    if (!games.length) {
        document.getElementById('totalGames').textContent = '0';
        document.getElementById('playerStats').innerHTML = '';
        document.getElementById('commanderStats').innerHTML = '';
        document.getElementById('comboStats').innerHTML = '';
        return;
    }

    const { playerStats, commanderStats, comboStats, startingWins } = calculateStats(games);

    document.getElementById('totalGames').textContent = games.length;

    document.getElementById('playerStats').innerHTML = Object.entries(playerStats)
        .sort((a, b) => b[1].wins - a[1].wins)
        .slice(0, 8)
        .map(([player, s]) => renderPlayerStatCard(player, s, startingWins))
        .join('');

    document.getElementById('commanderStats').innerHTML = Object.entries(commanderStats)
        .sort((a, b) => b[1].wins - a[1].wins)
        .slice(0, 8)
        .map(([commander, s]) => renderCommanderStatCard(commander, s))
        .join('');

    document.getElementById('comboStats').innerHTML = Object.entries(comboStats)
        .sort((a, b) => b[1].wins - a[1].wins)
        .slice(0, 8)
        .map(([combo, s]) => renderComboStatCard(combo, s))
        .join('');
}
