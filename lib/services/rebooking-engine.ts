import { ItineraryManager } from './itinerary-manager'
import { MultiCityCoordinator } from './multi-city-coordinator'
import { 
  Itinerary, 
  FlightBooking, 
  RebookingOption, 
  TripSegment,
  LayoverPlan,
  AccommodationBooking,
  ActivityBooking
} from '../types/itinerary'

export interface RebookingCriteria {
  reason: 'cancellation' | 'delay' | 'missed_connection' | 'schedule_change' | 'user_request'
  affectedSegments: string[]
  constraints: {
    maxCostIncrease: number
    maxDelayAcceptable: number
    requireSameAirline: boolean
    maintainLayoverPlans: boolean
    flexibleDates: boolean
    flexibleAirports: boolean
  }
  preferences: {
    preferredAirlines: string[]
    preferredAirports: string[]
    avoidRedEye: boolean
    minimizeConnections: boolean
  }
}

export interface RebookingImpactAnalysis {
  flightChanges: {
    cancelled: FlightBooking[]
    rescheduled: FlightBooking[]
    newBookings: FlightBooking[]
  }
  layoverImpact: {
    cancelled: LayoverPlan[]
    modified: LayoverPlan[]
    newOpportunities: LayoverPlan[]
  }
  accommodationImpact: {
    cancelled: AccommodationBooking[]
    modified: AccommodationBooking[]
    additional: AccommodationBooking[]
  }
  activityImpact: {
    cancelled: ActivityBooking[]
    rescheduled: ActivityBooking[]
  }
  costImpact: {
    additionalCosts: number
    refunds: number
    netChange: number
    currency: string
  }
  timeImpact: {
    arrivalTimeChange: number
    totalTripTimeChange: number
    layoverTimeChanges: { [city: string]: number }
  }
}

export class RebookingEngine {
  private itineraryManager: ItineraryManager
  private multiCityCoordinator: MultiCityCoordinator

  constructor() {
    this.itineraryManager = new ItineraryManager()
    this.multiCityCoordinator = new MultiCityCoordinator()
  }

  async generateRebookingOptions(
    itineraryId: string, 
    criteria: RebookingCriteria
  ): Promise<RebookingOption[]> {
    const itinerary = await this.itineraryManager.getItinerary(itineraryId)
    if (!itinerary) {
      throw new Error('Itinerary not found')
    }

    const affectedSegments = itinerary.segments.filter(segment => 
      criteria.affectedSegments.includes(segment.id)
    )

    if (affectedSegments.length === 0) {
      throw new Error('No affected segments found')
    }

    const rebookingOptions: RebookingOption[] = []

    // Strategy 1: Minimal change - find alternative flights for affected segments only
    const minimalChangeOption = await this.generateMinimalChangeOption(
      itinerary, 
      affectedSegments, 
      criteria
    )
    if (minimalChangeOption) {
      rebookingOptions.push(minimalChangeOption)
    }

    // Strategy 2: Optimize entire trip - rebuild affected portion optimally
    const optimizedOption = await this.generateOptimizedRebookingOption(
      itinerary, 
      affectedSegments, 
      criteria
    )
    if (optimizedOption) {
      rebookingOptions.push(optimizedOption)
    }

    // Strategy 3: Alternative routing - use different connections/hubs
    const alternativeRoutingOption = await this.generateAlternativeRoutingOption(
      itinerary, 
      affectedSegments, 
      criteria
    )
    if (alternativeRoutingOption) {
      rebookingOptions.push(alternativeRoutingOption)
    }

    // Strategy 4: Split trip - break into multiple bookings if beneficial
    if (criteria.reason === 'cancellation' && affectedSegments.length > 1) {
      const splitTripOption = await this.generateSplitTripOption(
        itinerary, 
        affectedSegments, 
        criteria
      )
      if (splitTripOption) {
        rebookingOptions.push(splitTripOption)
      }
    }

    // Sort by recommendation score
    return rebookingOptions
      .sort((a, b) => this.calculateRecommendationScore(b, criteria) - 
                      this.calculateRecommendationScore(a, criteria))
      .slice(0, 3) // Return top 3 options
  }

