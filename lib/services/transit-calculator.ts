/**
 * Transit Calculator Service for LayoverHQ
 * Calculates if users can leave the airport during layovers
 * Integrates with public transit APIs to provide accurate timing
 */

interface TransitOption {
  mode: "train" | "bus" | "metro" | "taxi" | "walk"
  duration: number // minutes
  cost: number
  frequency: number // minutes between departures
  operatingHours: { start: string; end: string }
  accessibility: boolean
  luggage: boolean
  directRoute: boolean
}

export interface TransitAnalysis {
  canLeaveAirport: boolean
  minimumLayoverRequired: number // minutes
  availableTimeInCity: number // minutes
  transitOptions: TransitOption[]
  recommendations: string[]
  warnings: string[]
  confidence: number // 0-1 score
}

interface AirportTransitInfo {
  airport: string
  cityCenter: { lat: number; lon: number; name: string }
  distanceToCity: number // km
  transitOptions: TransitOption[]
  customsTime: number // minutes
  securityTime: number // minutes
  walkingTime: number // minutes to/from gates
  hasExpressTransit: boolean
  transitMaps: string[]
}

interface LayoverTimeBreakdown {
  totalLayover: number
  bufferTime: number // Safety buffer
  customsAndImmigration: number
  securityRecheck: number
  walkToFromGates: number
  transitToCity: number
  transitFromCity: number
  availableInCity: number
  isViable: boolean
}

class TransitCalculatorService {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private cacheTimeout = 60 * 60 * 1000 // 1 hour

  // Airport-specific transit data (would be from database in production)
  private airportData: Record<string, AirportTransitInfo> = {
    DXB: {
      airport: "Dubai International",
      cityCenter: { lat: 25.2048, lon: 55.2708, name: "Downtown Dubai" },
      distanceToCity: 15,
      customsTime: 30,
      securityTime: 45,
      walkingTime: 15,
      hasExpressTransit: true,
      transitMaps: ["metro-map-url"],
      transitOptions: [
        {
          mode: "metro",
          duration: 25,
          cost: 8,
          frequency: 10,
          operatingHours: { start: "05:00", end: "00:00" },
          accessibility: true,
          luggage: true,
          directRoute: true,
        },
        {
          mode: "taxi",
          duration: 20,
          cost: 50,
          frequency: 0,
          operatingHours: { start: "00:00", end: "23:59" },
          accessibility: true,
          luggage: true,
          directRoute: true,
        },
      ],
    },
    IST: {
      airport: "Istanbul Airport",
      cityCenter: { lat: 41.0082, lon: 28.9784, name: "Sultanahmet" },
      distanceToCity: 45,
      customsTime: 25,
      securityTime: 40,
      walkingTime: 20,
      hasExpressTransit: true,
      transitMaps: ["metro-map-url"],
      transitOptions: [
        {
          mode: "metro",
          duration: 50,
          cost: 5,
          frequency: 15,
          operatingHours: { start: "06:00", end: "00:00" },
          accessibility: true,
          luggage: true,
          directRoute: false,
        },
        {
          mode: "bus",
          duration: 90,
          cost: 3,
          frequency: 30,
          operatingHours: { start: "04:00", end: "01:00" },
          accessibility: false,
          luggage: true,
          directRoute: true,
        },
        {
          mode: "taxi",
          duration: 45,
          cost: 80,
          frequency: 0,
          operatingHours: { start: "00:00", end: "23:59" },
          accessibility: true,
          luggage: true,
          directRoute: true,
        },
      ],
    },
    AMS: {
      airport: "Amsterdam Schiphol",
      cityCenter: { lat: 52.3676, lon: 4.9041, name: "Amsterdam Centrum" },
      distanceToCity: 17,
      customsTime: 20,
      securityTime: 30,
      walkingTime: 10,
      hasExpressTransit: true,
      transitMaps: ["train-map-url"],
      transitOptions: [
        {
          mode: "train",
          duration: 15,
          cost: 5.5,
          frequency: 10,
          operatingHours: { start: "00:00", end: "23:59" },
          accessibility: true,
          luggage: true,
          directRoute: true,
        },
        {
          mode: "bus",
          duration: 30,
          cost: 6,
          frequency: 15,
          operatingHours: { start: "05:00", end: "00:30" },
          accessibility: true,
          luggage: true,
          directRoute: true,
        },
      ],
    },
    SIN: {
      airport: "Singapore Changi",
      cityCenter: { lat: 1.3521, lon: 103.8198, name: "Marina Bay" },
      distanceToCity: 20,
      customsTime: 15,
      securityTime: 25,
      walkingTime: 10,
      hasExpressTransit: true,
      transitMaps: ["mrt-map-url"],
      transitOptions: [
        {
          mode: "metro",
          duration: 30,
          cost: 2.5,
          frequency: 7,
          operatingHours: { start: "05:30", end: "23:30" },
          accessibility: true,
          luggage: true,
          directRoute: true,
        },
        {
          mode: "taxi",
          duration: 20,
          cost: 25,
          frequency: 0,
          operatingHours: { start: "00:00", end: "23:59" },
          accessibility: true,
          luggage: true,
          directRoute: true,
        },
      ],
    },
  }

