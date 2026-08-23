import { create } from 'zustand'
import { demoData } from '@/constants/demoData'
import type { FinanceData } from '@/types'

export type SessionMode = 'guest' | 'api' | 'demo'

type AppState = {
  sessionMode: SessionMode
  demoData: FinanceData
  dataError: string
  startApiSession: () => void
  startDemoSession: () => void
  endSession: () => void
  updateDemoData: (data: FinanceData) => void
  setDataError: (message: string) => void
}

export const useAppStore = create<AppState>()((set) => ({
  sessionMode: 'api',
  demoData: structuredClone(demoData),
  dataError: '',
  startApiSession: () => set({ sessionMode: 'api', dataError: '' }),
  startDemoSession: () => set({ sessionMode: 'demo', demoData: structuredClone(demoData), dataError: '' }),
  endSession: () => set({ sessionMode: 'guest', dataError: '' }),
  updateDemoData: (data) => set({ demoData: data }),
  setDataError: (dataError) => set({ dataError }),
}))
