# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server with hot reload
npm run build     # Type-check (tsc -b) then build for production
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```

No test suite is configured.

## Architecture

**HMI Whiteboard** is a weekly habit/goal tracking app. Users define tasks, mark daily completions across a 7-day grid, set weekly goals (e.g., "complete 5 of 7 days"), and track streaks. At end of week, the current grid is archived to history and streaks update based on goal achievement.

### State & Data Flow

All state lives in `App.tsx` via React hooks — no external state library. Two `useEffect` hooks sync everything to `localStorage` on change.

**Core state:**
- `rows`: `Row[]` — the active task list with per-cell completion states
- `weekOf`: string — current week's start date label
- `history`: `HistoryEntry[]` — archived past weeks

**Key functions in `App.tsx`:**
- `toggleCell(rowId, dayIndex)` — cycles cell through 3 states: 0 (uncompleted) → 1 (completed) → 2 (failed) → 0
- `endWeek()` — recalculates streaks (positive if goal met, negative if not), resets cells, advances `weekOf`
- `archiveCurrentWeek()` — snapshots current rows + weekOf into `history`
- `addRow()` / `deleteRow(id)` — task CRUD
- `startEditingCell()` / `saveCellValue()` — inline editing for task name, goal, and streak fields

### Components

- **`App.tsx`** — owns all state, passes callbacks down as props
- **`components/Grid.tsx`** — pure presentation table; renders days, cells, goals, streaks; handles cell clicks and inline editing UI
- **`components/types.ts`** — shared TypeScript types (`Row`, `HistoryEntry`)

### Cell States

| Value | Meaning | Color |
|-------|---------|-------|
| 0 | Uncompleted | white |
| 1 | Completed | lightgreen |
| 2 | Failed | lightcoral |

### Persistence

localStorage keys:
- `hmi-rows` — serialized `Row[]`
- `hmi-weekOf` — current week string
- `hmi-history` — serialized `HistoryEntry[]`
