import DuffelService from "./duffel-service"
import KiwiService from "./kiwi-service"
import AmadeusService from "./amadeus-service"

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

interface AggregatedResults {
  flights: FlightOffer[]
  providers: {
    duffel: number
    kiwi: number
    amadeus: number
  }
  total: number
  searchTime: number
}

interface ProviderHealth {
  name: string
  status: "healthy" | "degraded" | "down"
  responseTime: number | null
  lastCheck: string
}

export class FlightAggregatorService {
  private providers = [
    { name: "duffel", service: DuffelService },
    { name: "kiwi", service: KiwiService },
    { name: "amadeus", service: AmadeusService },
  ]

  async searchAllProviders(params: FlightSearchParams): Promise<AggregatedResults> {
    const startTime = Date.now()
    console.log("[v0] FlightAggregator: Starting search across all providers...")

    const results = await Promise.allSettled(
      this.providers.map(async (provider) => {
        try {
          console.log(`[v0] FlightAggregator: Searching ${provider.name}...`)
          const flights = await provider.service.searchFlights(params)
          console.log(`[v0] FlightAggregator: ${provider.name} returned ${flights.length} flights`)
          return { provider: provider.name, flights }
        } catch (error) {
          console.error(`[v0] FlightAggregator: ${provider.name} search failed:`, error)
          return { provider: provider.name, flights: [] }
        }
      }),
    )

    const allFlights: FlightOffer[] = []
    const providerCounts = { duffel: 0, kiwi: 0, amadeus: 0 }

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const { provider, flights } = result.value
        allFlights.push(...flights)
        if (provider === "duffel") providerCounts.duffel = flights.length
        if (provider === "kiwi") providerCounts.kiwi = flights.length
        if (provider === "amadeus") providerCounts.amadeus = flights.length
      }
    })

    const uniqueFlights = this.deduplicateFlights(allFlights)
    const sortedFlights = uniqueFlights.sort((a, b) => a.price.total - b.price.total)

    const searchTime = Date.now() - startTime
    console.log(
      `[v0] FlightAggregator: Search completed in ${searchTime}ms, found ${sortedFlights.length} unique flights`,
    )

    return {
      flights: sortedFlights,
      providers: providerCounts,
      total: sortedFlights.length,
      searchTime,
    }
  }

  private deduplicateFlights(flights: FlightOffer[]): FlightOffer[] {
    const seen = new Set<string>()
    return flights.filter((flight) => {
      // Create a unique key based on route, time, and airline
      const outbound = flight.itinerary.outbound
      const key = `${outbound[0]?.departure.airport}-${outbound[outbound.length - 1]?.arrival.airport}-${outbound[0]?.departure.time}-${flight.airline.code}`

      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  async getHealthStatus(): Promise<ProviderHealth[]> {
    console.log("[v0] FlightAggregator: Checking provider health...")

    const healthChecks = await Promise.allSettled(
      this.providers.map(async (provider) => {
        const startTime = Date.now()
        try {
          // Test with a simple search to check if the service is working
          const testParams: FlightSearchParams = {
            origin: "NYC",
            destination: "LAX",
            departureDate: "2025-09-01",
            passengers: { adults: 1, children: 0, infants: 0 },
          }

          await provider.service.searchFlights(testParams)
          const responseTime = Date.now() - startTime

          return {
            name: provider.name,
            status: "healthy" as const,
            responseTime,
            lastCheck: new Date().toISOString(),
          }
        } catch (error) {
          return {
            name: provider.name,
            status: "degraded" as const,
            responseTime: null,
            lastCheck: new Date().toISOString(),
          }
        }
      }),
    )

    return healthChecks.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : {
            name: "unknown",
            status: "down" as const,
            responseTime: null,
            lastCheck: new Date().toISOString(),
          },
    )
  }

  private async measureResponseTime(service: any): Promise<number> {
    const startTime = Date.now()
    try {
      await service.searchFlights({
        origin: "NYC",
        destination: "LAX",
        departureDate: "2025-09-01",
        passengers: { adults: 1, children: 0, infants: 0 },
      })
      return Date.now() - startTime
    } catch {
      return -1
    }
  }
}

export default new FlightAggregatorService()
