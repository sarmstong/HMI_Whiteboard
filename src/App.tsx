import { useEffect, useState } from "react";
import type { Row, HistoryEntry } from "./components/types.ts";
import Grid from "./components/Grid.tsx";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];



function App() {
  const [weekOf, setWeekOf] = useState<string>(() => {
    return localStorage.getItem("hmi_weekOf") || "";
  });

  const [rows, setRows] = useState<Row[]>(() => {
    const savedRows = localStorage.getItem("hmi_rows");
    return savedRows ? JSON.parse(savedRows) : [
      { id: "1", task: "Workout", goal: 5, streak: 0, cells: Array(days.length).fill(0) },
      { id: "2", task: "Code", goal: 7, streak: 0, cells: Array(days.length).fill(0) }
    ];
  });

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const savedHistory = localStorage.getItem("hmi_history");
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  // --- ADD THIS BLOCK HERE ---
  useEffect(() => {
    localStorage.setItem("hmi_rows", JSON.stringify(rows));
    localStorage.setItem("hmi_weekOf", weekOf);
    localStorage.setItem("hmi_history", JSON.stringify(history));
  }, [rows, weekOf, history]); 
  // ----------------------------

  const toggleCell = (row: number, col: number) => {
    const newRows = [...rows];
    newRows[row].cells[col] = (newRows[row].cells[col] + 1) % 3;
    setRows(newRows);
  };

  // Update the second argument to include "task"
  const startEditingCell = (rowIndex: number, field: "goal" | "streak" | "task") => {
    const newRows = [...rows];
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      editingField: field,
      // Use an empty string fallback for the task name
      tempValue: newRows[rowIndex][field] ?? "" 
    };
    setRows(newRows);
  };

  const updateTempValue = (rowIndex: number, value: string) => {
    const newRows = [...rows];
    const field = newRows[rowIndex].editingField;

    newRows[rowIndex] = {
      ...newRows[rowIndex],
      // If we are editing 'task', keep it as a string. Otherwise, convert to Number.
      tempValue: field === "task" ? value : (value === "" ? 0 : Number(value))
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

  const archiveCurrentWeek = () => {
  if (!weekOf) {
    alert("Please set a 'Week of' date before saving.");
    return;
  }

  const newEntry: HistoryEntry = {
    weekOf: weekOf,
    savedAt: new Date().toISOString(),
    data: [...rows], // Shallow copy of the current rows
  };

  setHistory((prev) => [...prev, newEntry]);
  
  // Optional: Reset the board for the new week? 
  // We can decide on that next.
  alert("Week archived successfully!");
  };

  const addTask = () => {
    const newRow: Row = {
      id: Date.now().toString(),
      task: "New Task",
      goal: 3,
      cells: new Array(7).fill(0),
      streak: 0
    };
    setRows([...rows, newRow]);
  };

  const deleteRow = (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  useEffect(() => {
    localStorage.setItem("hmi_rows", JSON.stringify(rows));
    localStorage.setItem("hmi_weekOf", weekOf);
    }, [rows, weekOf]);

  return (
    <div style={{ padding: 20 }}>
      <h2>HMI Whiteboard</h2>
      <h3>Week of: {""}
          <input
            type="date"
            value={weekOf}
            onChange={(e) => setWeekOf(e.target.value)}
  />

{/* ARCHIVE BUTTON */}
  <button 
    onClick={archiveCurrentWeek} 
    style={{ marginLeft: '10px', cursor: 'pointer' }}
  >
    Archive Week
  </button>
      </h3>

{/* ADD ROW BUTTON */}
<button onClick={addTask}>Add New Row</button>

{/* TABLE */}
      <Grid
        days={days}
        rows={rows}
        toggleCell={toggleCell}
        startEditingCell={startEditingCell}
        updateTempValue={updateTempValue}
        saveCellValue={saveCellValue}
        deleteRow={deleteRow}
      />
      <div style={{ marginTop: '40px', borderTop: '2px solid #ccc', paddingTop: '20px' }}>
        <h2>Archive History</h2>
        {history.length === 0 ? (
          <p>No archived weeks yet.</p>
        ) : (
          history.map((entry, index) => (
            <details key={index} style={{ marginBottom: '10px', border: '1px solid #ddd', padding: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Week of: {entry.weekOf} (Saved: {new Date(entry.savedAt).toLocaleDateString()})
              </summary>
              <table style={{ marginTop: '10px', width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Goal</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.data.map((row) => (
                    <tr key={row.id}>
                      <td>{row.task}</td>
                      <td>{row.goal}</td>
                      <td>
                        {row.cells.filter(c => c === 1).length >= row.goal ? "✅" : "❌"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          ))
        )}
      </div>
    </div>
    
  );
}

export default App;
