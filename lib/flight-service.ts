import { AmadeusAPI } from "./flight-apis/amadeus"
import { KiwiAPI } from "./flight-apis/kiwi"
import { DuffelAPI } from "./flight-apis/duffel"
import { OpenSkyAPI } from "./flight-apis/opensky"

interface FlightSearchRequest {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: {
    adults: number
    children?: number
    infants?: number
  }
  cabinClass?: "economy" | "premium_economy" | "business" | "first"
  maxPrice?: number
  maxConnections?: number
  preferLayovers?: boolean
  layoverMinDuration?: number
  layoverMaxDuration?: number
}

interface UnifiedFlightOffer {
  id: string
  source: "amadeus" | "kiwi" | "duffel"
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
  duration: {
    outbound: string
    inbound?: string
    total: string
  }
  layovers: LayoverInfo[]
  airline: {
    code: string
    name: string
    logo?: string
  }
  aircraft?: {
    code: string
    name: string
  }
  bookingUrl?: string
  deepLink?: string
  validUntil: string
  layoverScore?: number
  layoverPackages?: LayoverPackage[]
}

interface FlightSegment {
  id: string
  departure: {
    airport: string
    city: string
    country: string
    terminal?: string
    time: string
    timezone: string
  }
  arrival: {
    airport: string
    city: string
    country: string
    terminal?: string
    time: string
    timezone: string
  }
  airline: {
    code: string
    name: string
  }
  flightNumber: string
  aircraft?: {
    code: string
    name: string
  }
  duration: string
  cabinClass: string
  fareBasis?: string
}

interface LayoverInfo {
  airport: string
  city: string
  country: string
  duration: string
  durationMinutes: number
  isEligibleForPackages: boolean
  timezone: string
}

interface LayoverPackage {
  id: string
  name: string
  description: string
  duration: string
  price: number
  currency: string
  provider: string
  includes: string[]
  bookingUrl?: string
}

export class FlightService {
  private amadeus: AmadeusAPI
  private kiwi: KiwiAPI
  private duffel: DuffelAPI
  private opensky: OpenSkyAPI

  constructor() {
    // Initialize APIs with environment variables
    this.amadeus = new AmadeusAPI({
      clientId: process.env.VITE_AMADEUS_CLIENT_ID || "",
      clientSecret: process.env.VITE_AMADEUS_CLIENT_SECRET || "",
      baseUrl: process.env.VITE_AMADEUS_BASE_URL || "https://api.amadeus.com",
    })

    this.kiwi = new KiwiAPI({
      multiCityApiKey: process.env.VITE_KIWI_MULTICITY_API_KEY || "",
      nomadApiKey: process.env.VITE_KIWI_NOMAD_API_KEY || "",
      onewayApiKey: process.env.VITE_KIWI_ONEWAY_API_KEY || "",
      multiCityAffiliateId: process.env.VITE_KIWI_MULTICITY_AFFILIATE_ID || "",
      nomadAffiliateId: process.env.VITE_KIWI_NOMAD_AFFILIATE_ID || "",
      onewayAffiliateId: process.env.VITE_KIWI_ONEWAY_AFFILIATE_ID || "",
    })

    this.duffel = new DuffelAPI({
      apiKey: process.env.VITE_DUFFEL_API_KEY || "",
      baseUrl: "https://api.duffel.com",
    })

    this.opensky = new OpenSkyAPI({
      username: process.env.VITE_OPENSKY_USERNAME,
      password: process.env.VITE_OPENSKY_PASSWORD,
      baseUrl: "https://opensky-network.org",
    })

    console.log("[v0] FlightService: Environment variables check:")
    console.log("- AMADEUS_CLIENT_ID:", !!process.env.VITE_AMADEUS_CLIENT_ID)
    console.log("- AMADEUS_CLIENT_SECRET:", !!process.env.VITE_AMADEUS_CLIENT_SECRET)
    console.log("- DUFFEL_API_KEY:", !!process.env.VITE_DUFFEL_API_KEY)
    console.log("- KIWI_MULTICITY_API_KEY:", !!process.env.VITE_KIWI_MULTICITY_API_KEY)
    console.log("- OPENSKY_USERNAME:", !!process.env.VITE_OPENSKY_USERNAME)
  }

