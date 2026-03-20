import './components/GameForm.js';
import { renderNavBar } from './navigation.js';
import { loadGamesList } from './gamesList.js';
import { loadStats } from './statsDisplay.js';

/**
 * Initializes the home page.
 */
async function initHome() {
    renderNavBar();

    const gameForm = document.querySelector('game-form');
    gameForm.addEventListener('game-form-submitted', () => {
        loadGamesList();
        loadStats();
    });

    gameForm.addEventListener('game-form-error', (e) => {
        alert(e.detail.message);
    });

    await loadGamesList();
    await loadStats();
}

document.addEventListener('DOMContentLoaded', initHome);