  private async generateMinimalChangeOption(
    itinerary: Itinerary,
    affectedSegments: TripSegment[],
    criteria: RebookingCriteria
  ): Promise<RebookingOption | null> {
    try {
      const newFlights: FlightBooking[] = []
      
      for (const segment of affectedSegments) {
        if (segment.type === 'flight' && segment.booking) {
          const originalFlight = segment.booking as FlightBooking
          const alternativeFlights = await this.findAlternativeFlights(
            originalFlight,
            criteria,
            'minimal_change'
          )
          
          if (alternativeFlights.length > 0) {
            newFlights.push(alternativeFlights[0]) // Take best alternative
          } else {
            return null // Cannot find alternative for this segment
          }
        }
      }

      const impact = await this.analyzeRebookingImpact(
        itinerary, 
        affectedSegments, 
        newFlights
      )

      // Check if the change meets constraints
      if (impact.costImpact.netChange > criteria.constraints.maxCostIncrease) {
        return null
      }

      return {
        id: crypto.randomUUID(),
        originalFlightId: affectedSegments[0].id,
        newFlights,
        reason: criteria.reason,
        impact,
        recommendation: this.shouldAcceptRebooking(impact, criteria) ? 'accept' : 'manual_review',
        confidence: this.calculateConfidence(impact, criteria, 'minimal_change'),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        actionRequired: criteria.reason === 'cancellation'
      }
    } catch (error) {
      console.error('Error generating minimal change option:', error)
      return null
    }
  }

  private async generateOptimizedRebookingOption(
    itinerary: Itinerary,
    affectedSegments: TripSegment[],
    criteria: RebookingCriteria
  ): Promise<RebookingOption | null> {
    try {
      // Extract the route that needs rebooking
      const flightSegments = affectedSegments.filter(s => s.type === 'flight')
      if (flightSegments.length === 0) return null

      const startSegment = flightSegments[0]
      const endSegment = flightSegments[flightSegments.length - 1]
      
      const startFlight = startSegment.booking as FlightBooking
      const endFlight = endSegment.booking as FlightBooking

      // Find optimized route
      const optimizedFlights = await this.findOptimizedRoute(
        startFlight.departure.airport,
        endFlight.arrival.airport,
        startFlight.departure.time,
        criteria
      )

      if (!optimizedFlights || optimizedFlights.length === 0) {
        return null
      }

      const impact = await this.analyzeRebookingImpact(
        itinerary, 
        affectedSegments, 
        optimizedFlights
      )

      return {
        id: crypto.randomUUID(),
        originalFlightId: affectedSegments[0].id,
        newFlights: optimizedFlights,
        reason: criteria.reason,
        impact,
        recommendation: this.shouldAcceptRebooking(impact, criteria) ? 'accept' : 'manual_review',
        confidence: this.calculateConfidence(impact, criteria, 'optimized'),
        validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
        actionRequired: criteria.reason === 'cancellation'
      }
    } catch (error) {
      console.error('Error generating optimized option:', error)
      return null
    }
  }

  private async generateAlternativeRoutingOption(
    itinerary: Itinerary,
    affectedSegments: TripSegment[],
    criteria: RebookingCriteria
  ): Promise<RebookingOption | null> {
    try {
      // This uses different hubs/connections than the original route
      const flightSegments = affectedSegments.filter(s => s.type === 'flight')
      if (flightSegments.length === 0) return null

      const startFlight = flightSegments[0].booking as FlightBooking
      const endFlight = flightSegments[flightSegments.length - 1].booking as FlightBooking

      const alternativeFlights = await this.findAlternativeRouting(
        startFlight.departure.airport,
        endFlight.arrival.airport,
        startFlight.departure.time,
        criteria
      )

      if (!alternativeFlights || alternativeFlights.length === 0) {
        return null
      }

      const impact = await this.analyzeRebookingImpact(
        itinerary, 
        affectedSegments, 
        alternativeFlights
      )

      return {
        id: crypto.randomUUID(),
        originalFlightId: affectedSegments[0].id,
        newFlights: alternativeFlights,
        reason: criteria.reason,
        impact,
        recommendation: impact.costImpact.netChange < 0 ? 'accept' : 'manual_review', // Accept if saves money
        confidence: this.calculateConfidence(impact, criteria, 'alternative'),
        validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
        actionRequired: criteria.reason === 'cancellation'
      }
    } catch (error) {
      console.error('Error generating alternative routing option:', error)
      return null
    }
  }