  async searchFlights(request: FlightSearchRequest): Promise<UnifiedFlightOffer[]> {
    const results: UnifiedFlightOffer[] = []

    // Search all APIs in parallel
    const searchPromises = [
      this.searchAmadeus(request).catch((err) => {
        console.error("Amadeus search failed:", err)
        return []
      }),
      this.searchKiwi(request).catch((err) => {
        console.error("Kiwi search failed:", err)
        return []
      }),
      this.searchDuffel(request).catch((err) => {
        console.error("Duffel search failed:", err)
        return []
      }),
    ]

    const [amadeusResults, kiwiResults, duffelResults] = await Promise.all(searchPromises)

    results.push(...amadeusResults, ...kiwiResults, ...duffelResults)

    // Sort by layover score if layovers are preferred, otherwise by price
    if (request.preferLayovers) {
      results.sort((a, b) => (b.layoverScore || 0) - (a.layoverScore || 0))
    } else {
      results.sort((a, b) => a.price.total - b.price.total)
    }

    // Apply layover packages to eligible flights
    await this.enrichWithLayoverPackages(results)

    return results.slice(0, 50) // Return top 50 results
  }

  private async searchAmadeus(request: FlightSearchRequest): Promise<UnifiedFlightOffer[]> {
    const offers = await this.amadeus.searchFlights({
      origin: request.origin,
      destination: request.destination,
      departureDate: request.departureDate,
      returnDate: request.returnDate,
      adults: request.passengers.adults,
      children: request.passengers.children,
      infants: request.passengers.infants,
      travelClass: request.cabinClass?.toUpperCase() as any,
      maxPrice: request.maxPrice,
      max: 25,
    })

    return offers.map((offer) => this.convertAmadeusOffer(offer))
  }

  private async searchKiwi(request: FlightSearchRequest): Promise<UnifiedFlightOffer[]> {
    const flights = await this.kiwi.searchFlights({
      fly_from: request.origin,
      fly_to: request.destination,
      date_from: request.departureDate,
      date_to: request.departureDate,
      return_from: request.returnDate,
      return_to: request.returnDate,
      flight_type: request.returnDate ? "round" : "oneway",
      adults: request.passengers.adults,
      children: request.passengers.children,
      infants: request.passengers.infants,
      selected_cabins: this.mapCabinClassToKiwi(request.cabinClass),
      price_to: request.maxPrice,
      max_stopovers: request.maxConnections,
      limit: 25,
    })

    return flights.map((flight) => this.convertKiwiOffer(flight))
  }

  private async searchDuffel(request: FlightSearchRequest): Promise<UnifiedFlightOffer[]> {
    if (!process.env.VITE_DUFFEL_API_KEY) {
      console.warn("[v0] FlightService: Duffel API key not configured, skipping Duffel search")
      return []
    }

    console.log("[v0] FlightService: Starting Duffel search with request:", JSON.stringify(request))

    const passengers = [
      ...Array(request.passengers.adults).fill({ type: "adult" }),
      ...Array(request.passengers.children || 0).fill({ type: "child" }),
      ...Array(request.passengers.infants || 0).fill({ type: "infant_without_seat" }),
    ]

    try {
      const offers = await this.duffel.searchOffers({
        origin: request.origin,
        destination: request.destination,
        departure_date: request.departureDate,
        return_date: request.returnDate,
        passengers,
        cabin_class: request.cabinClass,
        max_connections: request.maxConnections,
      })

      console.log("[v0] FlightService: Duffel search completed, found", offers.length, "offers")
      return offers.map((offer) => this.convertDuffelOffer(offer))
    } catch (error) {
      console.error("[v0] FlightService: Duffel search failed with detailed error:", error)
      throw error
    }
  }

