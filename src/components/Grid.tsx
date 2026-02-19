import type { Row } from "./types.ts";

type GridProps = {
  days: string[];
  rows: Row[];
  toggleCell: (row: number, col: number) => void;
  startEditingCell: (rowIndex: number, field: "goal" | "streak") => void;
  updateTempValue: (rowIndex: number, value: string) => void;
  saveCellValue: (rowIndex: number) => void;
};

const colors = ["white", "lightgreen", "lightcoral"];
const symbols = ["", "✔", "✖"];

function Grid({ rows, days, toggleCell, startEditingCell, updateTempValue, saveCellValue}: GridProps) {
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
            <td>{row.task}</td>
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
            <td>Ns</td>
            <td>{row.streak}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Grid;
