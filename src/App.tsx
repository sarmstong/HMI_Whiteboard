import { useState } from "react";
import Grid from "./components/Grid.tsx";

const days = ["Goal","Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun","Completed?", "Streak"];
const tasks = ["Up early", "Pushups", "Spanish", "Controls", "Journal" ];

function App() {
  const [grid, setGrid] = useState(
    Array(tasks.length)
      .fill(null)
      .map(() => Array(days.length).fill(0))
  );

  const toggleCell = (row: number, col: number) => {
    const newGrid = [...grid];
    newGrid[row][col] = (newGrid[row][col] + 1) % 3;
    setGrid(newGrid);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>HMI Whiteboard</h2>
      <Grid
        days={days}
        tasks={tasks}
        grid={grid}
        toggleCell={toggleCell}
      />
    </div>
  );
}

export default App;
