interface KiwiConfig {
  multiCityApiKey: string
  nomadApiKey: string
  onewayApiKey: string
  multiCityAffiliateId: string
  nomadAffiliateId: string
  onewayAffiliateId: string
}

interface KiwiSearchParams {
  fly_from: string
  fly_to: string
  date_from: string
  date_to?: string
  return_from?: string
  return_to?: string
  nights_in_dst_from?: number
  nights_in_dst_to?: number
  flight_type?: "round" | "oneway"
  adults?: number
  children?: number
  infants?: number
  selected_cabins?: "M" | "W" | "C" | "F" // Economy, Premium Economy, Business, First
  price_from?: number
  price_to?: number
  max_stopovers?: number
  max_sector_stopovers?: number
  stopover_from?: string
  stopover_to?: string
  limit?: number
}

interface KiwiFlightData {
  id: string
  flyFrom: string
  flyTo: string
  cityFrom: string
  cityTo: string
  countryFrom: { code: string; name: string }
  countryTo: { code: string; name: string }
  price: number
  airlines: string[]
  route: KiwiRoute[]
  booking_token: string
  deep_link: string
  tracking_pixel: string
  duration: { departure: number; return: number; total: number }
  quality: number
  has_airport_change: boolean
  technical_stops: number
  throw_away_ticketing: boolean
  hidden_city_ticketing: boolean
  virtual_interlining: boolean
  local_arrival: string
  local_departure: string
  utc_arrival: string
  utc_departure: string
  nightsInDest?: number
}

interface KiwiRoute {
  id: string
  combination_id: string
  flyFrom: string
  flyTo: string
  cityFrom: string
  cityTo: string
  airline: string
  flight_no: number
  operating_carrier: string
  operating_flight_no: string
  fare_basis: string
  fare_category: string
  fare_classes: string
  fare_family: string
  return: number
  bags_recheck_required: boolean
  vi_connection: boolean
  guarantee: boolean
  equipment: { name: string }
  vehicle_type: string
  local_arrival: string
  local_departure: string
  utc_arrival: string
  utc_departure: string
}

export class KiwiAPI {
  private config: KiwiConfig

  constructor(config: KiwiConfig) {
    this.config = config
  }

  private getApiKey(searchType: "multicity" | "nomad" | "oneway"): string {
    switch (searchType) {
      case "multicity":
        return this.config.multiCityApiKey
      case "nomad":
        return this.config.nomadApiKey
      case "oneway":
        return this.config.onewayApiKey
      default:
        return this.config.onewayApiKey
    }
  }

  private getAffiliateId(searchType: "multicity" | "nomad" | "oneway"): string {
    switch (searchType) {
      case "multicity":
        return this.config.multiCityAffiliateId
      case "nomad":
        return this.config.nomadAffiliateId
      case "oneway":
        return this.config.onewayAffiliateId
      default:
        return this.config.onewayAffiliateId
    }
  }

  async searchFlights(
    params: KiwiSearchParams,
    searchType: "multicity" | "nomad" | "oneway" = "oneway",
  ): Promise<KiwiFlightData[]> {
    const apiKey = this.getApiKey(searchType)
    const affiliateId = this.getAffiliateId(searchType)

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    // Add affiliate ID
    searchParams.append("partner", affiliateId)

    const response = await fetch(`https://api.tequila.kiwi.com/v2/search?${searchParams}`, {
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Kiwi flight search failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  }

  async getNomadFlights(params: {
    fly_from: string
    date_from: string
    date_to: string
    nights_in_dst_from?: number
    nights_in_dst_to?: number
    limit?: number
  }): Promise<KiwiFlightData[]> {
    return this.searchFlights(
      {
        ...params,
        fly_to: "anywhere", // Nomad searches don't have a specific destination
        flight_type: "round",
      } as KiwiSearchParams,
      "nomad",
    )
  }

  async getMultiCityFlights(params: {
    fly_from: string
    fly_to: string[]
    date_from: string
    date_to: string
    adults?: number
    limit?: number
  }): Promise<KiwiFlightData[]> {
    const searchParams: KiwiSearchParams = {
      fly_from: params.fly_from,
      fly_to: params.fly_to.join(","),
      date_from: params.date_from,
      date_to: params.date_to,
      adults: params.adults || 1,
      limit: params.limit || 50,
    }

    return this.searchFlights(searchParams, "multicity")
  }

  async getLocationInfo(query: string) {
    const response = await fetch(
      `https://api.tequila.kiwi.com/locations/query?term=${encodeURIComponent(query)}&location_types=airport&location_types=city&limit=10`,
      {
        headers: {
          apikey: this.config.onewayApiKey,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Kiwi location search failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.locations || []
  }
}
