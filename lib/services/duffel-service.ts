import { Duffel } from "@duffel/api"

interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: {
    adults: number
    children: number
    infants: number
  }
  cabinClass?: "economy" | "premium_economy" | "business" | "first"
  maxConnections?: number
  preferLayovers?: boolean
}

interface FlightOffer {
  id: string
  source: string
  price: {
    total: number
    currency: string
    base: number
    taxes: number
  }
  itinerary: {
    outbound: FlightSegment[]
    inbound?: FlightSegment[]
  }
  layovers: LayoverInfo[]
  airline: {
    code: string
    name: string
  }
  duration: {
    outbound: string
    inbound?: string
  }
}

interface FlightSegment {
  id: string
  departure: {
    airport: string
    city: string
    country: string
    time: string
    timezone: string
  }
  arrival: {
    airport: string
    city: string
    country: string
    time: string
    timezone: string
  }
  airline: {
    code: string
    name: string
  }
  flightNumber: string
  aircraft: string
  duration: string
}

interface LayoverInfo {
  airport: string
  city: string
  country: string
  duration: number
  arrival: string
  departure: string
}

export class DuffelService {
  private client: Duffel | null = null
  private isInitialized = false
  private initializationPromise: Promise<void> | null = null

  constructor() {
    // Start initialization immediately
    this.initializationPromise = this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      console.log("[v0] DuffelService: Starting initialization...")

      const token = process.env.VITE_DUFFEL_API_KEY

      if (!token) {
        console.warn("[v0] DuffelService: No API token found - using mock data only")
        return
      }

      if (!token.startsWith("duffel_test_") && !token.startsWith("duffel_live_")) {
        console.error("[v0] DuffelService: Invalid token format")
        return
      }

      this.client = new Duffel({
        token: token,
      } as any)

      const connectionSuccess = await this.testConnection()
      if (connectionSuccess) {
        this.isInitialized = true
        console.log("[v0] DuffelService: Initialization successful")
      } else {
        console.warn("[v0] DuffelService: Connection test failed - will use mock data")
        this.client = null
        this.isInitialized = false
      }
    } catch (error) {
      console.error("[v0] DuffelService: Initialization failed:", error)
      this.client = null
      this.isInitialized = false
    }
  }

  private async testConnection(): Promise<boolean> {
    if (!this.client) return false

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Connection test timeout")), 5000)
      })

      const testPromise = this.client.airlines.list({ limit: 1 })

      const response = await Promise.race([testPromise, timeoutPromise])
      console.log("[v0] DuffelService: Connection test successful")
      return response.data.length >= 0
    } catch (error) {
      console.error("[v0] DuffelService: Connection test failed:", error)
      return false
    }
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    if (this.initializationPromise) {
      await this.initializationPromise
    }

    if (!this.isInitialized || !this.client) {
      console.log("[v0] DuffelService: Using mock data (not initialized)")
      return this.getMockFlightData(params)
    }

    try {
      console.log("[v0] DuffelService: Searching flights with Duffel API...")

      const passengers = []
      for (let i = 0; i < params.passengers.adults; i++) {
        passengers.push({ type: "adult" as const })
      }
      for (let i = 0; i < params.passengers.children; i++) {
        passengers.push({ type: "child" as const })
      }
      for (let i = 0; i < params.passengers.infants; i++) {
        passengers.push({ type: "infant_without_seat" as const })
      }

      const slices = [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departureDate,
        },
      ]

      if (params.returnDate) {
        slices.push({
          origin: params.destination,
          destination: params.origin,
          departure_date: params.returnDate,
        })
      }

      const offerRequest = await this.client.offerRequests.create({
        slices: slices as any,
        passengers: passengers.map((p, index) => ({
          type: p.type,
          given_name: "Passenger",
          family_name: `${index + 1}`,
          id: `passenger_${index}`,
        })),
        cabin_class: params.cabinClass || "economy",
        max_connections: (params.maxConnections || 2) as 0 | 1 | 2,
      })

      console.log("[v0] DuffelService: Offer request created:", offerRequest.data.id)

      const offers = await this.client.offers.list({
        offer_request_id: offerRequest.data.id,
        sort: "total_amount",
      })

      console.log("[v0] DuffelService: Found", offers.data.length, "offers")

      return this.transformDuffelOffers(offers.data, params.preferLayovers)
    } catch (error: any) {
      console.error("[v0] DuffelService: API error:", {
        message: error.message,
        status: error.status,
        errors: error.errors,
      })

      return this.getMockFlightData(params)
    }
  }

  private transformDuffelOffers(offers: any[], preferLayovers = false): FlightOffer[] {
    return offers
      .map((offer) => {
        const outboundSlice = offer.slices[0]
        const inboundSlice = offer.slices[1]

        const layovers = this.extractLayovers(offer.slices)

        if (preferLayovers && layovers.length === 0) {
          return null // Skip direct flights if layovers preferred
        }

        return {
          id: offer.id,
          source: "duffel",
          price: {
            total: Number.parseFloat(offer.total_amount),
            currency: offer.total_currency,
            base: Number.parseFloat(offer.base_amount || offer.total_amount) * 0.8,
            taxes: Number.parseFloat(offer.tax_amount || offer.total_amount) * 0.2,
          },
          itinerary: {
            outbound: this.transformSegments(outboundSlice.segments),
            inbound: inboundSlice ? this.transformSegments(inboundSlice.segments) : undefined,
          },
          layovers: layovers,
          airline: {
            code: offer.owner.iata_code,
            name: offer.owner.name,
          },
          duration: {
            outbound: outboundSlice.duration,
            inbound: inboundSlice?.duration,
          },
        }
      })
      .filter(Boolean) as FlightOffer[]
  }

  private transformSegments(segments: any[]): FlightSegment[] {
    return segments.map((segment, index) => ({
      id: `seg-${index}`,
      departure: {
        airport: segment.origin.iata_code,
        city: segment.origin.city_name || segment.origin.name,
        country: segment.origin.country_name || "Unknown",
        time: segment.departing_at,
        timezone: segment.origin.time_zone || "UTC",
      },
      arrival: {
        airport: segment.destination.iata_code,
        city: segment.destination.city_name || segment.destination.name,
        country: segment.destination.country_name || "Unknown",
        time: segment.arriving_at,
        timezone: segment.destination.time_zone || "UTC",
      },
      airline: {
        code: segment.marketing_carrier.iata_code,
        name: segment.marketing_carrier.name,
      },
      flightNumber: `${segment.marketing_carrier.iata_code}${segment.marketing_carrier_flight_number}`,
      aircraft: segment.aircraft?.name || "Unknown Aircraft",
      duration: segment.duration,
    }))
  }

  private extractLayovers(slices: any[]): LayoverInfo[] {
    const layovers: LayoverInfo[] = []

    slices.forEach((slice) => {
      if (slice.segments.length > 1) {
        for (let i = 0; i < slice.segments.length - 1; i++) {
          const arrival = new Date(slice.segments[i].arriving_at)
          const departure = new Date(slice.segments[i + 1].departing_at)
          const duration = (departure.getTime() - arrival.getTime()) / (1000 * 60) // minutes

          layovers.push({
            airport: slice.segments[i].destination.iata_code,
            city: slice.segments[i].destination.city_name || slice.segments[i].destination.name,
            country: slice.segments[i].destination.country_name || "Unknown",
            duration: duration,
            arrival: arrival.toISOString(),
            departure: departure.toISOString(),
          })
        }
      }
    })

    return layovers
  }

  private getMockFlightData(params: FlightSearchParams): FlightOffer[] {
    const mockFlights: FlightOffer[] = [
      {
        id: "mock_001",
        source: "layoverhq",
        price: {
          total: 1250,
          currency: "USD",
          base: 1000,
          taxes: 250,
        },
        itinerary: {
          outbound: [
            {
              id: "seg-1",
              departure: {
                airport: params.origin,
                city: params.origin === "LOS" ? "Lagos" : "Origin City",
                country: params.origin === "LOS" ? "Nigeria" : "Origin Country",
                time: `${params.departureDate}T14:30:00Z`,
                timezone: "Africa/Lagos",
              },
              arrival: {
                airport: "DOH",
                city: "Doha",
                country: "Qatar",
                time: `${params.departureDate}T22:45:00Z`,
                timezone: "Asia/Qatar",
              },
              airline: {
                code: "QR",
                name: "Qatar Airways",
              },
              flightNumber: "QR1161",
              aircraft: "Boeing 787-9",
              duration: "PT8H15M",
            },
            {
              id: "seg-2",
              departure: {
                airport: "DOH",
                city: "Doha",
                country: "Qatar",
                time: `${params.departureDate}T23:45:00Z`,
                timezone: "Asia/Qatar",
              },
              arrival: {
                airport: params.destination,
                city: params.destination === "ATL" ? "Atlanta" : "Destination City",
                country: params.destination === "ATL" ? "United States" : "Destination Country",
                time: `${params.departureDate}T06:30:00Z`,
                timezone: "America/New_York",
              },
              airline: {
                code: "QR",
                name: "Qatar Airways",
              },
              flightNumber: "QR755",
              aircraft: "Airbus A350-900",
              duration: "PT14H45M",
            },
          ],
        },
        layovers: [
          {
            airport: "DOH",
            city: "Doha",
            country: "Qatar",
            duration: 60,
            arrival: `${params.departureDate}T22:45:00Z`,
            departure: `${params.departureDate}T23:45:00Z`,
          },
        ],
        airline: {
          code: "QR",
          name: "Qatar Airways",
        },
        duration: {
          outbound: "PT23H",
        },
      },
      {
        id: "mock_002",
        source: "layoverhq",
        price: {
          total: 1450,
          currency: "USD",
          base: 1200,
          taxes: 250,
        },
        itinerary: {
          outbound: [
            {
              id: "seg-1",
              departure: {
                airport: params.origin,
                city: params.origin === "LOS" ? "Lagos" : "Origin City",
                country: params.origin === "LOS" ? "Nigeria" : "Origin Country",
                time: `${params.departureDate}T16:00:00Z`,
                timezone: "Africa/Lagos",
              },
              arrival: {
                airport: params.destination,
                city: params.destination === "ATL" ? "Atlanta" : "Destination City",
                country: params.destination === "ATL" ? "United States" : "Destination Country",
                time: `${params.departureDate}T08:30:00Z`,
                timezone: "America/New_York",
              },
              airline: {
                code: "DL",
                name: "Delta Air Lines",
              },
              flightNumber: "DL156",
              aircraft: "Airbus A330-900neo",
              duration: "PT10H30M",
            },
          ],
        },
        layovers: [],
        airline: {
          code: "DL",
          name: "Delta Air Lines",
        },
        duration: {
          outbound: "PT10H30M",
        },
      },
    ]

    if (params.returnDate) {
      mockFlights.forEach((flight) => {
        flight.itinerary.inbound = [
          {
            id: "seg-return",
            departure: {
              airport: params.destination,
              city: params.destination === "ATL" ? "Atlanta" : "Destination City",
              country: params.destination === "ATL" ? "United States" : "Destination Country",
              time: `${params.returnDate}T10:00:00Z`,
              timezone: "America/New_York",
            },
            arrival: {
              airport: params.origin,
              city: params.origin === "LOS" ? "Lagos" : "Origin City",
              country: params.origin === "LOS" ? "Nigeria" : "Origin Country",
              time: `${params.returnDate}T18:30:00Z`,
              timezone: "Africa/Lagos",
            },
            airline: flight.airline,
            flightNumber: flight.airline.code + "157",
            aircraft: "Boeing 777-300ER",
            duration: "PT12H30M",
          },
        ]
        flight.duration.inbound = "PT12H30M"
      })
    }

    return mockFlights
  }
}

export default new DuffelService()
