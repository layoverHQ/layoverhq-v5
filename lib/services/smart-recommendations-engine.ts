import { createClient } from '@supabase/supabase-js'
import { Itinerary, LayoverPlan, ActivityBooking } from '../types/itinerary'

export interface UserProfile {
  id: string
  preferences: {
    travelStyle: 'budget' | 'balanced' | 'luxury'
    interests: string[]
    dietaryRestrictions: string[]
    accessibility: string[]
    languages: string[]
    budgetRange: { min: number; max: number }
    timePreferences: { morning: boolean; afternoon: boolean; evening: boolean }
  }
  travelHistory: {
    visitedCities: string[]
    favoriteActivities: string[]
    averageSpending: number
    preferredSeasons: string[]
  }
  currentLocation?: {
    city: string
    country: string
    timezone: string
  }
}

export interface Recommendation {
  id: string
  type: 'experience' | 'restaurant' | 'layover_city' | 'flight' | 'accommodation' | 'transport'
  title: string
  description: string
  location: {
    city: string
    country: string
    address?: string
    coordinates?: { lat: number; lng: number }
  }
  price: {
    amount: number
    currency: string
    priceLevel: 'budget' | 'mid-range' | 'luxury'
  }
  duration: number // minutes
  rating: number
  reviewCount: number
  images: string[]
  tags: string[]
  reasons: string[] // Why this was recommended
  availability: {
    startTime: string
    endTime: string
    daysOfWeek: number[]
  }
  bookingInfo?: {
    provider: string
    bookingUrl: string
    cancellationPolicy: string
  }
  personalizedScore: number // 0-1 based on user preferences
  urgency: 'low' | 'medium' | 'high' // Time-sensitive deals
}

export interface LayoverRecommendations {
  city: string
  layoverDuration: number
  recommendations: {
    quickActivities: Recommendation[] // 2-4 hours
    halfDayExperiences: Recommendation[] // 4-8 hours
    fullDayAdventures: Recommendation[] // 8+ hours
    dining: Recommendation[]
    shopping: Recommendation[]
    cultural: Recommendation[]
    transportation: Recommendation[]
  }
  optimizedItinerary?: {
    activities: Recommendation[]
    totalDuration: number
    totalCost: number
    timeBuffer: number
  }
}

export interface FlightRecommendation extends Recommendation {
  flightDetails: {
    airline: string
    flightNumber: string
    aircraft: string
    departure: { airport: string; time: string }
    arrival: { airport: string; time: string }
    duration: number
    stops: number
    layovers: Array<{
      airport: string
      duration: number
      city: string
    }>
  }
  savings: {
    amount: number
    percentage: number
    comparedTo: 'direct_flight' | 'competitor'
  }
}

export class SmartRecommendationsEngine {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  async generatePersonalizedRecommendations(
    userId: string,
    context: {
      currentLocation?: string
      destination?: string
      layoverCity?: string
      layoverDuration?: number
      budget?: number
      interests?: string[]
      timeOfDay?: 'morning' | 'afternoon' | 'evening'
    }
  ): Promise<Recommendation[]> {
    const userProfile = await this.getUserProfile(userId)
    const recommendations: Recommendation[] = []

    // Generate different types of recommendations based on context
    if (context.layoverCity && context.layoverDuration) {
      const layoverRecs = await this.getLayoverRecommendations(
        context.layoverCity,
        context.layoverDuration,
        userProfile
      )
      recommendations.push(...this.selectBestRecommendations(layoverRecs, userProfile))
    }

    if (context.destination) {
      const destinationRecs = await this.getDestinationRecommendations(
        context.destination,
        userProfile
      )
      recommendations.push(...destinationRecs)
    }

    // Add flight recommendations
    const flightRecs = await this.getFlightRecommendations(userProfile, context)
    recommendations.push(...flightRecs)

    // Sort by personalized score and return top recommendations
    return recommendations
      .sort((a, b) => b.personalizedScore - a.personalizedScore)
      .slice(0, 10)
  }

  private async getUserProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*, travel_history(*), user_preferences(*)')
      .eq('id', userId)
      .single()

    if (error || !data) {
      // Return default profile
      return {
        id: userId,
        preferences: {
          travelStyle: 'balanced',
          interests: ['culture', 'food', 'sightseeing'],
          dietaryRestrictions: [],
          accessibility: [],
          languages: ['en'],
          budgetRange: { min: 50, max: 200 },
          timePreferences: { morning: true, afternoon: true, evening: true }
        },
        travelHistory: {
          visitedCities: [],
          favoriteActivities: [],
          averageSpending: 100,
          preferredSeasons: ['spring', 'summer']
        }
      }
    }

