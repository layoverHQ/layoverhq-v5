import { NextRequest, NextResponse } from 'next/server'
import { TravelBuddyOrchestrator, TravelContext } from '@/lib/services/travel-buddy-orchestrator'
import { Logger } from '@/lib/logger'

const logger = new Logger('travel-buddy-dashboard-api')
const orchestrator = new TravelBuddyOrchestrator()

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const requestData = await request.json()

    // Build travel context from request
    const context: TravelContext = {
      userId,
      currentLocation: requestData.currentLocation,
      layover: requestData.layover,
      preferences: requestData.preferences || {
        interests: [],
        budget: { min: 0, max: 500 },
        activityLevel: 'moderate',
        travelStyle: 'solo'
      },
      travelDocuments: requestData.travelDocuments,
      emergencyContacts: requestData.emergencyContacts
    }

    logger.info('Getting unified travel buddy dashboard', { 
      userId,
      hasLocation: !!context.currentLocation,
      hasLayover: !!context.layover
    })

    // Get unified data from orchestrator
    const unifiedData = await orchestrator.getUnifiedTravelData(context)

    // Add metadata
    const response = {
      success: true,
      data: unifiedData,
      context: {
        userId,
        timestamp: new Date().toISOString(),
        location: context.currentLocation?.city || 'Unknown',
        layoverActive: !!context.layover
      },
      modules: {
        liveTracking: {
          active: unifiedData.liveUpdates.flights.length > 0,
          lastUpdate: new Date().toISOString()
        },
        recommendations: {
          total: unifiedData.recommendations.experiences.length +
                 unifiedData.recommendations.restaurants.length +
                 unifiedData.recommendations.activities.length,
          personalizedScore: unifiedData.recommendations.personalizedScore
        },
        social: {
          feedItems: unifiedData.social.feed.length,
          connections: unifiedData.social.connections.length,
          groups: unifiedData.social.travelGroups.length
        },
        documents: {
          total: unifiedData.documents.active.length,
          verified: unifiedData.documents.verificationStatus.verified || 0,
          expiring: unifiedData.documents.expiringSoon.length
        },
        emergency: {
          contacts: unifiedData.emergency.contacts.length,
          alertsActive: unifiedData.emergency.safetyAlerts.length
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Failed to get travel buddy dashboard', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to load dashboard',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city')
    const layoverDuration = searchParams.get('layover_duration')

    // Build minimal context for GET request
    const context: TravelContext = {
      userId,
      currentLocation: city ? { 
        city, 
        airport: '', 
        coordinates: { lat: 0, lng: 0 } 
      } : undefined,
      layover: layoverDuration ? {
        duration: parseInt(layoverDuration),
        timeRemaining: parseInt(layoverDuration) - 1,
        flightInfo: {}
      } : undefined,
      preferences: {
        interests: [],
        budget: { min: 0, max: 500 },
        activityLevel: 'moderate',
        travelStyle: 'solo'
      }
    }

    const unifiedData = await orchestrator.getUnifiedTravelData(context)

    return NextResponse.json({
      success: true,
      data: unifiedData,
      context: {
        userId,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error('Failed to get travel buddy dashboard (GET)', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to load dashboard',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}