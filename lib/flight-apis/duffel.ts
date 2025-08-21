interface DuffelConfig {
  apiKey: string
  baseUrl: string
}

interface DuffelSearchParams {
  origin: string
  destination: string
  departure_date: string
  return_date?: string
  passengers: DuffelPassenger[]
  cabin_class?: "economy" | "premium_economy" | "business" | "first"
  max_connections?: number
}

interface DuffelPassenger {
  type: "adult" | "child" | "infant_without_seat"
  age?: number
}

interface DuffelOfferRequest {
  slices: DuffelSlice[]
  passengers: DuffelPassenger[]
  cabin_class?: string
  max_connections?: number
}

interface DuffelSlice {
  origin: string
  destination: string
  departure_date: string
}

interface DuffelOffer {
  id: string
  live_mode: boolean
  created_at: string
  expires_at: string
  updated_at: string
  slices: DuffelOfferSlice[]
  passengers: DuffelOfferPassenger[]
  base_amount: string
  base_currency: string
  tax_amount: string
  tax_currency: string
  total_amount: string
  total_currency: string
  total_emissions_kg: string
  owner: DuffelAirline
  payment_requirements: DuffelPaymentRequirements
  conditions: DuffelConditions
  available_services: DuffelService[]
}

interface DuffelOfferSlice {
  id: string
  origin: DuffelPlace
  destination: DuffelPlace
  departure_date: string
  arrival_date: string
  duration: string
  segments: DuffelSegment[]
  conditions: DuffelSliceConditions
}

interface DuffelSegment {
  id: string
  origin: DuffelPlace
  destination: DuffelPlace
  departing_at: string
  arriving_at: string
  duration: string
  aircraft: DuffelAircraft
  operating_carrier: DuffelAirline
  marketing_carrier: DuffelAirline
  operating_carrier_flight_number: string
  marketing_carrier_flight_number: string
  passengers: DuffelSegmentPassenger[]
}

interface DuffelPlace {
  id: string
  name: string
  iata_code: string
  iata_country_code: string
  icao_code: string
  time_zone: string
  type: string
  latitude: number
  longitude: number
  city: DuffelCity
}

interface DuffelCity {
  id: string
  name: string
  iata_code: string
  iata_country_code: string
}

interface DuffelAircraft {
  id: string
  name: string
  iata_code: string
  icao_code: string
}

interface DuffelAirline {
  id: string
  name: string
  iata_code: string
  icao_code: string
  logo_symbol_url: string
  logo_lockup_url: string
}

interface DuffelSegmentPassenger {
  passenger_id: string
  cabin_class: string
  cabin_class_marketing_name: string
  fare_basis_code: string
  baggages: DuffelBaggage[]
}

interface DuffelBaggage {
  type: string
  quantity: number
}

interface DuffelOfferPassenger {
  id: string
  type: string
  age?: number
  loyalty_programme_accounts: any[]
  family_name?: string
  given_name?: string
}

interface DuffelPaymentRequirements {
  requires_instant_payment: boolean
  payment_required_by: string
  price_guarantee_expires_at: string
}

interface DuffelConditions {
  change_before_departure?: DuffelCondition
  cancel_before_departure?: DuffelCondition
  refund_before_departure?: DuffelCondition
}

interface DuffelCondition {
  allowed: boolean
  penalty_amount?: string
  penalty_currency?: string
}

interface DuffelSliceConditions {
  advance_seat_selection?: boolean
  priority_check_in?: boolean
  priority_boarding?: boolean
}

interface DuffelService {
  id: string
  type: string
  metadata: any
  maximum_quantity: number
  passenger_id?: string
  segment_id?: string
  total_amount: string
  total_currency: string
}

export class DuffelAPI {
  private config: DuffelConfig