  private convertAmadeusOffer(offer: any): UnifiedFlightOffer {
    const outboundSegments = offer.itineraries[0].segments.map((segment: any) => ({
      id: segment.id,
      departure: {
        airport: segment.departure.iataCode,
        city: segment.departure.iataCode, // Would need airport lookup
        country: "", // Would need airport lookup
        terminal: segment.departure.terminal,
        time: segment.departure.at,
        timezone: "", // Would need airport lookup
      },
      arrival: {
        airport: segment.arrival.iataCode,
        city: segment.arrival.iataCode, // Would need airport lookup
        country: "", // Would need airport lookup
        terminal: segment.arrival.terminal,
        time: segment.arrival.at,
        timezone: "", // Would need airport lookup
      },
      airline: {
        code: segment.carrierCode,
        name: segment.carrierCode, // Would need airline lookup
      },
      flightNumber: `${segment.carrierCode}${segment.number}`,
      aircraft: segment.aircraft
        ? {
            code: segment.aircraft.code,
            name: segment.aircraft.code, // Would need aircraft lookup
          }
        : undefined,
      duration: segment.duration,
      cabinClass: offer.travelerPricings[0]?.fareDetailsBySegment[0]?.cabin || "economy",
      fareBasis: offer.travelerPricings[0]?.fareDetailsBySegment[0]?.fareBasis,
    }))

    const layovers = this.calculateLayovers(outboundSegments)

    return {
      id: offer.id,
      source: "amadeus",
      price: {
        total: Number.parseFloat(offer.price.total),
        currency: offer.price.currency,
        base: Number.parseFloat(offer.price.base),
        taxes: Number.parseFloat(offer.price.total) - Number.parseFloat(offer.price.base),
      },
      itinerary: {
        outbound: outboundSegments,
        inbound: offer.itineraries[1]
          ? offer.itineraries[1].segments.map((segment: any) => ({
              // Similar mapping for inbound
            }))
          : undefined,
      },
      duration: {
        outbound: offer.itineraries[0].duration,
        inbound: offer.itineraries[1]?.duration,
        total: offer.itineraries[0].duration, // Would calculate total
      },
      layovers,
      airline: {
        code: offer.validatingAirlineCodes[0],
        name: offer.validatingAirlineCodes[0], // Would need airline lookup
      },
      validUntil: offer.lastTicketingDate,
      layoverScore: this.calculateLayoverScore(layovers),
    }
  }

  private convertKiwiOffer(flight: any): UnifiedFlightOffer {
    const segments = flight.route.map((route: any) => ({
      id: route.id,
      departure: {
        airport: route.flyFrom,
        city: route.cityFrom,
        country: flight.countryFrom.name,
        time: route.local_departure,
        timezone: "", // Would need timezone lookup
      },
      arrival: {
        airport: route.flyTo,
        city: route.cityTo,
        country: flight.countryTo.name,
        time: route.local_arrival,
        timezone: "", // Would need timezone lookup
      },
      airline: {
        code: route.airline,
        name: route.airline, // Would need airline lookup
      },
      flightNumber: `${route.airline}${route.flight_no}`,
      duration: "", // Would calculate from times
      cabinClass: "economy", // Kiwi doesn't provide detailed cabin info
    }))

    const layovers = this.calculateLayovers(segments)

    return {
      id: flight.id,
      source: "kiwi",
      price: {
        total: flight.price,
        currency: "EUR", // Kiwi typically returns EUR
        base: flight.price * 0.8, // Estimate
        taxes: flight.price * 0.2, // Estimate
      },
      itinerary: {
        outbound: segments,
      },
      duration: {
        outbound: `${Math.floor(flight.duration.departure / 60)}h ${flight.duration.departure % 60}m`,
        total: `${Math.floor(flight.duration.total / 60)}h ${flight.duration.total % 60}m`,
      },
      layovers,
      airline: {
        code: flight.airlines[0],
        name: flight.airlines[0], // Would need airline lookup
      },
      bookingUrl: flight.deep_link,
      deepLink: flight.deep_link,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      layoverScore: this.calculateLayoverScore(layovers),
    }
  }

