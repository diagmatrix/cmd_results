import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PLAYER_COUNT = 3;

function createPlayerRow(index) {
  return `
    <div class="player-row grid grid-cols-2 gap-2 items-center" data-index="${index}">
      <input type="text" class="player-name bg-gray-700 rounded px-3 py-2" placeholder="Player ${index + 1}" required>
      <input type="text" class="player-commander bg-gray-700 rounded px-3 py-2" placeholder="Commander" required>
      ${index >= 2 ? `<button type="button" class="remove-player col-span-2 text-red-400 text-sm hover:text-red-300">Remove</button>` : ''}
    </div>
  `;
}

function initForm() {
  const container = document.getElementById('playerRows');
  container.innerHTML = '';
  for (let i = 0; i < PLAYER_COUNT; i++) {
    container.innerHTML += createPlayerRow(i);
  }
  document.getElementById('gameDate').value = new Date().toISOString().split('T')[0];
  updateDropdowns();
}

function updateDropdowns() {
  const names = Array.from(document.querySelectorAll('.player-name')).map(i => i.value).filter(Boolean);
  const winnerSelect = document.getElementById('winner');
  const startingSelect = document.getElementById('startingPlayer');
  
  [winnerSelect, startingSelect].forEach(select => {
    const current = select.value;
    select.innerHTML = '<option value="">Select...</option>' + 
      names.map(n => `<option value="${n}">${n}</option>`).join('');
    if (names.includes(current)) select.value = current;
  });
}

document.getElementById('playerRows').addEventListener('input', (e) => {
  if (e.target.classList.contains('player-name')) {
    updateDropdowns();
  }
});

document.getElementById('playerRows').addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-player')) {
    e.target.closest('.player-row').remove();
    document.querySelectorAll('.player-row').forEach((row, i) => {
      row.dataset.index = i;
      row.querySelector('.player-name').placeholder = `Player ${i + 1}`;
      const removeBtn = row.querySelector('.remove-player');
      if (removeBtn) removeBtn.style.display = i >= 2 ? '' : 'none';
    });
    updateDropdowns();
  }
});

document.getElementById('addPlayer').addEventListener('click', () => {
  const rows = document.querySelectorAll('.player-row');
  const newIndex = rows.length;
  rows[rows.length - 1].insertAdjacentHTML('afterend', createPlayerRow(newIndex));
  updateDropdowns();
});

document.getElementById('gameForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const playerRows = document.querySelectorAll('.player-row');
  const playerData = Array.from(playerRows).map(row => ({
    player: row.querySelector('.player-name').value.trim(),
    commander: row.querySelector('.player-commander').value.trim()
  })).filter(p => p.player && p.commander);

  const winner = document.getElementById('winner').value;
  const startingPlayer = document.getElementById('startingPlayer').value;
  const gameDate = document.getElementById('gameDate').value;

  if (playerData.length < 2) {
    alert('Need at least 2 players with commanders');
    return;
  }
  if (!winner || !startingPlayer) {
    alert('Please select winner and starting player');
    return;
  }

  const { error } = await supabase.from('games').insert([{
    player_data: playerData,
    winner,
    starting_player: startingPlayer,
    created_at: gameDate
  }]);

  if (error) {
    alert('Error saving game: ' + error.message);
  } else {
    e.target.reset();
    initForm();
    loadGames();
    loadStats();
  }
});

async function loadGames() {
  const { data: games, error } = await supabase
    .from('games')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error loading games:', error);
    return;
  }

  const list = document.getElementById('gamesList');
  if (!games.length) {
    list.innerHTML = '<p class="text-gray-500 text-center py-4">No games yet</p>';
    return;
  }

  list.innerHTML = games.map(game => `
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
  `).join('');
}

async function loadStats() {
  const { data: games, error } = await supabase
    .from('games')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !games.length) {
    document.getElementById('totalGames').textContent = '0';
    document.getElementById('playerStats').innerHTML = '';
    document.getElementById('commanderStats').innerHTML = '';
    document.getElementById('comboStats').innerHTML = '';
    return;
  }

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

  document.getElementById('totalGames').textContent = games.length;

  document.getElementById('playerStats').innerHTML = Object.entries(playerStats)
    .sort((a, b) => b[1].wins - a[1].wins)
    .slice(0, 8)
    .map(([player, s]) => `
      <div class="bg-gray-700 rounded p-3">
        <div class="font-semibold">${player}</div>
        <div class="text-2xl font-bold">${s.wins}/${s.games}</div>
        <div class="text-sm text-gray-400">${((s.wins/s.games)*100).toFixed(0)}% win rate</div>
        <div class="text-xs text-yellow-400 mt-1">${startingWins[player] ? `${startingWins[player].wins}/${startingWins[player].games} going first` : ''}</div>
      </div>
    `).join('');

  document.getElementById('commanderStats').innerHTML = Object.entries(commanderStats)
    .sort((a, b) => b[1].wins - a[1].wins)
    .slice(0, 8)
    .map(([commander, s]) => `
      <div class="bg-gray-700 rounded p-3">
        <div class="font-semibold text-purple-300">${commander}</div>
        <div class="text-2xl font-bold">${s.wins}/${s.games}</div>
        <div class="text-sm text-gray-400">${((s.wins/s.games)*100).toFixed(0)}% win rate</div>
      </div>
    `).join('');

  document.getElementById('comboStats').innerHTML = Object.entries(comboStats)
    .sort((a, b) => b[1].wins - a[1].wins)
    .slice(0, 8)
    .map(([combo, s]) => {
      const [player, commander] = combo.split(' + ');
      return `
        <div class="bg-gray-700 rounded p-3">
          <div class="font-semibold">${player}</div>
          <div class="text-purple-300">${commander}</div>
          <div class="flex items-baseline justify-between">
            <div class="text-2xl font-bold">${s.wins}/${s.games}</div>
            <div class="text-gray-400">${((s.wins/s.games)*100).toFixed(0)}% win rate</div>
          </div>
        </div>
      `;
    }).join('');
}

import { renderNavBar } from './navigation.js';

document.addEventListener('DOMContentLoaded', () => {
  renderNavBar();
  initForm();
  loadGames();
  loadStats();
});
