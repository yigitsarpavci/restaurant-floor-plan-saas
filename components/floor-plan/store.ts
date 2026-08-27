import { create } from 'zustand';

export type TableShapeType = 'RECTANGLE' | 'CIRCLE' | 'SQUARE' | 'BOOTH';

export interface TableItem {
  id: string; // Temporary UUID for new, or real UUID from DB
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  shape: TableShapeType;
}

interface FloorPlanState {
  tables: TableItem[];
  selectedTableId: string | null;
  addTable: (table: Omit<TableItem, 'id'>) => void;
  updateTable: (id: string, updates: Partial<TableItem>) => void;
  removeTable: (id: string) => void;
  setSelectedTable: (id: string | null) => void;
  setTables: (tables: TableItem[]) => void;
}

export const useFloorPlanStore = create<FloorPlanState>((set) => ({
  tables: [],
  selectedTableId: null,
  addTable: (table) =>
    set((state) => ({
      tables: [...state.tables, { ...table, id: crypto.randomUUID() }],
    })),
  updateTable: (id, updates) =>
    set((state) => ({
      tables: state.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTable: (id) =>
    set((state) => ({
      tables: state.tables.filter((t) => t.id !== id),
      selectedTableId: state.selectedTableId === id ? null : state.selectedTableId,
    })),
  setSelectedTable: (id) => set({ selectedTableId: id }),
  setTables: (tables) => set({ tables }),
}));
