import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/utils/cn'

/**
 * Renders AI advisory/chat replies as formatted markdown instead of a flat
 * paragraph — bullet/numbered lists, **bold** key terms, headings for longer
 * answers, and clickable links, matching the structured way ChatGPT renders
 * replies. The backend's SYSTEM_PROMPT is written to actually produce this
 * markdown; this component is just the renderer.
 *
 * `tone` swaps text/link colors so this reads correctly both on a light
 * bubble (assistant chat bubble) and on a dark/brand-colored one (used
 * nowhere today, but kept for reuse).
 */
export function AiMarkdown({ content, className, tone = 'light' }: { content: string; className?: string; tone?: 'light' | 'dark' }) {
  const linkClass = tone === 'dark' ? 'text-white underline decoration-white/50 hover:decoration-white' : 'text-brand-700 underline decoration-brand-300 hover:decoration-brand-600'
  const strongClass = tone === 'dark' ? 'font-semibold text-white' : 'font-semibold text-ink-900'
  const codeClass = tone === 'dark' ? 'bg-white/15 text-white' : 'bg-ink-100 text-ink-900'

  const components: Components = {
    p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
    ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
    li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className={strongClass}>{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    a: ({ children, href }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn('font-medium', linkClass)}>
        {children}
      </a>
    ),
    h1: ({ children }) => <h3 className="mb-1.5 mt-2 text-base font-bold first:mt-0">{children}</h3>,
    h2: ({ children }) => <h3 className="mb-1.5 mt-2 text-[15px] font-bold first:mt-0">{children}</h3>,
    h3: ({ children }) => <h4 className="mb-1 mt-2 text-sm font-bold first:mt-0">{children}</h4>,
    blockquote: ({ children }) => (
      <blockquote className={cn('mb-2 border-l-2 pl-3 italic last:mb-0', tone === 'dark' ? 'border-white/40' : 'border-brand-300')}>{children}</blockquote>
    ),
    code: ({ children }) => <code className={cn('rounded px-1 py-0.5 text-[13px]', codeClass)}>{children}</code>,
    pre: ({ children }) => <pre className={cn('mb-2 overflow-x-auto rounded-lg p-2.5 text-[13px] last:mb-0', codeClass)}>{children}</pre>,
    hr: () => <hr className={cn('my-2', tone === 'dark' ? 'border-white/20' : 'border-ink-200')} />,
    table: ({ children }) => (
      <div className="mb-2 overflow-x-auto last:mb-0">
        <table className="w-full border-collapse text-left text-[13px]">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className={cn('border-b px-2 py-1 font-semibold', tone === 'dark' ? 'border-white/30' : 'border-ink-200')}>{children}</th>,
    td: ({ children }) => <td className={cn('border-b px-2 py-1', tone === 'dark' ? 'border-white/10' : 'border-ink-100')}>{children}</td>,
  }

  return (
    <div className={cn('text-sm leading-relaxed', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
