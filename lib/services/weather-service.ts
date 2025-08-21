/**
 * Weather Service for LayoverHQ
 * Integrates with OpenWeatherMap API to provide weather data for layover destinations
 * Used to match activities with weather conditions
 */

export interface WeatherData {
  temperature: number
  feelsLike: number
  condition: string
  description: string
  humidity: number
  windSpeed: number
  visibility: number
  cloudiness: number
  precipitation: number
  icon: string
  isGoodForOutdoor: boolean
  recommendations: string[]
}

interface WeatherForecast {
  current: WeatherData
  hourly: WeatherData[]
  daily: WeatherData[]
}

interface ActivityWeatherMatch {
  activity: any
  weatherScore: number
  recommendation: string
  warnings: string[]
}

class WeatherService {
  private apiKey: string
  private baseUrl = "https://api.openweathermap.org/data/2.5"
  private cache = new Map<string, { data: any; timestamp: number }>()
  private cacheTimeout = 15 * 60 * 1000 // 15 minutes

  constructor() {
    // Use environment variable or fallback to free tier demo key
    this.apiKey = process.env.OPENWEATHER_API_KEY || "demo"
  }

  /**
   * Get current weather for an airport/city
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    const cacheKey = `weather_${lat}_${lon}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`,
      )

      if (!response.ok) {
        console.warn("[Weather] API call failed, using fallback data")
        return this.getFallbackWeather()
      }

      const data = await response.json()
      const weatherData = this.parseWeatherData(data)

      this.setCache(cacheKey, weatherData)
      return weatherData
    } catch (error) {
      console.error("[Weather] Error fetching weather:", error)
      return this.getFallbackWeather()
    }
  }

  /**
   * Get weather forecast for planning activities
   */
  async getWeatherForecast(lat: number, lon: number, hours: number = 24): Promise<WeatherForecast> {
    const cacheKey = `forecast_${lat}_${lon}_${hours}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&cnt=${Math.ceil(hours / 3)}`,
      )

      if (!response.ok) {
        return this.getFallbackForecast()
      }

      const data = await response.json()
      const forecast = this.parseForecastData(data)

