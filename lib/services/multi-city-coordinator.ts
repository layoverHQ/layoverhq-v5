import { ItineraryManager } from './itinerary-manager'
import { 
  Itinerary, 
  TripSegment, 
  FlightBooking, 
  LayoverPlan,
  AccommodationBooking,
  ActivityBooking
} from '../types/itinerary'

export interface MultiCityRequest {
  cities: string[]
  startDate: string
  endDate: string
  travelerCount: number
  budget?: number
  preferences: {
    maxLayoverTime: number
    minLayoverTime: number
    preferredAirlines: string[]
    flexibleDates: boolean
    accommodationRequired: boolean
    activitiesRequired: boolean
  }
}

export interface CityConnection {
  from: string
  to: string
  flights: FlightBooking[]
  layoverTime?: number
  costEfficiency: number
  convenience: number
}

export interface MultiCityItinerary {
  totalCost: number
  totalDuration: number
  connections: CityConnection[]
  accommodations: AccommodationBooking[]
  activities: ActivityBooking[]
  savings: number
  score: number
}

export class MultiCityCoordinator {
  private itineraryManager: ItineraryManager

  constructor() {
    this.itineraryManager = new ItineraryManager()
  }

  async planMultiCityTrip(request: MultiCityRequest): Promise<MultiCityItinerary[]> {
    // Generate optimal city sequences
    const citySequences = this.generateCitySequences(request.cities)
    
    // Find flights for each sequence
    const itineraryOptions: MultiCityItinerary[] = []
    
    for (const sequence of citySequences) {
      try {
        const itinerary = await this.buildItineraryForSequence(sequence, request)
        if (itinerary) {
          itineraryOptions.push(itinerary)
        }
      } catch (error) {
        console.error(`Error building itinerary for sequence ${sequence.join(' -> ')}:`, error)
      }
    }

    // Sort by score (cost efficiency + convenience)
    return itineraryOptions.sort((a, b) => b.score - a.score).slice(0, 5)
  }

  private generateCitySequences(cities: string[]): string[][] {
    if (cities.length <= 2) {
      return [cities]
    }

    // Generate permutations for optimal routing
    const sequences: string[][] = []
    
    // Direct sequence
    sequences.push([...cities])
    
    // Reverse sequence
    sequences.push([...cities].reverse())
    
    // Hub-based sequences (start/end at major hubs)
    const majorHubs = ['JFK', 'LAX', 'DFW', 'ORD', 'ATL', 'LHR', 'CDG', 'FRA', 'AMS', 'DXB']
    const hubCities = cities.filter(city => majorHubs.some(hub => city.includes(hub)))
    
    if (hubCities.length > 0) {
      for (const hub of hubCities) {
        const nonHubCities = cities.filter(city => city !== hub)
        sequences.push([hub, ...nonHubCities])
        sequences.push([...nonHubCities, hub])
      }
    }

    // Geographic optimization (minimize backtracking)
    const geographicallyOptimized = await this.optimizeByGeography(cities)
    sequences.push(geographicallyOptimized)

    // Remove duplicates
    return sequences.filter((seq, index, arr) => 
      arr.findIndex(s => JSON.stringify(s) === JSON.stringify(seq)) === index
    )
  }

  private async optimizeByGeography(cities: string[]): Promise<string[]> {
    // This would use geographical coordinates to minimize total travel distance
    // For now, return the original sequence
    return cities
  }

