import type { Row } from "./types.ts";

type GridProps = {
  days: string[];
  rows: Row[];
  toggleCell: (row: number, col: number) => void;
  startEditingCell: (rowIndex: number, field: "goal" | "streak" | "task") => void;
  updateTempValue: (rowIndex: number, value: string) => void;
  saveCellValue: (rowIndex: number) => void;
  deleteRow: (id: string) => void;
};

const colors = ["white", "lightgreen", "lightcoral"];
const symbols = ["", "✔", "✖"];


function Grid({ rows, days, toggleCell, startEditingCell, updateTempValue, saveCellValue, deleteRow}: GridProps) {
  return (
    <table border={1} cellPadding={10}>
      <thead>
        <tr>
          <th>Task</th>
          <th>Goal</th>
          {days.map((day, index) => (
            <th key={index}>{day}</th>
          ))}
          <th>Completed?</th>
          <th>Streak</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {/* Task Cell */}
            <td onClick={() => startEditingCell(rowIndex, "task")} style={{ cursor: 'pointer' }}>
              {row.editingField === "task" ? (
                <input
                  autoFocus
                  type="text"
                  value={row.tempValue ?? row.task}
                  onChange={(e) => updateTempValue(rowIndex, e.target.value)}
                  onBlur={() => saveCellValue(rowIndex)} // Saves when you click away
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveCellValue(rowIndex); // Saves when you hit Enter
                  }}
                />
              ) : (
                row.task
              )}
            </td>
            {/* Goal Cell */}
            <td
              onClick={() => startEditingCell(rowIndex, "goal")}
              style={{ cursor: "pointer" }}
            >
              {row.editingField === "goal" ? (
                <input
                  type="number"
                  value={row.tempValue}
                  onChange={(e) => updateTempValue(rowIndex, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveCellValue(rowIndex);
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()} // <--- prevent td click
                  step={1}
                  min={0}
                  style={{ width: "100%", boxSizing: "border-box", padding: "2px" }}
                />
              ) : (
                row.goal
              )}
            </td>
            {/* Days Cells */}
            {days.map((_, colIndex) => (
              <td
                key={colIndex}
                onClick={() => toggleCell(rowIndex, colIndex)}
                style={{
                  cursor: "pointer",
                  textAlign: "center",
                  backgroundColor: colors[row.cells[colIndex]]
                }}
              >
                {symbols[row.cells[colIndex]]}
              </td>
            ))}
            {/* Completed? Cells */}
            <td>
                {row.cells.filter(cell => cell === 1).length >= row.goal ? "Yes ✅" : "No"}
            </td>
            {/* Streak Cells */}
            <td>{row.streak}</td>
            {/* Delete Button */}
            <td>
              <button 
                onClick={() => deleteRow(row.id)}
                style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                title="Delete Task"
              >
                🗑️
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Grid;
