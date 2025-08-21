import { NextRequest, NextResponse } from 'next/server'
import { AISearchEngine, AISearchQuery } from '@/lib/services/ai-search-engine'
import { Logger } from '@/lib/logger'

const logger = new Logger('ai-search-api')
const aiSearchEngine = new AISearchEngine()

export async function POST(request: NextRequest) {
  try {
    const searchQuery: AISearchQuery = await request.json()

    // Validate required fields
    if (!searchQuery.query || !searchQuery.location?.city) {
      return NextResponse.json(
        { error: 'Query and location.city are required' },
        { status: 400 }
      )
    }

    // Set defaults for optional fields
    const enhancedQuery: AISearchQuery = {
      ...searchQuery,
      timeConstraints: {
        layoverDuration: 6,
        availableTime: 4,
        bufferTime: 1,
        ...searchQuery.timeConstraints
      },
      filters: {
        budget: { min: 0, max: 500 },
        duration: { min: 1, max: 8 },
        activityLevel: 'moderate',
        travelStyle: 'solo',
        accessibility: false,
        language: ['en'],
        mood: 'culture',
        weather: 'flexible',
        transportation: 'public',
        ...searchQuery.filters
      }
    }

    logger.info('AI search request', {
      query: enhancedQuery.query,
      location: enhancedQuery.location.city,
      filters: enhancedQuery.filters
    })

    // Perform AI-powered search
    const searchResults = await aiSearchEngine.intelligentSearch(enhancedQuery)

    logger.info('AI search completed', {
      resultCount: searchResults.results.length,
      searchTime: searchResults.searchTime
    })

    return NextResponse.json(searchResults)

  } catch (error) {
    logger.error('AI search error', error)
    
    return NextResponse.json(
      { 
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const city = searchParams.get('city')
    const layoverDuration = parseInt(searchParams.get('layover') || '6')
    const budget = searchParams.get('budget')
    const mood = searchParams.get('mood')

    if (!query || !city) {
      return NextResponse.json(
        { error: 'Query (q) and city parameters are required' },
        { status: 400 }
      )
    }

    // Convert GET parameters to AISearchQuery format
    const searchQuery: AISearchQuery = {
      query,
      location: { city },
      timeConstraints: {
        layoverDuration,
        availableTime: layoverDuration - 2,
        bufferTime: 1
      },
      filters: {
        ...(budget && { budget: { min: 0, max: parseInt(budget) } }),
        ...(mood && { mood: mood as any })
      }
    }

    const searchResults = await aiSearchEngine.intelligentSearch(searchQuery)

    return NextResponse.json(searchResults)

  } catch (error) {
    logger.error('AI search GET error', error)
    
    return NextResponse.json(
      { 
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}