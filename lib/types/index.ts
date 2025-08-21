// Re-export all types for unified travel buddy system
export * from './analytics'

// Experience and availability types
export interface ExperienceAvailabilityRequest {
  searchQuery: string
  location: string
  date: Date
  filters?: {
    priceRange?: { min: number; max: number }
    duration?: { min: number; max: number }
    categories?: string[]
  }
}

export interface Experience {
  id: string
  title: string
  description: string
  price: number
  currency: string
  duration: number
  location: string
  category: string
  rating?: number
  reviews?: number
  images?: string[]
  instantBooking?: boolean
}

// Travel context types
export interface TravelContext {
  userId: string
  currentLocation?: {
    city: string
    airport: string
    coordinates: { lat: number; lng: number }
  }
  layover?: {
    duration: number
    timeRemaining: number
    flightInfo: any
  }
  preferences: {
    interests: string[]
    budget: { min: number; max: number }
    activityLevel: 'low' | 'moderate' | 'high'
    travelStyle: 'solo' | 'couple' | 'family' | 'group'
  }
}