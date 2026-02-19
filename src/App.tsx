import { useState } from "react";
import type { Row } from "./components/types.ts";

import Grid from "./components/Grid.tsx";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];


function App() {

    const [rows, setRows] = useState<Row[]>([
      { id: "1", task: "Workout", goal: 5, streak: 0, cells: Array(days.length).fill(0) },
      { id: "2", task: "Code", goal: 7, streak: 0, cells: Array(days.length).fill(0)  }
    ]);

  const toggleCell = (row: number, col: number) => {
    const newRows = [...rows];
    newRows[row].cells[col] = (newRows[row].cells[col] + 1) % 3;
    setRows(newRows);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>HMI Whiteboard</h2>
      <Grid
        days={days}
        rows={rows}
        toggleCell={toggleCell}
      />
    </div>
  );
}

export default App;
