# cmd-results: MTG Commander Game Tracker

**cmd-results** is a Magic: The Gathering Commander game tracker. Users record games, track wins/losses, and analyze statistics for players, commanders, and specific player-commander combinations.

## Features

* **Record Games:** Input game results, including the winner, starting player, and the commanders played.
* **Track Statistics:** View comprehensive stats and win rates for players, specific commanders, and player-commander combos.
* **Modern UI:** Built with React 19 and styled with Tailwind CSS for a dark-themed, responsive experience.

## Tech Stack

* **Frontend:** React 19, TypeScript, Vite
* **Styling:** Tailwind CSS
* **Backend:** Supabase (Postgres + Row Level Security)
* **Deployment:** GitHub Pages

## Getting Started

### Prerequisites

* Node.js and npm installed.
* A [Supabase](https://supabase.com/) project to host the PostgreSQL database.

### Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory (based on `.env.example` if available) and add your Supabase connection details:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup:**
   Apply the database schema by executing the SQL files located in the `db/` directory (tables and views) within your Supabase Dashboard's SQL Editor.

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be running at `http://localhost:5173`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check (`tsc -b`) + Vite production build |
| `npm run lint` | Run ESLint on all TypeScript/TSX files |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Build and deploy to GitHub Pages (`gh-pages` branch) |

> **Note:** Always ensure `npm run lint` and `npm run build` pass before committing code.

## Project Structure Overview

* `src/`: React frontend source code, including components (`src/components/`) and utilities/API clients (`src/lib/`).
* `db/`: Database schema definitions.
  * `db/tables/` and `db/views/`: SQL schemas.
  * `db/functions/`: Python scripts for batch database operations. To run these, install their dependencies:
    ```bash
    pip install -r db/functions/requirements.txt
    ```

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

```text
cmd-results: MTG Commander Game Tracker
Copyright (C) 2026 diagmatrix

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```
