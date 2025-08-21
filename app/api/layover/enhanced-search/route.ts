import { type NextRequest, NextResponse } from "next/server"
import { enhancedViatorService } from "@/lib/services/enhanced-viator-service"
import { weatherService } from "@/lib/services/weather-service"
import { transitCalculator } from "@/lib/services/transit-calculator"

interface SearchParams {
  city: string
  layoverDuration: number // minutes
  airportCode: string
  arrivalTime: string
  hasCheckedBaggage?: boolean
  maxPrice?: number
  activityType?: "outdoor" | "indoor" | "mixed"
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchParams
    const {
      city,
      layoverDuration,
      airportCode,
      arrivalTime,
      hasCheckedBaggage = false,
      maxPrice,
      activityType,
    } = body

    // Validate required parameters
    if (!city || !layoverDuration || !airportCode || !arrivalTime) {
      return NextResponse.json(
        { error: "Missing required parameters: city, layoverDuration, airportCode, arrivalTime" },
        { status: 400 },
      )
    }

    console.log(
      `[Enhanced Search] Starting search for ${city}, ${layoverDuration}min layover at ${airportCode}`,
    )

    // Get airport coordinates for weather
    const airportCoordinates = getAirportCoordinates(airportCode)

    // Fetch weather data and transit analysis in parallel
    const [weather, transitAnalysis] = await Promise.all([
      weatherService.getCurrentWeather(airportCoordinates.lat, airportCoordinates.lng),
      transitCalculator.analyzeLayover(
        airportCode,
        layoverDuration,
        arrivalTime,
        hasCheckedBaggage,
      ),
    ])

    console.log(`[Enhanced Search] Weather: ${weather.temperature}°C, ${weather.condition}`)
    console.log(`[Enhanced Search] Transit: Can leave airport = ${transitAnalysis.canLeaveAirport}`)

    // Search for weather-aware experiences
    const experiences = await enhancedViatorService.searchWeatherAwareExperiences(
      city,
      layoverDuration,
      airportCode,
      arrivalTime,
      weather,
      {
        maxPrice,
        activityType,
        maxDuration: Math.floor(transitAnalysis.availableTimeInCity / 60), // Convert to hours
      },
    )

    console.log(`[Enhanced Search] Found ${experiences.length} enhanced experiences`)

    // Generate comprehensive recommendations
    const recommendations = generateLayoverRecommendations(
      weather,
      transitAnalysis,
      experiences,
      layoverDuration,
    )

