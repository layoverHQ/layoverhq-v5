'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plane, MapPin, Clock, Users, FileText, Shield, Search, 
  TrendingUp, Heart, Star, AlertCircle, Zap, RefreshCw,
  Globe, Navigation, Phone, Wallet, Calendar, Camera
} from 'lucide-react'

// Import specialized components
import { ResponsiveTravelDashboard } from './responsive-travel-dashboard'
import { MobileTravelWidgets } from './mobile-travel-widgets'
import { AISearchInterface } from './ai-search-interface'
import PersonalizedTravelDashboard from './personalized-travel-dashboard'

// Types for unified data
interface UnifiedTravelData {
  liveUpdates: {
    flights: any[]
    weather: any
    alerts: any[]
    locationInfo: any
  }
  recommendations: {
    experiences: any[]
    restaurants: any[]
    activities: any[]
    personalizedScore: number
  }
  social: {
    feed: any[]
    travelGroups: any[]
    sharedItineraries: any[]
    connections: any[]
  }
  aiSearch: {
    recentSearches: any[]
    suggestedQueries: string[]
    trendingExperiences: any[]
  }
  documents: {
    active: any[]
    expiringSoon: any[]
    verificationStatus: any
  }
  expenses: {
    total: number
    byCategory: any[]
    budget: any
    currencyRates: any[]
  }
  emergency: {
    contacts: any[]
    nearbyServices: any[]
    safetyAlerts: any[]
  }
  analytics: {
    travelStats: any
    patterns: any[]
    achievements: any[]
  }
}

interface UnifiedTravelBuddyDashboardProps {
  userId: string
  initialData?: Partial<UnifiedTravelData>
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
}

