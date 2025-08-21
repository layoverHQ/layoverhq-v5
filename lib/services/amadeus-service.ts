interface AmadeusConfig {
  clientId: string
  clientSecret: string
  baseUrl: string
  environment: "test" | "production"
}

interface AmadeusToken {
  access_token: string
  token_type: string
  expires_in: number
  expires_at: number
}

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
  amenities?: string[]
  co2Emissions?: number
  delayPrediction?: {
    probability: number
    confidence: string
  }
  brandedFares?: {
    name: string
    features: string[]
  }[]
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

export class AmadeusService {
  private config: AmadeusConfig
  private token: AmadeusToken | null = null
  private isInitialized = false

  constructor() {
    this.config = {
      clientId: process.env.VITE_AMADEUS_CLIENT_ID || "",
      clientSecret: process.env.VITE_AMADEUS_CLIENT_SECRET || "",
      baseUrl: process.env.VITE_AMADEUS_BASE_URL || "https://test.api.amadeus.com",
      environment: "test",
    }
  }

  async initialize(): Promise<void> {
    console.log("[v0] AmadeusService: Starting initialization...")

    if (!this.config.clientId || !this.config.clientSecret) {
      console.warn("[v0] AmadeusService: Missing credentials, using mock data")
      this.isInitialized = true
      return
    }

    try {
      await this.authenticate()
      this.isInitialized = true
      console.log("[v0] AmadeusService: Initialization successful")
    } catch (error) {
      console.error("[v0] AmadeusService: Initialization failed:", error)
      this.isInitialized = true // Still mark as initialized to use mock data
    }
  }

  private async authenticate(): Promise<void> {
    console.log("[v0] AmadeusService: Authenticating with OAuth2...")

    const response = await fetch(`${this.config.baseUrl}/v1/security/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    })

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`)
    }

    const tokenData = await response.json()
    this.token = {
      ...tokenData,
      expires_at: Date.now() + tokenData.expires_in * 1000,
    }

