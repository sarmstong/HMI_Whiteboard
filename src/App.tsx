import { useEffect, useRef, useState } from "react";
import type { Row, HistoryEntry } from "./components/types.ts";
import { supabase } from "./lib/supabase.ts";
import Grid from "./components/Grid.tsx";
import LoginScreen from "./components/LoginScreen.tsx";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import "./App.css";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_ROWS: Row[] = [
  { id: "1", task: "Workout", goal: 5, streak: 0, cells: Array(7).fill(0) },
  { id: "2", task: "Code",    goal: 7, streak: 0, cells: Array(7).fill(0) },
];

function getMondayOf(date: Date): string {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

function getMondayOfCurrentWeek(): string {
  return getMondayOf(new Date());
}

function App() {
  // ── Auth state ────────────────────────────────────────────
  const savedUser = localStorage.getItem("hmi-user");
  const [activeUser, setActiveUser] = useState<{ username: string; userId: string } | null>(
    savedUser ? JSON.parse(savedUser) : null
  );

  // ── App state ─────────────────────────────────────────────
  const [dataLoading, setDataLoading] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [weekOf,  setWeekOf]  = useState(getMondayOfCurrentWeek());
  const [rows,    setRows]    = useState<Row[]>(DEFAULT_ROWS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // ── Backup helpers ───────────────────────────────────────
  const writeSnapshotBackup = async (snapshotRows: Row[], snapshotWeekOf: string, snapshotHistory: HistoryEntry[]) => {
    if (!activeUser) return;
    const lastBackupKey = `hmi-last-backup-${activeUser.userId}`;
    const { error } = await supabase.from("app_state_backups").insert({
      user_id: activeUser.userId,
      rows: snapshotRows,
      week_of: snapshotWeekOf,
      history: snapshotHistory,
    });
    if (error) { console.error("Snapshot backup error:", error); return; }
    localStorage.setItem(lastBackupKey, new Date().toDateString());
    // Prune snapshots older than 90 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    await supabase.from("app_state_backups").delete()
      .eq("user_id", activeUser.userId)
      .lt("created_at", cutoff.toISOString());
  };

  // Load from Supabase on mount (or when user changes)
  useEffect(() => {
    if (!activeUser) return;
    setDataLoading(true);
    setSyncEnabled(false);
    setRows(DEFAULT_ROWS);
    setWeekOf(getMondayOfCurrentWeek());
    setHistory([]);

    const shadowKey = `hmi-shadow-${activeUser.userId}`;
    const lastBackupKey = `hmi-last-backup-${activeUser.userId}`;

    const restoreFromShadow = (): { rows: Row[]; weekOf: string; history: HistoryEntry[] } | null => {
      try {
        const raw = localStorage.getItem(shadowKey);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch { return null; }
    };

    const load = async () => {
      const { data, error } = await supabase
        .from("app_state")
        .select("key, value")
        .eq("user_id", activeUser.userId);

      if (error) {
        console.error("Supabase load error:", error);
        const shadow = restoreFromShadow();
        if (shadow) {
          if (shadow.rows)    setRows(shadow.rows);
          if (shadow.weekOf)  setWeekOf(shadow.weekOf);
          if (shadow.history) setHistory(shadow.history);
          console.warn("Supabase error — displaying data from local shadow copy (sync disabled).");
        }
        setDataLoading(false);
        // Do NOT enable sync — Supabase unreachable, avoid overwriting with recovered data
        return;
      }

      let loadedRows: Row[] = DEFAULT_ROWS;
      let loadedWeekOf: string = getMondayOfCurrentWeek();
      let loadedHistory: HistoryEntry[] = [];

      if (data && data.length > 0) {
        const byKey: Record<string, unknown> = Object.fromEntries(data.map(d => [d.key, d.value]));
        if (byKey.rows)    loadedRows    = byKey.rows    as Row[];
        if (byKey.weekOf)  loadedWeekOf  = byKey.weekOf  as string;
        if (byKey.history) loadedHistory = byKey.history as HistoryEntry[];
      } else {
        // Supabase returned empty — restore from shadow if available (protects against accidental data deletion)
        const shadow = restoreFromShadow();
        if (shadow) {
          if (shadow.rows)    loadedRows    = shadow.rows;
          if (shadow.weekOf)  loadedWeekOf  = shadow.weekOf;
          if (shadow.history) loadedHistory = shadow.history;
          console.warn("Supabase returned no data — restored from local shadow copy.");
        }
      }

      setRows(loadedRows);
      setWeekOf(loadedWeekOf);
      setHistory(loadedHistory);
      setDataLoading(false);
      setSyncEnabled(true);

      // Write daily snapshot to backup table if not already done today
      if (localStorage.getItem(lastBackupKey) !== new Date().toDateString()) {
        writeSnapshotBackup(loadedRows, loadedWeekOf, loadedHistory);
      }
    };

    load();
  }, [activeUser]);

  // Debounced sync to Supabase on state changes
  const syncTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (dataLoading || !syncEnabled) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const { error } = await supabase.from("app_state").upsert([
        { user_id: activeUser!.userId, key: "rows",    value: rows    },
        { user_id: activeUser!.userId, key: "weekOf",  value: weekOf  },
        { user_id: activeUser!.userId, key: "history", value: history },
      ]);
      if (error) { console.error("Supabase sync error:", error); return; }
      // Update localStorage shadow copy on every successful sync
      localStorage.setItem(`hmi-shadow-${activeUser!.userId}`, JSON.stringify({ rows, weekOf, history }));
    }, 1500);
    return () => clearTimeout(syncTimer.current);
  }, [rows, weekOf, history, dataLoading, syncEnabled]);

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

  const togglePause = (id: string) => {
    setRows(rows.map(row => row.id === id ? { ...row, paused: !row.paused } : row));
  };

  const togglePauseAll = () => {
    const allPaused = rows.every(r => r.paused);
    setRows(rows.map(row => ({ ...row, paused: !allPaused })));
  };

  const endWeek = () => {
    if (!window.confirm("End the week? This will update streaks and reset the board.")) return;

    const updatedRows = rows.map((row) => {
      if (row.paused) {
        return { ...row, cells: new Array(7).fill(0), paused: false };
      }
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

    const archivedData = updatedRows.map((updated, i) => ({ ...updated, cells: rows[i].cells }));
    const newHistory = weekOf
      ? [...history, { weekOf, savedAt: new Date().toISOString(), data: archivedData }]
      : history;

    if (weekOf) setHistory(newHistory);
    setRows(updatedRows);

    // Snapshot before the board resets — preserves the completed week in backup history
    writeSnapshotBackup(updatedRows, weekOf, newHistory);
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

  const switchUser = () => {
    localStorage.removeItem("hmi-user");
    setActiveUser(null);
  };

  // ── Render ────────────────────────────────────────────────
  if (!activeUser) return <LoginScreen onLogin={(username, userId) => setActiveUser({ username, userId })} />;
  if (dataLoading) return <div className="app-loading">Loading…</div>;

  return (
    <div className="app">
      <header className="app-header">
        <h2 className="app-title">HMI Whiteboard</h2>
        <div className="week-selector">
          <span className="week-label">Week of</span>
          <input type="date" value={weekOf} onChange={(e) => setWeekOf(getMondayOf(new Date(e.target.value + "T00:00:00")))} />
        </div>
        <button className="btn-switch-user" onClick={switchUser} title="Switch user">{activeUser.username}</button>
      </header>

      <div className="toolbar">
        <button className="btn-primary" onClick={addTask}>+ Add Task</button>
        <button className="btn-pause" onClick={togglePauseAll}>
          {rows.every(r => r.paused) ? "▶ Resume All" : "⏸ Pause All"}
        </button>
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
        togglePause={togglePause}
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
