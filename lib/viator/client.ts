import { z } from "zod"
import { cacheManager, CacheKeys, CacheTags } from "../cache-manager"
import { errorTracker } from "../error-tracking"

const VIATOR_ENVIRONMENT = process.env.VIATOR_ENVIRONMENT || "sandbox"
const VIATOR_API_BASE_URL =
  VIATOR_ENVIRONMENT === "production"
    ? "https://api.viator.com/partner"
    : "https://api.sandbox.viator.com/partner"
const VIATOR_API_KEY = process.env.VIATOR_API_KEY || ""

// Enhanced response schemas
const ViatorAvailabilitySchema = z.object({
  productCode: z.string(),
  status: z.enum(["AVAILABLE", "LIMITED", "UNAVAILABLE"]),
  nextAvailableDate: z.string().optional(),
  pricing: z
    .object({
      summary: z.object({
        fromPrice: z.string(),
        fromPriceBeforeDiscount: z.string().optional(),
        currency: z.string(),
      }),
    })
    .optional(),
  bookingRequirements: z
    .object({
      requiresAdultForBooking: z.boolean(),
      maxTravelersPerBooking: z.number().optional(),
    })
    .optional(),
})

const ViatorBookingSchema = z.object({
  bookingId: z.string(),
  status: z.enum(["CONFIRMED", "PENDING", "CANCELLED", "FAILED"]),
  confirmationCode: z.string().optional(),
  totalPrice: z.object({
    amount: z.string(),
    currency: z.string(),
  }),
  bookingDate: z.string(),
  travelDate: z.string(),
  cancellationPolicy: z
    .object({
      type: z.string(),
      description: z.string(),
      fees: z
        .array(
          z.object({
            amount: z.string(),
            percentage: z.number().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
})

export type ViatorAvailability = z.infer<typeof ViatorAvailabilitySchema>
export type ViatorBooking = z.infer<typeof ViatorBookingSchema>

export const ViatorProductSchema = z.object({
  productCode: z.string(),
  title: z.string(),
  description: z.string(),
  duration: z.string().optional(),
  price: z.object({
    amount: z.number(),
    currency: z.string(),
  }),
  images: z.array(
    z.object({
      url: z.string(),
      caption: z.string().optional(),
    }),
  ),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  location: z.object({
    city: z.string(),
    country: z.string(),
    coordinates: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
      })
      .optional(),
  }),
  categories: z.array(z.string()),
  highlights: z.array(z.string()).optional(),
})

export type ViatorProduct = z.infer<typeof ViatorProductSchema>

// Destination ID mappings from Viator
const VIATOR_DESTINATION_IDS: Record<string, number> = {
  Dubai: 828,
  Istanbul: 585,
  Singapore: 18,
  Doha: 684, // Qatar
  Amsterdam: 10177,
  Reykjavik: 24794,
  "New York": 3,
  London: 1,
  Paris: 2,
  Rome: 19,
  Tokyo: 334,
  Sydney: 357,
}

export class ViatorClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || VIATOR_API_KEY
    this.baseUrl = VIATOR_API_BASE_URL

    if (!this.apiKey) {
      throw new Error("Viator API key is required")
    }
  }

  /**
   * Get destination ID from city name
   */
  private getDestinationId(city: string): number | null {
    return VIATOR_DESTINATION_IDS[city] || null
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 3,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            Accept: "application/json",
            "Accept-Language": "en-US",
            "Content-Type": "application/json",
            "exp-api-key": this.apiKey,
            "User-Agent": "LayoverHQ/1.0",
            ...options.headers,
          },
          // timeout: 10000, // 10 second timeout (not supported in fetch)
        })

        if (response.ok) {
          const data = await response.json()
          return data
        }

        // Handle specific error cases
        if (response.status === 401) {
          throw new Error("Viator API: Invalid API key or authentication failed")
        }

        if (response.status === 403) {
          throw new Error("Viator API: Access forbidden - check API permissions")
        }

        if (response.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = response.headers.get("Retry-After")
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * attempt

          if (attempt < retries) {
            console.warn(
              `Viator API rate limited, retrying in ${waitTime}ms (attempt ${attempt}/${retries})`,
            )
            await this.sleep(waitTime)
            continue
          }
        }

        if (response.status >= 500 && attempt < retries) {
          // Server error - retry with exponential backoff
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
          console.warn(
            `Viator API server error, retrying in ${waitTime}ms (attempt ${attempt}/${retries})`,
          )
          await this.sleep(waitTime)
          continue
        }

        const errorText = await response.text()
        throw new Error(`Viator API error: ${response.status} - ${errorText}`)
      } catch (error) {
        if (attempt === retries) {
          await errorTracker.trackError(error as Error, {
            service: "viator-client",
            operation: endpoint,
            metadata: { url },
          })
          throw error
        }

        // If it's not a network error, don't retry
        if (error instanceof Error && !error.message.includes("fetch")) {
          throw error
        }

        // Network error - wait and retry
        const waitTime = 1000 * attempt
        console.warn(
          `Viator API network error, retrying in ${waitTime}ms (attempt ${attempt}/${retries})`,
        )
        await this.sleep(waitTime)
      }
    }

    throw new Error("Max retries exceeded")
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Search for experiences/activities in a specific destination
   */
  async searchProducts(params: {
    destination: string
    startDate?: string
    endDate?: string
    currencyCode?: string
    limit?: number
  }) {
    const searchParams = new URLSearchParams({
      destination: params.destination,
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
      ...(params.currencyCode && { currencyCode: params.currencyCode }),
      limit: String(params.limit || 20),
    })

    return this.makeRequest<any>(`/products/search?${searchParams}`)
  }

  /**
   * Get detailed information about a specific product
   */
  async getProduct(productCode: string, currencyCode: string = "USD") {
    return this.makeRequest<any>(`/products/${productCode}?currencyCode=${currencyCode}`)
  }

  /**
   * Get real-time availability for a specific product
   */
  async getAvailability(
    productCode: string,
    travelDate: string,
    currencyCode: string = "USD",
    useCache: boolean = true,
  ): Promise<ViatorAvailability> {
    const cacheKey = `viator:availability:${productCode}:${travelDate}:${currencyCode}`

    if (useCache) {
      const cached = await cacheManager.get<ViatorAvailability>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const response = await this.makeRequest<any>(`/availability/schedules`, {
        method: "POST",
        body: JSON.stringify({
          productCode,
          travelDate,
          currencyCode,
        }),
      })

      // Parse and validate response
      const availability = ViatorAvailabilitySchema.parse({
        productCode,
        status: response.available ? "AVAILABLE" : "UNAVAILABLE",
        nextAvailableDate: response.nextAvailableDate,
        pricing: response.pricing,
        bookingRequirements: response.bookingRequirements,
      })

      // Cache for 10 minutes (availability changes frequently)
      if (useCache) {
        await cacheManager.set(cacheKey, availability, {
          ttl: 600000, // 10 minutes
          tags: [CacheTags.LAYOVER, "viator"],
        })
      }

      return availability
    } catch (error) {
      console.error(`Failed to get availability for product ${productCode}:`, error)
      // Return fallback availability
      return {
        productCode,
        status: "UNAVAILABLE",
        nextAvailableDate: undefined,
        pricing: undefined,
        bookingRequirements: undefined,
      }
    }
  }

  /**
   * Check availability for multiple products efficiently
   */
  async getBulkAvailability(
    productCodes: string[],
    travelDate: string,
    currencyCode: string = "USD",
  ): Promise<ViatorAvailability[]> {
    const MAX_BATCH_SIZE = 10 // Viator API limit
    const batches = []

    for (let i = 0; i < productCodes.length; i += MAX_BATCH_SIZE) {
      batches.push(productCodes.slice(i, i + MAX_BATCH_SIZE))
    }

    const results: ViatorAvailability[] = []

    for (const batch of batches) {
      const batchPromises = batch.map((productCode) =>
        this.getAvailability(productCode, travelDate, currencyCode),
      )

      const batchResults = await Promise.allSettled(batchPromises)

      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          results.push(result.value)
        } else {
          console.error(`Failed to get availability for ${batch[index]}:`, result.reason)
          results.push({
            productCode: batch[index],
            status: "UNAVAILABLE",
          })
        }
      })
    }

    return results
  }

  /**
   * Search for layover-friendly experiences with enhanced filtering and caching
   */
  async searchLayoverExperiences(params: {
    city: string
    maxDurationHours?: number
    minDurationHours?: number
    date?: string
    currencyCode?: string
    categories?: string[]
    maxPrice?: number
    includeAvailability?: boolean
  }): Promise<ViatorProduct[]> {
    const cacheKey = `viator:layover:${params.city}:${JSON.stringify(params)}`

    // Check cache first
    const cached = await cacheManager.get<ViatorProduct[]>(cacheKey)
    if (cached) {
      return cached
    }

    // Get destination ID from city name
    const destId = this.getDestinationId(params.city)
    if (!destId) {
      console.warn(`No destination ID found for ${params.city}`)
      return []
    }

    try {
      const searchBody = {
        destId,
        currencyCode: params.currencyCode || "USD",
        sortOrder: "POPULARITY",
        paging: {
          offset: 0,
          limit: 50, // Get more results for better filtering
        },
        filters: {
          duration: params.maxDurationHours ? `PT0H-PT${params.maxDurationHours}H` : undefined,
          priceRange: params.maxPrice ? `0-${params.maxPrice}` : undefined,
          categories: params.categories,
        },
      }

      const searchResults = await this.makeRequest<any>("/products/search", {
        method: "POST",
        body: JSON.stringify(searchBody),
      })

      let products = searchResults.products || []

      // Enhanced filtering for layover suitability
      products = products.filter((product: any) => {
        // Duration filtering
        if (product.duration) {
          const hours = this.parseDurationToHours(product.duration)

          if (params.maxDurationHours && hours > params.maxDurationHours) {
            return false
          }

          if (params.minDurationHours && hours < params.minDurationHours) {
            return false
          }
        }

        // Exclude overnight or multi-day tours for layovers
        if (
          product.title &&
          (product.title.toLowerCase().includes("overnight") ||
            product.title.toLowerCase().includes("multi-day") ||
            product.title.toLowerCase().includes("sleep"))
        ) {
          return false
        }

        // Prefer tours that start frequently or have flexible timing
        if (product.operationalDays && product.operationalDays.length < 3) {
          return false // Tours that only operate a few days a week
        }

        return true
      })

      // Sort by layover suitability score
      products = products.sort((a: any, b: any) => {
        const aScore = this.calculateLayoverSuitabilityScore(a)
        const bScore = this.calculateLayoverSuitabilityScore(b)
        return bScore - aScore
      })

      // Transform to our schema
      const transformedProducts: ViatorProduct[] = products.map((product: any) => ({
        productCode: product.productCode,
        title: product.title,
        description: product.shortDescription || product.description,
        duration: product.duration,
        price: {
          amount: parseFloat(product.price?.fromPrice || "0"),
          currency: product.price?.currency || params.currencyCode || "USD",
        },
        images:
          product.images?.map((img: any) => ({
            url: img.url,
            caption: img.caption,
          })) || [],
        rating: product.rating || 0,
        reviewCount: product.reviewCount || 0,
        location: {
          city: params.city,
          country: product.country || "",
          coordinates: product.location,
        },
        categories: product.categories || [],
        highlights: product.highlights || [],
      }))

      // Get availability if requested
      if (params.includeAvailability && params.date) {
        const availabilityPromises = transformedProducts.slice(0, 10).map(async (product) => {
          try {
            const availability = await this.getAvailability(
              product.productCode,
              params.date!,
              params.currencyCode,
            )
            return { ...product, availability }
          } catch (error) {
            return product
          }
        })

        const productsWithAvailability = await Promise.allSettled(availabilityPromises)
        const availableProducts = productsWithAvailability
          .filter(
            (
              result,
            ): result is PromiseFulfilledResult<
              ViatorProduct & { availability?: ViatorAvailability }
            > => result.status === "fulfilled",
          )
          .map((result) => result.value)
          .filter((product) => !product.availability || product.availability.status === "AVAILABLE")

        // Cache results for 30 minutes
        await cacheManager.set(cacheKey, availableProducts.slice(0, 20), {
          ttl: 1800000, // 30 minutes
          tags: [CacheTags.LAYOVER, "viator", `city:${params.city}`],
        })

        return availableProducts.slice(0, 20)
      }

      const finalProducts = transformedProducts.slice(0, 20)

      // Cache results for 1 hour
      await cacheManager.set(cacheKey, finalProducts, {
        ttl: 3600000, // 1 hour
        tags: [CacheTags.LAYOVER, "viator", `city:${params.city}`],
      })

      return finalProducts
    } catch (error) {
      console.error(`Error searching layover experiences for ${params.city}:`, error)
      await errorTracker.trackError(error as Error, {
        service: "viator-client",
        operation: "searchLayoverExperiences",
        metadata: {
          city: params.city,
          params,
        },
      })

      // Return empty array instead of throwing
      return []
    }
  }

  /**
   * Calculate how suitable a product is for layovers
   */
  private calculateLayoverSuitabilityScore(product: any): number {
    let score = 0

    // Base score from rating and reviews
    if (product.rating) {
      score += product.rating * 10
    }

    if (product.reviewCount) {
      score += Math.min(product.reviewCount / 10, 20) // Max 20 points
    }

    // Duration preference (2-4 hours is ideal for layovers)
    if (product.duration) {
      const hours = this.parseDurationToHours(product.duration)
      if (hours >= 2 && hours <= 4) {
        score += 30
      } else if (hours >= 1 && hours <= 6) {
        score += 20
      } else {
        score += 5
      }
    }

    // Prefer certain categories for layovers
    const layoverFriendlyCategories = [
      "food-drink",
      "cultural",
      "sightseeing",
      "shopping",
      "walking-tours",
    ]

    if (product.categories) {
      const hasLayoverCategory = product.categories.some((cat: string) =>
        layoverFriendlyCategories.some((friendly) => cat.toLowerCase().includes(friendly)),
      )
      if (hasLayoverCategory) {
        score += 25
      }
    }

    // Prefer tours with frequent departures
    if (product.operationalDays && product.operationalDays.length >= 6) {
      score += 15
    }

    // Prefer tours that don't require advance booking
    if (product.bookingRequirements && !product.bookingRequirements.requiresAdvanceBooking) {
      score += 10
    }

    return score
  }

  /**
   * Create a booking for a Viator experience
   */
  async createBooking(params: {
    productCode: string
    travelDate: string
    travelers: Array<{
      ageBand: "ADULT" | "CHILD" | "INFANT"
      firstName: string
      lastName: string
      leadTraveler?: boolean
    }>
    contact: {
      email: string
      phone: string
    }
    payment?: {
      method: "CREDIT_CARD" | "PAYPAL"
      token?: string
    }
    currencyCode?: string
    partnerReference?: string
  }): Promise<ViatorBooking> {
    try {
      const bookingBody = {
        productCode: params.productCode,
        travelDate: params.travelDate,
        currencyCode: params.currencyCode || "USD",
        partnerReference: params.partnerReference || `layoverhq-${Date.now()}`,
        travelers: params.travelers,
        booker: {
          email: params.contact.email,
          phone: params.contact.phone,
        },
        payment: params.payment,
      }

      const response = await this.makeRequest<any>("/bookings", {
        method: "POST",
        body: JSON.stringify(bookingBody),
      })

      const booking = ViatorBookingSchema.parse({
        bookingId: response.bookingId,
        status: response.status,
        confirmationCode: response.confirmationCode,
        totalPrice: response.totalPrice,
        bookingDate: response.bookingDate,
        travelDate: params.travelDate,
        cancellationPolicy: response.cancellationPolicy,
      })

      // Cache booking for quick retrieval
      await cacheManager.set(`viator:booking:${booking.bookingId}`, booking, {
        ttl: 86400000, // 24 hours
        tags: [CacheTags.BOOKING, "viator"],
      })

      return booking
    } catch (error) {
      console.error("Failed to create Viator booking:", error)
      await errorTracker.trackError(error as Error, {
        service: "viator-client",
        operation: "createBooking",
        metadata: {
          productCode: params.productCode,
          travelDate: params.travelDate,
        },
      })
      throw error
    }
  }

  /**
   * Get booking details
   */
  async getBooking(bookingId: string): Promise<ViatorBooking | null> {
    // Check cache first
    const cached = await cacheManager.get<ViatorBooking>(`viator:booking:${bookingId}`)
    if (cached) {
      return cached
    }

    try {
      const response = await this.makeRequest<any>(`/bookings/${bookingId}`)

      const booking = ViatorBookingSchema.parse({
        bookingId: response.bookingId,
        status: response.status,
        confirmationCode: response.confirmationCode,
        totalPrice: response.totalPrice,
        bookingDate: response.bookingDate,
        travelDate: response.travelDate,
        cancellationPolicy: response.cancellationPolicy,
      })

      // Cache for future requests
      await cacheManager.set(`viator:booking:${bookingId}`, booking, {
        ttl: 3600000, // 1 hour
        tags: [CacheTags.BOOKING, "viator"],
      })

      return booking
    } catch (error) {
      console.error(`Failed to get booking ${bookingId}:`, error)
      return null
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(
    bookingId: string,
    reason?: string,
  ): Promise<{ success: boolean; refundAmount?: string; cancellationFee?: string }> {
    try {
      const response = await this.makeRequest<any>(`/bookings/${bookingId}/cancel`, {
        method: "POST",
        body: JSON.stringify({
          reason: reason || "Customer requested cancellation",
        }),
      })

      // Invalidate cached booking
      await cacheManager.delete(`viator:booking:${bookingId}`)

      return {
        success: true,
        refundAmount: response.refundAmount,
        cancellationFee: response.cancellationFee,
      }
    } catch (error) {
      console.error(`Failed to cancel booking ${bookingId}:`, error)
      return { success: false }
    }
  }

  /**
   * Get popular experiences for a destination with enhanced caching
   */
  async getPopularExperiences(destination: string, limit: number = 10): Promise<ViatorProduct[]> {
    const cacheKey = `viator:popular:${destination}:${limit}`

    const cached = await cacheManager.get<ViatorProduct[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const results = await this.searchLayoverExperiences({
        city: destination,
        maxDurationHours: 8,
        categories: ["cultural", "sightseeing", "food-drink"],
      })

      const popular = results.slice(0, limit)

      // Cache for 2 hours
      await cacheManager.set(cacheKey, popular, {
        ttl: 7200000, // 2 hours
        tags: [CacheTags.LAYOVER, "viator", `city:${destination}`],
      })

      return popular
    } catch (error) {
      console.error(`Failed to get popular experiences for ${destination}:`, error)
      return []
    }
  }

  /**
   * Helper to parse duration strings to hours
   */
  private parseDurationToHours(duration: string): number {
    // Parse duration strings like "3 hours", "90 minutes", "Half day", etc.
    const lowerDuration = duration.toLowerCase()

    if (lowerDuration.includes("minute")) {
      const minutes = parseInt(duration.match(/\d+/)?.[0] || "0")
      return minutes / 60
    }

    if (lowerDuration.includes("hour")) {
      return parseInt(duration.match(/\d+/)?.[0] || "0")
    }

    if (lowerDuration.includes("half day")) {
      return 4
    }

    if (lowerDuration.includes("full day")) {
      return 8
    }

    // Default to assuming it's okay for layovers
    return 3
  }
}

// Singleton instance for server-side use
let viatorClient: ViatorClient | null = null

export function getViatorClient(): ViatorClient {
  if (!viatorClient) {
    viatorClient = new ViatorClient()
  }
  return viatorClient
}
