import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { mockMachineryListings, type MachineryListing } from '@/data/mock/mockMachinery'

export interface MachineryBooking {
  id: string
  machineryId: string
  startDate: string
  days: number
  totalPrice: number
  status: 'confirmed' | 'completed'
}

type NewMachineryInput = Omit<MachineryListing, 'id'>

interface MachineryContextValue {
  bookings: MachineryBooking[]
  bookMachinery: (machineryId: string, startDate: string, days: number) => MachineryBooking
  allListings: MachineryListing[]
  sellerListings: MachineryListing[]
  addMachineryListing: (input: NewMachineryInput) => MachineryListing
}

const MachineryContext = createContext<MachineryContextValue | null>(null)

export function MachineryProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<MachineryBooking[]>([])
  const [sellerListings, setSellerListings] = useState<MachineryListing[]>([])

  const allListings = useMemo(() => [...sellerListings, ...mockMachineryListings], [sellerListings])

  const bookMachinery = useCallback(
    (machineryId: string, startDate: string, days: number): MachineryBooking => {
      const machine = allListings.find((m) => m.id === machineryId)
      const booking: MachineryBooking = {
        id: `book_${Date.now()}`,
        machineryId,
        startDate,
        days,
        totalPrice: (machine?.pricePerDay ?? 0) * days,
        status: 'confirmed',
      }
      setBookings((prev) => [booking, ...prev])
      return booking
    },
    [allListings],
  )

  const addMachineryListing = useCallback((input: NewMachineryInput): MachineryListing => {
    const listing: MachineryListing = { ...input, id: `mach_${Date.now()}` }
    setSellerListings((prev) => [listing, ...prev])
    return listing
  }, [])

  const value = useMemo(
    () => ({ bookings, bookMachinery, allListings, sellerListings, addMachineryListing }),
    [bookings, bookMachinery, allListings, sellerListings, addMachineryListing],
  )

  return <MachineryContext.Provider value={value}>{children}</MachineryContext.Provider>
}

export function useMachinery(): MachineryContextValue {
  const ctx = useContext(MachineryContext)
  if (!ctx) throw new Error('useMachinery must be used within a MachineryProvider')
  return ctx
}
