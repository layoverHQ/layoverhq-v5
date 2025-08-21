import { Supabase } from '@/lib/supabase/service-role'
import { ExperienceAvailabilityRequest } from '@/lib/types'

export interface AISearchFilters {
  interests: string[]
  activityLevel: 'low' | 'moderate' | 'high'
  budget: { min: number; max: number }
  duration: { min: number; max: number } // in hours
  travelStyle: 'solo' | 'couple' | 'family' | 'group'
  accessibility: boolean
  language: string[]
  mood: 'adventure' | 'relaxation' | 'culture' | 'food' | 'nightlife' | 'nature'
  weather: 'indoor' | 'outdoor' | 'flexible'
  transportation: 'walking' | 'public' | 'taxi' | 'rental'
}

export interface AISearchQuery {
  query: string
  location: {
    city: string
    airport?: string
    coordinates?: { lat: number; lng: number }
  }
  timeConstraints: {
    layoverDuration: number
    availableTime: number
    bufferTime: number
  }
  filters: Partial<AISearchFilters>
  context?: {
    previousSearches: string[]
    userPreferences: any
    travelHistory: any[]
  }
}

export interface EnhancedSearchResult {
  id: string
  title: string
  description: string
  category: string
  price: {
    amount: number
    currency: string
    priceLevel: 'budget' | 'moderate' | 'premium' | 'luxury'
  }
  duration: {
    minimum: number
    maximum: number
    recommended: number
  }
  location: {
    name: string
    address: string
    coordinates: { lat: number; lng: number }
    district: string
    transportTime: number
  }
  aiScore: {
    relevance: number
    personalizedScore: number
    popularityScore: number
    qualityScore: number
    feasibilityScore: number
  }
  tags: string[]
  highlights: string[]
  warnings?: string[]
  aiInsights: {
    whyRecommended: string
    perfectFor: string[]
    considerations: string[]
    bestTime: string
  }
  availability: {
    nextAvailable: Date
    bookingDeadline: Date
    instantBooking: boolean
  }
  viatorData?: any
  amadeusData?: any
}

export interface AISearchResponse {
  results: EnhancedSearchResult[]
  totalCount: number
  searchTime: number
  aiInsights: {
    searchInterpretation: string
    alternativeQueries: string[]
    locationInsights: string[]
    timeOptimization: string[]
  }
  filters: {
    applied: Partial<AISearchFilters>
    suggested: Partial<AISearchFilters>
  }
}

export class AISearchEngine {
  private supabase = Supabase()

  async intelligentSearch(searchQuery: AISearchQuery): Promise<AISearchResponse> {
    try {
      const startTime = Date.now()

      // Step 1: Analyze and enhance the search query using AI
      const enhancedQuery = await this.enhanceSearchQuery(searchQuery)

      // Step 2: Multi-source search with parallel execution
      const [viatorResults, localResults, aiGeneratedResults] = await Promise.all([
        this.searchViatorExperiences(enhancedQuery),
        this.searchLocalDatabase(enhancedQuery),
        this.generateAIRecommendations(enhancedQuery)
      ])

      // Step 3: Merge and deduplicate results
      const mergedResults = await this.mergeSearchResults([
        ...viatorResults,
        ...localResults,
        ...aiGeneratedResults
      ])

      // Step 4: Apply AI-powered filtering and ranking
      const filteredResults = await this.applyIntelligentFiltering(mergedResults, searchQuery)
      const rankedResults = await this.applyAIRanking(filteredResults, searchQuery)

      // Step 5: Generate AI insights and suggestions
      const aiInsights = await this.generateSearchInsights(searchQuery, rankedResults)

      const searchTime = Date.now() - startTime

      return {
        results: rankedResults,
        totalCount: rankedResults.length,
        searchTime,
        aiInsights,
        filters: {
          applied: searchQuery.filters,
          suggested: await this.suggestFilters(searchQuery, rankedResults)
        }
      }
    } catch (error) {
      console.error('AI Search Engine error:', error)
      throw error
    }
  }

  private async enhanceSearchQuery(query: AISearchQuery): Promise<AISearchQuery> {
    // AI-powered query understanding and enhancement
    const enhancedQuery = { ...query }

    // Extract intent from natural language query
    const intent = await this.extractSearchIntent(query.query)
    
    // Auto-detect missing filters based on query context
    if (intent.includes('adventure')) {
      enhancedQuery.filters.mood = 'adventure'
      enhancedQuery.filters.activityLevel = 'high'
    }
    
    if (intent.includes('family') || intent.includes('kids')) {
      enhancedQuery.filters.travelStyle = 'family'
      enhancedQuery.filters.accessibility = true
    }

    if (intent.includes('quick') || intent.includes('short')) {
      enhancedQuery.filters.duration = { min: 1, max: 3 }
    }

    // Location-based enhancements
    await this.enhanceLocationContext(enhancedQuery)

    return enhancedQuery
  }