    return NextResponse.json({
      success: true,
      data: {
        weather: {
          temperature: weather.temperature,
          condition: weather.condition,
          description: weather.description,
          isGoodForOutdoor: weather.isGoodForOutdoor,
          recommendations: weather.recommendations,
        },
        transit: {
          canLeaveAirport: transitAnalysis.canLeaveAirport,
          availableTimeInCity: transitAnalysis.availableTimeInCity,
          bestTransitOption: transitAnalysis.transitOptions[0],
          recommendations: transitAnalysis.recommendations,
          warnings: transitAnalysis.warnings,
          confidence: transitAnalysis.confidence,
        },
        experiences: experiences.map((exp) => ({
          productCode: exp.productCode,
          title: exp.title,
          description: exp.description,
          duration: exp.duration,
          price: exp.price,
          weatherScore: exp.weatherScore,
          weatherRecommendation: exp.weatherRecommendation,
          weatherWarnings: exp.weatherWarnings,
          transitFeasibility: exp.transitFeasibility,
          layoverSuitability: exp.layoverSuitability,
          adaptations: exp.adaptations,
          rating: exp.rating,
        })),
        recommendations,
        summary: {
          totalExperiences: experiences.length,
          feasibleExperiences: experiences.filter((e) => e.transitFeasibility.canReach).length,
          weatherCompatible: experiences.filter((e) => e.weatherScore >= 0.7).length,
          averageWeatherScore:
            experiences.length > 0
              ? experiences.reduce((sum, e) => sum + e.weatherScore, 0) / experiences.length
              : 0,
        },
      },
    })
  } catch (error) {
    console.error("[Enhanced Search] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to search enhanced layover experiences",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function getAirportCoordinates(airportCode: string): { lat: number; lng: number } {
  // Major airport coordinates for weather API
  const coordinates: Record<string, { lat: number; lng: number }> = {
    DXB: { lat: 25.2532, lng: 55.3657 }, // Dubai
    IST: { lat: 41.2751, lng: 28.7519 }, // Istanbul
    AMS: { lat: 52.3105, lng: 4.7683 }, // Amsterdam
    SIN: { lat: 1.3644, lng: 103.9915 }, // Singapore
    DOH: { lat: 25.2731, lng: 51.608 }, // Doha
    FRA: { lat: 50.0379, lng: 8.5622 }, // Frankfurt
    LHR: { lat: 51.47, lng: -0.4543 }, // London Heathrow
    CDG: { lat: 49.0097, lng: 2.5479 }, // Paris CDG
    HKG: { lat: 22.308, lng: 113.9185 }, // Hong Kong
    ICN: { lat: 37.4602, lng: 126.4407 }, // Seoul Incheon
    NRT: { lat: 35.772, lng: 140.3929 }, // Tokyo Narita
    JFK: { lat: 40.6413, lng: -73.7781 }, // New York JFK
    LAX: { lat: 33.9425, lng: -118.4081 }, // Los Angeles
    ORD: { lat: 41.9742, lng: -87.9073 }, // Chicago
    ATL: { lat: 33.6407, lng: -84.4277 }, // Atlanta
    MUC: { lat: 48.3538, lng: 11.7861 }, // Munich
    BKK: { lat: 13.69, lng: 100.7501 }, // Bangkok
    SYD: { lat: -33.9399, lng: 151.1753 }, // Sydney
    AUH: { lat: 24.433, lng: 54.6511 }, // Abu Dhabi
  }

  return coordinates[airportCode] || { lat: 0, lng: 0 }
}

function generateLayoverRecommendations(
  weather: any,
  transit: any,
  experiences: any[],
  layoverDuration: number,
): string[] {
  const recommendations: string[] = []

  // Overall feasibility
  if (!transit.canLeaveAirport) {
    recommendations.push("🛑 Stay at the airport - insufficient time to explore the city safely")
    recommendations.push("🛍️ Focus on airport amenities, shopping, and dining")
    if (layoverDuration >= 240) {
      recommendations.push("🛏️ Consider booking an airport hotel or day room")
    }
    return recommendations
  }

  // Weather-based recommendations
  if (weather.isGoodForOutdoor) {
    recommendations.push("☀️ Excellent weather for outdoor exploration!")
    const outdoorExperiences = experiences.filter((e) => e.activityType === "outdoor")
    if (outdoorExperiences.length > 0) {
      recommendations.push(`🌳 ${outdoorExperiences.length} outdoor activities available`)
    }
  } else {
    recommendations.push("🌧️ Weather favors indoor activities")
    const indoorExperiences = experiences.filter((e) => e.activityType === "indoor")
    if (indoorExperiences.length > 0) {
      recommendations.push(`🏛️ ${indoorExperiences.length} indoor experiences recommended`)
    }
  }

  // Transit recommendations
  if (transit.confidence >= 0.8) {
    recommendations.push("✅ High confidence - comfortable time for city exploration")
  } else if (transit.confidence >= 0.6) {
    recommendations.push("⚠️ Medium confidence - stay close to transport links")
  } else {
    recommendations.push("🚨 Low confidence - consider staying at the airport")
  }

  // Experience recommendations
  if (experiences.length > 0) {
    const topExperience = experiences[0]
    if (topExperience.layoverSuitability.ideal) {
      recommendations.push(`⭐ "${topExperience.title}" is perfectly suited for your layover`)
    }

    const highScoring = experiences.filter(
      (e) => e.weatherScore >= 0.8 && e.layoverSuitability.score >= 0.8,
    )
    if (highScoring.length > 0) {
      recommendations.push(
        `🎯 ${highScoring.length} highly recommended experiences match your conditions`,
      )
    }
  }

  // Time-specific recommendations
  if (transit.availableTimeInCity >= 180) {
    recommendations.push("🕒 Sufficient time for a comprehensive city experience")
  } else if (transit.availableTimeInCity >= 120) {
    recommendations.push("⏰ Good time for focused activities or dining")
  } else {
    recommendations.push("⚡ Limited time - quick nearby attractions only")
  }

  return recommendations
}
