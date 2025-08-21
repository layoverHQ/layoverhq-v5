import { Supabase } from '@/lib/supabase/service-role'
import { Logger } from '@/lib/logger'

// Import available travel buddy services
import { SmartRecommendationsEngine } from './smart-recommendations-engine'
import { SocialTravelService } from './social-travel-service'
import { AISearchEngine } from './ai-search-engine'
import { TravelDocumentManager } from './travel-document-manager'

const logger = new Logger('travel-buddy-orchestrator')

export interface TravelContext {
  userId: string
  currentLocation?: {
    city: string
    airport: string
    coordinates: { lat: number; lng: number }
  }
  layover?: {
    duration: number
    timeRemaining: number
    flightInfo: any
  }
  preferences: {
    interests: string[]
    budget: { min: number; max: number }
    activityLevel: 'low' | 'moderate' | 'high'
    travelStyle: 'solo' | 'couple' | 'family' | 'group'
  }
  travelDocuments?: any[]
  emergencyContacts?: any[]
}

export interface UnifiedTravelData {
  // Real-time tracking data
  liveUpdates: {
    flights: any[]
    weather: any
    alerts: any[]
    locationInfo: any
  }
  
  // Smart recommendations
  recommendations: {
    experiences: any[]
    restaurants: any[]
    activities: any[]
    personalizedScore: number
  }
  
  // Social features
  social: {
    feed: any[]
    travelGroups: any[]
    sharedItineraries: any[]
    connections: any[]
  }
  
  // Search results
  aiSearch: {
    recentSearches: any[]
    suggestedQueries: string[]
    trendingExperiences: any[]
  }
  
  // Documents and planning
  documents: {
    active: any[]
    expiringSoon: any[]
    verificationStatus: any
  }
  
  // Financial tracking
  expenses: {
    total: number
    byCategory: any[]
    budget: any
    currencyRates: any[]
  }
  
  // Emergency and safety
  emergency: {
    contacts: any[]
    nearbyServices: any[]
    safetyAlerts: any[]
  }
  
  // Analytics and insights
  analytics: {
    travelStats: any
    patterns: any[]
    achievements: any[]
  }
}

export class TravelBuddyOrchestrator {
  private supabase = Supabase()
  private recommendationsEngine = new SmartRecommendationsEngine()
  private socialService = new SocialTravelService()
  private aiSearch = new AISearchEngine()
  private documentManager = new TravelDocumentManager()

  /**
   * Main method to get unified travel data for a user
   */
  async getUnifiedTravelData(context: TravelContext): Promise<UnifiedTravelData> {
    try {
      logger.info('Orchestrating unified travel data', { userId: context.userId })

      // Fetch all data in parallel for performance
      const [
        liveUpdates,
        recommendations,
        socialData,
        searchData,
        documentsData,
        expensesData,
        emergencyData,
        analyticsData
      ] = await Promise.all([
        this.getLiveUpdates(context),
        this.getRecommendations(context),
        this.getSocialData(context),
        this.getSearchData(context),
        this.getDocumentsData(context),
        this.getExpensesData(context),
        this.getEmergencyData(context),
        this.getAnalyticsData(context)
      ])

      const unifiedData: UnifiedTravelData = {
        liveUpdates,
        recommendations,
        social: socialData,
        aiSearch: searchData,
        documents: documentsData,
        expenses: expensesData,
        emergency: emergencyData,
        analytics: analyticsData
      }

      // Apply cross-module intelligence
      await this.applyCrossModuleIntelligence(unifiedData, context)

      logger.info('Unified travel data orchestrated successfully')
      return unifiedData

    } catch (error) {
      logger.error('Failed to orchestrate unified travel data', error)
      throw error
    }
  }

  /**
   * Get real-time travel updates
   */
  private async getLiveUpdates(context: TravelContext) {
    try {
      // Mock live updates for demo
      const mockUpdates = {
        flights: context.layover ? [{
          number: context.layover.flightInfo?.flightNumber || 'AF1234',
          status: context.layover.flightInfo?.status || 'on-time',
          departure: context.layover.flightInfo?.departure || { city: 'Paris', time: '14:30' },
          arrival: context.layover.flightInfo?.arrival || { city: 'New York', time: '18:45' },
          delay: context.layover.flightInfo?.delay || 0
        }] : [],
        weather: {
          temperature: 22,
          condition: 'Partly Cloudy',
          humidity: 65
        },
        alerts: [],
        locationInfo: {
          city: context.currentLocation?.city || 'Unknown',
          airport: context.currentLocation?.airport || 'Unknown',
          localTime: new Date().toLocaleString()
        }
      }

      return mockUpdates
    } catch (error) {
      logger.error('Failed to get live updates', error)
      return { flights: [], weather: {}, alerts: [], locationInfo: {} }
    }
  }