  private async extractSearchIntent(query: string): Promise<string[]> {
    // Simplified AI intent extraction
    const intents: string[] = []
    const lowerQuery = query.toLowerCase()

    const intentKeywords = {
      adventure: ['adventure', 'thrill', 'exciting', 'adrenaline', 'extreme'],
      culture: ['culture', 'museum', 'history', 'art', 'heritage', 'traditional'],
      food: ['food', 'restaurant', 'cuisine', 'eat', 'taste', 'local food'],
      nature: ['nature', 'park', 'outdoor', 'hiking', 'garden', 'wildlife'],
      relaxation: ['relax', 'spa', 'peaceful', 'calm', 'meditation', 'rest'],
      family: ['family', 'kids', 'children', 'child-friendly'],
      quick: ['quick', 'short', 'brief', 'fast', 'express'],
      luxury: ['luxury', 'premium', 'high-end', 'exclusive', 'upscale']
    }

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        intents.push(intent)
      }
    }

    return intents
  }

  private async enhanceLocationContext(query: AISearchQuery): Promise<void> {
    // Add location-specific context and insights
    const { data: locationData } = await this.supabase
      .from('airports')
      .select('*')
      .ilike('city', `%${query.location.city}%`)
      .single()

    if (locationData) {
      query.location.coordinates = {
        lat: locationData.latitude,
        lng: locationData.longitude
      }
    }
  }

  private async searchViatorExperiences(query: AISearchQuery): Promise<EnhancedSearchResult[]> {
    // Search Viator API with enhanced parameters
    const viatorService = await import('@/lib/services/enhanced-viator-service')
    
    try {
      const searchRequest: ExperienceAvailabilityRequest = {
        searchQuery: query.query,
        location: query.location.city,
        date: new Date(),
        filters: {
          priceRange: query.filters.budget,
          duration: query.filters.duration,
          categories: query.filters.interests
        }
      }

      const viatorResults = await viatorService.EnhancedViatorService.prototype.searchExperiences(searchRequest)
      
      return viatorResults.map(result => this.transformViatorResult(result, query))
    } catch (error) {
      console.error('Viator search error:', error)
      return []
    }
  }

  private async searchLocalDatabase(query: AISearchQuery): Promise<EnhancedSearchResult[]> {
    // Search local curated experiences database
    const { data: localResults } = await this.supabase
      .from('curated_experiences')
      .select('*')
      .ilike('city', `%${query.location.city}%`)
      .ilike('description', `%${query.query}%`)
      .limit(20)

    return (localResults || []).map(result => this.transformLocalResult(result, query))
  }

  private async generateAIRecommendations(query: AISearchQuery): Promise<EnhancedSearchResult[]> {
    // AI-generated recommendations based on query analysis
    const recommendations: EnhancedSearchResult[] = []

    // Analyze query context and generate smart suggestions
    if (query.filters.mood === 'culture' || query.query.includes('culture')) {
      recommendations.push(...await this.generateCulturalRecommendations(query))
    }

    if (query.filters.mood === 'food' || query.query.includes('food')) {
      recommendations.push(...await this.generateFoodRecommendations(query))
    }

    return recommendations
  }

  private async generateCulturalRecommendations(query: AISearchQuery): Promise<EnhancedSearchResult[]> {
    // Generate cultural experience recommendations
    const culturalSpots = [
      {
        type: 'museum',
        name: `${query.location.city} Cultural Museum`,
        description: 'Explore local history and culture'
      },
      {
        type: 'heritage',
        name: `Historic ${query.location.city} Walking Tour`,
        description: 'Discover the city\'s rich heritage'
      }
    ]

    return culturalSpots.map((spot, index) => ({
      id: `cultural-${index}`,
      title: spot.name,
      description: spot.description,
      category: 'Culture',
      price: {
        amount: Math.floor(Math.random() * 50) + 10,
        currency: 'USD',
        priceLevel: 'moderate' as const
      },
      duration: {
        minimum: 1,
        maximum: 3,
        recommended: 2
      },
      location: {
        name: query.location.city,
        address: `${query.location.city} City Center`,
        coordinates: { lat: 0, lng: 0 },
        district: 'City Center',
        transportTime: 30
      },
      aiScore: {
        relevance: 0.9,
        personalizedScore: 0.8,
        popularityScore: 0.7,
        qualityScore: 0.8,
        feasibilityScore: 0.9
      },
      tags: ['culture', 'history', 'local'],
      highlights: ['Local insights', 'Historical significance'],
      aiInsights: {
        whyRecommended: 'Perfect for cultural exploration during layover',
        perfectFor: ['Culture enthusiasts', 'History lovers'],
        considerations: ['Check opening hours', 'Allow time for return'],
        bestTime: 'Morning or afternoon'
      },
      availability: {
        nextAvailable: new Date(),
        bookingDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        instantBooking: true
      }
    }))
  }

  private async generateFoodRecommendations(query: AISearchQuery): Promise<EnhancedSearchResult[]> {
    // Generate food experience recommendations
    return [{
      id: 'food-tour-1',
      title: `${query.location.city} Food Tour`,
      description: 'Taste the best local cuisine and specialties',
      category: 'Food & Drink',
      price: {
        amount: 45,
        currency: 'USD',
        priceLevel: 'moderate' as const
      },
      duration: {
        minimum: 2,
        maximum: 4,
        recommended: 3
      },
      location: {
        name: query.location.city,
        address: `${query.location.city} Food District`,
        coordinates: { lat: 0, lng: 0 },
        district: 'Food District',
        transportTime: 25
      },
      aiScore: {
        relevance: 0.95,
        personalizedScore: 0.9,
        popularityScore: 0.85,
        qualityScore: 0.9,
        feasibilityScore: 0.8
      },
      tags: ['food', 'local cuisine', 'cultural'],
      highlights: ['Local specialties', 'Hidden gems'],
      aiInsights: {
        whyRecommended: 'Experience authentic local flavors',
        perfectFor: ['Food lovers', 'Cultural explorers'],
        considerations: ['Dietary restrictions', 'Meal timing'],
        bestTime: 'Lunch or early dinner'
      },
      availability: {
        nextAvailable: new Date(),
        bookingDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
        instantBooking: true
      }
    }]
  }

  private async mergeSearchResults(resultSets: EnhancedSearchResult[][]): Promise<EnhancedSearchResult[]> {
    const merged = resultSets.flat()
    
    // Deduplicate based on title and location similarity
    const unique = merged.filter((result, index, array) => 
      array.findIndex(r => 
        r.title.toLowerCase() === result.title.toLowerCase() &&
        r.location.name === result.location.name
      ) === index
    )

    return unique
  }

  private async applyIntelligentFiltering(
    results: EnhancedSearchResult[], 
    query: AISearchQuery
  ): Promise<EnhancedSearchResult[]> {
    let filtered = results

    // Apply filters with intelligent defaults
    if (query.filters.budget) {
      filtered = filtered.filter(r => 
        r.price.amount >= (query.filters.budget?.min || 0) &&
        r.price.amount <= (query.filters.budget?.max || 1000)
      )
    }

    if (query.filters.duration) {
      filtered = filtered.filter(r => 
        r.duration.recommended >= (query.filters.duration?.min || 0) &&
        r.duration.recommended <= (query.filters.duration?.max || 24)
      )
    }

    // Feasibility filtering based on layover constraints
    if (query.timeConstraints.availableTime) {
      filtered = filtered.filter(r => 
        r.duration.recommended + r.location.transportTime * 2 <= query.timeConstraints.availableTime
      )
    }

    return filtered
  }

  private async applyAIRanking(
    results: EnhancedSearchResult[], 
    query: AISearchQuery
  ): Promise<EnhancedSearchResult[]> {
    // Calculate composite AI scores for ranking
    const scoredResults = results.map(result => {
      const composite = (
        result.aiScore.relevance * 0.3 +
        result.aiScore.personalizedScore * 0.25 +
        result.aiScore.feasibilityScore * 0.25 +
        result.aiScore.qualityScore * 0.2
      )
      
      return { ...result, compositeScore: composite }
    })

    // Sort by composite score
    return scoredResults
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .map(({ compositeScore, ...result }) => result)
  }

  private async generateSearchInsights(
    query: AISearchQuery, 
    results: EnhancedSearchResult[]
  ): Promise<AISearchResponse['aiInsights']> {
    return {
      searchInterpretation: `Found ${results.length} experiences matching "${query.query}" in ${query.location.city}`,
      alternativeQueries: [
        `${query.query} near ${query.location.city} airport`,
        `Quick ${query.query} ${query.location.city}`,
        `Best ${query.query} for layover`
      ],
      locationInsights: [
        `${query.location.city} is known for its cultural attractions`,
        `Average transport time from airport: 30-45 minutes`,
        `Peak hours may affect travel time`
      ],
      timeOptimization: [
        'Book experiences with instant confirmation',
        'Allow 30 minutes buffer for airport return',
        'Consider transport delays during peak hours'
      ]
    }
  }

  private async suggestFilters(
    query: AISearchQuery, 
    results: EnhancedSearchResult[]
  ): Promise<Partial<AISearchFilters>> {
    // Analyze results to suggest useful filters
    const categories = [...new Set(results.map(r => r.category))]
    const avgPrice = results.reduce((sum, r) => sum + r.price.amount, 0) / results.length
    
    return {
      interests: categories.slice(0, 3),
      budget: {
        min: Math.floor(avgPrice * 0.5),
        max: Math.floor(avgPrice * 1.5)
      },
      mood: this.detectDominantMood(results)
    }
  }

  private detectDominantMood(results: EnhancedSearchResult[]): AISearchFilters['mood'] {
    const moodCounts = {
      adventure: 0,
      culture: 0,
      food: 0,
      relaxation: 0,
      nature: 0,
      nightlife: 0
    }

    results.forEach(result => {
      result.tags.forEach(tag => {
        if (tag.includes('adventure') || tag.includes('thrill')) moodCounts.adventure++
        if (tag.includes('culture') || tag.includes('history')) moodCounts.culture++
        if (tag.includes('food') || tag.includes('cuisine')) moodCounts.food++
        if (tag.includes('nature') || tag.includes('park')) moodCounts.nature++
        if (tag.includes('relax') || tag.includes('spa')) moodCounts.relaxation++
        if (tag.includes('night') || tag.includes('bar')) moodCounts.nightlife++
      })
    })

    const dominantMood = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)[0][0] as AISearchFilters['mood']

    return dominantMood
  }

  private transformViatorResult(viatorResult: any, query: AISearchQuery): EnhancedSearchResult {
    return {
      id: `viator-${viatorResult.id}`,
      title: viatorResult.title,
      description: viatorResult.description,
      category: viatorResult.category || 'Experience',
      price: {
        amount: viatorResult.price?.amount || 0,
        currency: viatorResult.price?.currency || 'USD',
        priceLevel: this.determinePriceLevel(viatorResult.price?.amount || 0)
      },
      duration: {
        minimum: viatorResult.duration?.min || 1,
        maximum: viatorResult.duration?.max || 4,
        recommended: viatorResult.duration?.recommended || 2
      },
      location: {
        name: viatorResult.location?.name || query.location.city,
        address: viatorResult.location?.address || '',
        coordinates: viatorResult.location?.coordinates || { lat: 0, lng: 0 },
        district: viatorResult.location?.district || '',
        transportTime: 30
      },
      aiScore: {
        relevance: 0.8,
        personalizedScore: 0.7,
        popularityScore: viatorResult.rating || 0.6,
        qualityScore: viatorResult.rating || 0.7,
        feasibilityScore: 0.8
      },
      tags: viatorResult.tags || [],
      highlights: viatorResult.highlights || [],
      aiInsights: {
        whyRecommended: 'Highly rated experience from trusted provider',
        perfectFor: ['Travelers seeking quality experiences'],
        considerations: ['Check availability', 'Booking confirmation time'],
        bestTime: 'As per tour schedule'
      },
      availability: {
        nextAvailable: new Date(),
        bookingDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        instantBooking: viatorResult.instantBooking || false
      },
      viatorData: viatorResult
    }
  }

  private transformLocalResult(localResult: any, query: AISearchQuery): EnhancedSearchResult {
    return {
      id: `local-${localResult.id}`,
      title: localResult.title,
      description: localResult.description,
      category: localResult.category || 'Local Experience',
      price: {
        amount: localResult.price || 0,
        currency: 'USD',
        priceLevel: this.determinePriceLevel(localResult.price || 0)
      },
      duration: {
        minimum: localResult.duration_min || 1,
        maximum: localResult.duration_max || 3,
        recommended: localResult.duration_recommended || 2
      },
      location: {
        name: localResult.location_name || query.location.city,
        address: localResult.address || '',
        coordinates: {
          lat: localResult.latitude || 0,
          lng: localResult.longitude || 0
        },
        district: localResult.district || '',
        transportTime: localResult.transport_time || 30
      },
      aiScore: {
        relevance: 0.9,
        personalizedScore: 0.8,
        popularityScore: localResult.popularity_score || 0.7,
        qualityScore: localResult.quality_score || 0.8,
        feasibilityScore: 0.9
      },
      tags: localResult.tags || [],
      highlights: localResult.highlights || [],
      aiInsights: {
        whyRecommended: 'Curated local experience with insider knowledge',
        perfectFor: ['Authentic local experiences', 'Hidden gems'],
        considerations: ['Local operating hours', 'Seasonal availability'],
        bestTime: localResult.best_time || 'Anytime'
      },
      availability: {
        nextAvailable: new Date(),
        bookingDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000),
        instantBooking: true
      }
    }
  }

  private determinePriceLevel(amount: number): 'budget' | 'moderate' | 'premium' | 'luxury' {
    if (amount <= 25) return 'budget'
    if (amount <= 75) return 'moderate'
    if (amount <= 150) return 'premium'
    return 'luxury'
  }
}