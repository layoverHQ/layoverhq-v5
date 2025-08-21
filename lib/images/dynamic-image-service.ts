import { cache } from "react"

// Image source configurations
const IMAGE_SOURCES = {
  unsplash: {
    baseUrl: "https://api.unsplash.com/search/photos",
    collections: {
      dubai: "1709967", // Dubai skyline collection
      istanbul: "3782967", // Istanbul collection
      singapore: "1709964", // Singapore collection
      paris: "3330445", // Paris collection
      london: "3330448", // London collection
      amsterdam: "1709963", // Amsterdam collection
      doha: "9248817", // Qatar/Doha collection
      reykjavik: "8874435", // Iceland collection
      tokyo: "3330452", // Tokyo collection
      newyork: "2739403", // NYC collection
      sydney: "208574", // Sydney collection
    },
    // Fallback search queries if collections don't work
    queries: {
      dubai: "dubai+skyline+burj+khalifa",
      istanbul: "istanbul+blue+mosque+bosphorus",
      singapore: "singapore+gardens+bay+marina",
      paris: "paris+eiffel+tower+sunset",
      london: "london+tower+bridge+big+ben",
      amsterdam: "amsterdam+canals+bikes",
      doha: "doha+skyline+qatar+souq",
      reykjavik: "reykjavik+iceland+northern+lights",
      tokyo: "tokyo+temple+shibuya+mount+fuji",
      newyork: "new+york+manhattan+skyline",
      sydney: "sydney+opera+house+harbour",
    },
  },
  pexels: {
    baseUrl: "https://api.pexels.com/v1",
    queries: {
      dubai: "dubai skyline",
      istanbul: "istanbul mosque",
      singapore: "singapore city",
      paris: "paris eiffel tower",
      london: "london bridge",
      amsterdam: "amsterdam canal",
      doha: "doha qatar",
      reykjavik: "reykjavik iceland",
      tokyo: "tokyo japan",
      newyork: "new york city",
      sydney: "sydney opera house",
    },
  },
  pixabay: {
    baseUrl: "https://pixabay.com/api",
    queries: {
      dubai: "dubai+city",
      istanbul: "istanbul+turkey",
      singapore: "singapore",
      paris: "paris+france",
      london: "london+uk",
      amsterdam: "amsterdam+netherlands",
      doha: "doha+qatar",
      reykjavik: "reykjavik+iceland",
      tokyo: "tokyo+japan",
      newyork: "new+york+usa",
      sydney: "sydney+australia",
    },
  },
}

// Cache duration in milliseconds (30 days)
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days
const FALLBACK_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days for fallbacks

interface ImageCache {
  url: string
  fetchedAt: number
  source: string
  query?: string
  photographer?: string
  photographerUrl?: string
}

interface DynamicImageOptions {
  width?: number
  height?: number
  quality?: number
  forceRefresh?: boolean
  source?: "unsplash" | "pexels" | "pixabay" | "all"
}

class DynamicImageService {
  private cache: Map<string, ImageCache> = new Map()
  private localStorage: Storage | null = null

  constructor() {
    // Initialize localStorage if available (client-side only)
    if (typeof window !== "undefined") {
      this.localStorage = window.localStorage
      this.loadCacheFromStorage()
    }
  }

