import { createClient } from '@supabase/supabase-js'
import { 
  Itinerary, 
  TripSegment, 
  FlightBooking, 
  RebookingOption, 
  TravelAlert,
  ItineraryStats,
  SyncStatus,
  LayoverPlan
} from '../types/itinerary'

export class ItineraryManager {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  async createItinerary(userId: string, itineraryData: Partial<Itinerary>): Promise<Itinerary> {
    const newItinerary: Itinerary = {
      id: crypto.randomUUID(),
      userId,
      title: itineraryData.title || 'New Trip',
      description: itineraryData.description,
      startDate: itineraryData.startDate || new Date().toISOString(),
      endDate: itineraryData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalDuration: 0,
      status: 'draft',
      tripType: itineraryData.tripType || 'leisure',
      travelerCount: itineraryData.travelerCount || 1,
      budget: itineraryData.budget,
      segments: [],
      documents: [],
      alerts: [],
      preferences: itineraryData.preferences || {
        notifications: {
          email: true,
          sms: true,
          push: true,
          advanceNotice: 120
        },
        rebookingPreferences: {
          automaticRebooking: false,
          maxPriceIncrease: 100,
          preferredAirlines: [],
          flexibleDates: true,
          flexibleAirports: false
        }
      },
      emergencyContacts: itineraryData.emergencyContacts || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('itineraries')
      .insert([newItinerary])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create itinerary: ${error.message}`)
    }

    return data
  }

  async getItinerary(itineraryId: string): Promise<Itinerary | null> {
    const { data, error } = await this.supabase
      .from('itineraries')
      .select('*')
      .eq('id', itineraryId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch itinerary: ${error.message}`)
    }

