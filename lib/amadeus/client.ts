import { z } from "zod"

// Amadeus API configuration
const AMADEUS_BASE_URL = process.env.VITE_AMADEUS_BASE_URL || "https://api.amadeus.com"
const AMADEUS_CLIENT_ID = process.env.VITE_AMADEUS_CLIENT_ID || ""
const AMADEUS_CLIENT_SECRET = process.env.VITE_AMADEUS_CLIENT_SECRET || ""

// Cache for access token
let accessToken: string | null = null
let tokenExpiry: Date | null = null

// Response schemas
export const FlightOfferSchema = z.object({
  id: z.string(),
  source: z.string(),
  instantTicketingRequired: z.boolean().optional(),
  nonHomogeneous: z.boolean().optional(),
  oneWay: z.boolean().optional(),
  lastTicketingDate: z.string().optional(),
  numberOfBookableSeats: z.number().optional(),
  itineraries: z.array(
    z.object({
      duration: z.string(),
      segments: z.array(
        z.object({
          departure: z.object({
            iataCode: z.string(),
            terminal: z.string().optional(),
            at: z.string(),
          }),
          arrival: z.object({
            iataCode: z.string(),
            terminal: z.string().optional(),
            at: z.string(),
          }),
          carrierCode: z.string(),
          number: z.string(),
          aircraft: z
            .object({
              code: z.string(),
            })
            .optional(),
          duration: z.string(),
          id: z.string(),
          numberOfStops: z.number(),
        }),
      ),
    }),
  ),
  price: z.object({
    currency: z.string(),
    total: z.string(),
    base: z.string(),
    fees: z
      .array(
        z.object({
          amount: z.string(),
          type: z.string(),
        }),
      )
      .optional(),
    grandTotal: z.string(),
  }),
  pricingOptions: z.object({
    fareType: z.array(z.string()),
    includedCheckedBagsOnly: z.boolean(),
  }),
})

export type FlightOffer = z.infer<typeof FlightOfferSchema>

export class AmadeusClient {
  private baseUrl: string
  private clientId: string
  private clientSecret: string

  constructor() {
    this.baseUrl = AMADEUS_BASE_URL
    this.clientId = AMADEUS_CLIENT_ID
    this.clientSecret = AMADEUS_CLIENT_SECRET

    if (!this.clientId || !this.clientSecret) {
      console.warn("Amadeus API credentials not configured")
    }
  }

  /**
   * Get access token for Amadeus API
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (accessToken && tokenExpiry && tokenExpiry > new Date()) {
      return accessToken
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/security/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status}`)
      }

      const data = await response.json()
      accessToken = data.access_token
      tokenExpiry = new Date(Date.now() + data.expires_in * 1000)

      return accessToken
    } catch (error) {
      console.error("Error getting Amadeus access token:", error)
      throw error
    }
  }

  /**
   * Make authenticated request to Amadeus API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken()
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Amadeus API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  /**
   * Search for flight offers with layover opportunities
   */
  async searchFlightsWithLayovers(params: {
    origin: string
    destination: string
    departureDate: string
    returnDate?: string
    adults?: number
    maxConnections?: number
    preferredLayoverCities?: string[]
    maxPrice?: number
    currencyCode?: string
  }) {
    const searchParams = new URLSearchParams({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: String(params.adults || 1),
      currencyCode: params.currencyCode || "USD",
      max: "20", // Limit results
    })

    if (params.returnDate) {
      searchParams.append("returnDate", params.returnDate)
    }

    if (params.maxPrice) {
      searchParams.append("maxPrice", String(params.maxPrice))
    }

    try {
      const response = await this.makeRequest<any>(`/v2/shopping/flight-offers?${searchParams}`)

      // Filter for flights with layovers
      if (response.data && params.maxConnections) {
        response.data = response.data.filter((offer: any) => {
          const segments = offer.itineraries[0].segments
          const connections = segments.length - 1
          return connections > 0 && connections <= params.maxConnections
        })
      }

      return response
    } catch (error) {
      console.error("Error searching flights:", error)
      throw error
    }
  }

  /**
   * Get flight inspiration/recommendations
   */
  async getFlightInspiration(params: {
    origin: string
    departureDate?: string
    maxPrice?: number
    duration?: string
  }) {
    const searchParams = new URLSearchParams({
      origin: params.origin,
    })

    if (params.departureDate) {
      searchParams.append("departureDate", params.departureDate)
    }

    if (params.maxPrice) {
      searchParams.append("maxPrice", String(params.maxPrice))
    }

    if (params.duration) {
      searchParams.append("duration", params.duration)
    }

    return this.makeRequest<any>(`/v1/shopping/flight-destinations?${searchParams}`)
  }