  /**
   * Load cached images from localStorage
   */
  private loadCacheFromStorage() {
    if (!this.localStorage) return

    try {
      const cached = this.localStorage.getItem("layoverhq_image_cache")
      if (cached) {
        const parsed = JSON.parse(cached)
        Object.entries(parsed).forEach(([key, value]) => {
          this.cache.set(key, value as ImageCache)
        })
        this.cleanExpiredCache()
      }
    } catch (error) {
      console.error("Failed to load image cache:", error)
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage() {
    if (!this.localStorage) return

    try {
      const cacheObject: Record<string, ImageCache> = {}
      this.cache.forEach((value, key) => {
        cacheObject[key] = value
      })
      this.localStorage.setItem("layoverhq_image_cache", JSON.stringify(cacheObject))
    } catch (error) {
      console.error("Failed to save image cache:", error)
    }
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache() {
    const now = Date.now()
    const expired: string[] = []

    this.cache.forEach((value, key) => {
      if (now - value.fetchedAt > CACHE_DURATION) {
        expired.push(key)
      }
    })

    expired.forEach((key) => this.cache.delete(key))

    if (expired.length > 0) {
      this.saveCacheToStorage()
    }
  }

  /**
   * Get dynamic image URL for a city
   */
  async getCityImage(city: string, options: DynamicImageOptions = {}): Promise<string> {
    const {
      width = 800,
      height = 600,
      quality = 80,
      forceRefresh = false,
      source = "unsplash",
    } = options

    const cacheKey = `${city.toLowerCase()}_${width}x${height}_${source}`

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.fetchedAt < CACHE_DURATION) {
        return cached.url
      }
    }

    // Fetch new image
    try {
      let imageUrl: string

      switch (source) {
        case "unsplash":
          imageUrl = await this.fetchUnsplashImage(city, width, height, quality)
          break
        case "pexels":
          imageUrl = await this.fetchPexelsImage(city, width, height)
          break
        case "pixabay":
          imageUrl = await this.fetchPixabayImage(city, width, height)
          break
        default:
          // Try sources in order until one works
          imageUrl = await this.fetchAnyImage(city, width, height, quality)
      }

      // Cache the result
      const cacheEntry: ImageCache = {
        url: imageUrl,
        fetchedAt: Date.now(),
        source,
        query: city,
      }

      this.cache.set(cacheKey, cacheEntry)
      this.saveCacheToStorage()

      return imageUrl
    } catch (error) {
      console.error(`Failed to fetch image for ${city}:`, error)
      return this.getFallbackImage(city, width, height, quality)
    }
  }

  /**
   * Fetch image from Unsplash
   */
  private async fetchUnsplashImage(
    city: string,
    width: number,
    height: number,
    quality: number,
  ): Promise<string> {
    const accessKey =
      process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || "XUbumLFOkucH6R48_4tO6pI9plfuJtilnYHc462HwZM"
    const cityKey = city.toLowerCase().replace(" ", "")

    // Get query for the city
    const query =
      IMAGE_SOURCES.unsplash.queries[cityKey as keyof typeof IMAGE_SOURCES.unsplash.queries] ||
      `${city} city skyline`

    const params = new URLSearchParams({
      client_id: accessKey,
      query: query,
      per_page: "10",
      orientation: "landscape",
    })

    const response = await fetch(`${IMAGE_SOURCES.unsplash.baseUrl}?${params}`)

    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status}`)
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data = await response.json()

    // Get a random image from the results
    if (!data.results || data.results.length === 0) {
      throw new Error("No images found in Unsplash response")
    }

    const randomIndex = Math.floor(Math.random() * Math.min(data.results.length, 5))
    const photo = data.results[randomIndex]

    // Return the URL with proper parameters for Next.js Image
    const imageUrl = photo.urls?.regular || photo.urls?.full || photo.urls?.raw
    if (!imageUrl) {
      throw new Error("No image URL in Unsplash response")
    }

    // Return URL with our desired dimensions
    return `${imageUrl}&w=${width}&h=${height}&q=${quality}&fit=crop`
  }

  /**
   * Fetch image from Pexels
   */
  private async fetchPexelsImage(city: string, width: number, height: number): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY || "YOUR_PEXELS_KEY"
    const cityKey = city.toLowerCase().replace(" ", "")
    const query =
      IMAGE_SOURCES.pexels.queries[cityKey as keyof typeof IMAGE_SOURCES.pexels.queries] || city

    const response = await fetch(
      `${IMAGE_SOURCES.pexels.baseUrl}/search?query=${query}&per_page=1&page=${Math.floor(Math.random() * 10) + 1}`,
      {
        headers: {
          Authorization: apiKey,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }

    const data = await response.json()
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.large || data.photos[0].src.original
    }

    throw new Error("No images found")
  }

  /**
   * Fetch image from Pixabay
   */
  private async fetchPixabayImage(city: string, width: number, height: number): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_PIXABAY_API_KEY || "YOUR_PIXABAY_KEY"
    const cityKey = city.toLowerCase().replace(" ", "")
    const query =
      IMAGE_SOURCES.pixabay.queries[cityKey as keyof typeof IMAGE_SOURCES.pixabay.queries] || city

    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      image_type: "photo",
      orientation: "horizontal",
      min_width: String(width),
      min_height: String(height),
      per_page: "3",
      page: String(Math.floor(Math.random() * 5) + 1),
    })

    const response = await fetch(`${IMAGE_SOURCES.pixabay.baseUrl}?${params}`)

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`)
    }

    const data = await response.json()
    if (data.hits && data.hits.length > 0) {
      return data.hits[0].largeImageURL || data.hits[0].webformatURL
    }

    throw new Error("No images found")
  }

  /**
   * Try multiple sources to fetch an image
   */
  private async fetchAnyImage(
    city: string,
    width: number,
    height: number,
    quality: number,
  ): Promise<string> {
    const sources = ["unsplash", "pexels", "pixabay"] as const

    for (const source of sources) {
      try {
        switch (source) {
          case "unsplash":
            return await this.fetchUnsplashImage(city, width, height, quality)
          case "pexels":
            return await this.fetchPexelsImage(city, width, height)
          case "pixabay":
            return await this.fetchPixabayImage(city, width, height)
        }
      } catch (error) {
        console.warn(`Failed to fetch from ${source}:`, error)
        continue
      }
    }

    throw new Error("All image sources failed")
  }

  /**
   * Get fallback image for a city
   */
  private getFallbackImage(city: string, width: number, height: number, quality: number): string {
    // Static fallback images that are always available
    const fallbacks: Record<string, string> = {
      dubai: `https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=${width}&h=${height}&q=${quality}&fit=crop`,
      istanbul: `https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=${width}&h=${height}&q=${quality}&fit=crop`,
      singapore: `https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=${width}&h=${height}&q=${quality}&fit=crop`,
      doha: `https://images.unsplash.com/photo-1572252821143-035a024857ac?w=${width}&h=${height}&q=${quality}&fit=crop`,
      amsterdam: `https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=${width}&h=${height}&q=${quality}&fit=crop`,
      reykjavik: `https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=${width}&h=${height}&q=${quality}&fit=crop`,
      paris: `https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=${width}&h=${height}&q=${quality}&fit=crop`,
      london: `https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=${width}&h=${height}&q=${quality}&fit=crop`,
      newyork: `https://images.unsplash.com/photo-1534430480872-3498386e7856?w=${width}&h=${height}&q=${quality}&fit=crop`,
      tokyo: `https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=${width}&h=${height}&q=${quality}&fit=crop`,
      sydney: `https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=${width}&h=${height}&q=${quality}&fit=crop`,
    }

    const cityKey = city.toLowerCase().replace(" ", "")
    return (
      fallbacks[cityKey] ||
      `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=${width}&h=${height}&q=${quality}&fit=crop`
    )
  }

  /**
   * Refresh all cached images older than specified days
   */
  async refreshOldImages(daysOld: number = 30): Promise<void> {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000
    const toRefresh: Array<{ key: string; city: string; options: any }> = []

    this.cache.forEach((value, key) => {
      if (value.fetchedAt < cutoffTime) {
        // Parse the cache key to extract parameters
        const [city, dimensions, source] = key.split("_")
        const [width, height] = dimensions.split("x").map(Number)

        toRefresh.push({
          key,
          city,
          options: { width, height, source, forceRefresh: true },
        })
      }
    })

    // Refresh images in parallel (with concurrency limit)
    const concurrencyLimit = 3
    for (let i = 0; i < toRefresh.length; i += concurrencyLimit) {
      const batch = toRefresh.slice(i, i + concurrencyLimit)
      await Promise.all(
        batch.map(({ city, options }) =>
          this.getCityImage(city, options).catch((err) =>
            console.error(`Failed to refresh image for ${city}:`, err),
          ),
        ),
      )
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalImages: number
    oldestImage: number | null
    newestImage: number | null
    averageAge: number
    expiredCount: number
  } {
    const now = Date.now()
    let oldest: number | null = null
    let newest: number | null = null
    let totalAge = 0
    let expiredCount = 0

    this.cache.forEach((value) => {
      const age = now - value.fetchedAt
      totalAge += age

      if (oldest === null || value.fetchedAt < oldest) {
        oldest = value.fetchedAt
      }
      if (newest === null || value.fetchedAt > newest) {
        newest = value.fetchedAt
      }
      if (age > CACHE_DURATION) {
        expiredCount++
      }
    })

    return {
      totalImages: this.cache.size,
      oldestImage: oldest,
      newestImage: newest,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
      expiredCount,
    }
  }

  /**
   * Clear all cached images
   */
  clearCache(): void {
    this.cache.clear()
    if (this.localStorage) {
      this.localStorage.removeItem("layoverhq_image_cache")
    }
  }

  /**
   * Preload images for specific cities
   */
  async preloadCityImages(cities: string[], options: DynamicImageOptions = {}): Promise<void> {
    await Promise.all(
      cities.map((city) =>
        this.getCityImage(city, options).catch((err) =>
          console.error(`Failed to preload image for ${city}:`, err),
        ),
      ),
    )
  }
}

// Export singleton instance
export const dynamicImageService = new DynamicImageService()

// Export cached function for React Server Components
export const getCityImage = cache(async (city: string, options?: DynamicImageOptions) => {
  return dynamicImageService.getCityImage(city, options)
})
