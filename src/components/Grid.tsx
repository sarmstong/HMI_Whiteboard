type GridProps = {
  days: string[];
  tasks: string[];
  grid: number[][];
  toggleCell: (row: number, col: number) => void;
};

const colors = ["white", "lightgreen", "lightcoral"];
const symbols = ["", "✔", "✖"];

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
                style={{
                  cursor: "pointer",
                  textAlign: "center",
                  backgroundColor: colors[grid[rowIndex][colIndex]]
                }}
              >
                {grid[rowIndex][colIndex]}
                {symbols[grid[rowIndex][colIndex]]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Grid;
