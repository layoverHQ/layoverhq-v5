import { ItineraryManager } from './itinerary-manager'
import { FlightBooking, TravelAlert, Itinerary, SyncStatus } from '../types/itinerary'
import { createClient } from '@supabase/supabase-js'

export class ScheduleSyncService {
  private itineraryManager: ItineraryManager
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.itineraryManager = new ItineraryManager()
  }

  async startSyncForItinerary(itineraryId: string): Promise<void> {
    // Stop existing sync if running
    this.stopSyncForItinerary(itineraryId)

    // Start new sync interval (every 5 minutes)
    const interval = setInterval(async () => {
      try {
        await this.syncItinerary(itineraryId)
      } catch (error) {
        console.error(`Sync error for itinerary ${itineraryId}:`, error)
      }
    }, 5 * 60 * 1000)

    this.syncIntervals.set(itineraryId, interval)

    // Initial sync
    await this.syncItinerary(itineraryId)
  }

  stopSyncForItinerary(itineraryId: string): void {
    const interval = this.syncIntervals.get(itineraryId)
    if (interval) {
      clearInterval(interval)
      this.syncIntervals.delete(itineraryId)
    }
  }

  async syncItinerary(itineraryId: string): Promise<SyncStatus> {
    const itinerary = await this.itineraryManager.getItinerary(itineraryId)
    if (!itinerary) {
      throw new Error('Itinerary not found')
    }

    const syncStatus: SyncStatus = {
      lastSync: new Date().toISOString(),
      status: 'syncing',
      errors: [],
      nextSync: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      syncSources: {
        airlines: [],
        hotels: [],
        activities: [],
        weather: false,
        alerts: false
      }
    }

    try {
      // Sync flight information
      await this.syncFlights(itinerary)
      syncStatus.syncSources.airlines = await this.getAirlineSources(itinerary)

      // Sync hotel information
      await this.syncAccommodations(itinerary)
      syncStatus.syncSources.hotels = await this.getHotelSources(itinerary)

      // Sync weather information
      await this.syncWeatherForItinerary(itinerary)
      syncStatus.syncSources.weather = true

      // Sync travel alerts
      await this.syncTravelAlerts(itinerary)
      syncStatus.syncSources.alerts = true

      // Update sync timestamp
      await this.itineraryManager.updateItinerary(itineraryId, {
        lastSyncedAt: new Date().toISOString()
      })

      syncStatus.status = 'synced'
    } catch (error) {
      syncStatus.status = 'error'
      syncStatus.errors.push(error instanceof Error ? error.message : 'Unknown sync error')
    }

    // Store sync status
    await this.storeSyncStatus(itineraryId, syncStatus)

    return syncStatus
  }

  private async syncFlights(itinerary: Itinerary): Promise<void> {
    for (const segment of itinerary.segments) {
      if (segment.type === 'flight' && segment.booking) {
        const flightBooking = segment.booking as FlightBooking
        const updatedFlight = await this.fetchFlightStatus(flightBooking)
        
        if (this.hasFlightChanged(flightBooking, updatedFlight)) {
          // Update the segment
          await this.itineraryManager.updateSegment(itinerary.id, segment.id, {
            booking: updatedFlight
          })

          // Create alert for significant changes
          if (this.isSignificantFlightChange(flightBooking, updatedFlight)) {
            await this.createFlightChangeAlert(itinerary.id, flightBooking, updatedFlight)
          }
        }
      }
    }
  }

  private async fetchFlightStatus(flight: FlightBooking): Promise<FlightBooking> {
    // This would integrate with various airline APIs
    // For now, returning a mock updated flight
    
    try {
      // Mock API call - in real implementation, this would call:
      // - Amadeus Flight Status API
      // - Individual airline APIs
      // - FlightAware API
      // - etc.
      
      const updatedFlight: FlightBooking = {
        ...flight,
        lastUpdated: new Date().toISOString()
      }

      // Simulate potential changes
      const random = Math.random()
      if (random < 0.1) { // 10% chance of delay
        updatedFlight.status = 'delayed'
        const delayMinutes = Math.floor(Math.random() * 120) + 15
        const originalTime = new Date(flight.departure.time)
        const delayedTime = new Date(originalTime.getTime() + delayMinutes * 60 * 1000)
        
        updatedFlight.departure.time = delayedTime.toISOString()
        updatedFlight.departure.localTime = delayedTime.toISOString()
      } else if (random < 0.02) { // 2% chance of gate change
        updatedFlight.departure.gate = `A${Math.floor(Math.random() * 20) + 1}`
        updatedFlight.arrival.gate = `B${Math.floor(Math.random() * 30) + 1}`
      }

      return updatedFlight
    } catch (error) {
      console.error('Error fetching flight status:', error)
      return flight
    }
  }

  private hasFlightChanged(original: FlightBooking, updated: FlightBooking): boolean {
    return (
      original.status !== updated.status ||
      original.departure.time !== updated.departure.time ||
      original.departure.gate !== updated.departure.gate ||
      original.arrival.time !== updated.arrival.time ||
      original.arrival.gate !== updated.arrival.gate
    )
  }

  private isSignificantFlightChange(original: FlightBooking, updated: FlightBooking): boolean {
    // Define significant changes that warrant alerts
    if (original.status !== updated.status && 
        (updated.status === 'cancelled' || updated.status === 'delayed')) {
      return true
    }

    // Check for delays over 30 minutes
    const originalTime = new Date(original.departure.time).getTime()
    const updatedTime = new Date(updated.departure.time).getTime()
    const delayMinutes = (updatedTime - originalTime) / (1000 * 60)
    
    return Math.abs(delayMinutes) > 30
  }

  private async createFlightChangeAlert(
    itineraryId: string, 
    originalFlight: FlightBooking, 
    updatedFlight: FlightBooking
  ): Promise<void> {
    let alertMessage = ''
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'

    if (updatedFlight.status === 'cancelled') {
      alertMessage = `Flight ${originalFlight.flightNumber} has been cancelled. Rebooking options are being prepared.`
      severity = 'critical'
    } else if (updatedFlight.status === 'delayed') {
      const originalTime = new Date(originalFlight.departure.time).getTime()
      const updatedTime = new Date(updatedFlight.departure.time).getTime()
      const delayMinutes = Math.floor((updatedTime - originalTime) / (1000 * 60))
      
      alertMessage = `Flight ${originalFlight.flightNumber} is delayed by ${delayMinutes} minutes.`
      severity = delayMinutes > 120 ? 'high' : 'medium'
    } else if (originalFlight.departure.gate !== updatedFlight.departure.gate) {
      alertMessage = `Gate change for flight ${originalFlight.flightNumber}: New gate ${updatedFlight.departure.gate}`
      severity = 'low'
    }

    await this.itineraryManager.addAlert(itineraryId, {
      type: updatedFlight.status === 'cancelled' ? 'cancellation' : 'delay',
      severity,
      title: `Flight ${originalFlight.flightNumber} Update`,
      message: alertMessage,
      actionRequired: updatedFlight.status === 'cancelled'
    })
  }

  private async syncAccommodations(itinerary: Itinerary): Promise<void> {
    // Implementation would sync with hotel booking systems
    // Placeholder for now
    console.log('Syncing accommodations for itinerary:', itinerary.id)
  }

  private async syncWeatherForItinerary(itinerary: Itinerary): Promise<void> {
    for (const segment of itinerary.segments) {
      if (segment.layoverPlan) {
        const weather = await this.fetchWeatherForecast(
          segment.location.city,
          segment.startTime
        )
        
        // Update layover plan with weather info
        const updatedLayoverPlan = {
          ...segment.layoverPlan,
          weatherForecast: weather
        }
        
        await this.itineraryManager.updateSegment(itinerary.id, segment.id, {
          layoverPlan: updatedLayoverPlan
        })

        // Create weather alerts if severe weather expected
        if (weather && this.isSevereWeather(weather)) {
          await this.createWeatherAlert(itinerary.id, segment.location.city, weather)
        }
      }
    }
  }

  private async fetchWeatherForecast(city: string, date: string): Promise<any> {
    // This would integrate with weather APIs like OpenWeatherMap
    // Mock implementation for now
    return {
      temperature: Math.floor(Math.random() * 30) + 10,
      condition: ['sunny', 'cloudy', 'rainy', 'stormy'][Math.floor(Math.random() * 4)],
      precipitation: Math.floor(Math.random() * 100)
    }
  }

  private isSevereWeather(weather: any): boolean {
    return weather.condition === 'stormy' || weather.precipitation > 80
  }

  private async createWeatherAlert(itineraryId: string, city: string, weather: any): Promise<void> {
    await this.itineraryManager.addAlert(itineraryId, {
      type: 'weather',
      severity: 'medium',
      title: `Weather Alert for ${city}`,
      message: `Severe weather expected: ${weather.condition} with ${weather.precipitation}% chance of precipitation.`,
      actionRequired: false
    })
  }

  private async syncTravelAlerts(itinerary: Itinerary): Promise<void> {
    // This would integrate with travel alert services
    // Check for country-specific alerts, embassy notifications, etc.
    console.log('Syncing travel alerts for itinerary:', itinerary.id)
  }

  private async getAirlineSources(itinerary: Itinerary): Promise<string[]> {
    const airlines = new Set<string>()
    
    for (const segment of itinerary.segments) {
      if (segment.type === 'flight' && segment.booking) {
        const flight = segment.booking as FlightBooking
        airlines.add(flight.airline)
      }
    }
    
    return Array.from(airlines)
  }

  private async getHotelSources(itinerary: Itinerary): Promise<string[]> {
    // Extract hotel booking sources
    return []
  }

  private async storeSyncStatus(itineraryId: string, status: SyncStatus): Promise<void> {
    const { error } = await this.supabase
      .from('itinerary_sync_status')
      .upsert([{
        itinerary_id: itineraryId,
        ...status
      }])

    if (error) {
      console.error('Failed to store sync status:', error)
    }
  }

  async getSyncStatus(itineraryId: string): Promise<SyncStatus | null> {
    const { data, error } = await this.supabase
      .from('itinerary_sync_status')
      .select('*')
      .eq('itinerary_id', itineraryId)
      .single()

    if (error) {
      console.error('Failed to fetch sync status:', error)
      return null
    }

    return data
  }

  async syncAllActiveItineraries(): Promise<void> {
    // This would be called by a cron job or background service
    const { data: activeItineraries, error } = await this.supabase
      .from('itineraries')
      .select('id')
      .in('status', ['confirmed', 'active'])

    if (error) {
      console.error('Failed to fetch active itineraries:', error)
      return
    }

    const syncPromises = activeItineraries.map(itinerary => 
      this.syncItinerary(itinerary.id)
    )

    await Promise.allSettled(syncPromises)
  }

  cleanup(): void {
    // Stop all sync intervals
    for (const interval of this.syncIntervals.values()) {
      clearInterval(interval)
    }
    this.syncIntervals.clear()
  }
}