  private convertDuffelOffer(offer: any): UnifiedFlightOffer {
    const outboundSegments = offer.slices[0].segments.map((segment: any) => ({
      id: segment.id,
      departure: {
        airport: segment.origin.iata_code,
        city: segment.origin.city?.name || segment.origin.iata_code,
        country: segment.origin.iata_country_code || "",
        terminal: segment.origin.terminal,
        time: segment.departing_at,
        timezone: segment.origin.time_zone || "",
      },
      arrival: {
        airport: segment.destination.iata_code,
        city: segment.destination.city?.name || segment.destination.iata_code,
        country: segment.destination.iata_country_code || "",
        terminal: segment.destination.terminal,
        time: segment.arriving_at,
        timezone: segment.destination.time_zone || "",
      },
      airline: {
        code: segment.marketing_carrier?.iata_code || "Unknown",
        name:
          segment.marketing_carrier?.name ||
          segment.marketing_carrier?.iata_code ||
          "Unknown Airline",
      },
      flightNumber: segment.marketing_carrier_flight_number || "Unknown",
      aircraft: segment.aircraft
        ? {
            code: segment.aircraft.iata_code || "Unknown",
            name: segment.aircraft.name || segment.aircraft.iata_code || "Unknown Aircraft",
          }
        : undefined,
      duration: segment.duration || "Unknown",
      cabinClass: segment.passengers?.[0]?.cabin_class || "economy",
      fareBasis: segment.passengers?.[0]?.fare_basis_code,
    }))

    const inboundSegments = offer.slices[1]
      ? offer.slices[1].segments.map((segment: any) => ({
          id: segment.id,
          departure: {
            airport: segment.origin.iata_code,
            city: segment.origin.city?.name || segment.origin.iata_code,
            country: segment.origin.iata_country_code || "",
            terminal: segment.origin.terminal,
            time: segment.departing_at,
            timezone: segment.origin.time_zone || "",
          },
          arrival: {
            airport: segment.destination.iata_code,
            city: segment.destination.city?.name || segment.destination.iata_code,
            country: segment.destination.iata_country_code || "",
            terminal: segment.destination.terminal,
            time: segment.arriving_at,
            timezone: segment.destination.time_zone || "",
          },
          airline: {
            code: segment.marketing_carrier?.iata_code || "Unknown",
            name:
              segment.marketing_carrier?.name ||
              segment.marketing_carrier?.iata_code ||
              "Unknown Airline",
          },
          flightNumber: segment.marketing_carrier_flight_number || "Unknown",
          aircraft: segment.aircraft
            ? {
                code: segment.aircraft.iata_code || "Unknown",
                name: segment.aircraft.name || segment.aircraft.iata_code || "Unknown Aircraft",
              }
            : undefined,
          duration: segment.duration || "Unknown",
          cabinClass: segment.passengers?.[0]?.cabin_class || "economy",
          fareBasis: segment.passengers?.[0]?.fare_basis_code,
        }))
      : undefined

    const layovers = this.calculateLayovers(outboundSegments)

    return {
      id: offer.id,
      source: "duffel",
      price: {
        total: Number.parseFloat(offer.total_amount || "0"),
        currency: offer.total_currency || "USD",
        base: Number.parseFloat(offer.base_amount || "0"),
        taxes: Number.parseFloat(offer.tax_amount || "0"),
      },
      itinerary: {
        outbound: outboundSegments,
        inbound: inboundSegments,
      },
      duration: {
        outbound: offer.slices[0].duration || "Unknown",
        inbound: offer.slices[1]?.duration,
        total: offer.slices[0].duration || "Unknown", // Would calculate total
      },
      layovers,
      airline: {
        code: offer.owner?.iata_code || "Unknown",
        name: offer.owner?.name || offer.owner?.iata_code || "Unknown Airline",
        logo: offer.owner?.logo_symbol_url,
      },
      validUntil: offer.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      layoverScore: this.calculateLayoverScore(layovers),
    }
  }

