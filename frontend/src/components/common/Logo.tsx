import { cn } from '@/utils/cn'
import { Sprout } from 'lucide-react'
interface LogoProps {
  className?: string
  showWordmark?: boolean
}

export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
       <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-950 border border-white/30 group-hover:border-emerald-400 group-hover:bg-emerald-500/20 transition-all duration-300">
              <Sprout className="h-5 w-5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              </span>
            </div>
      {showWordmark && (
        <span className="font-display text-lg font-extrabold tracking-tight text-ink-900">Anndataa</span>
      )}
    </span>
  )
}
