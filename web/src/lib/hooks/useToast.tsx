'use client'

import { create } from 'zustand'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export function useToast() {
  const { addToast } = useToastStore()

  return {
    toast: (options: Omit<Toast, 'id'>) => addToast(options),
    success: (description: string, title = '성공') =>
      addToast({ title, description, variant: 'success' }),
    error: (description: string, title = '오류') =>
      addToast({ title, description, variant: 'error' }),
    warning: (description: string, title = '경고') =>
      addToast({ title, description, variant: 'warning' }),
  }
}
