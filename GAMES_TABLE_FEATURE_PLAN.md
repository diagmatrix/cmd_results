# Game Data Table Feature Plan

## Overview
Add a new page accessible by top navigation, showing a paginated, filterable, sortable table listing all games. The table displays Game ID, date, winner, starting player, and dynamic subcolumns for each player–commander pair in that game. UI and codebase organization must be consistent and modular.

---

## Key Features
- **Top Navigation Bar:** Persistent, with links to Home and Games Table. Visible on all pages.
- **Games Table Page:**
  - New HTML page.
  - Table shows Game ID, date, winner, starting player, dynamic subcolumns for player–commander pairs.
  - Paginated, filterable (player, commander, winner, date), and sortable by date.
  - Button reveals reusable Add Game form directly on this page.
- **Add Game Form Component:**
  - Form extracted to a JS (or HTML template + JS) module for reuse on main and table pages.
  - Form shown via button/modal as needed; form submit logic reused.
- **Code Modularization (ES Modules Recommended):**
  - data-fetch.js – DB fetch, filtering, paging logic
  - table-render.js – table layout, dynamic columns, in-table sorting/paging
  - filters.js – filter controls UI, wiring
  - add-game-form.js – form rendering, validation, submission
  - util.js – shared helpers
  - main.js – page bootstrap/navigation/events
- **Client-Side Filtering:**
  - Perform filtering client-side initially; optimize with server-side as needed on large datasets.
- **Style Consistency:**
  - Tailwind classes only, dark theme, matching current app layout.

---

## Implementation Todo List

1. Plan and mock the top navigation bar (high, completed)
2. Extract or rewrite the add game form as a reusable JS module/component (high, pending)
3. Review the current game data structure for dynamic player–commander subcolumns (high, pending)
4. Scaffold the new games table HTML page with navigation bar and page structure (high, pending)
5. Set up JS modularization: refactor into ES modules (data-fetch, table-render, filters, add-game-form, util, main), update index.html and new page to load as modules (high, pending)
6. Implement data-fetch.js: load game list from Supabase and support paging/filtering (high, pending)
7. Implement table-render.js: render main table with dynamic player–commander subcolumns, sorting by date, pagination (high, pending)
8. Implement filters.js: UI/interaction for filter controls; wire to table-render (high, pending)
9. Implement add-game-form.js: module to render, validate, and submit the form (reused in both pages) (high, pending)
10. Implement main.js files for Home and Games Table pages: wire up navigation, events, and bootstrap modules (medium, pending)
11. Style the table, form, and navigation for visual consistency using Tailwind (medium, pending)
12. Manual testing: navigation, form use, filtering, paging, dynamic columns, responsiveness (high, pending)
13. Document new modular structure/feature in AGENTS.md (low, completed)

---

## Notes

- Dynamic subcolumns for players: each game row adapts to number of players. If wide, consider horizontal scroll for the table.
- For add-game-form reuse: Prefer <template> tag + JS or fully JS-rendered component, as HTML imports are deprecated. JS modules are recommended for maintainability and clean separation of concerns.
- Filtering is client-side first (fast for small/medium datasets); consider server-side only if needed later.