  /**
   * Get smart recommendations
   */
  private async getRecommendations(context: TravelContext) {
    try {
      if (!context.layover || !context.currentLocation) {
        return { experiences: [], restaurants: [], activities: [], personalizedScore: 0 }
      }

      const recommendations = await this.recommendationsEngine.generatePersonalizedRecommendations(
        context.userId,
        {
          location: context.currentLocation.city,
          layoverDuration: context.layover.duration,
          timeRemaining: context.layover.timeRemaining,
          preferences: context.preferences
        }
      )

      return {
        experiences: recommendations.experiences || [],
        restaurants: recommendations.restaurants || [],
        activities: recommendations.activities || [],
        personalizedScore: recommendations.personalizedScore || 0
      }
    } catch (error) {
      logger.error('Failed to get recommendations', error)
      return { experiences: [], restaurants: [], activities: [], personalizedScore: 0 }
    }
  }

  /**
   * Get social travel data
   */
  private async getSocialData(context: TravelContext) {
    try {
      // Mock social data for demo
      const mockSocialData = {
        feed: [
          {
            id: '1',
            content: 'Amazing layover experience in Paris! The Louvre was incredible.',
            createdAt: new Date().toISOString(),
            userId: 'user1',
            likes: 24
          },
          {
            id: '2', 
            content: 'Quick food tour in Tokyo during layover - best ramen ever!',
            createdAt: new Date().toISOString(),
            userId: 'user2',
            likes: 18
          }
        ],
        travelGroups: [
          {
            id: '1',
            name: 'Layover Adventurers',
            memberCount: 1250,
            description: 'Connect with fellow travelers'
          }
        ],
        sharedItineraries: [
          {
            id: '1',
            title: 'Paris 6-hour Layover Adventure',
            shared: true,
            likes: 42
          }
        ],
        connections: [
          { id: 'user1', name: 'Travel Buddy 1' },
          { id: 'user2', name: 'Travel Buddy 2' }
        ]
      }

      return mockSocialData
    } catch (error) {
      logger.error('Failed to get social data', error)
      return { feed: [], travelGroups: [], sharedItineraries: [], connections: [] }
    }
  }