  private async generateSplitTripOption(
    itinerary: Itinerary,
    affectedSegments: TripSegment[],
    criteria: RebookingCriteria
  ): Promise<RebookingOption | null> {
    // This would split a multi-segment journey into separate bookings
    // Implementation would be complex, returning null for now
    return null
  }

  private async findAlternativeFlights(
    originalFlight: FlightBooking,
    criteria: RebookingCriteria,
    strategy: 'minimal_change' | 'optimized' | 'alternative'
  ): Promise<FlightBooking[]> {
    // Mock implementation - would integrate with airline APIs and flight aggregators
    
    const alternatives: FlightBooking[] = []
    const baseTime = new Date(originalFlight.departure.time)
    
    // Generate mock alternatives with different characteristics
    for (let i = 0; i < 3; i++) {
      const departureTime = new Date(baseTime)
      
      switch (strategy) {
        case 'minimal_change':
          // Same day, similar time
          departureTime.setHours(departureTime.getHours() + (i * 2))
          break
        case 'optimized':
          // Consider different times of day for better layover opportunities
          departureTime.setHours(8 + (i * 4)) // 8am, 12pm, 4pm options
          break
        case 'alternative':
          // Different day if flexible
          if (criteria.constraints.flexibleDates) {
            departureTime.setDate(departureTime.getDate() + i)
          }
          break
      }

      const alternative: FlightBooking = {
        id: crypto.randomUUID(),
        confirmationCode: `ALT${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        airline: criteria.constraints.requireSameAirline ? originalFlight.airline : 
                 criteria.preferences.preferredAirlines[i % criteria.preferences.preferredAirlines.length] || 'AA',
        flightNumber: `${originalFlight.airline}${Math.floor(Math.random() * 9000) + 1000}`,
        departure: {
          ...originalFlight.departure,
          time: departureTime.toISOString(),
          localTime: departureTime.toISOString(),
        },
        arrival: {
          ...originalFlight.arrival,
          time: new Date(departureTime.getTime() + originalFlight.duration * 60 * 1000).toISOString(),
          localTime: new Date(departureTime.getTime() + originalFlight.duration * 60 * 1000).toISOString(),
        },
        duration: originalFlight.duration + (Math.random() * 60 - 30), // +/- 30 minutes variation
        status: 'scheduled',
        checkedIn: false,
        lastUpdated: new Date().toISOString(),
        price: {
          total: (originalFlight.price?.total || 500) * (0.8 + Math.random() * 0.4), // 80%-120% of original
          currency: originalFlight.price?.currency || 'USD'
        }
      }

      alternatives.push(alternative)
    }

    return alternatives
  }

  private async findOptimizedRoute(
    from: string,
    to: string,
    departureTime: string,
    criteria: RebookingCriteria
  ): Promise<FlightBooking[]> {
    // This would use flight search APIs to find optimal routes
    // Mock implementation that considers layover opportunities
    
    const route: FlightBooking[] = []
    
    // For optimization, we might add strategic layovers in hub cities
    const hubs = ['DFW', 'ATL', 'ORD', 'JFK', 'LAX', 'DEN']
    const viableHubs = hubs.filter(hub => hub !== from && hub !== to)
    
    if (viableHubs.length > 0 && Math.random() > 0.5) {
      // Add a hub connection for potential layover experience
      const selectedHub = viableHubs[Math.floor(Math.random() * viableHubs.length)]
      
      // First flight to hub
      const firstFlight: FlightBooking = {
        id: crypto.randomUUID(),
        confirmationCode: `OPT1${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        airline: criteria.preferences.preferredAirlines[0] || 'AA',
        flightNumber: `AA${Math.floor(Math.random() * 9000) + 1000}`,
        departure: {
          airport: from,
          city: from,
          country: 'US',
          time: departureTime,
          localTime: departureTime,
          timezone: 'UTC'
        },
        arrival: {
          airport: selectedHub,
          city: selectedHub,
          country: 'US',
          time: new Date(new Date(departureTime).getTime() + 3 * 60 * 60 * 1000).toISOString(),
          localTime: new Date(new Date(departureTime).getTime() + 3 * 60 * 60 * 1000).toISOString(),
          timezone: 'UTC'
        },
        duration: 180,
        status: 'scheduled',
        checkedIn: false,
        lastUpdated: new Date().toISOString(),
        price: {
          total: Math.floor(Math.random() * 300) + 200,
          currency: 'USD'
        }
      }
      
      // Second flight from hub to destination (with layover time)
      const layoverHours = Math.floor(Math.random() * 8) + 4 // 4-12 hour layover
      const secondDepartureTime = new Date(
        new Date(firstFlight.arrival.time).getTime() + layoverHours * 60 * 60 * 1000
      )
      
      const secondFlight: FlightBooking = {
        id: crypto.randomUUID(),
        confirmationCode: `OPT2${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        airline: firstFlight.airline,
        flightNumber: `${firstFlight.airline}${Math.floor(Math.random() * 9000) + 1000}`,
        departure: {
          airport: selectedHub,
          city: selectedHub,
          country: 'US',
          time: secondDepartureTime.toISOString(),
          localTime: secondDepartureTime.toISOString(),
          timezone: 'UTC'
        },
        arrival: {
          airport: to,
          city: to,
          country: 'US',
          time: new Date(secondDepartureTime.getTime() + 2.5 * 60 * 60 * 1000).toISOString(),
          localTime: new Date(secondDepartureTime.getTime() + 2.5 * 60 * 60 * 1000).toISOString(),
          timezone: 'UTC'
        },
        duration: 150,
        status: 'scheduled',
        checkedIn: false,
        lastUpdated: new Date().toISOString(),
        price: {
          total: Math.floor(Math.random() * 300) + 200,
          currency: 'USD'
        }
      }
      
      route.push(firstFlight, secondFlight)
    } else {
      // Direct flight option
      route.push(await this.findAlternativeFlights({
        id: '',
        confirmationCode: '',
        airline: 'AA',
        flightNumber: 'AA1000',
        departure: {
          airport: from,
          city: from,
          country: 'US',
          time: departureTime,
          localTime: departureTime,
          timezone: 'UTC'
        },
        arrival: {
          airport: to,
          city: to,
          country: 'US',
          time: new Date(new Date(departureTime).getTime() + 4 * 60 * 60 * 1000).toISOString(),
          localTime: new Date(new Date(departureTime).getTime() + 4 * 60 * 60 * 1000).toISOString(),
          timezone: 'UTC'
        },
        duration: 240,
        status: 'scheduled',
        checkedIn: false,
        lastUpdated: new Date().toISOString(),
        price: { total: 500, currency: 'USD' }
      }, criteria, 'optimized').then(flights => flights[0]))
    }
    
    return route
  }

  private async findAlternativeRouting(
    from: string,
    to: string,
    departureTime: string,
    criteria: RebookingCriteria
  ): Promise<FlightBooking[]> {
    // This would find routes using different hubs than originally planned
    return this.findOptimizedRoute(from, to, departureTime, criteria)
  }

  private async analyzeRebookingImpact(
    itinerary: Itinerary,
    affectedSegments: TripSegment[],
    newFlights: FlightBooking[]
  ): Promise<RebookingImpactAnalysis> {
    const originalFlights = affectedSegments
      .filter(s => s.type === 'flight' && s.booking)
      .map(s => s.booking as FlightBooking)

    const originalCost = originalFlights.reduce((sum, f) => sum + (f.price?.total || 0), 0)
    const newCost = newFlights.reduce((sum, f) => sum + (f.price?.total || 0), 0)

    // Calculate time differences
    const originalArrival = new Date(originalFlights[originalFlights.length - 1]?.arrival.time || '')
    const newArrival = new Date(newFlights[newFlights.length - 1]?.arrival.time || '')
    const arrivalTimeChange = Math.floor((newArrival.getTime() - originalArrival.getTime()) / (1000 * 60)) // minutes

    return {
      flightChanges: {
        cancelled: originalFlights,
        rescheduled: [],
        newBookings: newFlights
      },
      layoverImpact: {
        cancelled: [],
        modified: [],
        newOpportunities: []
      },
      accommodationImpact: {
        cancelled: [],
        modified: [],
        additional: []
      },
      activityImpact: {
        cancelled: [],
        rescheduled: []
      },
      costImpact: {
        additionalCosts: Math.max(0, newCost - originalCost),
        refunds: Math.max(0, originalCost - newCost),
        netChange: newCost - originalCost,
        currency: 'USD'
      },
      timeImpact: {
        arrivalTimeChange,
        totalTripTimeChange: arrivalTimeChange,
        layoverTimeChanges: {}
      }
    }
  }

  private shouldAcceptRebooking(impact: RebookingImpactAnalysis, criteria: RebookingCriteria): boolean {
    // Auto-accept criteria
    if (criteria.reason === 'cancellation') return true
    if (impact.costImpact.netChange < 0) return true // Saves money
    if (impact.costImpact.netChange <= criteria.constraints.maxCostIncrease && 
        Math.abs(impact.timeImpact.arrivalTimeChange) <= criteria.constraints.maxDelayAcceptable) {
      return true
    }
    
    return false
  }

  private calculateConfidence(
    impact: RebookingImpactAnalysis, 
    criteria: RebookingCriteria,
    strategy: string
  ): number {
    let confidence = 0.5 // Base confidence

    // Increase confidence for lower cost impact
    if (impact.costImpact.netChange <= 0) confidence += 0.3
    else if (impact.costImpact.netChange <= criteria.constraints.maxCostIncrease * 0.5) confidence += 0.2

    // Increase confidence for minimal time impact
    if (Math.abs(impact.timeImpact.arrivalTimeChange) <= 60) confidence += 0.2 // Within 1 hour

    // Strategy-specific adjustments
    if (strategy === 'minimal_change') confidence += 0.1 // Generally more reliable
    if (strategy === 'optimized') confidence += 0.05 // Some optimization benefits

    return Math.min(1.0, confidence)
  }

  private calculateRecommendationScore(option: RebookingOption, criteria: RebookingCriteria): number {
    let score = 0

    // Cost efficiency (40% weight)
    const costRatio = option.impact.costImpact.netChange / criteria.constraints.maxCostIncrease
    score += (1 - Math.min(1, Math.max(0, costRatio))) * 40

    // Time efficiency (30% weight)
    const timeRatio = Math.abs(option.impact.timeImpact.arrivalTimeChange) / criteria.constraints.maxDelayAcceptable
    score += (1 - Math.min(1, Math.max(0, timeRatio))) * 30

    // Confidence (20% weight)
    score += option.confidence * 20

    // Convenience (10% weight)
    if (option.recommendation === 'accept') score += 10

    return score
  }

  async executeRebooking(rebookingId: string, userId: string): Promise<boolean> {
    // This would handle the actual rebooking process
    // Including API calls to airlines, updating databases, sending confirmations
    console.log(`Executing rebooking ${rebookingId} for user ${userId}`)
    
    // Mock implementation
    return true
  }

  async monitorForRebookingOpportunities(userId: string): Promise<RebookingOption[]> {
    // This would run continuously to monitor user's active itineraries
    // for rebooking opportunities (better prices, schedules, etc.)
    
    const activeItineraries = await this.itineraryManager.getActiveItineraries(userId)
    const opportunities: RebookingOption[] = []

    for (const itinerary of activeItineraries) {
      // Check for proactive rebooking opportunities
      const flightSegments = itinerary.segments.filter(s => s.type === 'flight')
      
      for (const segment of flightSegments) {
        if (segment.booking && new Date(segment.startTime) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
          // More than 7 days out - check for better options
          const betterOptions = await this.findBetterFlightOptions(segment.booking as FlightBooking)
          
          if (betterOptions.length > 0) {
            const opportunity: RebookingOption = {
              id: crypto.randomUUID(),
              originalFlightId: segment.id,
              newFlights: [betterOptions[0]],
              reason: 'user_request',
              impact: await this.analyzeRebookingImpact(itinerary, [segment], [betterOptions[0]]),
              recommendation: 'manual_review',
              confidence: 0.8,
              validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
              actionRequired: false
            }
            
            opportunities.push(opportunity)
          }
        }
      }
    }

    return opportunities
  }

  private async findBetterFlightOptions(originalFlight: FlightBooking): Promise<FlightBooking[]> {
    // Mock implementation to find better flight options
    // Would integrate with flight APIs to find lower prices or better schedules
    
    if (Math.random() > 0.7) { // 30% chance of finding better option
      const betterFlight: FlightBooking = {
        ...originalFlight,
        id: crypto.randomUUID(),
        price: {
          total: (originalFlight.price?.total || 500) * 0.85, // 15% cheaper
          currency: originalFlight.price?.currency || 'USD'
        }
      }
      return [betterFlight]
    }
    
    return []
  }
}