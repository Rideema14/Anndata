export interface LandListing {
  id: string
  title: string
  areaAcres: number
  location: string
  price: number
  dealType: 'Sale' | 'Lease'
  sellerName: string
  description: string
  soilType: string
  waterSource: string
}

export const mockLandListings: LandListing[] = [
  {
    id: 'land_1',
    title: 'Irrigated Farmland near Katni',
    areaAcres: 5,
    location: 'Bahoriband, Katni',
    price: 1850000,
    dealType: 'Sale',
    sellerName: 'Ramesh Chaudhary',
    description: 'Well-irrigated black soil farmland with borewell access, close to the main road and Katni Mandi.',
    soilType: 'Black soil',
    waterSource: 'Borewell + canal',
  },
  {
    id: 'land_2',
    title: 'Riverside Agricultural Plot',
    areaAcres: 3.2,
    location: 'Bargi, Jabalpur',
    price: 45000,
    dealType: 'Lease',
    sellerName: 'Sunita Dubey',
    description: 'Fertile riverside plot available for annual lease, ideal for vegetable cultivation.',
    soilType: 'Alluvial soil',
    waterSource: 'River-adjacent',
  },
  {
    id: 'land_3',
    title: 'Highway-Adjacent Farmland',
    areaAcres: 8,
    location: 'Berasia Road, Bhopal',
    price: 3200000,
    dealType: 'Sale',
    sellerName: 'Gurpreet Singh',
    description: 'Large plot with highway frontage, suitable for farming and future commercial use.',
    soilType: 'Loamy soil',
    waterSource: 'Borewell',
  },
  {
    id: 'land_4',
    title: 'Terraced Farmland — Rewa',
    areaAcres: 2.5,
    location: 'Semaria, Rewa',
    price: 38000,
    dealType: 'Lease',
    sellerName: 'Manoj Patel',
    description: 'Gently terraced plot, good for pulses and oilseeds, available for 2–3 year lease.',
    soilType: 'Red soil',
    waterSource: 'Rain-fed',
  },
]

export function getLandById(id: string): LandListing | undefined {
  return mockLandListings.find((l) => l.id === id)
}
