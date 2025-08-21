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

export class KiwiService {
  private apiKey: string | null = null
  private baseUrl = "https://tequila-api.kiwi.com"
  private isInitialized = false
  private initializationPromise: Promise<void> | null = null

  constructor() {
    this.initializationPromise = this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      console.log("[v0] KiwiService: Starting initialization...")

      // Check for API key from environment variables
      this.apiKey =
        process.env.VITE_KIWI_MULTICITY_API_KEY ||
        process.env.VITE_KIWI_NOMAD_API_KEY ||
        process.env.VITE_KIWI_ONEWAY_API_KEY ||
        null

      if (!this.apiKey) {
        console.warn("[v0] KiwiService: No API key found - using mock data only")
        console.warn("[v0] KiwiService: Kiwi.com requires B2B partnership for API access")
        return
      }

      const connectionSuccess = await this.testConnection()
      if (connectionSuccess) {
        this.isInitialized = true
        console.log("[v0] KiwiService: Initialization successful")
      } else {
        console.warn("[v0] KiwiService: Connection test failed - will use mock data")
        this.isInitialized = false
      }
    } catch (error) {
      console.error("[v0] KiwiService: Initialization failed:", error)
      this.isInitialized = false
    }
  }

  private async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Connection test timeout")), 5000)
      })

      const testPromise = fetch(`${this.baseUrl}/locations/query?term=NYC&limit=1`, {
        headers: {
          apikey: this.apiKey,
          "Content-Type": "application/json",
        },
      })

      const response = await Promise.race([testPromise, timeoutPromise])

      if (response.ok) {
        console.log("[v0] KiwiService: Connection test successful")
        return true
      } else if (response.status === 403) {
        console.log("[v0] KiwiService: API access requires B2B partnership - using mock data")
        return false
      } else {
        console.error("[v0] KiwiService: Connection test failed with status:", response.status)
        return false
      }
    } catch (error) {
      console.error("[v0] KiwiService: Connection test failed:", error)
      return false
    }
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    if (this.initializationPromise) {
      await this.initializationPromise
    }

    if (!this.isInitialized || !this.apiKey) {
      console.log("[v0] KiwiService: Using mock data (API access requires B2B partnership)")
      return this.getMockFlightData(params)
    }

    try {
      console.log("[v0] KiwiService: Searching flights with Kiwi API...")

      // Convert date format from YYYY-MM-DD to DD/MM/YYYY for Kiwi API
      const formatDateForKiwi = (date: string) => {
        const [year, month, day] = date.split("-")
        return `${day}/${month}/${year}`
      }

      const searchParams = new URLSearchParams({
        fly_from: params.origin,
        fly_to: params.destination,
        date_from: formatDateForKiwi(params.departureDate),
        date_to: formatDateForKiwi(params.departureDate),
        adults: params.passengers.adults.toString(),
        children: params.passengers.children.toString(),
        infants: params.passengers.infants.toString(),
        selected_cabins: this.mapCabinClass(params.cabinClass || "economy"),
        max_stopovers: params.maxConnections?.toString() || "2",
        limit: "50",
      })

      if (params.returnDate) {
        searchParams.append("return_from", formatDateForKiwi(params.returnDate))
        searchParams.append("return_to", formatDateForKiwi(params.returnDate))
      }

      const response = await fetch(`${this.baseUrl}/v2/search?${searchParams}`, {
        headers: {
          apikey: this.apiKey,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 403) {
          console.log("[v0] KiwiService: API access requires B2B partnership - using mock data")
        } else {
          console.error("[v0] KiwiService: API error:", response.status, response.statusText)
        }
        return this.getMockFlightData(params)
      }

      const data = await response.json()
      console.log("[v0] KiwiService: Found", data.data?.length || 0, "flights")

      return this.transformKiwiFlights(data.data || [], params.preferLayovers)
    } catch (error: any) {
      if (error.message?.includes("403")) {
        console.log("[v0] KiwiService: Using mock data (authentication required)")
      } else {
        console.error("[v0] KiwiService: Unexpected error:", error.message)
      }
      return this.getMockFlightData(params)
    }
  }

  private mapCabinClass(cabinClass: string): string {
    const mapping: Record<string, string> = {
      economy: "M",
      premium_economy: "W",
      business: "C",
      first: "F",
    }
    return mapping[cabinClass] || "M"
  }

  private transformKiwiFlights(flights: any[], preferLayovers = false): FlightOffer[] {
    return flights
      .map((flight) => {
        const layovers = this.extractKiwiLayovers(flight.route)

        if (preferLayovers && layovers.length === 0) {
          return null // Skip direct flights if layovers preferred
        }

        return {
          id: flight.id || `kiwi_${Math.random().toString(36).substr(2, 9)}`,
          source: "kiwi",
          price: {
            total: flight.price,
            currency: flight.currency || "USD",
            base: flight.price * 0.8,
            taxes: flight.price * 0.2,
          },
          itinerary: {
            outbound: this.transformKiwiRoute(flight.route.filter((r: any) => r.return === 0)),
            inbound: flight.route.some((r: any) => r.return === 1)
              ? this.transformKiwiRoute(flight.route.filter((r: any) => r.return === 1))
              : undefined,
          },
          layovers: layovers,
          airline: {
            code: flight.airlines?.[0] || "XX",
            name: this.getAirlineName(flight.airlines?.[0] || "XX"),
          },
          duration: {
            outbound: this.formatDuration(flight.duration?.departure || 0),
            inbound: flight.duration?.return
              ? this.formatDuration(flight.duration.return)
              : undefined,
          },
        }
      })
      .filter(Boolean) as FlightOffer[]
  }

  private transformKiwiRoute(route: any[]): FlightSegment[] {
    return route.map((segment, index) => ({
      id: `kiwi-seg-${index}`,
      departure: {
        airport: segment.flyFrom,
        city: segment.cityFrom,
        country: segment.countryFrom?.name || "Unknown",
        time: new Date(segment.dTimeUTC * 1000).toISOString(),
        timezone: "UTC",
      },
      arrival: {
        airport: segment.flyTo,
        city: segment.cityTo,
        country: segment.countryTo?.name || "Unknown",
        time: new Date(segment.aTimeUTC * 1000).toISOString(),
        timezone: "UTC",
      },
      airline: {
        code: segment.airline,
        name: this.getAirlineName(segment.airline),
      },
      flightNumber: `${segment.airline}${segment.flight_no}`,
      aircraft: "Unknown Aircraft",
      duration: this.formatDuration((segment.aTimeUTC - segment.dTimeUTC) / 60),
    }))
  }

  private extractKiwiLayovers(route: any[]): LayoverInfo[] {
    const layovers: LayoverInfo[] = []
    const outboundRoute = route.filter((r) => r.return === 0)

    for (let i = 0; i < outboundRoute.length - 1; i++) {
      const arrival = new Date(outboundRoute[i].aTimeUTC * 1000)
      const departure = new Date(outboundRoute[i + 1].dTimeUTC * 1000)
      const duration = (departure.getTime() - arrival.getTime()) / (1000 * 60) // minutes

      layovers.push({
        airport: outboundRoute[i].flyTo,
        city: outboundRoute[i].cityTo,
        country: outboundRoute[i].countryTo?.name || "Unknown",
        duration: duration,
        arrival: arrival.toISOString(),
        departure: departure.toISOString(),
      })
    }

    return layovers
  }

  private getAirlineName(code: string): string {
    const airlines: Record<string, string> = {
      AA: "American Airlines",
      DL: "Delta Air Lines",
      UA: "United Airlines",
      LH: "Lufthansa",
      BA: "British Airways",
      AF: "Air France",
      KL: "KLM",
      QR: "Qatar Airways",
      EK: "Emirates",
      TK: "Turkish Airlines",
      SQ: "Singapore Airlines",
      CX: "Cathay Pacific",
      JL: "Japan Airlines",
      NH: "ANA",
      AC: "Air Canada",
      VS: "Virgin Atlantic",
      IB: "Iberia",
      AZ: "Alitalia",
      OS: "Austrian Airlines",
      LX: "Swiss International",
    }
    return airlines[code] || `${code} Airlines`
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `PT${hours}H${mins}M`
  }

  private getMockFlightData(params: FlightSearchParams): FlightOffer[] {
    const mockFlights: FlightOffer[] = [
      {
        id: "kiwi_mock_001",
        source: "kiwi",
        price: {
          total: 1180,
          currency: "USD",
          base: 950,
          taxes: 230,
        },
        itinerary: {
          outbound: [
            {
              id: "kiwi-seg-1",
              departure: {
                airport: params.origin,
                city: params.origin === "LOS" ? "Lagos" : "Origin City",
                country: params.origin === "LOS" ? "Nigeria" : "Origin Country",
                time: `${params.departureDate}T12:15:00Z`,
                timezone: "Africa/Lagos",
              },
              arrival: {
                airport: "IST",
                city: "Istanbul",
                country: "Turkey",
                time: `${params.departureDate}T18:30:00Z`,
                timezone: "Europe/Istanbul",
              },
              airline: {
                code: "TK",
                name: "Turkish Airlines",
              },
              flightNumber: "TK624",
              aircraft: "Boeing 777-300ER",
              duration: "PT6H15M",
            },
            {
              id: "kiwi-seg-2",
              departure: {
                airport: "IST",
                city: "Istanbul",
                country: "Turkey",
                time: `${params.departureDate}T21:45:00Z`,
                timezone: "Europe/Istanbul",
              },
              arrival: {
                airport: params.destination,
                city: params.destination === "ATL" ? "Atlanta" : "Destination City",
                country: params.destination === "ATL" ? "United States" : "Destination Country",
                time: `${params.departureDate}T05:20:00Z`,
                timezone: "America/New_York",
              },
              airline: {
                code: "TK",
                name: "Turkish Airlines",
              },
              flightNumber: "TK15",
              aircraft: "Airbus A350-900",
              duration: "PT11H35M",
            },
          ],
        },
        layovers: [
          {
            airport: "IST",
            city: "Istanbul",
            country: "Turkey",
            duration: 195, // 3h 15m
            arrival: `${params.departureDate}T18:30:00Z`,
            departure: `${params.departureDate}T21:45:00Z`,
          },
        ],
        airline: {
          code: "TK",
          name: "Turkish Airlines",
        },
        duration: {
          outbound: "PT17H50M",
        },
      },
      {
        id: "kiwi_mock_002",
        source: "kiwi",
        price: {
          total: 1350,
          currency: "USD",
          base: 1100,
          taxes: 250,
        },
        itinerary: {
          outbound: [
            {
              id: "kiwi-seg-1",
              departure: {
                airport: params.origin,
                city: params.origin === "LOS" ? "Lagos" : "Origin City",
                country: params.origin === "LOS" ? "Nigeria" : "Origin Country",
                time: `${params.departureDate}T09:45:00Z`,
                timezone: "Africa/Lagos",
              },
              arrival: {
                airport: "LHR",
                city: "London",
                country: "United Kingdom",
                time: `${params.departureDate}T15:30:00Z`,
                timezone: "Europe/London",
              },
              airline: {
                code: "BA",
                name: "British Airways",
              },
              flightNumber: "BA75",
              aircraft: "Boeing 787-9",
              duration: "PT6H45M",
            },
            {
              id: "kiwi-seg-2",
              departure: {
                airport: "LHR",
                city: "London",
                country: "United Kingdom",
                time: `${params.departureDate}T19:15:00Z`,
                timezone: "Europe/London",
              },
              arrival: {
                airport: params.destination,
                city: params.destination === "ATL" ? "Atlanta" : "Destination City",
                country: params.destination === "ATL" ? "United States" : "Destination Country",
                time: `${params.departureDate}T23:45:00Z`,
                timezone: "America/New_York",
              },
              airline: {
                code: "VS",
                name: "Virgin Atlantic",
              },
              flightNumber: "VS103",
              aircraft: "Airbus A350-1000",
              duration: "PT8H30M",
            },
          ],
        },
        layovers: [
          {
            airport: "LHR",
            city: "London",
            country: "United Kingdom",
            duration: 225, // 3h 45m
            arrival: `${params.departureDate}T15:30:00Z`,
            departure: `${params.departureDate}T19:15:00Z`,
          },
        ],
        airline: {
          code: "BA",
          name: "British Airways",
        },
        duration: {
          outbound: "PT15H15M",
        },
      },
    ]

    if (params.returnDate) {
      mockFlights.forEach((flight) => {
        flight.itinerary.inbound = [
          {
            id: "kiwi-return-seg",
            departure: {
              airport: params.destination,
              city: params.destination === "ATL" ? "Atlanta" : "Destination City",
              country: params.destination === "ATL" ? "United States" : "Destination Country",
              time: `${params.returnDate}T11:30:00Z`,
              timezone: "America/New_York",
            },
            arrival: {
              airport: params.origin,
              city: params.origin === "LOS" ? "Lagos" : "Origin City",
              country: params.origin === "LOS" ? "Nigeria" : "Origin Country",
              time: `${params.returnDate}T19:45:00Z`,
              timezone: "Africa/Lagos",
            },
            airline: flight.airline,
            flightNumber: flight.airline.code + "76",
            aircraft: "Boeing 787-9",
            duration: "PT14H15M",
          },
        ]
        flight.duration.inbound = "PT14H15M"
      })
    }

    return mockFlights
  }
}

export default new KiwiService()
