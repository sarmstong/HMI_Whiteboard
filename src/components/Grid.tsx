import type { Row } from "./types.ts";

type GridProps = {
  days: string[];
  weekOf: string;
  rows: Row[];
  toggleCell: (row: number, col: number) => void;
  startEditingCell: (rowIndex: number, field: "goal" | "streak" | "task") => void;
  updateTempValue: (rowIndex: number, value: string) => void;
  saveCellValue: (rowIndex: number) => void;
  deleteRow: (id: string) => void;
  onVisualize: (id: string) => void;
};

const dayCellClass = ["day-empty", "day-done", "day-fail"];
const daySymbols   = ["·", "✔", "✖"];

function getDayDates(weekOf: string): number[] {
  if (!weekOf) return Array(7).fill(0);
  const monday = new Date(weekOf + "T00:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.getDate();
  });
}

function Grid({ rows, days, weekOf, toggleCell, startEditingCell, updateTempValue, saveCellValue, deleteRow, onVisualize }: GridProps) {
  const dayDates = getDayDates(weekOf);

  return (
    <table className="grid-table">
      <thead>
        <tr>
          <th>Task</th>
          <th>Goal</th>
          {days.map((day, i) => (
            <th key={i}>
              {day}
              {dayDates[i] !== 0 && <span className="day-header-date">{dayDates[i]}</span>}
            </th>
          ))}
          <th>Done</th>
          <th>Streak</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => {
          const completed = row.cells.filter(c => c === 1).length;
          const goalMet   = completed >= row.goal;
          const streakClass = row.streak > 0 ? "streak-pos" : row.streak < 0 ? "streak-neg" : "streak-zero";

          return (
            <tr key={rowIndex}>
              {/* Task */}
              <td onClick={() => startEditingCell(rowIndex, "task")} style={{ cursor: "pointer" }}>
                {row.editingField === "task" ? (
                  <input
                    autoFocus
                    type="text"
                    value={row.tempValue ?? row.task}
                    onChange={(e) => updateTempValue(rowIndex, e.target.value)}
                    onBlur={() => saveCellValue(rowIndex)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveCellValue(rowIndex); }}
                  />
                ) : row.task}
              </td>

              {/* Goal */}
              <td onClick={() => startEditingCell(rowIndex, "goal")} style={{ cursor: "pointer" }}>
                {row.editingField === "goal" ? (
                  <input
                    autoFocus
                    type="number"
                    value={row.tempValue}
                    onChange={(e) => updateTempValue(rowIndex, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveCellValue(rowIndex); }}
                    onClick={(e) => e.stopPropagation()}
                    step={1} min={0}
                    style={{ width: 60 }}
                  />
                ) : row.goal}
              </td>

              {/* Day cells */}
              {days.map((_, colIndex) => (
                <td
                  key={colIndex}
                  onClick={() => toggleCell(rowIndex, colIndex)}
                  className={`day-cell ${dayCellClass[row.cells[colIndex]]}`}
                >
                  {daySymbols[row.cells[colIndex]]}
                </td>
              ))}

              {/* Done */}
              <td className={goalMet ? "completion-met" : "completion-unmet"}>
                {completed}/{row.goal}
              </td>

              {/* Streak */}
              <td
                className={streakClass}
                onClick={() => startEditingCell(rowIndex, "streak")}
                style={{ cursor: "pointer" }}
              >
                {row.editingField === "streak" ? (
                  <input
                    autoFocus
                    type="number"
                    value={row.tempValue ?? row.streak}
                    onChange={(e) => updateTempValue(rowIndex, e.target.value)}
                    onBlur={() => saveCellValue(rowIndex)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveCellValue(rowIndex); }}
                    style={{ width: 56 }}
                  />
                ) : (row.streak > 0 ? `+${row.streak}` : row.streak)}
              </td>

              {/* Visualize */}
              <td>
                <button className="icon-btn" onClick={() => onVisualize(row.id)} title="Visualize">
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1,14 5,8 8,11 12,5 17,7" />
                  </svg>
                </button>
              </td>

              {/* Delete */}
              <td>
                <button className="icon-btn danger" onClick={() => deleteRow(row.id)} title="Delete task">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                    <polyline points="1,3 14,3" /><polyline points="5,3 5,1 10,1 10,3" />
                    <path d="M2 3 l1 10 a1 1 0 0 0 1 1 h7 a1 1 0 0 0 1-1 l1-10" />
                    <line x1="5.5" y1="6.5" x2="5.5" y2="11" /><line x1="9.5" y1="6.5" x2="9.5" y2="11" />
                  </svg>
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default Grid;
