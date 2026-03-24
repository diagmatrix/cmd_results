# Agent Onboarding Guide

**cmd-results** is a Magic: The Gathering Commander game tracker. Users record games, track wins/losses, and analyze statistics for players, commanders, and combinations.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Postgres + RLS)
- **Deployment:** GitHub Pages

## Build & Deploy Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server (http://localhost:5173) |
| `npm run build` | TypeScript check + Vite production build |
| `npm run lint` | Run ESLint on all TypeScript/TSX files |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Build and deploy to GitHub Pages (gh-pages branch) |

**Type Checking:** `npm run build` runs `tsc -b` before building. Lint and build must pass before committing.

**Testing:** No automated tests configured. Manual testing required.

## Project Structure

```
/home/manuel/Documents/cmd_results
├── src/
│   ├── main.tsx              # App entry point
│   ├── App.tsx               # Root component
│   ├── components/           # React components
│   │   ├── GameForm.tsx
│   │   ├── GamesList.tsx
│   │   ├── NavBar.tsx
│   │   └── StatsDisplay.tsx
│   └── lib/
│       ├── supabase.ts       # Database operations & data classes
│       ├── config.ts         # Supabase credentials
│       └── utils.ts          # Utility functions
├── db/                       # Database schema (SQL files)
|   ├── functions/            # Python scripts for mass modifications of the DB
│   ├── tables/
│   └── views/
|   
├── index.html
├── vite.config.ts
├── tsconfig.json
└── eslint.config.js
```

## Code Style Guidelines

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Functions/variables | camelCase | `loadGames()`, `playerData` |
| Constants | SCREAMING_SNAKE_CASE | `PLAYER_COUNT` |
| Components/Classes | PascalCase | `Player`, `GameForm` |
| Database columns | snake_case | `games_played`, `player_data` |
| Files | kebab-case | `games-list.tsx`, `supabase-service.ts` |
| Custom events | kebab-case | `game-form-submitted` |

### TypeScript

**Types vs Interfaces:**
- Use `type` for unions, primitives, and object literals
- Use `interface` for React component props and extendable types

```typescript
// Type for data records
type PlayerData = {
  player: string;
  commander: string;
};

// Interface for React props
interface GameFormProps {
  onSuccess?: () => void;
}
```

**Imports:** Use `type` keyword for type-only imports
```typescript
import { createClient } from '@supabase/supabase-js';
import { insertGame, type GameFormData } from '../lib/supabase';
import { escapeHtml } from '../lib/utils';
```

**Type Annotation:** Prefer inference, annotate function parameters and return types when unclear
```typescript
export async function fetchRecentGames(limit: number = 10): Promise<Game[]> {
  // ...
}
```

### React

**Component Structure:**
```typescript
interface ComponentProps {
  title: string;
  items: string[];
}

export function Component({ title, items }: ComponentProps) {
  const [state, setState] = useState<string>('');

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {/* ... */}
    </div>
  );
}
```

**Hooks:** Use `useCallback` for functions passed as dependencies
```typescript
const loadData = useCallback(async () => {
  // ...
}, [dependency]);
```

**Event Handlers:**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  // ...
};
```

### Error Handling

```typescript
async function fetchData() {
  const { data, error } = await supabase.from('table').select('*');
  if (error) {
    console.error('Error loading data:', error);
    return [];
  }
  return data || [];
}
```

### HTML/Tailwind CSS

- Semantic HTML5 elements
- Tailwind utilities only (no custom CSS)
- Dark theme colors: `bg-gray-900`, `bg-gray-800`, `bg-gray-700`
- Text colors: `text-gray-100`, `text-gray-400`, accent (`text-blue-400`)

## Data Classes (`src/lib/supabase.ts`)

- `Player` - player, games, wins, started, startedWon + winrate()
- `Commander` - commander, games, wins, started, startedWon + winrate()
- `PlayerCommander` - player, commander, games, wins, started, startedWon + winrate()
- `Stats` - games, players, commanders

## Database Schema

**Table:** `raw_games(id, game_date, player_data jsonb, winner, starting_player, created_at)`

**Views:** `players`, `commanders`, `player_commander_combos`, `stats`

**Modifying Schema:** Edit files in `db/` directory, then run SQL in Supabase Dashboard → SQL Editor

## Git Workflow

- Branch: `git checkout -b feature-name`
- Commits: imperative mood ("Add player stats", "Fix commander validation")
- Always run `npm run lint && npm run build` before committing