    return {
      id: data.id,
      preferences: data.user_preferences || {},
      travelHistory: data.travel_history || {},
      currentLocation: data.current_location
    }
  }

  private async getLayoverRecommendations(
    city: string,
    duration: number,
    userProfile: UserProfile
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []

    // Get city-specific activities from database
    const { data: activities, error } = await this.supabase
      .from('layover_activities')
      .select('*')
      .eq('city', city)
      .lte('min_duration', duration)

    if (!error && activities) {
      for (const activity of activities) {
        const recommendation: Recommendation = {
          id: activity.id,
          type: 'experience',
          title: activity.title,
          description: activity.description,
          location: {
            city: activity.city,
            country: activity.country,
            address: activity.address,
            coordinates: activity.coordinates
          },
          price: {
            amount: activity.price,
            currency: activity.currency,
            priceLevel: this.determinePriceLevel(activity.price, userProfile.preferences.budgetRange)
          },
          duration: activity.duration,
          rating: activity.rating,
          reviewCount: activity.review_count,
          images: activity.images || [],
          tags: activity.tags || [],
          reasons: this.generateReasonsList(activity, userProfile),
          availability: activity.availability,
          bookingInfo: activity.booking_info,
          personalizedScore: this.calculatePersonalizedScore(activity, userProfile),
          urgency: activity.limited_time ? 'high' : 'low'
        }

        recommendations.push(recommendation)
      }
    }

    // Add AI-generated recommendations based on user preferences
    const aiRecommendations = await this.generateAIRecommendations(city, duration, userProfile)
    recommendations.push(...aiRecommendations)

    return recommendations
  }

  private async generateAIRecommendations(
    city: string,
    duration: number,
    userProfile: UserProfile
  ): Promise<Recommendation[]> {
    // This would integrate with an AI service like OpenAI or Claude
    // to generate personalized recommendations based on user profile
    
    const mockRecommendations: Recommendation[] = []

    // Cultural recommendations for culture enthusiasts
    if (userProfile.preferences.interests.includes('culture')) {
      mockRecommendations.push({
        id: `ai-culture-${city}`,
        type: 'experience',
        title: `${city} Cultural Walking Tour`,
        description: `Discover the rich history and culture of ${city} with a guided walking tour designed for layover travelers.`,
        location: { city, country: 'US' },
        price: { amount: 75, currency: 'USD', priceLevel: 'mid-range' },
        duration: Math.min(duration - 60, 240), // Leave 1 hour buffer
        rating: 4.5,
        reviewCount: 230,
        images: [`https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80`],
        tags: ['culture', 'walking', 'history', 'guided'],
        reasons: ['Matches your interest in culture', 'Perfect for your layover duration', 'Highly rated by other travelers'],
        availability: {
          startTime: '09:00',
          endTime: '18:00',
          daysOfWeek: [1, 2, 3, 4, 5, 6, 7]
        },
        personalizedScore: 0.85,
        urgency: 'medium'
      })
    }

    // Food recommendations for food lovers
    if (userProfile.preferences.interests.includes('food')) {
      mockRecommendations.push({
        id: `ai-food-${city}`,
        type: 'restaurant',
        title: `${city} Food Tasting Experience`,
        description: `Sample the best local cuisine with a curated food tour featuring ${city}'s signature dishes.`,
        location: { city, country: 'US' },
        price: { amount: 95, currency: 'USD', priceLevel: 'mid-range' },
        duration: 180,
        rating: 4.7,
        reviewCount: 156,
        images: [`https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&q=80`],
        tags: ['food', 'local cuisine', 'tasting', 'authentic'],
        reasons: ['Matches your interest in food', 'Highly rated local experience', 'Accommodates dietary restrictions'],
        availability: {
          startTime: '11:00',
          endTime: '20:00',
          daysOfWeek: [1, 2, 3, 4, 5, 6, 7]
        },
        personalizedScore: 0.90,
        urgency: 'low'
      })
    }

    return mockRecommendations
  }

  private async getDestinationRecommendations(
    destination: string,
    userProfile: UserProfile
  ): Promise<Recommendation[]> {
    // Get recommendations for the final destination
    const recommendations: Recommendation[] = []

    // Pre-trip planning recommendations
    recommendations.push({
      id: `dest-prep-${destination}`,
      type: 'experience',
      title: `${destination} Travel Prep Package`,
      description: `Essential information and bookings for your ${destination} trip including local SIM cards, transport passes, and city guides.`,
      location: { city: destination, country: 'US' },
      price: { amount: 25, currency: 'USD', priceLevel: 'budget' },
      duration: 0, // Digital service
      rating: 4.3,
      reviewCount: 89,
      images: [],
      tags: ['preparation', 'digital', 'travel-essentials'],
      reasons: ['Essential for your destination', 'Saves time on arrival', 'Includes local insights'],
      availability: {
        startTime: '00:00',
        endTime: '23:59',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7]
      },
      personalizedScore: 0.75,
      urgency: 'medium'
    })

    return recommendations
  }

  private async getFlightRecommendations(
    userProfile: UserProfile,
    context: any
  ): Promise<FlightRecommendation[]> {
    // Generate flight recommendations with layover opportunities
    const flightRecommendations: FlightRecommendation[] = []

    const mockFlight: FlightRecommendation = {
      id: 'flight-rec-1',
      type: 'flight',
      title: 'NYC to LA with Chicago Layover Experience',
      description: 'Save money and explore Chicago during your 8-hour layover with included deep-dish pizza tour.',
      location: { city: 'Chicago', country: 'US' },
      price: { amount: 450, currency: 'USD', priceLevel: 'budget' },
      duration: 540, // 9 hours total travel time
      rating: 4.6,
      reviewCount: 342,
      images: ['https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=600&q=80'],
      tags: ['layover-experience', 'food-tour', 'city-exploration', 'value'],
      reasons: [
        'Save $200 compared to direct flights',
        'Experience Chicago deep-dish pizza',
        'Perfect layover duration for city tour'
      ],
      availability: {
        startTime: '06:00',
        endTime: '22:00',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7]
      },
      personalizedScore: 0.88,
      urgency: 'high',
      flightDetails: {
        airline: 'American Airlines',
        flightNumber: 'AA 1234 / AA 5678',
        aircraft: 'Boeing 737',
        departure: { airport: 'JFK', time: '08:00' },
        arrival: { airport: 'LAX', time: '17:00' },
        duration: 540,
        stops: 1,
        layovers: [{
          airport: 'ORD',
          duration: 480, // 8 hours
          city: 'Chicago'
        }]
      },
      savings: {
        amount: 200,
        percentage: 31,
        comparedTo: 'direct_flight'
      }
    }

    flightRecommendations.push(mockFlight)
    return flightRecommendations
  }

  private calculatePersonalizedScore(activity: any, userProfile: UserProfile): number {
    let score = 0.5 // Base score

    // Interest matching
    const matchingInterests = activity.tags?.filter((tag: string) => 
      userProfile.preferences.interests.includes(tag)
    ).length || 0
    score += matchingInterests * 0.1

    // Budget compatibility
    if (activity.price >= userProfile.preferences.budgetRange.min && 
        activity.price <= userProfile.preferences.budgetRange.max) {
      score += 0.2
    }

    // Rating boost
    score += (activity.rating - 3) * 0.1

    // Travel style matching
    if (userProfile.preferences.travelStyle === 'luxury' && activity.price > 150) {
      score += 0.1
    } else if (userProfile.preferences.travelStyle === 'budget' && activity.price < 75) {
      score += 0.1
    }

    // Previous experience penalization (avoid repetition)
    if (userProfile.travelHistory.favoriteActivities.includes(activity.category)) {
      score -= 0.05
    }

    return Math.min(Math.max(score, 0), 1)
  }

  private generateReasonsList(activity: any, userProfile: UserProfile): string[] {
    const reasons: string[] = []

    // Interest-based reasons
    const matchingInterests = activity.tags?.filter((tag: string) => 
      userProfile.preferences.interests.includes(tag)
    ) || []
    
    if (matchingInterests.length > 0) {
      reasons.push(`Matches your interest in ${matchingInterests.join(', ')}`)
    }

    // Budget reasons
    if (activity.price >= userProfile.preferences.budgetRange.min && 
        activity.price <= userProfile.preferences.budgetRange.max) {
      reasons.push('Within your budget range')
    }

    // Quality reasons
    if (activity.rating > 4.5) {
      reasons.push('Highly rated by travelers')
    }

    // Uniqueness reasons
    if (!userProfile.travelHistory.visitedCities.includes(activity.city)) {
      reasons.push('New destination for you')
    }

    // Time-based reasons
    if (activity.duration && activity.duration <= 240) {
      reasons.push('Perfect for layover duration')
    }

    return reasons.slice(0, 3) // Limit to top 3 reasons
  }

  private determinePriceLevel(price: number, budgetRange: { min: number; max: number }): 'budget' | 'mid-range' | 'luxury' {
    if (price < budgetRange.min * 1.5) return 'budget'
    if (price < budgetRange.max * 1.2) return 'mid-range'
    return 'luxury'
  }

  private selectBestRecommendations(recommendations: Recommendation[], userProfile: UserProfile): Recommendation[] {
    // Filter and sort recommendations
    return recommendations
      .filter(rec => {
        // Budget filter
        if (rec.price.amount < userProfile.preferences.budgetRange.min || 
            rec.price.amount > userProfile.preferences.budgetRange.max * 1.5) {
          return false
        }

        // Dietary restrictions filter
        if (rec.type === 'restaurant' && userProfile.preferences.dietaryRestrictions.length > 0) {
          // Check if restaurant accommodates dietary restrictions
          return rec.tags.some(tag => userProfile.preferences.dietaryRestrictions.includes(tag))
        }

        return true
      })
      .sort((a, b) => b.personalizedScore - a.personalizedScore)
      .slice(0, 5)
  }

  async getOptimizedLayoverItinerary(
    city: string,
    layoverDuration: number,
    userProfile: UserProfile,
    selectedActivities?: string[]
  ): Promise<{
    activities: Recommendation[]
    timeline: Array<{
      time: string
      activity: string
      duration: number
      location: string
    }>
    totalCost: number
    timeBuffer: number
  }> {
    const recommendations = await this.getLayoverRecommendations(city, layoverDuration, userProfile)
    
    // AI-powered itinerary optimization
    const optimizedItinerary = this.optimizeItinerary(recommendations, layoverDuration, userProfile)
    
    return optimizedItinerary
  }

  private optimizeItinerary(
    recommendations: Recommendation[],
    totalDuration: number,
    userProfile: UserProfile
  ): any {
    // Implement traveling salesman problem solver for optimal route
    // Consider travel time between locations, opening hours, user preferences
    
    const selectedActivities = recommendations
      .slice(0, 3) // Limit to 3 activities for simplicity
      .sort((a, b) => a.duration - b.duration)

    let currentTime = 0
    const timeline = []
    let totalCost = 0

    for (const activity of selectedActivities) {
      if (currentTime + activity.duration + 60 <= totalDuration) { // 1 hour buffer
        timeline.push({
          time: this.formatTime(currentTime),
          activity: activity.title,
          duration: activity.duration,
          location: activity.location.address || activity.location.city
        })
        currentTime += activity.duration + 30 // 30 min travel time
        totalCost += activity.price.amount
      }
    }

    return {
      activities: selectedActivities,
      timeline,
      totalCost,
      timeBuffer: totalDuration - currentTime
    }
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  async trackRecommendationEngagement(
    userId: string,
    recommendationId: string,
    action: 'viewed' | 'clicked' | 'booked' | 'dismissed'
  ): Promise<void> {
    // Track user engagement for ML model improvement
    await this.supabase
      .from('recommendation_engagement')
      .insert([{
        user_id: userId,
        recommendation_id: recommendationId,
        action,
        timestamp: new Date().toISOString()
      }])
  }

  async getPopularRecommendations(city: string, limit = 10): Promise<Recommendation[]> {
    // Get trending/popular recommendations for a city
    const { data, error } = await this.supabase
      .from('layover_activities')
      .select('*')
      .eq('city', city)
      .order('booking_count', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data.map(activity => ({
      id: activity.id,
      type: 'experience',
      title: activity.title,
      description: activity.description,
      location: { city: activity.city, country: activity.country },
      price: { amount: activity.price, currency: activity.currency, priceLevel: 'mid-range' },
      duration: activity.duration,
      rating: activity.rating,
      reviewCount: activity.review_count,
      images: activity.images || [],
      tags: activity.tags || [],
      reasons: ['Popular with other travelers'],
      availability: activity.availability,
      personalizedScore: 0.7,
      urgency: 'low'
    }))
  }

  async getSimilarUserRecommendations(userId: string, city: string): Promise<Recommendation[]> {
    // Collaborative filtering - recommend based on similar users' preferences
    // This would use ML algorithms to find users with similar travel patterns
    
    return this.getPopularRecommendations(city, 5)
  }
}