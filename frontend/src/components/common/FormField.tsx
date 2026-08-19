import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface FieldShellProps {
  label: string
  htmlFor: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}

function FieldShell({ label, htmlFor, hint, error, required, children }: FieldShellProps) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
        {required && <span className="ml-0.5 text-danger-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-danger-500">{error}</p>}
    </div>
  )
}

const inputBase =
  'h-11 w-full rounded-xl border border-ink-200 bg-surface px-3.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 disabled:bg-surface-sunk'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> &
  Omit<FieldShellProps, 'children' | 'htmlFor'> & { id: string }

export function TextField({ label, hint, error, required, id, className, ...rest }: TextFieldProps) {
  return (
    <FieldShell label={label} htmlFor={id} hint={hint} error={error} required={required}>
      <input id={id} className={cn(inputBase, error && 'border-danger-400', className)} {...rest} />
    </FieldShell>
  )
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> &
  Omit<FieldShellProps, 'children' | 'htmlFor'> & { id: string }

export function TextAreaField({ label, hint, error, required, id, className, ...rest }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} htmlFor={id} hint={hint} error={error} required={required}>
      <textarea id={id} className={cn(inputBase, 'h-auto min-h-24 py-2.5', error && 'border-danger-400', className)} {...rest} />
    </FieldShell>
  )
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> &
  Omit<FieldShellProps, 'children' | 'htmlFor'> & { id: string }

export function SelectField({ label, hint, error, required, id, className, children, ...rest }: SelectFieldProps) {
  return (
    <FieldShell label={label} htmlFor={id} hint={hint} error={error} required={required}>
      <select id={id} className={cn(inputBase, 'appearance-none', error && 'border-danger-400', className)} {...rest}>
        {children}
      </select>
    </FieldShell>
  )
}
