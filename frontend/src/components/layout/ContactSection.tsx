import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2 } from 'lucide-react'

/** Fades + slides an element up into view the first time it enters the viewport. */
function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

const contactDetails = [
  { icon: Mail, label: 'Email Us', value: 'hello@farmverse.in' },
  { icon: Phone, label: 'Call Us', value: '+91 98765 43210' },
  { icon: MapPin, label: 'Visit Us', value: 'Bhopal, Madhya Pradesh, India' },
]

export function ContactSection() {
  const heading = useRevealOnScroll<HTMLDivElement>()
  const info = useRevealOnScroll<HTMLDivElement>()
  const form = useRevealOnScroll<HTMLDivElement>()

  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent'>('idle')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status !== 'idle') return
    setStatus('submitting')
    // No backend endpoint exists for this yet — this simulates the send so
    // the interaction feels real. Wire this up to a real API when one exists.
    window.setTimeout(() => setStatus('sent'), 900)
  }

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#161f0f] py-24 text-[#f8f4e9] font-['Plus_Jakarta_Sans',sans-serif] sm:py-32"
    >
      {/* Soft ambient glow, same accent palette as the rest of the page */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#d6b841]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#5c744d]/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* HEADER — matches the Hero / Services sticker+script pattern */}
        <div
          ref={heading.ref}
          className={`mx-auto mb-16 max-w-3xl space-y-4 text-center transition-all duration-700 ease-out sm:mb-20 ${
            heading.visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="flex flex-wrap items-center justify-center gap-3 leading-none select-none sm:gap-5">
            <h2 className="brand-sticker-green py-1 text-4xl leading-[1.1] sm:text-6xl sm:leading-none md:text-7xl lg:text-8xl">
              Get in
            </h2>
            <span className="brand-script-yellow -ml-2 -rotate-6 transform text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
              touch with
            </span>
            <h2 className="brand-sticker-green text-4xl leading-[1.1] sm:text-6xl sm:leading-none md:text-7xl lg:text-8xl">
              Us.
            </h2>
          </div>
          <p className="mx-auto max-w-xl text-sm font-light leading-relaxed text-[#d5d9d0] sm:text-base md:text-lg">
            Questions about renting machinery, leasing land, or mandi prices in your area?
            Our team replies within one business day.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
          {/* CONTACT INFO CARDS */}
          <div
            ref={info.ref}
            className={`space-y-4 lg:col-span-2 transition-all duration-700 ease-out ${
              info.visible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
            }`}
          >
            {contactDetails.map(({ icon: Icon, label, value }, i) => (
              <div
                key={label}
                className="group flex items-start gap-4 rounded-2xl border border-[#394a2d] bg-[#1c2a13]/60 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#d6b841]/50 hover:bg-[#1c2a13] hover:shadow-xl hover:shadow-black/30"
                style={{ transitionDelay: info.visible ? `${i * 100}ms` : '0ms' }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#27351d] text-[#d6b841] transition-colors duration-300 group-hover:bg-[#d6b841] group-hover:text-[#1c2a13]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="pt-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#7d806f]">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#f8f4e9] sm:text-base">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CONTACT FORM */}
          <div
            ref={form.ref}
            className={`lg:col-span-3 transition-all duration-700 ease-out ${
              form.visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
            }`}
          >
            <form
              onSubmit={handleSubmit}
              className="relative overflow-hidden rounded-3xl border border-[#394a2d] bg-[#1c2a13]/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-8"
            >
              {/* SUCCESS OVERLAY */}
              <div
                className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#1c2a13] transition-all duration-500 ${
                  status === 'sent' ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#d6b841]/15 transition-transform duration-500 ${
                    status === 'sent' ? 'scale-100' : 'scale-50'
                  }`}
                >
                  <CheckCircle2 className="h-8 w-8 text-[#d6b841]" />
                </span>
                <p className="text-sm font-semibold text-[#f8f4e9]">Message sent — thank you!</p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="text-xs font-bold uppercase tracking-wider text-[#d6b841] underline-offset-4 hover:underline"
                >
                  Send another message
                </button>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="group sm:col-span-1">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-[#7d806f] transition-colors group-focus-within:text-[#d6b841]">
                    Your Name
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="Ramesh Kumar"
                    className="w-full rounded-xl border border-[#394a2d] bg-[#161f0f] px-4 py-3 text-sm text-[#f8f4e9] placeholder:text-[#5c6153] transition-all duration-300 outline-none focus:border-[#d6b841] focus:ring-2 focus:ring-[#d6b841]/20"
                  />
                </label>

                <label className="group sm:col-span-1">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-[#7d806f] transition-colors group-focus-within:text-[#d6b841]">
                    Phone or Email
                  </span>
                  <input
                    required
                    type="text"
                    placeholder="98765 43210"
                    className="w-full rounded-xl border border-[#394a2d] bg-[#161f0f] px-4 py-3 text-sm text-[#f8f4e9] placeholder:text-[#5c6153] transition-all duration-300 outline-none focus:border-[#d6b841] focus:ring-2 focus:ring-[#d6b841]/20"
                  />
                </label>

                <label className="group sm:col-span-2">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-[#7d806f] transition-colors group-focus-within:text-[#d6b841]">
                    Message
                  </span>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what you're looking for — machinery, land, or mandi prices..."
                    className="w-full resize-none rounded-xl border border-[#394a2d] bg-[#161f0f] px-4 py-3 text-sm text-[#f8f4e9] placeholder:text-[#5c6153] transition-all duration-300 outline-none focus:border-[#d6b841] focus:ring-2 focus:ring-[#d6b841]/20"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d6b841] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-[#262c1d] shadow-xl transition-all duration-300 hover:bg-[#e0c64d] active:scale-[0.98] disabled:opacity-70 sm:text-sm"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}