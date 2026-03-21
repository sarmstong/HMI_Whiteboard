import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine,
  Cell, ResponsiveContainer, Legend
} from "recharts";
import type { HistoryEntry, Row } from "./types.ts";

type Props = { history: HistoryEntry[]; rows: Row[] };

export default function HistoryCharts({ history, rows }: Props) {
  if (history.length === 0) return null;

  // Use current live tasks as the source of truth for which tasks to show
  const taskNames = rows.map((r) => r.task);

  return (
    <div>
      {taskNames.map((taskName) => {
        const series = history
          .map((entry) => {
            const row = entry.data.find((r) => r.task === taskName);
            if (!row) return null;
            return {
              weekOf: entry.weekOf,
              streak: row.streak,
              completed: row.cells.filter((c) => c === 1).length,
              goal: row.goal,
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)
          .sort((a, b) => a.weekOf.localeCompare(b.weekOf));

        if (series.length === 0) return null;

        return (
          <div key={taskName} style={{ marginBottom: 48 }}>
            <h3 style={{ marginBottom: 8 }}>{taskName}</h3>

            <p style={{ fontWeight: "bold", marginBottom: 4 }}>Streak</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={series}>
                <XAxis dataKey="weekOf" />
                <YAxis />
                <Tooltip />
                <ReferenceLine y={0} stroke="#666" />
                <Bar dataKey="streak" name="Streak">
                  {series.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.streak < 0 ? "#ff4444" : "#4CAF50"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <p style={{ fontWeight: "bold", marginBottom: 4, marginTop: 16 }}>
              Completion vs Goal
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={series}>
                <XAxis dataKey="weekOf" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="goal" name="Goal" fill="#ddd" />
                <Bar dataKey="completed" name="Completed">
                  {series.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.completed >= entry.goal ? "#4CAF50" : "#64B5F6"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