  private async buildItineraryForSequence(
    sequence: string[], 
    request: MultiCityRequest
  ): Promise<MultiCityItinerary | null> {
    const connections: CityConnection[] = []
    let totalCost = 0
    let totalDuration = 0
    let currentDate = new Date(request.startDate)

    // Build connections between consecutive cities
    for (let i = 0; i < sequence.length - 1; i++) {
      const from = sequence[i]
      const to = sequence[i + 1]
      
      const connection = await this.findOptimalConnection(
        from, 
        to, 
        currentDate.toISOString(), 
        request
      )
      
      if (!connection) {
        return null // Cannot complete this sequence
      }
      
      connections.push(connection)
      totalCost += connection.flights.reduce((sum, flight) => sum + flight.price?.total || 0, 0)
      
      // Update current date for next segment
      const lastFlight = connection.flights[connection.flights.length - 1]
      currentDate = new Date(lastFlight.arrival.time)
      
      // Add layover time if planning city exploration
      if (connection.layoverTime && connection.layoverTime > request.preferences.minLayoverTime) {
        currentDate = new Date(currentDate.getTime() + connection.layoverTime * 60 * 60 * 1000)
      }
    }

    // Find accommodations if required
    const accommodations: AccommodationBooking[] = []
    if (request.preferences.accommodationRequired) {
      for (let i = 1; i < sequence.length - 1; i++) {
        const city = sequence[i]
        const accommodation = await this.findAccommodation(city, currentDate.toISOString(), 1)
        if (accommodation) {
          accommodations.push(accommodation)
          totalCost += accommodation.totalPrice
        }
      }
    }

    // Find activities if required
    const activities: ActivityBooking[] = []
    if (request.preferences.activitiesRequired) {
      for (const connection of connections) {
        if (connection.layoverTime && connection.layoverTime > 4) {
          const cityActivities = await this.findLayoverActivities(
            connection.to, 
            connection.layoverTime
          )
          activities.push(...cityActivities)
          totalCost += cityActivities.reduce((sum, activity) => sum + activity.price, 0)
        }
      }
    }

    // Calculate total duration
    const startTime = new Date(connections[0].flights[0].departure.time)
    const endTime = new Date(connections[connections.length - 1].flights[
      connections[connections.length - 1].flights.length - 1
    ].arrival.time)
    totalDuration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate savings (compared to direct flights)
    const directFlightCost = await this.estimateDirectFlightCost(
      sequence[0], 
      sequence[sequence.length - 1], 
      request.startDate
    )
    const savings = Math.max(0, directFlightCost - totalCost)

    // Calculate score
    const costEfficiency = savings / (directFlightCost || 1000)
    const convenience = this.calculateConvenienceScore(connections, request.preferences)
    const score = (costEfficiency * 0.6) + (convenience * 0.4)

    return {
      totalCost,
      totalDuration,
      connections,
      accommodations,
      activities,
      savings,
      score
    }
  }

