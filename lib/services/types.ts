export interface LayoverCity {
  code: string
  name: string
  country: string
  image?: string
  minExploreTime: number
  rating: number
  visaFree: boolean
  safetyRating: number
  duration?: number
  experiences: LayoverExperience[]
  transport: {
    toCity: string
    duration: number
    cost: number
    frequency: string
    options: string[]
  }
}

export interface LayoverExperience {
  id: string
  title: string
  description: string
  duration: number
  price: number
  category: "culture" | "adventure" | "shopping" | "dining"
  rating: number
  image?: string
}

export interface LayoverScore {
  duration: number
  amenities: number
  safety: number
  cost: number
  visa: number
  experience: number
  weather: number
}

export interface AirportAmenities {
  lounges: string[]
  restaurants: number
  shops: number
  wifi: boolean
  sleepingAreas: boolean
  showers: boolean
  rating: number
}

export interface FlightOffer {
  id: string
  source: string
  price: {
    total: number
    currency: string
    base?: number
    taxes?: number
  }
  itinerary: {
    outbound: any[]
    inbound?: any[]
  }
  layovers?: any[]
  airline?: string
  duration?: number
}

export interface FlightResult extends FlightOffer {
  layoverInfo?: {
    cities: LayoverCity[]
    longestLayover?: number
    optimalForExploration?: boolean
  }
  layoverScore?: number
}

export interface HotelOption {
  name: string
  rating: number
  price: number
  distance: string
  amenities: string[]
}

export interface SafetyRating {
  overall: number
  details: string
}

export interface WeatherInfo {
  temperature: number
  condition: string
  humidity: number
}

export interface Lounge {
  name: string
  terminal: string
  amenities: string[]
  accessRequirements: string
}

export interface Restaurant {
  name: string
  cuisine: string
  rating: number
  priceLevel: string
}

export interface LayoverRecommendation {
  city: string
  duration: number
  activities: LayoverExperience[]
}

export interface FlightSegment {
  departure: {
    airport: string
    time: string
  }
  arrival: {
    airport: string
    time: string
  }
  duration: number
  airline: string
  flightNumber: string
}

export interface DelayPrediction {
  probability: number
  averageDelay: number
  factors: string[]
}