  constructor(config: DuffelConfig) {
    this.config = config
    if (!config.apiKey) {
      console.warn("[v0] Duffel API: No API key provided")
    }
    if (!config.baseUrl) {
      console.warn("[v0] Duffel API: No base URL provided")
    }
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs = 10000,
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timed out after ${timeoutMs}ms`)
      }
      throw error
    }
  }

  async searchOffers(params: DuffelSearchParams): Promise<DuffelOffer[]> {
    if (!this.config.apiKey) {
      throw new Error("Duffel API key is not configured")
    }

    console.log("[v0] Duffel API: Creating offer request with params:", JSON.stringify(params))

    const offerRequest: DuffelOfferRequest = {
      slices: [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departure_date,
        },
      ],
      passengers: params.passengers,
      cabin_class: params.cabin_class,
      max_connections: params.max_connections,
    }

    // Add return slice if return date provided
    if (params.return_date) {
      offerRequest.slices.push({
        origin: params.destination,
        destination: params.origin,
        departure_date: params.return_date,
      })
    }

    console.log(
      "[v0] Duffel API: Making offer request to:",
      `${this.config.baseUrl}/air/offer_requests`,
    )

    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/air/offer_requests`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "Duffel-Version": "v2",
          },
          body: JSON.stringify({
            data: offerRequest,
          }),
        },
        15000,
      ) // 15 second timeout

      console.log("[v0] Duffel API: Offer request response status:", response.status)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorBody = await response.text()
          console.log("[v0] Duffel API: Error response body:", errorBody)

          // Try to parse as JSON for structured error
          try {
            const errorJson = JSON.parse(errorBody)
            if (errorJson.errors && errorJson.errors.length > 0) {
              errorMessage = errorJson.errors
                .map((err: any) => err.message || err.detail || err.title)
                .join(", ")
            } else if (errorJson.message) {
              errorMessage = errorJson.message
            }
          } catch {
            // If not JSON, use the raw text
            if (errorBody) {
              errorMessage = errorBody
            }
          }
        } catch (readError) {
          console.log("[v0] Duffel API: Could not read error response:", readError)
        }

        throw new Error(`Duffel offer request failed: ${errorMessage}`)
      }

      const data = await response.json()
      console.log("[v0] Duffel API: Offer request successful, ID:", data.data?.id)

      // Get the offer request ID and fetch offers
      const offerRequestId = data.data.id
      return this.getOffers(offerRequestId)
    } catch (error) {
      console.error("[v0] Duffel API: Search offers error:", error)
      throw error
    }
  }

  private async getOffers(offerRequestId: string): Promise<DuffelOffer[]> {
    console.log("[v0] Duffel API: Fetching offers for request ID:", offerRequestId)

    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/air/offers?offer_request_id=${offerRequestId}&sort=total_amount`,
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            Accept: "application/json",
            "Duffel-Version": "v2",
          },
        },
        10000, // 10 second timeout
      )

      console.log("[v0] Duffel API: Get offers response status:", response.status)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorBody = await response.text()
          console.log("[v0] Duffel API: Get offers error response body:", errorBody)

          try {
            const errorJson = JSON.parse(errorBody)
            if (errorJson.errors && errorJson.errors.length > 0) {
              errorMessage = errorJson.errors
                .map((err: any) => err.message || err.detail || err.title)
                .join(", ")
            } else if (errorJson.message) {
              errorMessage = errorJson.message
            }
          } catch {
            if (errorBody) {
              errorMessage = errorBody
            }
          }
        } catch (readError) {
          console.log("[v0] Duffel API: Could not read get offers error response:", readError)
        }

        throw new Error(`Duffel offers fetch failed: ${errorMessage}`)
      }

      const data = await response.json()
      console.log("[v0] Duffel API: Retrieved", data.data?.length || 0, "offers")
      return data.data || []
    } catch (error) {
      console.error("[v0] Duffel API: Get offers error:", error)
      throw error
    }
  }

  async getAirports(query?: string): Promise<DuffelPlace[]> {
    const url = query
      ? `${this.config.baseUrl}/air/airports?name=${encodeURIComponent(query)}`
      : `${this.config.baseUrl}/air/airports`

    const response = await this.fetchWithTimeout(
      url,
      {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          Accept: "application/json",
          "Duffel-Version": "v2",
        },
      },
      8000,
    ) // 8 second timeout

    if (!response.ok) {
      throw new Error(`Duffel airports fetch failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  }

  async getAirlines(): Promise<DuffelAirline[]> {
    const response = await this.fetchWithTimeout(
      `${this.config.baseUrl}/air/airlines`,
      {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          Accept: "application/json",
          "Duffel-Version": "v2",
        },
      },
      8000,
    ) // 8 second timeout

    if (!response.ok) {
      throw new Error(`Duffel airlines fetch failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  }
}
