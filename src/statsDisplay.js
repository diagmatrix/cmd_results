import { fetchPlayers, fetchCommanders, fetchCombos, fetchStats, Player, Commander, PlayerCommander, Stats } from './supabaseService.js';
import { escapeHtml } from './utils.js';

/**
 * Renders a stat card for a player.
 * @param {Player} player - Player object.
 * @returns {string} HTML string for the player stat card.
 */
function renderPlayerStatCard(player) {
    return `
      <div class="bg-gray-700 rounded p-3">
        <div class="font-semibold">${escapeHtml(player.player)}</div>
        <div class="text-2xl font-bold">${player.wins}/${player.games}</div>
        <div class="text-sm text-gray-400">${player.winrate()}% win rate</div>
        <div class="text-xs text-yellow-400 mt-1">${player.started > 0 ? `${player.startedWon}/${player.started} going first` : 'never gone first'}</div>
      </div>
    `;
}

/**
 * Renders a stat card for a commander.
 * @param {Commander} commander - Commander object.
 * @returns {string} HTML string for the commander stat card.
 */
function renderCommanderStatCard(commander) {
    return `
      <div class="bg-gray-700 rounded p-3">
        <div class="font-semibold text-purple-300">${escapeHtml(commander.commander)}</div>
        <div class="text-2xl font-bold">${commander.wins}/${commander.games}</div>
        <div class="text-sm text-gray-400">${commander.winrate()}% win rate</div>
        <div class="text-xs text-yellow-400 mt-1">${commander.started > 0 ? `${commander.startedWon}/${commander.started} going first` : 'never gone first'}</div>
      </div>
    `;
}

/**
 * Renders a stat card for a player+commander combo.
 * @param {PlayerCommander} combo - Combo object.
 * @returns {string} HTML string for the combo stat card.
 */
function renderComboStatCard(combo) {
    return `
      <div class="bg-gray-700 rounded p-3">
        <div class="font-semibold">${escapeHtml(combo.player)}</div>
        <div class="text-purple-300">${escapeHtml(combo.commander)}</div>
        <div class="text-2xl font-bold">${combo.wins}/${combo.games}</div>
        <div class="text-sm text-gray-400">${combo.winrate()}% win rate</div>
        </div>
      </div>
    `;
}

/**
 * Loads and displays all statistics.
 */
export async function loadStats() {
    const players = await fetchPlayers(8);
    const commanders = await fetchCommanders(8);
    const combos = await fetchCombos(8);
    const stats = await fetchStats();

    if (!players.length && !commanders.length && !combos.length || !stats) {
        document.getElementById('playerStats').innerHTML = '';
        document.getElementById('commanderStats').innerHTML = '';
        document.getElementById('comboStats').innerHTML = '';
        document.getElementById('totalGames').textContent = '0';
        document.getElementById('totalPlayers').textContent = '0';
        document.getElementById('totalCommanders').textContent = '0';
        return;
    }

    document.getElementById('playerStats').innerHTML = Object.entries(players)
        .sort((a, b) => b[1].games - a[1].games)
        .map(([_, player]) => renderPlayerStatCard(player))
        .join('');

    document.getElementById('commanderStats').innerHTML = Object.entries(commanders)
        .sort((a, b) => b[1].games - a[1].games)
        .map(([_, commander]) => renderCommanderStatCard(commander))
        .join('');

    document.getElementById('comboStats').innerHTML = Object.entries(combos)
        .sort((a, b) => b[1].wins - a[1].wins)
        .map(([_, combo]) => renderComboStatCard(combo))
        .join('');

    document.getElementById('totalGames').textContent = stats.games;
    document.getElementById('totalPlayers').textContent = stats.players;
    document.getElementById('totalCommanders').textContent = stats.commanders;
}
