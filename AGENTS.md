# Agent Onboarding Guide

**cmd-results** is a Magic: The Gathering Commander game tracker. Users record games, track wins/losses, and analyze statistics for players, commanders, and combinations.

**Tech Stack:** Vanilla JS (ES6+), Tailwind CSS (CDN), Supabase (Postgres + RLS), GitHub Pages

## Build & Deploy Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies (gh-pages) |
| `npm run deploy` | Deploy to GitHub Pages (gh-pages branch) |
| `npx serve . -l 8000` | Local development server |

**Testing:** No automated tests configured. Manual testing required - serve locally, open browser, verify in console.

## Project Structure

```
/home/manuel/Documents/cmd_results
├── index.html              # Main UI with Tailwind CSS
├── src/
│   ├── home.js             # Home page entry point
│   ├── navigation.js       # Nav bar rendering
│   ├── gamesList.js        # Games list display
│   ├── statsDisplay.js     # Statistics rendering
│   ├── supabaseService.js  # Database operations & data classes
│   ├── utils.js            # Utility functions (e.g., escapeHtml)
│   ├── config.js           # Supabase credentials (git-ignored)
│   └── components/
│       └── GameForm.js     # Reusable Web Component for adding games
├── supabase_setup.sql      # DB schema, RLS policies, views
└── .env                    # Environment variables (git-ignored)
```

---

## Code Style Guidelines

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Functions/variables | camelCase | `loadGames()`, `playerData` |
| Constants | SCREAMING_SNAKE_CASE | `PLAYER_COUNT` |
| Classes | PascalCase | `Player`, `GameForm` |
| Database columns | snake_case | `games_played`, `player_data` |
| DOM element IDs | camelCase | `gameForm`, `playerRows` |
| Custom events | kebab-case | `game-form-submitted` |

### JavaScript

**Imports:** ES6 modules with CDN via ESM, local via relative paths
```javascript
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
```

**Functions:** Always use arrow functions for callbacks, named functions for exports
```javascript
const handleSubmit = async (e) => { /* ... */ };
export async function loadGames() { /* ... */ }
```

**JSDoc Required:** All exported functions must have JSDoc comments
```javascript
/**
 * Fetches recent games from the database.
 * @param {number} limit - Maximum number of games to fetch.
 * @returns {Promise<Array>} Array of game objects.
 */
export async function fetchRecentGames(limit = 10) { /* ... */ }
```

**Error Handling Pattern:**
```javascript
async function fetchData() {
    try {
        const { data, error } = await supabase.from('table').select('*');
        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error loading data:', err);
        return [];
    }
}
```

**Web Components:** Use `CustomEvent` with `bubbles: true, composed: true` for cross-shadow-DOM events
```javascript
this.dispatchEvent(new CustomEvent('game-form-submitted', {
    bubbles: true,
    composed: true,
    detail: { playerData, winner }
}));
```

**Null Checks:** Always check for null before accessing properties
```javascript
if (form) form.removeEventListener('submit', handleSubmit);
```

### HTML/Tailwind CSS

- Semantic HTML5 elements
- Tailwind utilities only (no custom CSS)
- Dark theme colors: `bg-gray-900`, `bg-gray-800`, `bg-gray-700`
- Text colors: `text-gray-100`, `text-gray-400`, accent colors (`text-blue-400`, `text-purple-400`)

**Class Patterns:**
- Layout: `grid grid-cols-2`, `flex justify-between`, `space-y-4`
- Spacing: `p-4`, `mb-6`, `gap-4`
- Cards: `bg-gray-800 rounded-lg p-4`

### SQL Conventions

- UPPERCASE keywords: `CREATE TABLE`, `SELECT`, `INSERT`
- Lowercase identifiers: `games`, `player_data`
- snake_case columns: `game_date`, `starting_player`

```sql
CREATE TABLE IF NOT EXISTS public.raw_games (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    player_data jsonb NOT NULL,
    winner text NOT NULL
);
```

---

## Key Components

### `<game-form>` Web Component

**Events:**

| Event | Detail | Description |
|-------|--------|-------------|
| `game-form-submitted` | `{ playerData, winner, startingPlayer, createdAt }` | Success |
| `game-form-error` | `{ message }` | Validation or save error |

**Methods:** `reset()` - Resets form to initial state

**Usage:**
```javascript
const gameForm = document.querySelector('game-form');
gameForm.addEventListener('game-form-submitted', (e) => {
    loadGamesList();
    loadStats();
});
gameForm.addEventListener('game-form-error', (e) => alert(e.detail.message));
```

### Data Classes (`supabaseService.js`)

- `Player` - player, games, wins, started, startedWon + winrate()
- `Commander` - commander, games, wins, started, startedWon + winrate()
- `PlayerCommander` - player, commander, games, wins, started, startedWon + winrate()
- `Stats` - games, players, commanders

## Development Workflow

1. **UI Changes** → Edit `index.html`
2. **Logic Changes** → Edit relevant `src/` modules
3. **Database Changes** → Edit `supabase_setup.sql`, run in Supabase Dashboard

## Database Schema

**Table:** `raw_games(id, game_date, player_data jsonb, winner, starting_player, _created_at)`

**Views:** `players_and_commanders`, `players`, `commanders`, `player_commander_combos`, `stats`

**Modifying Schema:** Edit `supabase_setup.sql` and run in Supabase Dashboard → SQL Editor

## Git Workflow

- Branch: `git checkout -b feature-name`
- Commits: imperative mood ("Add player stats", "Fix commander validation")

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [MTG Commander Rules](https://mtgcommander.net/)
