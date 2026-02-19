import type { Row } from "./types.ts";

type GridProps = {
  days: string[];
  rows: Row[];
  toggleCell: (row: number, col: number) => void;
};

const colors = ["white", "lightgreen", "lightcoral"];
const symbols = ["", "✔", "✖"];

function Grid({ rows, days, toggleCell }: GridProps) {
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
            <td>{row.goal}</td>
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
