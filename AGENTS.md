# Agent Onboarding Guide

**cmd-results** is a Magic: The Gathering Commander game tracker. Users record games, track wins/losses, and analyze statistics for players, commanders, and combinations.

**Tech Stack:** Vanilla JS (ES6+), Tailwind CSS (CDN), Supabase (Postgres + RLS), GitHub Pages

## Build & Deploy Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies (gh-pages) |
| `npm run deploy` | Deploy to GitHub Pages (gh-pages branch) |
| `npx serve . -l 8000` | Local development server |

**No linters or automated tests are configured.** Manual testing required.

## Project Structure

| File | Purpose |
|------|---------|
| `index.html` | Main UI with Tailwind CSS |
| `js/app.js` | App logic, Supabase integration |
| `js/config.js` | Supabase credentials (git-ignored) |
| `supabase_setup.sql` | DB schema and RLS policies |
| `.env` | Environment variables (git-ignored) |

## Code Style Guidelines

### JavaScript

**Naming Conventions:**
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- DOM selectors: descriptive names

```javascript
const PLAYER_COUNT = 3;

async function loadGames() {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error loading games:', err);
    return [];
  }
}
```

**Imports:** ES6 modules, CDN via ESM, local via relative paths

```javascript
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
```

**Error Handling:** Always use try/catch for async operations, log with `console.error()`, show user alerts for validation errors

### HTML/Tailwind CSS

- Semantic HTML5 elements
- Tailwind utilities only (no custom CSS)
- Dark theme: `bg-gray-900`, `text-gray-100`

**Class Patterns:** Layout (`grid grid-cols-2`, `flex justify-between`), spacing (`p-4`, `mb-6`), colors (`bg-gray-700`, `text-blue-400`)

```html
<div class="bg-gray-800 rounded-lg p-4">
  <h2 class="text-lg font-semibold mb-3 text-purple-400">Stats</h2>
  <div id="commanderStats" class="grid grid-cols-2 gap-2"></div>
</div>
```

### SQL Conventions

- UPPERCASE keywords: `CREATE TABLE`, `SELECT`, `INSERT`
- Lowercase identifiers: `games`, `player_data`
- snake_case columns

```sql
CREATE TABLE IF NOT EXISTS games (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp DEFAULT now(),
  player_data jsonb NOT NULL,
  winner text NOT NULL
);
```

## Development Workflow

1. **UI Changes** → Edit `index.html`
2. **Logic Changes** → Edit `js/app.js`
3. **Database Changes** → Edit `supabase_setup.sql`, run in Supabase Dashboard

**Testing:** No automated tests. Serve locally (`npx serve . -l 8000`), open browser, verify in console.

## Database Setup

Create `.env` (git-ignored) with your Supabase credentials:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

**Schema:** `games(id, created_at, player_data jsonb, winner, starting_player)`

**Modifying Schema:** Edit `supabase_setup.sql` and run in Supabase Dashboard → SQL Editor

## Common Tasks

### Adding a New Statistic
1. Add calculation logic in `js/app.js`
2. Add display element in `index.html`
3. Test locally

### Debugging Database Issues
1. Check browser console for errors
2. Verify `.env` has correct Supabase credentials
3. Check Supabase Dashboard → Table Editor for data
4. Test RLS policies in Dashboard → Authentication

### Adding Players/Commanders
The app supports dynamic player rows (minimum 3, unlimited max). Click the add button in the UI.

## Git Workflow

- Branch: `git checkout -b feature-name`
- Commits: imperative mood ("Add player stats", "Fix commander validation")
- PR to main branch, deploy via `npm run deploy`

## Getting Help

- [Supabase Docs](https://supabase.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [MTG Commander](https://mtgcommander.net/)
