'use client'

import { useToastStore } from '@/lib/hooks/useToast'
import { Toast, ToastContainer } from './toast'

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore()

  return (
    <ToastContainer>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </ToastContainer>
  )
}
