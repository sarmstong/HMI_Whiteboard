type GridProps = {
  days: string[];
  tasks: string[];
  grid: boolean[][];
  toggleCell: (row: number, col: number) => void;
};

const colors = ["white", "lightgreen", "lightcoral"];

function Grid({ tasks, days, grid, toggleCell }: GridProps) {
  return (
    <table border={1} cellPadding={10}>
      <thead>
        <tr>
          <th></th>
          {days.map((day, index) => (
            <th key={index}>{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tasks.map((task, rowIndex) => (
          <tr key={rowIndex}>
            <td>{task}</td>
            {days.map((_, colIndex) => (
              <td
                key={colIndex}
                onClick={() => toggleCell(rowIndex, colIndex)}
                cellValue = (grid[row][col] + 1) % 3)
                style={{
                  cursor: "pointer",
                  textAlign: "center",
                  backgroundColor = colors[cellValue]
                }}
              >
                {grid[rowIndex][colIndex] ? "✔" : ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Grid;
