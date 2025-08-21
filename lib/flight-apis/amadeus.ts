interface AmadeusConfig {
  clientId: string
  clientSecret: string
  baseUrl: string
}

interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  children?: number
  infants?: number
  travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST"
  nonStop?: boolean
  maxPrice?: number
  max?: number
}

interface AmadeusFlightOffer {
  id: string
  source: string
  instantTicketingRequired: boolean
  nonHomogeneous: boolean
  oneWay: boolean
  lastTicketingDate: string
  numberOfBookableSeats: number
  itineraries: AmadeusItinerary[]
  price: AmadeusPrice
  pricingOptions: AmadeusPricingOptions
  validatingAirlineCodes: string[]
  travelerPricings: AmadeusTravelerPricing[]
}

interface AmadeusItinerary {
  duration: string
  segments: AmadeusSegment[]
}

interface AmadeusSegment {
  departure: AmadeusEndpoint
  arrival: AmadeusEndpoint
  carrierCode: string
  number: string
  aircraft: { code: string }
  operating?: { carrierCode: string }
  duration: string
  id: string
  numberOfStops: number
  blacklistedInEU: boolean
}

interface AmadeusEndpoint {
  iataCode: string
  terminal?: string
  at: string
}

interface AmadeusPrice {
  currency: string
  total: string
  base: string
  fees: AmadeusFee[]
  grandTotal: string
}

interface AmadeusFee {
  amount: string
  type: string
}

interface AmadeusPricingOptions {
  fareType: string[]
  includedCheckedBagsOnly: boolean
}

interface AmadeusTravelerPricing {
  travelerId: string
  fareOption: string
  travelerType: string
  price: AmadeusPrice
  fareDetailsBySegment: AmadeusFareDetails[]
}

interface AmadeusFareDetails {
  segmentId: string
  cabin: string
  fareBasis: string
  class: string
  includedCheckedBags: { quantity: number }
}

export class AmadeusAPI {
  private config: AmadeusConfig
  private accessToken: string | null = null
  private tokenExpiry = 0

  constructor(config: AmadeusConfig) {
    this.config = config
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

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
      throw new Error(`Amadeus auth failed: ${response.statusText}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000 // 1 minute buffer

    return this.accessToken
  }

  async searchFlights(params: FlightSearchParams): Promise<AmadeusFlightOffer[]> {
    const token = await this.getAccessToken()

    const searchParams = new URLSearchParams({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      adults: params.adults.toString(),
      max: (params.max || 50).toString(),
    })

    if (params.returnDate) {
      searchParams.append("returnDate", params.returnDate)
    }
    if (params.children) {
      searchParams.append("children", params.children.toString())
    }
    if (params.infants) {
      searchParams.append("infants", params.infants.toString())
    }
    if (params.travelClass) {
      searchParams.append("travelClass", params.travelClass)
    }
    if (params.nonStop) {
      searchParams.append("nonStop", "true")
    }
    if (params.maxPrice) {
      searchParams.append("maxPrice", params.maxPrice.toString())
    }

    const response = await fetch(
      `${this.config.baseUrl}/v2/shopping/flight-offers?${searchParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Amadeus flight search failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  }

  async getAirportInfo(iataCode: string) {
    const token = await this.getAccessToken()

    const response = await fetch(
      `${this.config.baseUrl}/v1/reference-data/locations?subType=AIRPORT&keyword=${iataCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Amadeus airport info failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  }

  async getFlightStatus(carrierCode: string, flightNumber: string, scheduledDepartureDate: string) {
    const token = await this.getAccessToken()

    const response = await fetch(
      `${this.config.baseUrl}/v2/schedule/flights?carrierCode=${carrierCode}&flightNumber=${flightNumber}&scheduledDepartureDate=${scheduledDepartureDate}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Amadeus flight status failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  }
}
