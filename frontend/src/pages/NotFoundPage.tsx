import { Link } from 'react-router-dom'
import { Sprout } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Sprout className="h-8 w-8" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <h1 className="text-xl">We couldn't find that page</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">
        The page may have moved, or the link might be outdated. Let's get you back to familiar ground.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Go to Home
      </Link>
    </div>
  )
}
