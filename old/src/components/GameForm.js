import { insertGame } from '../supabaseService.js';
import { escapeHtml } from '../utils.js';

const PLAYER_COUNT = 3;

/**
 * Custom element for adding Commander games.
 * Usage: <game-form></game-form>
 * 
 * Events:
 *   game-form-submitted - Fired when a game is successfully saved. detail contains { playerData, winner, startingPlayer, createdAt }
 *   game-form-error - Fired when an error occurs. detail contains { message }
 */
class GameForm extends HTMLElement {
    static get observedAttributes() {
        return [];
    }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.initPlayerRows();
    }

    disconnectedCallback() {
        this.removeEventListeners();
    }

    render() {
        this.innerHTML = `
            <form id="gameForm" class="space-y-4">
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="text-sm">Players & Commanders</label>
                        <button type="button" id="addPlayer" class="text-sm text-blue-400 hover:text-blue-300">+ Add Player</button>
                    </div>
                    <div id="playerRows" class="space-y-2"></div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm mb-1">Date</label>
                        <input type="date" id="gameDate" class="w-full bg-gray-700 rounded px-3 py-2" required>
                    </div>
                    <div>
                        <label class="block text-sm mb-1">Winner</label>
                        <select id="winner" class="w-full bg-gray-700 rounded px-3 py-2" required>
                            <option value="">Select...</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm mb-1">Starting Player</label>
                        <select id="startingPlayer" class="w-full bg-gray-700 rounded px-3 py-2" required>
                            <option value="">Select...</option>
                        </select>
                    </div>
                </div>
                
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold">
                    Add Game
                </button>
            </form>
        `;
    }

    setupEventListeners() {
        this.querySelector('#gameForm').addEventListener('submit', this.handleSubmit.bind(this));
        this.querySelector('#addPlayer').addEventListener('click', this.handleAddPlayer.bind(this));
        this.querySelector('#playerRows').addEventListener('click', this.handleRemovePlayer.bind(this));
        this.querySelector('#playerRows').addEventListener('input', this.handlePlayerInput.bind(this));
    }

    removeEventListeners() {
        const form = this.querySelector('#gameForm');
        if (form) form.removeEventListener('submit', this.handleSubmit);
        const addBtn = this.querySelector('#addPlayer');
        if (addBtn) addBtn.removeEventListener('click', this.handleAddPlayer);
        const playerRows = this.querySelector('#playerRows');
        if (playerRows) {
            playerRows.removeEventListener('click', this.handleRemovePlayer);
            playerRows.removeEventListener('input', this.handlePlayerInput);
        }
    }

    collectPlayerData() {
        const playerRows = this.querySelectorAll('.player-row');
        return Array.from(playerRows).map(row => ({
            player: row.querySelector('.player-name').value.trim(),
            commander: row.querySelector('.player-commander').value.trim()
        })).filter(p => p.player && p.commander);
    }

    initPlayerRows() {
        const container = this.querySelector('#playerRows');
        container.innerHTML = '';
        for (let i = 0; i < PLAYER_COUNT; i++) {
            container.innerHTML += this.createPlayerRow(i);
        }
        this.querySelector('#gameDate').value = new Date().toISOString().split('T')[0];
        this.updateDropdowns();
    }

    createPlayerRow(index) {
        return `
            <div class="player-row grid grid-cols-2 gap-2 items-center" data-index="${index}">
                <input type="text" class="player-name bg-gray-700 rounded px-3 py-2" placeholder="Player ${index + 1}" required>
                <input type="text" class="player-commander bg-gray-700 rounded px-3 py-2" placeholder="Commander" required>
                ${index >= 2 ? `<button type="button" class="remove-player col-span-2 text-red-400 text-sm hover:text-red-300">Remove</button>` : ''}
            </div>
        `;
    }

    updateDropdowns() {
        const names = Array.from(this.querySelectorAll('.player-name')).map(i => i.value).filter(Boolean);
        const winnerSelect = this.querySelector('#winner');
        const startingSelect = this.querySelector('#startingPlayer');

        [winnerSelect, startingSelect].forEach(select => {
            const current = select.value;
            select.innerHTML = '<option value="">Select...</option>' +
                names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
            if (names.includes(current)) select.value = current;
        });
    }

    handlePlayerInput(e) {
        if (e.target.classList.contains('player-name')) {
            this.updateDropdowns();
        }
    }

    handleRemovePlayer(e) {
        if (e.target.classList.contains('remove-player')) {
            e.target.closest('.player-row').remove();
            this.querySelectorAll('.player-row').forEach((row, i) => {
                row.dataset.index = i;
                row.querySelector('.player-name').placeholder = `Player ${i + 1}`;
                const removeBtn = row.querySelector('.remove-player');
                if (removeBtn) removeBtn.style.display = i >= 2 ? '' : 'none';
            });
            this.updateDropdowns();
        }
    }

    handleAddPlayer() {
        const rows = this.querySelectorAll('.player-row');
        const newIndex = rows.length;
        rows[rows.length - 1].insertAdjacentHTML('afterend', this.createPlayerRow(newIndex));
        this.updateDropdowns();
    }

    async handleSubmit(e) {
        e.preventDefault();

        const playerData = this.collectPlayerData();
        const winner = this.querySelector('#winner').value;
        const startingPlayer = this.querySelector('#startingPlayer').value;
        const gameDate = this.querySelector('#gameDate').value;

        if (playerData.length < 2) {
            this.dispatchEvent(new CustomEvent('game-form-error', {
                bubbles: true,
                composed: true,
                detail: { message: 'Need at least 2 players with commanders' }
            }));
            return;
        }
        if (!winner || !startingPlayer) {
            this.dispatchEvent(new CustomEvent('game-form-error', {
                bubbles: true,
                composed: true,
                detail: { message: 'Please select winner and starting player' }
            }));
            return;
        }

        const { error } = await insertGame({
            playerData,
            winner,
            startingPlayer,
            createdAt: gameDate
        });

        if (error) {
            this.dispatchEvent(new CustomEvent('game-form-error', {
                bubbles: true,
                composed: true,
                detail: { message: 'Error saving game: ' + error.message }
            }));
        } else {
            this.reset();
            this.dispatchEvent(new CustomEvent('game-form-submitted', {
                bubbles: true,
                composed: true,
                detail: { playerData, winner, startingPlayer, createdAt: gameDate }
            }));
        }
    }

    reset() {
        this.querySelector('#gameForm').reset();
        this.initPlayerRows();
    }
}

customElements.define('game-form', GameForm);

export default GameForm;