      this.setCache(cacheKey, forecast)
      return forecast
    } catch (error) {
      console.error("[Weather] Error fetching forecast:", error)
      return this.getFallbackForecast()
    }
  }

  /**
   * Match activities with weather conditions
   */
  async matchActivitiesWithWeather(
    activities: any[],
    weather: WeatherData,
    layoverDuration: number,
  ): Promise<ActivityWeatherMatch[]> {
    return activities.map((activity) => {
      const match = this.calculateWeatherMatch(activity, weather, layoverDuration)
      return {
        activity,
        weatherScore: match.score,
        recommendation: match.recommendation,
        warnings: match.warnings,
      }
    })
  }

  /**
   * Calculate weather score for layover
   */
  calculateWeatherScore(weather: WeatherData): number {
    let score = 1.0

    // Temperature factor (ideal: 15-25°C)
    if (weather.temperature >= 15 && weather.temperature <= 25) {
      score *= 1.0
    } else if (weather.temperature >= 10 && weather.temperature <= 30) {
      score *= 0.8
    } else if (weather.temperature < 0 || weather.temperature > 35) {
      score *= 0.4
    } else {
      score *= 0.6
    }

    // Precipitation factor
    if (weather.precipitation === 0) {
      score *= 1.0
    } else if (weather.precipitation < 2) {
      score *= 0.8
    } else if (weather.precipitation < 5) {
      score *= 0.6
    } else {
      score *= 0.3
    }

    // Wind factor
    if (weather.windSpeed < 5) {
      score *= 1.0
    } else if (weather.windSpeed < 10) {
      score *= 0.9
    } else if (weather.windSpeed < 15) {
      score *= 0.7
    } else {
      score *= 0.5
    }

    // Visibility factor
    if (weather.visibility >= 10) {
      score *= 1.0
    } else if (weather.visibility >= 5) {
      score *= 0.8
    } else {
      score *= 0.6
    }

    return Math.min(Math.max(score, 0), 1)
  }

  /**
   * Get weather data for a specific layover destination and time
   */
  async getWeatherForLayover(
    destination: string,
    date: Date,
    layoverDuration: number,
  ): Promise<WeatherData> {
    try {
      // For now, we'll use a fallback approach since we'd need geocoding
      // to convert destination to coordinates. In a full implementation,
      // you would use a geocoding service to get lat/lon from the destination

      // Extract coordinates based on major airports/cities
      const coords = this.getCoordinatesForDestination(destination)

      if (!coords) {
        console.warn(`[Weather] Unknown destination: ${destination}, using fallback`)
        return this.getFallbackWeather()
      }

      // Get weather forecast for the layover time
      const forecast = await this.getWeatherForecast(coords.lat, coords.lon, layoverDuration / 60)

      // Return current weather or find closest time match
      return forecast.current
    } catch (error) {
      console.error(`[Weather] Error getting weather for layover in ${destination}:`, error)
      return this.getFallbackWeather()
    }
  }

  /**
   * Get weather-based activity recommendations
   */
  getWeatherRecommendations(weather: WeatherData, layoverDuration: number): string[] {
    const recommendations: string[] = []

    // Temperature-based recommendations
    if (weather.temperature < 5) {
      recommendations.push("🧥 Dress warmly - cold weather expected")
      recommendations.push("☕ Indoor activities recommended")
    } else if (weather.temperature > 30) {
      recommendations.push("🌡️ Stay hydrated - hot weather")
      recommendations.push("🏢 Air-conditioned venues recommended")
    } else if (weather.temperature >= 18 && weather.temperature <= 25) {
      recommendations.push("👍 Perfect weather for outdoor exploration")
    }

    // Precipitation recommendations
    if (weather.precipitation > 0) {
      recommendations.push("☔ Bring umbrella - rain expected")
      if (weather.precipitation > 5) {
        recommendations.push("🏢 Indoor activities strongly recommended")
      }
    }

    // Wind recommendations
    if (weather.windSpeed > 15) {
      recommendations.push("💨 Strong winds - secure belongings")
    }

    // Time-based recommendations
    if (layoverDuration >= 240 && weather.isGoodForOutdoor) {
      recommendations.push("🌟 Great conditions for city tour")
    } else if (layoverDuration >= 120 && !weather.isGoodForOutdoor) {
      recommendations.push("🛍️ Perfect for indoor shopping or dining")
    }

    return recommendations
  }

  // Private helper methods

  private parseWeatherData(data: any): WeatherData {
    const precipitation = data.rain?.["1h"] || data.snow?.["1h"] || 0

    const weatherData: WeatherData = {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
      visibility: (data.visibility || 10000) / 1000, // Convert to km
      cloudiness: data.clouds.all,
      precipitation,
      icon: data.weather[0].icon,
      isGoodForOutdoor: this.isGoodForOutdoor(data),
      recommendations: [],
    }

    weatherData.recommendations = this.getWeatherRecommendations(weatherData, 240)
    return weatherData
  }

  private parseForecastData(data: any): WeatherForecast {
    const hourly = data.list.map((item: any) => this.parseWeatherData(item))

    return {
      current: hourly[0] || this.getFallbackWeather(),
      hourly: hourly.slice(0, 8), // Next 24 hours (3-hour intervals)
      daily: [], // OpenWeather free tier doesn't include daily in forecast endpoint
    }
  }

  private isGoodForOutdoor(data: any): boolean {
    const temp = data.main.temp
    const precipitation = data.rain?.["1h"] || data.snow?.["1h"] || 0
    const windSpeed = data.wind.speed * 3.6
    const condition = data.weather[0].main.toLowerCase()

    return (
      temp >= 10 &&
      temp <= 30 &&
      precipitation < 2 &&
      windSpeed < 20 &&
      !["thunderstorm", "snow", "heavy rain"].includes(condition)
    )
  }

  private calculateWeatherMatch(activity: any, weather: WeatherData, duration: number): any {
    let score = 1.0
    const warnings: string[] = []
    let recommendation = ""

    // Outdoor activities
    if (activity.type === "CITY_TOUR" || activity.type === "WALKING_TOUR") {
      if (!weather.isGoodForOutdoor) {
        score *= 0.3
        warnings.push("Weather not ideal for outdoor activities")
      }
      if (weather.precipitation > 0) {
        score *= 0.5
        warnings.push("Rain expected - bring umbrella")
      }
      if (weather.temperature < 5 || weather.temperature > 35) {
        score *= 0.4
        warnings.push("Extreme temperatures - dress appropriately")
      }
      recommendation = weather.isGoodForOutdoor
        ? "Great weather for this activity!"
        : "Consider indoor alternatives"
    }

    // Indoor activities
    if (["LOUNGE", "SPA", "SHOPPING", "DINING"].includes(activity.type)) {
      score = 1.0 // Indoor activities are weather-independent
      if (!weather.isGoodForOutdoor) {
        score *= 1.2 // Bonus for indoor activities in bad weather
        recommendation = "Perfect choice for current weather"
      } else {
        recommendation = "Good option regardless of weather"
      }
    }

    // Transit to/from activity
    if (activity.requiresTransit && weather.precipitation > 5) {
      score *= 0.7
      warnings.push("Heavy rain may affect transit")
    }

    return { score: Math.min(score, 1.0), recommendation, warnings }
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  private getFallbackWeather(): WeatherData {
    return {
      temperature: 22,
      feelsLike: 22,
      condition: "Clear",
      description: "clear sky",
      humidity: 60,
      windSpeed: 10,
      visibility: 10,
      cloudiness: 20,
      precipitation: 0,
      icon: "01d",
      isGoodForOutdoor: true,
      recommendations: ["Weather data temporarily unavailable - showing typical conditions"],
    }
  }

  private getFallbackForecast(): WeatherForecast {
    return {
      current: this.getFallbackWeather(),
      hourly: Array(8).fill(this.getFallbackWeather()),
      daily: [],
    }
  }

  private getCoordinatesForDestination(destination: string): { lat: number; lon: number } | null {
    // Simple mapping of major airports/cities to coordinates
    // In production, this would use a proper geocoding service
    const coordinatesMap: Record<string, { lat: number; lon: number }> = {
      // Major US Airports
      LAX: { lat: 33.9425, lon: -118.4081 },
      JFK: { lat: 40.6413, lon: -73.7781 },
      ORD: { lat: 41.9742, lon: -87.9073 },
      DFW: { lat: 32.8998, lon: -97.0403 },
      DEN: { lat: 39.8617, lon: -104.6731 },
      SFO: { lat: 37.6213, lon: -122.379 },
      ATL: { lat: 33.6407, lon: -84.4277 },
      MIA: { lat: 25.7959, lon: -80.287 },
      SEA: { lat: 47.4502, lon: -122.3088 },
      LAS: { lat: 36.084, lon: -115.1537 },

      // International Airports
      LHR: { lat: 51.47, lon: -0.4543 }, // London Heathrow
      CDG: { lat: 49.0097, lon: 2.5479 }, // Paris Charles de Gaulle
      FRA: { lat: 50.0379, lon: 8.5622 }, // Frankfurt
      AMS: { lat: 52.3105, lon: 4.7683 }, // Amsterdam
      ICN: { lat: 37.4602, lon: 126.4407 }, // Seoul Incheon
      NRT: { lat: 35.7648, lon: 140.3864 }, // Tokyo Narita
      HKG: { lat: 22.308, lon: 113.9185 }, // Hong Kong
      SIN: { lat: 1.3644, lon: 103.9915 }, // Singapore
      DXB: { lat: 25.2532, lon: 55.3657 }, // Dubai

      // Cities (fallback)
      "New York": { lat: 40.7128, lon: -74.006 },
      "Los Angeles": { lat: 34.0522, lon: -118.2437 },
      London: { lat: 51.5074, lon: -0.1278 },
      Paris: { lat: 48.8566, lon: 2.3522 },
      Tokyo: { lat: 35.6762, lon: 139.6503 },
      Singapore: { lat: 1.3521, lon: 103.8198 },
      Dubai: { lat: 25.2048, lon: 55.2708 },
    }

    // Try exact match first
    if (coordinatesMap[destination]) {
      return coordinatesMap[destination]
    }

    // Try case-insensitive match
    const normalizedDestination = destination.toUpperCase()
    for (const [key, coords] of Object.entries(coordinatesMap)) {
      if (key.toUpperCase() === normalizedDestination) {
        return coords
      }
    }

    // Try partial match for cities
    for (const [key, coords] of Object.entries(coordinatesMap)) {
      if (
        key.toLowerCase().includes(destination.toLowerCase()) ||
        destination.toLowerCase().includes(key.toLowerCase())
      ) {
        return coords
      }
    }

    return null
  }
}

export const weatherService = new WeatherService()
export type { WeatherForecast, ActivityWeatherMatch }
