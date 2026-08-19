export interface SellerFeedback {
  id: string
  giverName: string
  productName: string
  category: string
  rating: number
  comment: string
  date: string
}

export const mockSellerFeedback: SellerFeedback[] = [
  { id: 'fb_1', giverName: 'Sunita Verma', productName: 'Soybean Seeds — JS-9560', category: 'Seeds', rating: 5, comment: 'Excellent germination and clean packaging. Very happy with the quality.', date: '2026-08-17T09:20:00.000Z' },
  { id: 'fb_2', giverName: 'Gurpreet Singh', productName: 'Wheat Seeds — HD-3086', category: 'Seeds', rating: 4, comment: 'Seeds were good and delivered on time.', date: '2026-08-16T14:05:00.000Z' },
  { id: 'fb_3', giverName: 'Manoj Patel', productName: 'Vermicompost — Organic Manure', category: 'Fertilizers', rating: 2, comment: 'The bags arrived late and one bag was slightly torn.', date: '2026-08-13T08:30:00.000Z' },
  { id: 'fb_4', giverName: 'Rekha Yadav', productName: 'Soybean Seeds — JS-9560', category: 'Seeds', rating: 5, comment: 'Good quality seeds. My field has shown even growth so far.', date: '2026-08-11T11:45:00.000Z' },
  { id: 'fb_5', giverName: 'Ajay Choudhary', productName: 'Power Tiller Rental Listing', category: 'Machinery', rating: 3, comment: 'The machine worked, but pickup took longer than expected.', date: '2026-08-08T16:10:00.000Z' },
  { id: 'fb_6', giverName: 'Kavita Sharma', productName: 'Wheat Seeds — HD-3086', category: 'Seeds', rating: 1, comment: 'Poor communication about the delivery date.', date: '2026-08-04T10:00:00.000Z' },
]