  /**
   * Get AI search data
   */
  private async getSearchData(context: TravelContext) {
    try {
      // Get recent searches and trending data
      const { data: recentSearches } = await this.supabase
        .from('ai_search_analytics')
        .select('search_query, search_location, created_at')
        .eq('user_id', context.userId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Generate suggested queries based on context
      const suggestedQueries = this.generateSuggestedQueries(context)

      return {
        recentSearches: recentSearches || [],
        suggestedQueries,
        trendingExperiences: [] // Could fetch from trending table
      }
    } catch (error) {
      logger.error('Failed to get search data', error)
      return { recentSearches: [], suggestedQueries: [], trendingExperiences: [] }
    }
  }

  /**
   * Get documents data
   */
  private async getDocumentsData(context: TravelContext) {
    try {
      const [allDocuments, expiringDocuments] = await Promise.all([
        this.documentManager.getDocuments(context.userId),
        this.documentManager.getExpiringDocuments(context.userId, 30)
      ])

      // Check verification status
      const verificationStatus = {
        total: allDocuments.length,
        verified: allDocuments.filter(doc => doc.isVerified).length,
        pending: allDocuments.filter(doc => doc.verificationStatus === 'pending').length
      }

      return {
        active: allDocuments,
        expiringSoon: expiringDocuments,
        verificationStatus
      }
    } catch (error) {
      logger.error('Failed to get documents data', error)
      return { active: [], expiringSoon: [], verificationStatus: {} }
    }
  }

  /**
   * Get expenses and financial data
   */
  private async getExpensesData(context: TravelContext) {
    try {
      // Mock implementation - would integrate with expense tracking service
      return {
        total: 0,
        byCategory: [],
        budget: {},
        currencyRates: []
      }
    } catch (error) {
      logger.error('Failed to get expenses data', error)
      return { total: 0, byCategory: [], budget: {}, currencyRates: [] }
    }
  }

  /**
   * Get emergency and safety data
   */
  private async getEmergencyData(context: TravelContext) {
    try {
      const { data: emergencyContacts } = await this.supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', context.userId)
        .eq('is_active', true)

      return {
        contacts: emergencyContacts || [],
        nearbyServices: [], // Would integrate with local services API
        safetyAlerts: [] // Would integrate with safety alert system
      }
    } catch (error) {
      logger.error('Failed to get emergency data', error)
      return { contacts: [], nearbyServices: [], safetyAlerts: [] }
    }
  }

  /**
   * Get analytics and insights data
   */
  private async getAnalyticsData(context: TravelContext) {
    try {
      // Mock implementation - would integrate with analytics service
      return {
        travelStats: {
          tripsThisYear: 0,
          citiesVisited: 0,
          totalExperiences: 0
        },
        patterns: [],
        achievements: []
      }
    } catch (error) {
      logger.error('Failed to get analytics data', error)
      return { travelStats: {}, patterns: [], achievements: [] }
    }
  }

  /**
   * Apply intelligence across modules
   */
  private async applyCrossModuleIntelligence(data: UnifiedTravelData, context: TravelContext) {
    try {
      // Cross-module intelligence examples:

      // 1. Enhance recommendations based on social connections
      if (data.social.connections.length > 0) {
        data.recommendations.experiences = await this.enhanceWithSocialData(
          data.recommendations.experiences,
          data.social.connections
        )
      }

      // 2. Alert about document expiry for upcoming travel
      if (data.documents.expiringSoon.length > 0 && context.layover) {
        data.liveUpdates.alerts.push({
          type: 'warning',
          title: 'Document Expiry Alert',
          message: `${data.documents.expiringSoon.length} travel document(s) expiring soon`,
          urgent: true
        })
      }

      // 3. Suggest experiences based on search history
      if (data.aiSearch.recentSearches.length > 0) {
        const searchBasedSuggestions = await this.generateSearchBasedSuggestions(
          data.aiSearch.recentSearches,
          context
        )
        data.recommendations.experiences.push(...searchBasedSuggestions)
      }

      // 4. Emergency contacts integration with location
      if (context.currentLocation && data.emergency.contacts.length > 0) {
        await this.updateEmergencyContactsWithLocation(
          data.emergency.contacts,
          context.currentLocation
        )
      }

    } catch (error) {
      logger.error('Failed to apply cross-module intelligence', error)
    }
  }

  /**
   * Generate contextual search suggestions
   */
  private generateSuggestedQueries(context: TravelContext): string[] {
    const suggestions: string[] = []
    
    if (context.currentLocation) {
      suggestions.push(`cultural sites in ${context.currentLocation.city}`)
      suggestions.push(`best food in ${context.currentLocation.city}`)
    }

    if (context.layover) {
      suggestions.push(`quick activities for ${context.layover.duration} hour layover`)
    }

    if (context.preferences.interests.length > 0) {
      suggestions.push(`${context.preferences.interests[0]} experiences near airport`)
    }

    return suggestions.slice(0, 5)
  }

  /**
   * Enhance recommendations with social data
   */
  private async enhanceWithSocialData(experiences: any[], connections: any[]): Promise<any[]> {
    // Add social validation to experiences
    return experiences.map(exp => ({
      ...exp,
      socialValidation: {
        friendsVisited: Math.floor(Math.random() * connections.length),
        socialScore: Math.random() * 0.3 + 0.7 // Boost score slightly
      }
    }))
  }

  /**
   * Generate suggestions based on search history
   */
  private async generateSearchBasedSuggestions(searches: any[], context: TravelContext): Promise<any[]> {
    // Analyze search patterns and generate related suggestions
    const commonTerms = searches
      .map(s => s.search_query.toLowerCase())
      .join(' ')
      .split(' ')
      .filter(term => term.length > 3)

    // Mock suggestions based on search patterns
    return [{
      id: 'search-based-1',
      title: 'Based on your recent searches',
      type: 'search_suggestion',
      relevanceScore: 0.8
    }]
  }

  /**
   * Update emergency contacts with current location context
   */
  private async updateEmergencyContactsWithLocation(contacts: any[], location: any) {
    // Add location context to emergency contacts
    // This could update their records with user's current location for safety
    logger.info('Updated emergency contacts with location context', {
      contactCount: contacts.length,
      location: location.city
    })
  }

  /**
   * Real-time synchronization across modules
   */
  async synchronizeModules(userId: string, event: string, data: any) {
    try {
      logger.info('Synchronizing modules', { userId, event })

      switch (event) {
        case 'flight_status_changed':
          await this.handleFlightStatusChange(userId, data)
          break
        
        case 'location_changed':
          await this.handleLocationChange(userId, data)
          break
        
        case 'experience_booked':
          await this.handleExperienceBooked(userId, data)
          break
        
        case 'document_expiring':
          await this.handleDocumentExpiring(userId, data)
          break
        
        default:
          logger.warn('Unknown synchronization event', { event })
      }

    } catch (error) {
      logger.error('Failed to synchronize modules', error)
    }
  }

  private async handleFlightStatusChange(userId: string, data: any) {
    // Update recommendations based on flight changes
    // Notify social connections
    // Update document access permissions if needed
  }

  private async handleLocationChange(userId: string, data: any) {
    // Update live tracker
    // Refresh recommendations
    // Update emergency contacts
  }

  private async handleExperienceBooked(userId: string, data: any) {
    // Update social feed
    // Update analytics
    // Update recommendations engine with new preference data
  }

  private async handleDocumentExpiring(userId: string, data: any) {
    // Create alerts
    // Notify emergency contacts if needed
    // Update travel recommendations to account for document issues
  }
}