export function UnifiedTravelBuddyDashboard({
  userId,
  initialData,
  currentLocation,
  layover
}: UnifiedTravelBuddyDashboardProps) {
  const [data, setData] = useState<UnifiedTravelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  // Fetch unified travel data
  const fetchTravelData = useCallback(async () => {
    try {
      setRefreshing(true)
      
      const requestBody = {
        currentLocation,
        layover,
        preferences: {
          interests: ['culture', 'food', 'adventure'],
          budget: { min: 0, max: 300 },
          activityLevel: 'moderate',
          travelStyle: 'solo'
        }
      }

      const response = await fetch('/api/v1/travel-buddy/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error('Failed to fetch travel data')
      }

      const result = await response.json()
      setData(result.data)
      setError(null)

    } catch (err) {
      console.error('Error fetching travel data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId, currentLocation, layover])

  useEffect(() => {
    if (initialData) {
      setData(initialData as UnifiedTravelData)
      setLoading(false)
    } else {
      fetchTravelData()
    }
  }, [initialData, fetchTravelData])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchTravelData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchTravelData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your travel buddy dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchTravelData}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  // Calculate summary stats
  const totalAlerts = data.liveUpdates.alerts.length + data.emergency.safetyAlerts.length
  const totalRecommendations = data.recommendations.experiences.length + 
                              data.recommendations.restaurants.length + 
                              data.recommendations.activities.length
  const urgentItems = data.documents.expiringSoon.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with unified status */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-blue-500" />
                <h1 className="text-xl font-bold">Travel Buddy</h1>
              </div>
              
              {currentLocation && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{currentLocation.city}</span>
                </div>
              )}
              
              {layover && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{Math.floor(layover.timeRemaining)}h remaining</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Status indicators */}
              {totalAlerts > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {totalAlerts} alerts
                </Badge>
              )}
              
              {urgentItems > 0 && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  {urgentItems} expiring
                </Badge>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={fetchTravelData}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Live
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Social
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Safety
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Quick stats cards */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Recommendations</p>
                      <p className="text-2xl font-bold">{totalRecommendations}</p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Social Posts</p>
                      <p className="text-2xl font-bold">{data.social.feed.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Documents</p>
                      <p className="text-2xl font-bold">{data.documents.active.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Emergency Contacts</p>
                      <p className="text-2xl font-bold">{data.emergency.contacts.length}</p>
                    </div>
                    <Shield className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Integrated overview components */}
            {layover && currentLocation && (
              <ResponsiveTravelDashboard 
                travelData={{
                  layover,
                  alerts: data.liveUpdates.alerts,
                  city: currentLocation.city,
                  user: { name: 'User', preferences: {}, travelHistory: [] }
                }}
              />
            )}
          </TabsContent>

          {/* Live Updates Tab */}
          <TabsContent value="live" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Flight updates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5" />
                    Flight Updates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.liveUpdates.flights.length > 0 ? (
                    <div className="space-y-3">
                      {data.liveUpdates.flights.map((flight, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{flight.number || 'Flight'}</span>
                            <Badge variant={flight.status === 'on-time' ? 'default' : 'destructive'}>
                              {flight.status || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No active flights</p>
                  )}
                </CardContent>
              </Card>

              {/* Weather and location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location & Weather
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentLocation ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Current Location</span>
                        <span className="font-medium">{currentLocation.city}</span>
                      </div>
                      {data.liveUpdates.weather && (
                        <div className="flex justify-between">
                          <span>Weather</span>
                          <span className="font-medium">
                            {data.liveUpdates.weather.temperature || 'Unknown'}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">Location not available</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {data.liveUpdates.alerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Active Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.liveUpdates.alerts.map((alert, index) => (
                      <div key={index} className="p-3 border rounded-lg border-orange-200 bg-orange-50">
                        <h4 className="font-medium text-orange-800">{alert.title}</h4>
                        <p className="text-sm text-orange-700">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Discover Tab - AI Search and Recommendations */}
          <TabsContent value="discover" className="space-y-6">
            {currentLocation && (
              <AISearchInterface
                initialLocation={currentLocation.city}
                layoverDuration={layover?.duration || 6}
                onResultSelect={(result) => {
                  console.log('Selected experience:', result)
                }}
              />
            )}

            {/* Personalized recommendations */}
            {data.recommendations.experiences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Personalized Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.recommendations.experiences.slice(0, 6).map((exp, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <h4 className="font-medium mb-2">{exp.title || 'Experience'}</h4>
                        <p className="text-sm text-gray-600 mb-3">{exp.description || 'No description'}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-green-600">
                            ${exp.price || 'Free'}
                          </span>
                          <Button size="sm">Book Now</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Social feed */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Travel Feed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.social.feed.length > 0 ? (
                    <div className="space-y-4">
                      {data.social.feed.slice(0, 5).map((post, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <p className="text-sm">{post.content || 'Social post content'}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">
                              {post.createdAt || 'Recently'}
                            </span>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">Like</Button>
                              <Button variant="ghost" size="sm">Comment</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No recent posts</p>
                  )}
                </CardContent>
              </Card>

              {/* Travel groups and connections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Travel Groups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.social.travelGroups.length > 0 ? (
                    <div className="space-y-3">
                      {data.social.travelGroups.map((group, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{group.name || 'Travel Group'}</span>
                            <Badge variant="outline">
                              {group.memberCount || 0} members
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No travel groups</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Travel Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.documents.active.length > 0 ? (
                    <div className="space-y-3">
                      {data.documents.active.slice(0, 5).map((doc, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{doc.title}</span>
                              <p className="text-sm text-gray-600">{doc.type}</p>
                            </div>
                            <Badge variant={doc.isVerified ? 'default' : 'outline'}>
                              {doc.isVerified ? 'Verified' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No documents uploaded</p>
                  )}
                </CardContent>
              </Card>

              {/* Expiring documents */}
              {data.documents.expiringSoon.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      Expiring Soon
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.documents.expiringSoon.map((doc, index) => (
                        <div key={index} className="p-3 border rounded-lg border-orange-200 bg-orange-50">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-orange-800">{doc.title}</span>
                            <span className="text-sm text-orange-600">
                              Expires: {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'Unknown'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Travel Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Expense tracking coming soon</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Track your travel expenses and manage your budget
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Safety Tab */}
          <TabsContent value="safety" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Emergency contacts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Emergency Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.emergency.contacts.length > 0 ? (
                    <div className="space-y-3">
                      {data.emergency.contacts.map((contact, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{contact.name}</span>
                              <p className="text-sm text-gray-600">{contact.relationship}</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No emergency contacts</p>
                      <Button className="mt-4" size="sm">Add Contact</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Safety alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Safety Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.emergency.safetyAlerts.length > 0 ? (
                    <div className="space-y-3">
                      {data.emergency.safetyAlerts.map((alert, index) => (
                        <div key={index} className="p-3 border rounded-lg border-red-200 bg-red-50">
                          <p className="text-sm text-red-800">{alert.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <p className="text-green-600 font-medium">All Clear</p>
                      <p className="text-sm text-gray-500 mt-2">No safety alerts for your location</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}