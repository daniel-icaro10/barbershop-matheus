import { create } from "zustand"
import type { BarbershopItem } from "@/generated/prisma/client"

export interface PersonalData {
  name: string
  phone: string
  notes: string
}

// 0=Serviço, 1=Horário, 2=Dados, 3=Acesso, 4=Confirmação
export type Step = 0 | 1 | 2 | 3 | 4

interface BookingStore {
  step: Step
  service: BarbershopItem | null
  date: Date | null
  time: string | null
  personalData: PersonalData | null
  bookingId: string | null

  setStep: (step: Step) => void
  setService: (service: BarbershopItem) => void
  setDate: (date: Date | null) => void
  setTime: (time: string | null) => void
  setPersonalData: (data: PersonalData) => void
  setBookingId: (id: string) => void
  next: () => void
  back: () => void
  reset: () => void
}

export const useBookingStore = create<BookingStore>()((set) => ({
  step: 0,
  service: null,
  date: null,
  time: null,
  personalData: null,
  bookingId: null,

  setStep: (step) => set({ step }),
  setService: (service) => set({ service }),
  setDate: (date) => set({ date }),
  setTime: (time) => set({ time }),
  setPersonalData: (personalData) => set({ personalData }),
  setBookingId: (bookingId) => set({ bookingId }),
  next: () => set((s) => ({ step: Math.min(4, s.step + 1) as Step })),
  back: () => set((s) => ({ step: Math.max(0, s.step - 1) as Step })),
  reset: () =>
    set({
      step: 0,
      service: null,
      date: null,
      time: null,
      personalData: null,
      bookingId: null,
    }),
}))
