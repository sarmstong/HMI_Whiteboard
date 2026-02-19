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

  const startEditingCell = (rowIndex: number, field: "goal" | "streak") => {
    const newRows = [...rows]; // copy rows array
    newRows[rowIndex] = {
      ...newRows[rowIndex],       // copy the specific row object
      editingField: field,
      tempValue: newRows[rowIndex][field] ?? 0 // set tempGoal to current goal
    };
    setRows(newRows);            // update state
  };

  const updateTempValue = (rowIndex: number, value: string) => {
  const newRows = [...rows];
  newRows[rowIndex] = {
    ...newRows[rowIndex],
    // tempValue: Number(value)  // convert input string to number
    tempValue: value === "" ? 0 : Number(value)
  };
  setRows(newRows);
  };

  const saveCellValue = (rowIndex: number) => {
    const newRows = [...rows];
    const row = newRows[rowIndex];

    if (row.editingField) {
      newRows[rowIndex] = {
        ...row,
        [row.editingField]: row.tempValue,  // update goal or streak
        tempValue: undefined,               // clear tempValue
        editingField: undefined             // stop editing
      };
      setRows(newRows);
    }
  };


  return (
    <div style={{ padding: 20 }}>
      <h2>HMI Whiteboard</h2>
      <h3>Week of: </h3>
      <Grid
        days={days}
        rows={rows}
        toggleCell={toggleCell}
        startEditingCell={startEditingCell}
        updateTempValue={updateTempValue}
        saveCellValue={saveCellValue}
      />
    </div>
  );
}

export default App;
