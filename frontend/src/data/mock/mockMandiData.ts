export interface MandiRecord {
  state: string
  district: string
  mandi: string
  crop: string
  price: number
  minPrice: number
  maxPrice: number
  updatedAt: string
}

const crops = ['Wheat', 'Soybean', 'Gram', 'Mustard', 'Rice', 'Maize']

const locations = [
  { state: 'Madhya Pradesh', district: 'Katni', mandi: 'Katni Mandi' },
  { state: 'Madhya Pradesh', district: 'Jabalpur', mandi: 'Jabalpur Mandi' },
  { state: 'Madhya Pradesh', district: 'Bhopal', mandi: 'Bhopal Mandi' },
  { state: 'Madhya Pradesh', district: 'Indore', mandi: 'Indore Mandi' },
  { state: 'Madhya Pradesh', district: 'Rewa', mandi: 'Rewa Mandi' },
  { state: 'Madhya Pradesh', district: 'Seoni', mandi: 'Seoni Mandi' },
  { state: 'Rajasthan', district: 'Kota', mandi: 'Kota Krishi Mandi' },
  { state: 'Rajasthan', district: 'Jaipur', mandi: 'Jaipur Mandi' },
]

const basePrices: Record<string, number> = {
  Wheat: 2340,
  Soybean: 4620,
  Gram: 5480,
  Mustard: 5920,
  Rice: 3150,
  Maize: 2080,
}

// Deterministic pseudo-random offset so the same (mandi, crop) pair always
// renders the same mock price across the app — no visual "flicker" between
// pages, without needing a shared price store for a static demo dataset.
function seededOffset(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 997
  return (hash % 200) - 100
}

export const mockMandiRecords: MandiRecord[] = locations.flatMap((loc) =>
  crops.map((crop) => {
    const base = basePrices[crop] + seededOffset(loc.mandi + crop)
    return {
      ...loc,
      crop,
      price: base,
      minPrice: Math.round(base * 0.94),
      maxPrice: Math.round(base * 1.05),
      updatedAt: '2026-08-17T06:00:00.000Z',
    }
  }),
)

export const mandiStates = [...new Set(mockMandiRecords.map((r) => r.state))]

export function mandiDistrictsForState(state: string): string[] {
  return [...new Set(mockMandiRecords.filter((r) => r.state === state).map((r) => r.district))]
}

export function mandisForDistrict(district: string): string[] {
  return [...new Set(mockMandiRecords.filter((r) => r.district === district).map((r) => r.mandi))]
}

export const mandiCrops = crops

export function generatePriceHistory(crop: string, mandi: string, days: number): { date: string; price: number }[] {
  const base = basePrices[crop] + seededOffset(mandi + crop)
  const points: { date: string; price: number }[] = []
  let price = base
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    // deterministic small daily drift based on date + crop
    const drift = Math.sin((date.getDate() + crop.length) * 0.7) * (base * 0.015)
    price = Math.round(base + drift + seededOffset(mandi + crop + date.getDate()) * 0.3)
    points.push({ date: date.toISOString(), price })
  }
  return points
}