  /**
   * Analyze if a layover allows for city exploration
   */
  async analyzeLayover(
    airportCode: string,
    layoverDuration: number,
    arrivalTime: string,
    hasCheckedBaggage: boolean = false,
  ): Promise<TransitAnalysis> {
    const cacheKey = `transit_${airportCode}_${layoverDuration}_${hasCheckedBaggage}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const airportInfo = this.getAirportInfo(airportCode)
    const timeBreakdown = this.calculateTimeBreakdown(
      layoverDuration,
      airportInfo,
      hasCheckedBaggage,
    )

    const availableOptions = this.filterTransitOptions(
      airportInfo.transitOptions,
      arrivalTime,
      timeBreakdown.availableInCity,
    )

    const analysis: TransitAnalysis = {
      canLeaveAirport: timeBreakdown.isViable,
      minimumLayoverRequired: this.calculateMinimumLayover(airportInfo),
      availableTimeInCity: Math.max(0, timeBreakdown.availableInCity),
      transitOptions: availableOptions,
      recommendations: this.generateRecommendations(timeBreakdown, availableOptions, airportInfo),
      warnings: this.generateWarnings(timeBreakdown, hasCheckedBaggage),
      confidence: this.calculateConfidence(airportInfo, timeBreakdown),
    }

    this.setCache(cacheKey, analysis)
    return analysis
  }

  /**
   * Calculate detailed time breakdown for layover
   */
  calculateTimeBreakdown(
    layoverMinutes: number,
    airportInfo: AirportTransitInfo,
    hasCheckedBaggage: boolean,
  ): LayoverTimeBreakdown {
    const bufferTime = 30 // Safety buffer
    const customsAndImmigration = airportInfo.customsTime
    const securityRecheck = airportInfo.securityTime
    const walkToFromGates = airportInfo.walkingTime * 2

    // Use fastest transit option
    const fastestTransit = Math.min(...airportInfo.transitOptions.map((opt) => opt.duration))
    const transitToCity = fastestTransit
    const transitFromCity = fastestTransit

    // Add extra time for checked baggage
    const baggageTime = hasCheckedBaggage ? 30 : 0

    const totalTransitTime =
      bufferTime +
      customsAndImmigration +
      securityRecheck +
      walkToFromGates +
      transitToCity +
      transitFromCity +
      baggageTime

    const availableInCity = layoverMinutes - totalTransitTime

    return {
      totalLayover: layoverMinutes,
      bufferTime,
      customsAndImmigration,
      securityRecheck,
      walkToFromGates,
      transitToCity,
      transitFromCity,
      availableInCity,
      isViable: availableInCity >= 60, // Minimum 1 hour in city
    }
  }

  /**
   * Get real-time transit information (would call actual API)
   */
  async getRealTimeTransit(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number },
    departureTime: string,
  ): Promise<TransitOption[]> {
    // In production, this would call OpenTripPlanner or Transitland API
    // For now, return mock data
    return [
      {
        mode: "train",
        duration: 25,
        cost: 10,
        frequency: 15,
        operatingHours: { start: "05:00", end: "23:00" },
        accessibility: true,
        luggage: true,
        directRoute: true,
      },
    ]
  }

  /**
   * Calculate if specific activities are feasible
   */
  calculateActivityFeasibility(
    activity: any,
    transitAnalysis: TransitAnalysis,
  ): {
    feasible: boolean
    totalTimeRequired: number
    reasoning: string
  } {
    if (!transitAnalysis.canLeaveAirport) {
      return {
        feasible: false,
        totalTimeRequired: 0,
        reasoning: "Insufficient time to leave airport",
      }
    }

    const activityDuration = activity.duration || 60
    const travelTime = transitAnalysis.transitOptions[0]?.duration || 30
    const totalTimeRequired = activityDuration + travelTime * 2 + 30 // Buffer

    const feasible = totalTimeRequired <= transitAnalysis.availableTimeInCity

    return {
      feasible,
      totalTimeRequired,
      reasoning: feasible
        ? `You have ${transitAnalysis.availableTimeInCity} minutes available, enough for this ${activityDuration}-minute activity`
        : `This activity requires ${totalTimeRequired} minutes, but you only have ${transitAnalysis.availableTimeInCity} minutes`,
    }
  }

  /**
   * Generate smart recommendations based on analysis
   */
  private generateRecommendations(
    breakdown: LayoverTimeBreakdown,
    options: TransitOption[],
    airportInfo: AirportTransitInfo,
  ): string[] {
    const recommendations: string[] = []

    if (breakdown.isViable) {
      if (breakdown.availableInCity >= 180) {
        recommendations.push("✅ Excellent layover duration for city exploration")
        recommendations.push("🏛️ Enough time for major attractions")
      } else if (breakdown.availableInCity >= 120) {
        recommendations.push("👍 Good time for quick city visit")
        recommendations.push("🍽️ Perfect for a meal in the city")
      } else if (breakdown.availableInCity >= 60) {
        recommendations.push("⏱️ Limited but viable for quick exploration")
        recommendations.push("☕ Consider nearby attractions only")
      }

      // Transit recommendations
      const hasExpressOption = options.some((opt) => opt.duration <= 30)
      if (hasExpressOption) {
        recommendations.push("🚄 Express transit available to city center")
      }

      if (airportInfo.hasExpressTransit) {
        recommendations.push("💳 Consider purchasing day pass for unlimited travel")
      }
    } else {
      if (breakdown.totalLayover >= 120) {
        recommendations.push("🛋️ Use airport lounges and amenities")
        recommendations.push("🛍️ Explore duty-free shopping")
      }
      recommendations.push("⚠️ Stay in airport - insufficient time for city visit")
    }

    return recommendations
  }

  /**
   * Generate warnings based on analysis
   */
  private generateWarnings(breakdown: LayoverTimeBreakdown, hasCheckedBaggage: boolean): string[] {
    const warnings: string[] = []

    if (breakdown.availableInCity < 60 && breakdown.availableInCity > 0) {
      warnings.push("⏰ Very tight schedule - high risk of missing connection")
    }

    if (hasCheckedBaggage) {
      warnings.push("🧳 Checked baggage adds complexity - consider carry-on only")
    }

    if (breakdown.bufferTime < 30) {
      warnings.push("⚠️ Limited buffer time - any delays could be problematic")
    }

    if (breakdown.customsAndImmigration > 45) {
      warnings.push("🛂 Long immigration times expected - plan accordingly")
    }

    return warnings
  }

  /**
   * Filter transit options based on time and availability
   */
  private filterTransitOptions(
    options: TransitOption[],
    arrivalTime: string,
    availableTime: number,
  ): TransitOption[] {
    const arrivalHour = new Date(arrivalTime).getHours()

    return options
      .filter((option) => {
        // Check operating hours
        const startHour = parseInt(option.operatingHours.start.split(":")[0])
        const endHour = parseInt(option.operatingHours.end.split(":")[0])

        const isOperating =
          (startHour <= arrivalHour && arrivalHour <= endHour) ||
          (endHour < startHour && (arrivalHour >= startHour || arrivalHour <= endHour))

        // Check if round trip is possible within available time
        const roundTripTime = option.duration * 2 + 60 // Include minimum city time
        const isPossible = roundTripTime <= availableTime

        return isOperating && isPossible
      })
      .sort((a, b) => a.duration - b.duration) // Sort by fastest first
  }

  /**
   * Calculate confidence score for the analysis
   */
  private calculateConfidence(
    airportInfo: AirportTransitInfo,
    breakdown: LayoverTimeBreakdown,
  ): number {
    let confidence = 0.5

    // Known airport with good data
    if (airportInfo.transitOptions.length > 0) {
      confidence += 0.2
    }

    // Has express transit
    if (airportInfo.hasExpressTransit) {
      confidence += 0.1
    }

    // Sufficient buffer time
    if (breakdown.bufferTime >= 30) {
      confidence += 0.1
    }

    // Clear viability
    if (breakdown.availableInCity >= 120 || breakdown.availableInCity <= 0) {
      confidence += 0.1
    }

    return Math.min(confidence, 1.0)
  }

  /**
   * Get airport information
   */
  private getAirportInfo(airportCode: string): AirportTransitInfo {
    return this.airportData[airportCode] || this.getDefaultAirportInfo(airportCode)
  }

  /**
   * Calculate minimum layover time needed
   */
  private calculateMinimumLayover(airportInfo: AirportTransitInfo): number {
    const minTransitTime = Math.min(...airportInfo.transitOptions.map((opt) => opt.duration))
    return (
      30 + // Buffer
      airportInfo.customsTime +
      airportInfo.securityTime +
      airportInfo.walkingTime * 2 +
      minTransitTime * 2 +
      60 // Minimum 1 hour in city
    )
  }

  /**
   * Get default airport info for unknown airports
   */
  private getDefaultAirportInfo(airportCode: string): AirportTransitInfo {
    return {
      airport: airportCode,
      cityCenter: { lat: 0, lon: 0, name: "City Center" },
      distanceToCity: 25,
      customsTime: 30,
      securityTime: 45,
      walkingTime: 15,
      hasExpressTransit: false,
      transitMaps: [],
      transitOptions: [
        {
          mode: "taxi",
          duration: 30,
          cost: 50,
          frequency: 0,
          operatingHours: { start: "00:00", end: "23:59" },
          accessibility: true,
          luggage: true,
          directRoute: true,
        },
        {
          mode: "bus",
          duration: 60,
          cost: 10,
          frequency: 30,
          operatingHours: { start: "06:00", end: "22:00" },
          accessibility: false,
          luggage: true,
          directRoute: false,
        },
      ],
    }
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
}

export const transitCalculator = new TransitCalculatorService()
export type { TransitOption, LayoverTimeBreakdown, AirportTransitInfo }