    console.log("[v0] AmadeusService: Authentication successful")
  }

  private async ensureValidToken(): Promise<string> {
    if (!this.token || Date.now() >= this.token.expires_at - 60000) {
      // Refresh 1 minute before expiry
      await this.authenticate()
    }
    return this.token!.access_token
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.ensureValidToken()

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    console.log("[v0] AmadeusService: Searching flights with Amadeus API...")

    try {
      // Use Amadeus Flight Offers Search API
      const searchParams = new URLSearchParams({
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: params.departureDate,
        adults: params.passengers.adults.toString(),
        max: "50",
      })

      if (params.returnDate) {
        searchParams.append("returnDate", params.returnDate)
      }

      if (params.passengers.children > 0) {
        searchParams.append("children", params.passengers.children.toString())
      }

      if (params.passengers.infants > 0) {
        searchParams.append("infants", params.passengers.infants.toString())
      }

      if (params.cabinClass) {
        const cabinClassMap = {
          economy: "ECONOMY",
          premium_economy: "PREMIUM_ECONOMY",
          business: "BUSINESS",
          first: "FIRST",
        }
        searchParams.append("travelClass", cabinClassMap[params.cabinClass])
      }

      const data = await this.makeRequest(`/v2/shopping/flight-offers?${searchParams}`)

      console.log(`[v0] AmadeusService: Found ${data.data?.length || 0} flight offers`)

      return this.convertAmadeusOffers(data.data || [])
    } catch (error) {
      console.error("[v0] AmadeusService: Flight search failed:", error)
      return this.getMockFlights(params)
    }
  }

  private convertAmadeusOffers(offers: any[]): FlightOffer[] {
    return offers.map((offer, index) => {
      const outboundSegments = offer.itineraries[0]?.segments || []
      const inboundSegments = offer.itineraries[1]?.segments || []

      const layovers = this.calculateLayovers(outboundSegments)

      return {
        id: offer.id || `amadeus-${index}`,
        source: "amadeus",
        price: {
          total: Number.parseFloat(offer.price?.total || "0"),
          currency: offer.price?.currency || "USD",
          base: Number.parseFloat(offer.price?.base || "0"),
          taxes:
            Number.parseFloat(offer.price?.total || "0") -
            Number.parseFloat(offer.price?.base || "0"),
        },
        itinerary: {
          outbound: this.convertSegments(outboundSegments),
          inbound: inboundSegments.length > 0 ? this.convertSegments(inboundSegments) : undefined,
        },
        layovers,
        airline: {
          code: outboundSegments[0]?.carrierCode || "XX",
          name: this.getAirlineName(outboundSegments[0]?.carrierCode || "XX"),
        },
        duration: {
          outbound: offer.itineraries[0]?.duration || "PT0H0M",
          inbound: offer.itineraries[1]?.duration,
        },
        amenities: this.extractAmenities(outboundSegments),
        co2Emissions: offer.co2Emissions?.[0]?.weight,
        delayPrediction: offer.delayPrediction,
        brandedFares: offer.travelerPricings?.[0]?.fareDetailsBySegment?.map((fare: any) => ({
          name: fare.brandedFare || "Standard",
          features: fare.amenities || [],
        })),
      }
    })
  }

  private convertSegments(segments: any[]): FlightSegment[] {
    return segments.map((segment, index) => ({
      id: segment.id || `segment-${index}`,
      departure: {
        airport: segment.departure?.iataCode || "",
        city: segment.departure?.cityCode || "",
        country: segment.departure?.countryCode || "",
        time: segment.departure?.at || "",
        timezone: segment.departure?.timezone || "",
      },
      arrival: {
        airport: segment.arrival?.iataCode || "",
        city: segment.arrival?.cityCode || "",
        country: segment.arrival?.countryCode || "",
        time: segment.arrival?.at || "",
        timezone: segment.arrival?.timezone || "",
      },
      airline: {
        code: segment.carrierCode || "",
        name: this.getAirlineName(segment.carrierCode || ""),
      },
      flightNumber: `${segment.carrierCode}${segment.number}`,
      aircraft: segment.aircraft?.code || "Unknown",
      duration: segment.duration || "PT0H0M",
    }))
  }

  private calculateLayovers(segments: any[]): LayoverInfo[] {
    const layovers: LayoverInfo[] = []

    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i]
      const next = segments[i + 1]

      if (current.arrival && next.departure) {
        const arrivalTime = new Date(current.arrival.at)
        const departureTime = new Date(next.departure.at)
        const duration = (departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60) // minutes

        layovers.push({
          airport: current.arrival.iataCode,
          city: current.arrival.cityCode || current.arrival.iataCode,
          country: current.arrival.countryCode || "",
          duration,
          arrival: current.arrival.at,
          departure: next.departure.at,
        })
      }
    }

    return layovers
  }

  private extractAmenities(segments: any[]): string[] {
    const amenities = new Set<string>()

    segments.forEach((segment) => {
      if (segment.aircraft?.code?.includes("787") || segment.aircraft?.code?.includes("A350")) {
        amenities.add("WiFi")
        amenities.add("Entertainment")
        amenities.add("Power")
      }

      // Add more amenity detection logic based on airline and aircraft
      const airlineCode = segment.carrierCode
      if (["AA", "DL", "UA", "BA", "LH", "AF"].includes(airlineCode)) {
        amenities.add("WiFi")
        amenities.add("Entertainment")
      }
    })

    return Array.from(amenities)
  }

  private getAirlineName(code: string): string {
    const airlineNames: { [key: string]: string } = {
      AA: "American Airlines",
      DL: "Delta Air Lines",
      UA: "United Airlines",
      BA: "British Airways",
      LH: "Lufthansa",
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

    return airlineNames[code] || `${code} Airlines`
  }

  private getMockFlights(params: FlightSearchParams): FlightOffer[] {
    console.log("[v0] AmadeusService: Using mock flight data")

    return [
      {
        id: "amadeus-mock-1",
        source: "amadeus",
        price: {
          total: 1250.0,
          currency: "USD",
          base: 980.0,
          taxes: 270.0,
        },
        itinerary: {
          outbound: [
            {
              id: "seg-1",
              departure: {
                airport: params.origin,
                city: params.origin,
                country: "US",
                time: "2025-09-01T08:00:00",
                timezone: "America/New_York",
              },
              arrival: {
                airport: "FRA",
                city: "Frankfurt",
                country: "DE",
                time: "2025-09-01T21:00:00",
                timezone: "Europe/Berlin",
              },
              airline: {
                code: "LH",
                name: "Lufthansa",
              },
              flightNumber: "LH441",
              aircraft: "Boeing 747-8",
              duration: "PT8H0M",
            },
            {
              id: "seg-2",
              departure: {
                airport: "FRA",
                city: "Frankfurt",
                country: "DE",
                time: "2025-09-01T23:30:00",
                timezone: "Europe/Berlin",
              },
              arrival: {
                airport: params.destination,
                city: params.destination,
                country: "US",
                time: "2025-09-02T06:45:00",
                timezone: "America/Los_Angeles",
              },
              airline: {
                code: "LH",
                name: "Lufthansa",
              },
              flightNumber: "LH453",
              aircraft: "Airbus A350",
              duration: "PT11H15M",
            },
          ],
        },
        layovers: [
          {
            airport: "FRA",
            city: "Frankfurt",
            country: "DE",
            duration: 150, // 2.5 hours
            arrival: "2025-09-01T21:00:00",
            departure: "2025-09-01T23:30:00",
          },
        ],
        airline: {
          code: "LH",
          name: "Lufthansa",
        },
        duration: {
          outbound: "PT19H45M",
        },
        amenities: ["WiFi", "Entertainment", "Power", "Meals"],
        co2Emissions: 1250,
        delayPrediction: {
          probability: 0.15,
          confidence: "HIGH",
        },
        brandedFares: [
          {
            name: "Economy Light",
            features: ["Seat selection", "Carry-on bag"],
          },
          {
            name: "Economy Classic",
            features: ["Seat selection", "Carry-on bag", "Checked bag", "Changes allowed"],
          },
        ],
      },
      {
        id: "amadeus-mock-2",
        source: "amadeus",
        price: {
          total: 1450.0,
          currency: "USD",
          base: 1150.0,
          taxes: 300.0,
        },
        itinerary: {
          outbound: [
            {
              id: "seg-3",
              departure: {
                airport: params.origin,
                city: params.origin,
                country: "US",
                time: "2025-09-01T14:30:00",
                timezone: "America/New_York",
              },
              arrival: {
                airport: "DOH",
                city: "Doha",
                country: "QA",
                time: "2025-09-02T01:15:00",
                timezone: "Asia/Qatar",
              },
              airline: {
                code: "QR",
                name: "Qatar Airways",
              },
              flightNumber: "QR701",
              aircraft: "Boeing 777-300ER",
              duration: "PT12H45M",
            },
            {
              id: "seg-4",
              departure: {
                airport: "DOH",
                city: "Doha",
                country: "QA",
                time: "2025-09-02T03:45:00",
                timezone: "Asia/Qatar",
              },
              arrival: {
                airport: params.destination,
                city: params.destination,
                country: "US",
                time: "2025-09-02T08:30:00",
                timezone: "America/Los_Angeles",
              },
              airline: {
                code: "QR",
                name: "Qatar Airways",
              },
              flightNumber: "QR739",
              aircraft: "Airbus A350-900",
              duration: "PT16H45M",
            },
          ],
        },
        layovers: [
          {
            airport: "DOH",
            city: "Doha",
            country: "QA",
            duration: 150, // 2.5 hours
            arrival: "2025-09-02T01:15:00",
            departure: "2025-09-02T03:45:00",
          },
        ],
        airline: {
          code: "QR",
          name: "Qatar Airways",
        },
        duration: {
          outbound: "PT18H0M",
        },
        amenities: ["WiFi", "Entertainment", "Power", "Premium Meals", "Lounge Access"],
        co2Emissions: 1180,
        delayPrediction: {
          probability: 0.08,
          confidence: "HIGH",
        },
        brandedFares: [
          {
            name: "Economy",
            features: ["Seat selection", "Carry-on bag", "Checked bag", "Meals"],
          },
          {
            name: "Economy Flex",
            features: [
              "Seat selection",
              "Carry-on bag",
              "Checked bag",
              "Meals",
              "Changes allowed",
              "Refundable",
            ],
          },
        ],
      },
    ]
  }

  // Additional Amadeus-specific methods for advanced features
  async getFlightDelayPrediction(flightDetails: any): Promise<any> {
    try {
      const params = new URLSearchParams({
        originLocationCode: flightDetails.origin,
        destinationLocationCode: flightDetails.destination,
        departureDate: flightDetails.departureDate,
        departureTime: flightDetails.departureTime,
        arrivalDate: flightDetails.arrivalDate,
        arrivalTime: flightDetails.arrivalTime,
        carrierCode: flightDetails.carrierCode,
        flightNumber: flightDetails.flightNumber,
        duration: flightDetails.duration,
      })

      return await this.makeRequest(`/v1/travel/predictions/flight-delay?${params}`)
    } catch (error) {
      console.error("[v0] AmadeusService: Delay prediction failed:", error)
      return null
    }
  }

  async getSeatmap(flightOffer: any): Promise<any> {
    try {
      return await this.makeRequest("/v1/shopping/seatmaps", {
        method: "POST",
        body: JSON.stringify({
          data: [flightOffer],
        }),
      })
    } catch (error) {
      console.error("[v0] AmadeusService: Seatmap request failed:", error)
      return null
    }
  }

  async getHotels(cityCode: string, checkIn: string, checkOut: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        cityCode,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        adults: "2",
        radius: "5",
        radiusUnit: "KM",
        currency: "USD",
        sort: "PRICE",
      })

      return await this.makeRequest(`/v3/shopping/hotel-offers?${params}`)
    } catch (error) {
      console.error("[v0] AmadeusService: Hotel search failed:", error)
      return null
    }
  }

  async getPointsOfInterest(latitude: number, longitude: number): Promise<any> {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: "2",
      })

      return await this.makeRequest(`/v1/shopping/activities?${params}`)
    } catch (error) {
      console.error("[v0] AmadeusService: Points of interest request failed:", error)
      return null
    }
  }
}

export default new AmadeusService()