  private async findOptimalConnection(
    from: string, 
    to: string, 
    date: string, 
    request: MultiCityRequest
  ): Promise<CityConnection | null> {
    // This would integrate with flight search APIs
    // Mock implementation for now
    
    const mockFlights: FlightBooking[] = [{
      id: crypto.randomUUID(),
      confirmationCode: `LHQ${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      airline: request.preferences.preferredAirlines[0] || 'AA',
      flightNumber: `AA${Math.floor(Math.random() * 9000) + 1000}`,
      departure: {
        airport: from,
        city: from,
        country: 'US',
        time: date,
        localTime: date,
        timezone: 'UTC'
      },
      arrival: {
        airport: to,
        city: to,
        country: 'US',
        time: new Date(new Date(date).getTime() + 4 * 60 * 60 * 1000).toISOString(),
        localTime: new Date(new Date(date).getTime() + 4 * 60 * 60 * 1000).toISOString(),
        timezone: 'UTC'
      },
      duration: 240,
      status: 'scheduled',
      checkedIn: false,
      lastUpdated: new Date().toISOString(),
      price: {
        total: Math.floor(Math.random() * 500) + 200,
        currency: 'USD'
      }
    }]

    // Check for layover opportunities
    const layoverTime = Math.floor(Math.random() * 12) + 2 // 2-14 hours
    const meetsLayoverCriteria = layoverTime >= request.preferences.minLayoverTime && 
                                layoverTime <= request.preferences.maxLayoverTime

    return {
      from,
      to,
      flights: mockFlights,
      layoverTime: meetsLayoverCriteria ? layoverTime : undefined,
      costEfficiency: Math.random() * 0.8 + 0.2, // 0.2 - 1.0
      convenience: Math.random() * 0.8 + 0.2 // 0.2 - 1.0
    }
  }

  private async findAccommodation(
    city: string, 
    date: string, 
    nights: number
  ): Promise<AccommodationBooking | null> {
    // Mock accommodation booking
    return {
      id: crypto.randomUUID(),
      confirmationCode: `HTL${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: `Premium Hotel ${city}`,
      address: `123 Main St, ${city}`,
      city,
      country: 'US',
      checkIn: date,
      checkOut: new Date(new Date(date).getTime() + nights * 24 * 60 * 60 * 1000).toISOString(),
      roomType: 'Standard Room',
      guestCount: 1,
      totalPrice: nights * (Math.floor(Math.random() * 200) + 100),
      currency: 'USD',
      amenities: ['WiFi', 'Breakfast', 'Airport Shuttle']
    }
  }

  private async findLayoverActivities(city: string, duration: number): Promise<ActivityBooking[]> {
    // Mock activity suggestions based on layover duration
    const activities: ActivityBooking[] = []
    
    if (duration >= 4) {
      activities.push({
        id: crypto.randomUUID(),
        title: `City Tour of ${city}`,
        description: `Guided tour of major attractions in ${city}`,
        datetime: new Date().toISOString(),
        duration: Math.min(duration - 2, 4), // Leave 2 hours buffer
        location: {
          name: `${city} City Center`,
          address: `Downtown ${city}`,
          city
        },
        price: Math.floor(Math.random() * 100) + 50,
        currency: 'USD',
        category: 'tour',
        provider: 'LayoverHQ Tours',
        status: 'confirmed',
        participantCount: 1
      })
    }

    if (duration >= 6) {
      activities.push({
        id: crypto.randomUUID(),
        title: `Local Cuisine Experience`,
        description: `Taste authentic local dishes`,
        datetime: new Date().toISOString(),
        duration: 2,
        location: {
          name: `Top Restaurant ${city}`,
          address: `456 Food St, ${city}`,
          city
        },
        price: Math.floor(Math.random() * 80) + 30,
        currency: 'USD',
        category: 'dining',
        provider: 'LayoverHQ Dining',
        status: 'confirmed',
        participantCount: 1
      })
    }

    return activities
  }

  private async estimateDirectFlightCost(from: string, to: string, date: string): Promise<number> {
    // Estimate cost of direct flight for comparison
    // Mock implementation
    return Math.floor(Math.random() * 800) + 400
  }

  private calculateConvenienceScore(
    connections: CityConnection[], 
    preferences: MultiCityRequest['preferences']
  ): number {
    let score = 1.0

    for (const connection of connections) {
      // Penalize if layover times don't match preferences
      if (connection.layoverTime) {
        if (connection.layoverTime < preferences.minLayoverTime ||
            connection.layoverTime > preferences.maxLayoverTime) {
          score -= 0.2
        }
      }

      // Bonus for preferred airlines
      const hasPreferredAirline = connection.flights.some(flight =>
        preferences.preferredAirlines.includes(flight.airline)
      )
      if (hasPreferredAirline) {
        score += 0.1
      }
    }

    return Math.max(0, Math.min(1, score))
  }

  async optimizeExistingItinerary(itineraryId: string): Promise<MultiCityItinerary[]> {
    const itinerary = await this.itineraryManager.getItinerary(itineraryId)
    if (!itinerary) {
      throw new Error('Itinerary not found')
    }

    // Extract cities from existing itinerary
    const cities = itinerary.segments
      .filter(segment => segment.location?.city)
      .map(segment => segment.location.city)
      .filter((city, index, arr) => arr.indexOf(city) === index) // Remove duplicates

    if (cities.length < 2) {
      throw new Error('Need at least 2 cities for multi-city optimization')
    }

    // Create optimization request based on existing itinerary
    const request: MultiCityRequest = {
      cities,
      startDate: itinerary.startDate,
      endDate: itinerary.endDate,
      travelerCount: itinerary.travelerCount,
      budget: itinerary.budget?.total,
      preferences: {
        maxLayoverTime: 12,
        minLayoverTime: 4,
        preferredAirlines: itinerary.preferences.rebookingPreferences.preferredAirlines,
        flexibleDates: itinerary.preferences.rebookingPreferences.flexibleDates,
        accommodationRequired: itinerary.segments.some(s => s.type === 'accommodation'),
        activitiesRequired: itinerary.segments.some(s => s.type === 'local_activity')
      }
    }

    return this.planMultiCityTrip(request)
  }

  async createItineraryFromMultiCity(
    userId: string, 
    multiCityItinerary: MultiCityItinerary,
    title: string
  ): Promise<Itinerary> {
    // Convert MultiCityItinerary to full Itinerary
    const segments: TripSegment[] = []

    // Add flight segments
    for (let i = 0; i < multiCityItinerary.connections.length; i++) {
      const connection = multiCityItinerary.connections[i]
      
      for (const flight of connection.flights) {
        segments.push({
          id: crypto.randomUUID(),
          segmentNumber: segments.length + 1,
          type: 'flight',
          startTime: flight.departure.time,
          endTime: flight.arrival.time,
          location: {
            city: flight.arrival.city,
            country: flight.arrival.country,
            airport: flight.arrival.airport
          },
          booking: flight,
          status: 'upcoming'
        })
      }

      // Add layover segments if applicable
      if (connection.layoverTime && connection.layoverTime > 4) {
        const layoverSegment: TripSegment = {
          id: crypto.randomUUID(),
          segmentNumber: segments.length + 1,
          type: 'layover',
          startTime: connection.flights[connection.flights.length - 1].arrival.time,
          endTime: new Date(
            new Date(connection.flights[connection.flights.length - 1].arrival.time).getTime() +
            connection.layoverTime * 60 * 60 * 1000
          ).toISOString(),
          location: {
            city: connection.to,
            country: 'US' // Mock
          },
          status: 'upcoming'
        }

        // Add layover activities
        const layoverActivities = multiCityItinerary.activities.filter(
          activity => activity.location.city === connection.to
        )

        if (layoverActivities.length > 0) {
          layoverSegment.layoverPlan = {
            id: crypto.randomUUID(),
            airport: connection.to,
            city: connection.to,
            country: 'US',
            arrivalTime: layoverSegment.startTime,
            departureTime: layoverSegment.endTime,
            totalDuration: connection.layoverTime,
            explorationTime: connection.layoverTime - 2, // 2 hour buffer
            minimumConnectionTime: 90,
            activities: layoverActivities,
            safetyRating: 8,
            visaRequired: false,
            estimatedCost: {
              transport: 50,
              activities: layoverActivities.reduce((sum, a) => sum + a.price, 0),
              dining: 30,
              total: 80 + layoverActivities.reduce((sum, a) => sum + a.price, 0),
              currency: 'USD'
            },
            riskLevel: 'low',
            contingencyPlans: ['Return to airport 2 hours early', 'Use airport shuttle service']
          }
        }

        segments.push(layoverSegment)
      }
    }

    // Add accommodation segments
    for (const accommodation of multiCityItinerary.accommodations) {
      segments.push({
        id: crypto.randomUUID(),
        segmentNumber: segments.length + 1,
        type: 'accommodation',
        startTime: accommodation.checkIn,
        endTime: accommodation.checkOut,
        location: {
          city: accommodation.city,
          country: accommodation.country
        },
        booking: accommodation,
        status: 'upcoming'
      })
    }

    const itinerary = await this.itineraryManager.createItinerary(userId, {
      title,
      description: `Multi-city trip visiting ${multiCityItinerary.connections.length + 1} cities`,
      startDate: segments[0]?.startTime || new Date().toISOString(),
      endDate: segments[segments.length - 1]?.endTime || new Date().toISOString(),
      tripType: 'leisure',
      travelerCount: 1,
      budget: {
        total: multiCityItinerary.totalCost + 200, // Add buffer
        spent: 0,
        currency: 'USD',
        breakdown: {
          flights: multiCityItinerary.connections.reduce((sum, c) => 
            sum + c.flights.reduce((fSum, f) => fSum + (f.price?.total || 0), 0), 0
          ),
          accommodation: multiCityItinerary.accommodations.reduce((sum, a) => sum + a.totalPrice, 0),
          activities: multiCityItinerary.activities.reduce((sum, a) => sum + a.price, 0),
          transport: 100,
          dining: 200,
          misc: 100
        }
      },
      segments: segments.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    })

    return itinerary
  }
}