    return data
  }

  async getUserItineraries(userId: string, status?: string): Promise<Itinerary[]> {
    let query = this.supabase
      .from('itineraries')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch user itineraries: ${error.message}`)
    }

    return data || []
  }

  async updateItinerary(itineraryId: string, updates: Partial<Itinerary>): Promise<Itinerary> {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('itineraries')
      .update(updatedData)
      .eq('id', itineraryId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update itinerary: ${error.message}`)
    }

    return data
  }

  async deleteItinerary(itineraryId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('itineraries')
      .delete()
      .eq('id', itineraryId)

    if (error) {
      throw new Error(`Failed to delete itinerary: ${error.message}`)
    }

    return true
  }

  async addSegment(itineraryId: string, segment: Omit<TripSegment, 'id'>): Promise<TripSegment> {
    const itinerary = await this.getItinerary(itineraryId)
    if (!itinerary) {
      throw new Error('Itinerary not found')
    }

    const newSegment: TripSegment = {
      ...segment,
      id: crypto.randomUUID()
    }

    const updatedSegments = [...itinerary.segments, newSegment]
    await this.updateItinerary(itineraryId, { 
      segments: updatedSegments,
      totalDuration: this.calculateTotalDuration(updatedSegments)
    })

    return newSegment
  }

  async updateSegment(itineraryId: string, segmentId: string, updates: Partial<TripSegment>): Promise<TripSegment> {
    const itinerary = await this.getItinerary(itineraryId)
    if (!itinerary) {
      throw new Error('Itinerary not found')
    }

    const segmentIndex = itinerary.segments.findIndex(s => s.id === segmentId)
    if (segmentIndex === -1) {
      throw new Error('Segment not found')
    }

    const updatedSegments = [...itinerary.segments]
    updatedSegments[segmentIndex] = { ...updatedSegments[segmentIndex], ...updates }

    await this.updateItinerary(itineraryId, { 
      segments: updatedSegments,
      totalDuration: this.calculateTotalDuration(updatedSegments)
    })

    return updatedSegments[segmentIndex]
  }

  async removeSegment(itineraryId: string, segmentId: string): Promise<boolean> {
    const itinerary = await this.getItinerary(itineraryId)
    if (!itinerary) {
      throw new Error('Itinerary not found')
    }

    const updatedSegments = itinerary.segments.filter(s => s.id !== segmentId)
    await this.updateItinerary(itineraryId, { 
      segments: updatedSegments,
      totalDuration: this.calculateTotalDuration(updatedSegments)
    })

    return true
  }

  async addAlert(itineraryId: string, alert: Omit<TravelAlert, 'id' | 'timestamp' | 'acknowledged'>): Promise<TravelAlert> {
    const itinerary = await this.getItinerary(itineraryId)
    if (!itinerary) {
      throw new Error('Itinerary not found')
    }

    const newAlert: TravelAlert = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      acknowledged: false
    }

    const updatedAlerts = [...itinerary.alerts, newAlert]
    await this.updateItinerary(itineraryId, { alerts: updatedAlerts })

    // Trigger notification if needed
    await this.sendNotification(itinerary.userId, newAlert)

    return newAlert
  }

  async acknowledgeAlert(itineraryId: string, alertId: string): Promise<boolean> {
    const itinerary = await this.getItinerary(itineraryId)
    if (!itinerary) {
      throw new Error('Itinerary not found')
    }

    const alertIndex = itinerary.alerts.findIndex(a => a.id === alertId)
    if (alertIndex === -1) {
      throw new Error('Alert not found')
    }

    const updatedAlerts = [...itinerary.alerts]
    updatedAlerts[alertIndex].acknowledged = true

    await this.updateItinerary(itineraryId, { alerts: updatedAlerts })
    return true
  }

  async getActiveItineraries(userId: string): Promise<Itinerary[]> {
    const now = new Date().toISOString()
    
    const { data, error } = await this.supabase
      .from('itineraries')
      .select('*')
      .eq('userId', userId)
      .in('status', ['confirmed', 'active'])
      .gte('endDate', now)
      .order('startDate', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch active itineraries: ${error.message}`)
    }

    return data || []
  }

  async getUpcomingSegments(userId: string, daysAhead: number = 7): Promise<TripSegment[]> {
    const itineraries = await this.getActiveItineraries(userId)
    const now = new Date()
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

    const upcomingSegments: TripSegment[] = []

    for (const itinerary of itineraries) {
      for (const segment of itinerary.segments) {
        const segmentDate = new Date(segment.startTime)
        if (segmentDate >= now && segmentDate <= futureDate) {
          upcomingSegments.push(segment)
        }
      }
    }

    return upcomingSegments.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
  }

  async getItineraryStats(userId: string): Promise<ItineraryStats> {
    const allItineraries = await this.getUserItineraries(userId)
    const completedTrips = allItineraries.filter(i => i.status === 'completed')
    const upcomingTrips = allItineraries.filter(i => 
      i.status === 'confirmed' || i.status === 'active'
    )

    let totalDistance = 0
    let totalSavings = 0
    const cityVisits: { [key: string]: number } = {}

    for (const itinerary of completedTrips) {
      for (const segment of itinerary.segments) {
        if (segment.type === 'flight' && segment.booking) {
          const flight = segment.booking as FlightBooking
          // Approximate distance calculation would go here
          totalDistance += 1000 // Placeholder
        }
        
        if (segment.location?.city) {
          cityVisits[segment.location.city] = (cityVisits[segment.location.city] || 0) + 1
        }
      }

      if (itinerary.budget?.total) {
        totalSavings += Math.max(0, itinerary.budget.total - itinerary.budget.spent)
      }
    }

    const favoriteCities = Object.entries(cityVisits)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([city]) => city)

    const totalDurations = completedTrips.map(i => i.totalDuration).filter(d => d > 0)
    const averageTripDuration = totalDurations.length > 0 
      ? totalDurations.reduce((a, b) => a + b, 0) / totalDurations.length 
      : 0

    return {
      totalTrips: allItineraries.length,
      completedTrips: completedTrips.length,
      totalDistance,
      totalSavings,
      favoriteCities,
      averageTripDuration,
      upcomingTrips: upcomingTrips.length
    }
  }

  private calculateTotalDuration(segments: TripSegment[]): number {
    if (segments.length === 0) return 0
    
    const sortedSegments = segments.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    
    const startTime = new Date(sortedSegments[0].startTime)
    const endTime = new Date(sortedSegments[sortedSegments.length - 1].endTime)
    
    return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24))
  }

  private async sendNotification(userId: string, alert: TravelAlert): Promise<void> {
    // Implementation would integrate with notification service
    // This is a placeholder for the notification logic
    console.log(`Sending notification to user ${userId}:`, alert)
  }

  async duplicateItinerary(itineraryId: string, userId: string): Promise<Itinerary> {
    const originalItinerary = await this.getItinerary(itineraryId)
    if (!originalItinerary) {
      throw new Error('Original itinerary not found')
    }

    const duplicatedItinerary = {
      ...originalItinerary,
      title: `Copy of ${originalItinerary.title}`,
      status: 'draft' as const,
      segments: originalItinerary.segments.map(segment => ({
        ...segment,
        id: crypto.randomUUID(),
        status: 'upcoming' as const
      })),
      alerts: [],
      documents: []
    }

    return this.createItinerary(userId, duplicatedItinerary)
  }

  async exportItinerary(itineraryId: string, format: 'json' | 'ical' | 'pdf'): Promise<string> {
    const itinerary = await this.getItinerary(itineraryId)
    if (!itinerary) {
      throw new Error('Itinerary not found')
    }

    switch (format) {
      case 'json':
        return JSON.stringify(itinerary, null, 2)
      
      case 'ical':
        return this.generateICalFormat(itinerary)
      
      case 'pdf':
        // This would integrate with a PDF generation service
        throw new Error('PDF export not yet implemented')
      
      default:
        throw new Error('Unsupported export format')
    }
  }

  private generateICalFormat(itinerary: Itinerary): string {
    const ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LayoverHQ//Itinerary//EN',
      `X-WR-CALNAME:${itinerary.title}`,
      'X-WR-TIMEZONE:UTC'
    ]

    for (const segment of itinerary.segments) {
      ical.push(
        'BEGIN:VEVENT',
        `UID:${segment.id}@layoverhq.com`,
        `DTSTART:${new Date(segment.startTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
        `DTEND:${new Date(segment.endTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
        `SUMMARY:${this.getSegmentSummary(segment)}`,
        `LOCATION:${segment.location.city}, ${segment.location.country}`,
        `DESCRIPTION:${this.getSegmentDescription(segment)}`,
        'END:VEVENT'
      )
    }

    ical.push('END:VCALENDAR')
    return ical.join('\r\n')
  }

  private getSegmentSummary(segment: TripSegment): string {
    switch (segment.type) {
      case 'flight':
        const flight = segment.booking as FlightBooking
        return `Flight ${flight?.flightNumber || ''} to ${segment.location.city}`
      case 'layover':
        return `Layover in ${segment.location.city}`
      case 'accommodation':
        return `Stay in ${segment.location.city}`
      case 'local_activity':
        return `Activity in ${segment.location.city}`
      default:
        return `Trip segment in ${segment.location.city}`
    }
  }

  private getSegmentDescription(segment: TripSegment): string {
    if (segment.notes) return segment.notes
    
    switch (segment.type) {
      case 'flight':
        const flight = segment.booking as FlightBooking
        return `Flight from ${flight?.departure.city} to ${flight?.arrival.city}`
      case 'layover':
        return `Layover exploration in ${segment.location.city}`
      default:
        return `Travel segment in ${segment.location.city}`
    }
  }
}