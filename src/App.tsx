import { useState } from "react";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const tasks = ["Workout", "Study", "Code"];

function App() {
  const [grid, setGrid] = useState(
    Array(tasks.length)
      .fill(null)
      .map(() => Array(days.length).fill(false))
  );

  const toggleCell = (row: number, col: number) => {
    const newGrid = [...grid];
    newGrid[row][col] = !newGrid[row][col];
    setGrid(newGrid);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>HMI Whiteboard</h2>
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
                    backgroundColor: grid[rowIndex][colIndex]
                      ? "lightgreen"
                      : "white",
                  }}
                >
                  {grid[rowIndex][colIndex] ? "✔" : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