  /**
   * Get trending destinations
   */
  async getTrendingDestinations(params: { origin: string; period?: string }) {
    const searchParams = new URLSearchParams({
      originCityCode: params.origin,
      period: params.period || "2024-12",
    })

    return this.makeRequest<any>(`/v1/travel/analytics/air-traffic/traveled?${searchParams}`)
  }

  /**
   * Get flight delay predictions
   */
  async getDelayPrediction(params: {
    origin: string
    destination: string
    departureDate: string
    departureTime: string
    arrivalDate: string
    arrivalTime: string
    carrierCode: string
    flightNumber: string
  }) {
    const searchParams = new URLSearchParams({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      departureTime: params.departureTime,
      arrivalDate: params.arrivalDate,
      arrivalTime: params.arrivalTime,
      aircraftCode: params.carrierCode,
      flightNumber: params.flightNumber,
    })

    return this.makeRequest<any>(`/v1/travel/predictions/flight-delay?${searchParams}`)
  }

  /**
   * Search for hotels near airports (for longer layovers)
   */
  async searchAirportHotels(params: {
    cityCode: string
    checkInDate: string
    checkOutDate: string
    adults?: number
    radius?: number
    radiusUnit?: "KM" | "MILE"
    hotelName?: string
    maxPrice?: number
  }) {
    const searchParams = new URLSearchParams({
      cityCode: params.cityCode,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: String(params.adults || 1),
      radius: String(params.radius || 10),
      radiusUnit: params.radiusUnit || "KM",
    })

    if (params.hotelName) {
      searchParams.append("hotelName", params.hotelName)
    }

    if (params.maxPrice) {
      searchParams.append("priceRange", `0-${params.maxPrice}`)
    }

    return this.makeRequest<any>(`/v2/shopping/hotel-offers?${searchParams}`)
  }

  /**
   * Get points of interest for a location
   */
  async getPointsOfInterest(params: {
    latitude: number
    longitude: number
    radius?: number
    categories?: string[]
  }) {
    const searchParams = new URLSearchParams({
      latitude: String(params.latitude),
      longitude: String(params.longitude),
      radius: String(params.radius || 5),
    })

    if (params.categories && params.categories.length > 0) {
      searchParams.append("categories", params.categories.join(","))
    }

    return this.makeRequest<any>(`/v1/shopping/activities?${searchParams}`)
  }

  /**
   * Get cheapest flight dates
   */
  async getCheapestDates(params: {
    origin: string
    destination: string
    departureDate?: string
    oneWay?: boolean
    duration?: string
    nonStop?: boolean
    maxPrice?: number
    viewBy?: "COUNTRY" | "DATE" | "DESTINATION" | "DURATION" | "WEEK"
  }) {
    const searchParams = new URLSearchParams({
      origin: params.origin,
      destination: params.destination,
      oneWay: String(params.oneWay || false),
      nonStop: String(params.nonStop || false),
      viewBy: params.viewBy || "DATE",
    })

    if (params.departureDate) {
      searchParams.append("departureDate", params.departureDate)
    }

    if (params.duration) {
      searchParams.append("duration", params.duration)
    }

    if (params.maxPrice) {
      searchParams.append("maxPrice", String(params.maxPrice))
    }

    return this.makeRequest<any>(`/v1/shopping/flight-dates?${searchParams}`)
  }

  /**
   * Get airport information
   */
  async getAirportInfo(airportCode: string) {
    return this.makeRequest<any>(`/v1/reference-data/locations/${airportCode}`)
  }

  /**
   * Search nearby airports
   */
  async searchNearbyAirports(params: { latitude: number; longitude: number; radius?: number }) {
    const searchParams = new URLSearchParams({
      latitude: String(params.latitude),
      longitude: String(params.longitude),
      radius: String(params.radius || 500),
    })

    return this.makeRequest<any>(`/v1/reference-data/locations/airports?${searchParams}`)
  }
}

// Singleton instance
let amadeusClient: AmadeusClient | null = null

export function getAmadeusClient(): AmadeusClient {
  if (!amadeusClient) {
    amadeusClient = new AmadeusClient()
  }
  return amadeusClient
}
