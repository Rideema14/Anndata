import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

export function StepperHeader({ steps, currentIndex }: { steps: string[]; currentIndex: number }) {
  return (
    <ol className="mb-6 flex items-center">
      {steps.map((step, index) => (
        <li key={step} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                index < currentIndex && 'bg-brand-600 text-white',
                index === currentIndex && 'bg-brand-600 text-white ring-4 ring-brand-100',
                index > currentIndex && 'bg-surface-sunk text-ink-400',
              )}
            >
              {index < currentIndex ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
            </span>
            <span className={cn('hidden text-[11px] font-medium sm:block', index <= currentIndex ? 'text-ink-800' : 'text-ink-400')}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <span className={cn('mx-1.5 h-0.5 flex-1 rounded', index < currentIndex ? 'bg-brand-600' : 'bg-surface-sunk')} />
          )}
        </li>
      ))}
    </ol>
  )
}
