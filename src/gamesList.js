import { fetchRecentGames } from './supabaseService.js';

/**
 * Renders a single game as HTML.
 * @param {Object} game - The game object.
 * @returns {string} HTML string for the game.
 */
function renderGameCard(game) {
    return `
    <div class="bg-gray-700 rounded p-4">
      <div class="flex justify-between items-start">
        <div>
          <span class="font-semibold text-green-400">${game.winner}</span>
          <span class="text-gray-400"> won</span>
        </div>
        <span class="text-xs text-gray-500">${new Date(game.created_at).toLocaleDateString()}</span>
      </div>
      <div class="text-sm text-gray-300 mt-2 space-y-1">
        ${game.player_data.map(p => `
          <div class="flex justify-between">
            <span>${p.player} ${p.player === game.starting_player ? `<span class="text-xs text-yellow-400">started</span>` : ''}</span>
            <span class="text-purple-300">${p.commander}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Loads and displays recent games.
 * @param {number} limit - Maximum number of games to display.
 */
export async function loadGamesList(limit = 10) {
    const games = await fetchRecentGames(limit);
    const list = document.getElementById('gamesList');

    if (!games.length) {
        list.innerHTML = '<p class="text-gray-500 text-center py-4">No games yet</p>';
        return;
    }

    list.innerHTML = games.map(game => renderGameCard(game)).join('');
}