  private calculateLayovers(segments: FlightSegment[]): LayoverInfo[] {
    const layovers: LayoverInfo[] = []

    for (let i = 0; i < segments.length - 1; i++) {
      const currentSegment = segments[i]
      const nextSegment = segments[i + 1]

      const arrivalTime = new Date(currentSegment.arrival.time)
      const departureTime = new Date(nextSegment.departure.time)
      const durationMs = departureTime.getTime() - arrivalTime.getTime()
      const durationMinutes = Math.floor(durationMs / (1000 * 60))

      layovers.push({
        airport: currentSegment.arrival.airport,
        city: currentSegment.arrival.city,
        country: currentSegment.arrival.country,
        duration: this.formatDuration(durationMinutes),
        durationMinutes,
        isEligibleForPackages: durationMinutes >= 120 && durationMinutes <= 1440, // 2-24 hours
        timezone: currentSegment.arrival.timezone,
      })
    }

    return layovers
  }

  private calculateLayoverScore(layovers: LayoverInfo[]): number {
    if (layovers.length === 0) return 0

    let score = 0
    for (const layover of layovers) {
      // Score based on duration (sweet spot is 4-12 hours)
      if (layover.durationMinutes >= 240 && layover.durationMinutes <= 720) {
        score += 50
      } else if (layover.durationMinutes >= 120 && layover.durationMinutes <= 1440) {
        score += 30
      } else {
        score += 10
      }

      // Bonus for major hub airports (would need airport data)
      const majorHubs = ["DOH", "DXB", "IST", "SIN", "AMS", "CDG", "LHR", "FRA"]
      if (majorHubs.includes(layover.airport)) {
        score += 20
      }
    }

    return Math.min(score, 100) // Cap at 100
  }

  private async enrichWithLayoverPackages(offers: UnifiedFlightOffer[]): Promise<void> {
    // This would fetch layover packages from the database for each eligible layover
    // For now, we'll add mock packages
    for (const offer of offers) {
      for (const layover of offer.layovers) {
        if (layover.isEligibleForPackages) {
          offer.layoverPackages = offer.layoverPackages || []
          offer.layoverPackages.push({
            id: `pkg-${layover.airport}-1`,
            name: `${layover.city} City Tour`,
            description: `Explore the highlights of ${layover.city} during your layover`,
            duration: "4 hours",
            price: 89,
            currency: "USD",
            provider: "GetYourGuide",
            includes: ["Transportation", "Guide", "Entry fees"],
          })
        }
      }
    }
  }

  private mapCabinClassToKiwi(cabinClass?: string): "C" | "F" | "M" | "W" {
    switch (cabinClass) {
      case "economy":
        return "M"
      case "premium_economy":
        return "W"
      case "business":
        return "C"
      case "first":
        return "F"
      default:
        return "M"
    }
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Flight tracking methods using OpenSky
  async getFlightStatus(flightNumber: string): Promise<any> {
    // This would parse the flight number and get real-time status
    const states = await this.opensky.getAllStates()
    return states.states.find((state) =>
      state.callsign?.trim().toLowerCase().includes(flightNumber.toLowerCase()),
    )
  }

  async getFlightsInArea(bounds: { north: number; south: number; east: number; west: number }) {
    return this.opensky.getAllStates(undefined, undefined, {
      lamin: bounds.south,
      lomin: bounds.west,
      lamax: bounds.north,
      lomax: bounds.east,
    })
  }
}
