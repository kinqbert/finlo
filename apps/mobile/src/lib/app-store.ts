import { create } from 'zustand';

import { demoData } from './demo-data';
import type { FinanceData } from './types';

type AppState = {
  demo: boolean;
  demoData: FinanceData;
  startApiSession(): void;
  startDemoSession(): void;
  endSession(): void;
  updateDemoData(data: FinanceData): void;
};

export const useAppStore = create<AppState>()((set) => ({
  demo: false,
  demoData: structuredClone(demoData),
  startApiSession: () => set({ demo: false }),
  startDemoSession: () => set({ demo: true, demoData: structuredClone(demoData) }),
  endSession: () => set({ demo: false }),
  updateDemoData: (demoData) => set({ demoData }),
}));
