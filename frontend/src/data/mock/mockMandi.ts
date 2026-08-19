export interface MandiPriceSnapshot {
  crop: string
  mandi: string
  pricePerQuintal: number
  changePercent: number
  updatedLabel: string
}

export const mockMandiSnapshot: MandiPriceSnapshot[] = [
  { crop: 'Wheat', mandi: 'Katni Mandi', pricePerQuintal: 2340, changePercent: 1.8, updatedLabel: 'Today, 6:00 AM' },
  { crop: 'Soybean', mandi: 'Katni Mandi', pricePerQuintal: 4620, changePercent: -0.6, updatedLabel: 'Today, 6:00 AM' },
  { crop: 'Gram', mandi: 'Jabalpur Mandi', pricePerQuintal: 5480, changePercent: 2.4, updatedLabel: 'Today, 6:00 AM' },
  { crop: 'Mustard', mandi: 'Bhopal Mandi', pricePerQuintal: 5920, changePercent: 0.3, updatedLabel: 'Today, 6:00 AM' },
]
