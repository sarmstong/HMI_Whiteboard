import { useEffect, useRef, useState } from "react";
import type { Row, HistoryEntry } from "./components/types.ts";
import { supabase } from "./lib/supabase.ts";
import Grid from "./components/Grid.tsx";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./App.css";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SHARED_UID = "1d60c134-d231-4890-a11f-8739a6749bc7";

const DEFAULT_ROWS: Row[] = [
  { id: "1", task: "Workout", goal: 5, streak: 0, cells: Array(7).fill(0) },
  { id: "2", task: "Code",    goal: 7, streak: 0, cells: Array(7).fill(0) },
];

function getMondayOfCurrentWeek(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

function App() {
  // ── App state ─────────────────────────────────────────────
  const [dataLoading, setDataLoading] = useState(true);
  const [weekOf,  setWeekOf]  = useState(getMondayOfCurrentWeek());
  const [rows,    setRows]    = useState<Row[]>(DEFAULT_ROWS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load from Supabase on mount
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_state")
        .select("key, value")
        .eq("user_id", SHARED_UID);

      if (data && data.length > 0) {
        const byKey: Record<string, unknown> = Object.fromEntries(data.map(d => [d.key, d.value]));
        if (byKey.rows)    setRows(byKey.rows    as Row[]);
        if (byKey.weekOf)  setWeekOf(byKey.weekOf as string);
        if (byKey.history) setHistory(byKey.history as HistoryEntry[]);
      }
      setDataLoading(false);
    };

    load();
  }, []);

  // Debounced sync to Supabase on state changes
  const syncTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (dataLoading) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const { error } = await supabase.from("app_state").upsert([
        { user_id: SHARED_UID, key: "rows",    value: rows    },
        { user_id: SHARED_UID, key: "weekOf",  value: weekOf  },
        { user_id: SHARED_UID, key: "history", value: history },
      ]);
      if (error) console.error("Supabase sync error:", error);
    }, 1500);
    return () => clearTimeout(syncTimer.current);
  }, [rows, weekOf, history, dataLoading]);

  // ── Actions ───────────────────────────────────────────────
  const toggleCell = (row: number, col: number) => {
    const newRows = [...rows];
    newRows[row].cells[col] = (newRows[row].cells[col] + 1) % 3;
    setRows(newRows);
  };

  const startEditingCell = (rowIndex: number, field: "goal" | "streak" | "task") => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], editingField: field, tempValue: newRows[rowIndex][field] ?? "" };
    setRows(newRows);
  };

  const updateTempValue = (rowIndex: number, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], tempValue: value };
    setRows(newRows);
  };

  const saveCellValue = (rowIndex: number) => {
    const newRows = [...rows];
    const row = newRows[rowIndex];
    if (row.editingField) {
      const finalValue = row.editingField === "task" ? String(row.tempValue) : Number(row.tempValue || 0);
      newRows[rowIndex] = { ...row, [row.editingField]: finalValue, tempValue: undefined, editingField: undefined };
      setRows(newRows);
    }
  };

  const addTask = () => {
    const newRow: Row = { id: Date.now().toString(), task: "New Task", goal: 3, cells: new Array(7).fill(0), streak: 0 };
    setRows([...rows, newRow]);
  };

  const deleteRow = (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const endWeek = () => {
    if (!window.confirm("End the week? This will update streaks and reset the board.")) return;

    const updatedRows = rows.map((row) => {
      const completedDays = row.cells.filter((cell) => cell === 1).length;
      const isGoalMet = completedDays >= row.goal;
      let newStreak = row.streak;
      if (isGoalMet) {
        newStreak = row.streak < 0 ? 1 : row.streak + 1;
      } else {
        newStreak = row.streak > 0 ? 0 : row.streak - 1;
      }
      return { ...row, streak: newStreak, cells: new Array(7).fill(0) };
    });

    if (weekOf) {
      const archivedData = updatedRows.map((updated, i) => ({ ...updated, cells: rows[i].cells }));
      setHistory((prev) => [...prev, { weekOf, savedAt: new Date().toISOString(), data: archivedData }]);
    }
    setRows(updatedRows);
  };

  const downloadCSV = () => {
    const header = "weekOf,task,goal,streak,day1,day2,day3,day4,day5,day6,day7,completed,goalMet";
    const csvRows = history.flatMap((entry) =>
      entry.data.map((row) => {
        const completed = row.cells.filter((c) => c === 1).length;
        return [entry.weekOf, `"${row.task.replace(/"/g, '""')}"`, row.goal, row.streak, ...row.cells, completed, completed >= row.goal].join(",");
      })
    );
    const csv = [header, ...csvRows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "hmi-history.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Visualization ─────────────────────────────────────────
  const [visualizingId, setVisualizingId] = useState<string | null>(null);
  const visualizingRow = visualizingId ? rows.find(r => r.id === visualizingId) ?? null : null;

  const visualChartData = visualizingId
    ? history
        .map((entry) => {
          const row = entry.data.find((r) => r.id === visualizingId);
          if (!row) return null;
          return { weekOf: entry.weekOf, completed: row.cells.filter((c) => c === 1).length };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => a.weekOf.localeCompare(b.weekOf))
    : [];

  const maxStreak = visualizingRow
    ? Math.max(visualizingRow.streak, ...history.map((e) => e.data.find((r) => r.id === visualizingId)?.streak ?? 0), 0)
    : 0;

  // ── Render ────────────────────────────────────────────────
  if (dataLoading) return <div className="app-loading">Loading…</div>;

  return (
    <div className="app">
      <header className="app-header">
        <h2 className="app-title">HMI Whiteboard</h2>
        <div className="week-selector">
          <span className="week-label">Week of</span>
          <input type="date" value={weekOf} onChange={(e) => setWeekOf(e.target.value)} />
        </div>
      </header>

      <div className="toolbar">
        <button className="btn-primary" onClick={addTask}>+ Add Task</button>
        <button className="btn-danger" onClick={endWeek}>End Week</button>
      </div>

      <Grid
        days={days}
        weekOf={weekOf}
        rows={rows}
        toggleCell={toggleCell}
        startEditingCell={startEditingCell}
        updateTempValue={updateTempValue}
        saveCellValue={saveCellValue}
        deleteRow={deleteRow}
        onVisualize={setVisualizingId}
      />

      {visualizingRow && (
        <div className="modal-backdrop" onClick={() => setVisualizingId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setVisualizingId(null)}>✕</button>
            <h3 className="modal-title">{visualizingRow.task}</h3>
            <p className="modal-stat">Max Streak: <strong>{maxStreak}</strong></p>
            {visualChartData.length === 0 ? (
              <p className="modal-empty">No history yet — end a week to start tracking.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={visualChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="weekOf" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: 13 }} cursor={{ stroke: "var(--border)" }} />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="var(--success)" strokeWidth={2} dot={{ r: 4, fill: "var(--success)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      <div className="archive-section">
        <div className="archive-header">
          <span className="archive-title">Archive History</span>
          {history.length > 0 && <button onClick={downloadCSV}>Download CSV</button>}
        </div>
        {history.length === 0 && (
          <p className="archive-empty">No archived weeks yet — end a week to archive automatically.</p>
        )}
      </div>
    </div>
  );
}

export default App;
