import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastOptions {
  title?: string
  type?: ToastType
  /** How long it stays up, in ms, before auto-dismissing. */
  duration?: number
}

interface ToastItem extends Required<Pick<ToastOptions, 'type' | 'duration'>> {
  id: number
  message: string
  title?: string
  /** Set just before removal so the exit animation can play out. */
  leaving: boolean
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const STYLES: Record<ToastType, string> = {
  success: 'border-brand-200 bg-white text-ink-900 [&_svg]:text-brand-600',
  error: 'border-danger-200 bg-white text-ink-900 [&_svg]:text-danger-500',
  info: 'border-ink-200 bg-white text-ink-900 [&_svg]:text-ink-500',
}

const EXIT_ANIMATION_MS = 200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    // Flip to "leaving" first so the exit transition can play, then actually
    // remove it from the list once the transition has had time to finish.
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, EXIT_ANIMATION_MS)
  }, [])

  const showToast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = nextId.current++
      const toast: ToastItem = {
        id,
        message,
        title: options?.title,
        type: options?.type ?? 'success',
        duration: options?.duration ?? 2600,
        leaving: false,
      }
      setToasts((prev) => [...prev, toast])
      window.setTimeout(() => dismiss(id), toast.duration)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:top-6"
          aria-live="polite"
          aria-atomic="true"
        >
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type]
            return (
              <div
                key={toast.id}
                role="status"
                className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-lg shadow-black/10 backdrop-blur-sm transition-all duration-200 ease-out ${
                  STYLES[toast.type]
                } ${
                  toast.leaving
                    ? 'translate-x-4 opacity-0'
                    : 'animate-in translate-x-0 opacity-100'
                }`}
                style={{
                  animation: toast.leaving ? undefined : 'toast-slide-in 0.25s ease-out',
                }}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  {toast.title && <p className="text-sm font-semibold leading-tight">{toast.title}</p>}
                  <p className="text-xs leading-snug text-ink-500">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="shrink-0 rounded-full p-0.5 text-ink-300 transition-colors hover:bg-ink-50 hover:text-ink-500"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(1rem); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}