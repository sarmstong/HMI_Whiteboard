export type Row = {
  id: string;
  task: string;
  goal: number;
  streak: number;
  cells: number[];
  editingField?: "goal" | "streak" | "task";
  tempValue?: string | number;
};

export type HistoryEntry = {
  weekOf: string;
  savedAt: string; // ISO timestamp of when you hit "Save"
  data: Row[];
};