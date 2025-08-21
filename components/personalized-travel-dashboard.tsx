"use client"

import { useState, useEffect } from 'react'
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Globe, 
  Calendar,
  Plane,
  Star,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Users,
  Camera,
  Bell,
  Settings,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Zap,
  Heart,
  Eye,
  ThumbsUp
} from 'lucide-react'

interface TravelInsight {
  id: string
  type: 'savings' | 'efficiency' | 'experience' | 'sustainability' | 'achievement'
  title: string
  description: string
  value: string
  change?: { amount: number; trend: 'up' | 'down' }
  icon: any
  color: string
  actionable?: boolean
  actionText?: string
}

interface UpcomingTrip {
  id: string
  destination: string
  departureDate: string
  duration: number
  layovers: number
  estimatedSavings: number
  status: 'confirmed' | 'pending' | 'at_risk'
  alerts: number
}

interface PersonalStats {
  totalTrips: number
  totalSavings: number
  milesFlown: number
  citiesVisited: number
  averageLayoverTime: number
  carbonFootprintSaved: number
  experienceRating: number
  loyaltyPoints: number
}

interface RecentActivity {
  id: string
  type: 'booking' | 'experience' | 'review' | 'achievement'
  title: string
  description: string
  timestamp: string
  value?: string
  image?: string
}

export default function PersonalizedTravelDashboard({ userId }: { userId: string }) {
  const [insights, setInsights] = useState<TravelInsight[]>([])
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([])
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    fetchDashboardData()
  }, [userId, selectedPeriod])

  const fetchDashboardData = async () => {
    try {
      // Fetch all dashboard data in parallel
      const [insightsRes, tripsRes, statsRes, activityRes] = await Promise.all([
        fetch(`/api/v1/dashboard/insights?userId=${userId}&period=${selectedPeriod}`),
        fetch(`/api/v1/dashboard/upcoming-trips?userId=${userId}`),
        fetch(`/api/v1/dashboard/stats?userId=${userId}&period=${selectedPeriod}`),
        fetch(`/api/v1/dashboard/activity?userId=${userId}&limit=10`)
      ])

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json()
        setInsights(generateMockInsights()) // Using mock data for now
      }

      if (tripsRes.ok) {
        const tripsData = await tripsRes.json()
        setUpcomingTrips(generateMockUpcomingTrips()) // Using mock data for now
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setPersonalStats(generateMockStats()) // Using mock data for now
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setRecentActivity(generateMockActivity()) // Using mock data for now
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Load mock data on error
      setInsights(generateMockInsights())
      setUpcomingTrips(generateMockUpcomingTrips())
      setPersonalStats(generateMockStats())
      setRecentActivity(generateMockActivity())
    } finally {
      setLoading(false)
    }
  }

  const generateMockInsights = (): TravelInsight[] => [
    {
      id: '1',
      type: 'savings',
      title: 'Smart Savings This Month',
      description: 'You saved money by choosing layover flights over direct routes',
      value: '$420',
      change: { amount: 15, trend: 'up' },
      icon: DollarSign,
      color: 'green',
      actionable: true,
      actionText: 'Find more deals'
    },
    {
      id: '2',
      type: 'efficiency',
      title: 'Travel Efficiency Score',
      description: 'Your layover timing optimization has improved significantly',
      value: '87%',
      change: { amount: 12, trend: 'up' },
      icon: Target,
      color: 'blue',
      actionable: true,
      actionText: 'Optimize more'
    },
    {
      id: '3',
      type: 'experience',
      title: 'Cities Explored',
      description: 'New cities visited through strategic layovers',
      value: '3',
      change: { amount: 2, trend: 'up' },
      icon: Globe,
      color: 'purple',
      actionable: true,
      actionText: 'Discover more'
    },
    {
      id: '4',
      type: 'sustainability',
      title: 'Carbon Footprint Reduced',
      description: 'By optimizing routes and using efficient flights',
      value: '145 kg CO₂',
      change: { amount: 8, trend: 'down' },
      icon: Activity,
      color: 'emerald',
      actionable: false
    }
  ]

  const generateMockUpcomingTrips = (): UpcomingTrip[] => [
    {
      id: '1',
      destination: 'Tokyo, Japan',
      departureDate: '2024-03-15',
      duration: 14,
      layovers: 2,
      estimatedSavings: 650,
      status: 'confirmed',
      alerts: 0
    },
    {
      id: '2',
      destination: 'London, UK',
      departureDate: '2024-04-22',
      duration: 7,
      layovers: 1,
      estimatedSavings: 380,
      status: 'confirmed',
      alerts: 1
    },
    {
      id: '3',
      destination: 'Sydney, Australia',
      departureDate: '2024-06-10',
      duration: 21,
      layovers: 3,
      estimatedSavings: 890,
      status: 'pending',
      alerts: 0
    }
  ]

  const generateMockStats = (): PersonalStats => ({
    totalTrips: 24,
    totalSavings: 8420,
    milesFlown: 145680,
    citiesVisited: 18,
    averageLayoverTime: 8.5,
    carbonFootprintSaved: 342,
    experienceRating: 4.8,
    loyaltyPoints: 15600
  })

  const generateMockActivity = (): RecentActivity[] => [
    {
      id: '1',
      type: 'achievement',
      title: 'Explorer Badge Earned',
      description: 'Visited 15+ cities through layovers',
      timestamp: '2024-01-20T10:30:00Z',
      image: '/badges/explorer.png'
    },
    {
      id: '2',
      type: 'booking',
      title: 'Chicago Layover Experience',
      description: 'Booked deep-dish pizza tour and architecture cruise',
      timestamp: '2024-01-18T14:15:00Z',
      value: '$149'
    },
    {
      id: '3',
      type: 'review',
      title: 'Reviewed NYC Helicopter Tour',
      description: 'Gave 5-star rating for amazing skyline views',
      timestamp: '2024-01-15T09:45:00Z'
    },
    {
      id: '4',
      type: 'experience',
      title: 'Completed Dubai Food Tour',
      description: 'Explored local markets and traditional cuisine',
      timestamp: '2024-01-12T16:20:00Z'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'at_risk': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getInsightColor = (color: string) => {
    const colors = {
      green: 'from-green-400 to-green-600',
      blue: 'from-blue-400 to-blue-600',
      purple: 'from-purple-400 to-purple-600',
      emerald: 'from-emerald-400 to-emerald-600',
      orange: 'from-orange-400 to-orange-600',
      red: 'from-red-400 to-red-600'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Travel Dashboard</h1>
              <p className="text-gray-600 mt-1">Your personalized travel insights and recommendations</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {insights.map((insight) => (
            <div key={insight.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className={`h-2 bg-gradient-to-r ${getInsightColor(insight.color)}`}></div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${getInsightColor(insight.color)} rounded-lg flex items-center justify-center`}>
                    <insight.icon className="h-6 w-6 text-white" />
                  </div>
                  {insight.change && (
                    <div className={`flex items-center text-sm font-medium ${
                      insight.change.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {insight.change.trend === 'up' ? 
                        <ArrowUpRight className="h-4 w-4 mr-1" /> : 
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                      }
                      {insight.change.amount}%
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mb-2">{insight.value}</p>
                <p className="text-sm text-gray-600 mb-4">{insight.description}</p>
                {insight.actionable && (
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    {insight.actionText} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Trips */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Trips</h2>
                <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                  View all
                </button>
              </div>
              
              <div className="space-y-4">
                {upcomingTrips.map((trip) => (
                  <div key={trip.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Plane className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{trip.destination}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(trip.departureDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {trip.duration} days
                          </span>
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {trip.layovers} layover{trip.layovers > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                          {trip.status}
                        </span>
                        {trip.alerts > 0 && (
                          <div className="flex items-center text-orange-600">
                            <Bell className="h-4 w-4 mr-1" />
                            <span className="text-xs font-medium">{trip.alerts}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-green-600 font-medium mt-1">
                        Save ${trip.estimatedSavings}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Travel Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Travel Statistics</h2>
              
              {personalStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Plane className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{personalStats.totalTrips}</div>
                    <div className="text-sm text-gray-600">Total Trips</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">${personalStats.totalSavings.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Savings</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Globe className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{personalStats.citiesVisited}</div>
                    <div className="text-sm text-gray-600">Cities Visited</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Star className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{personalStats.experienceRating}</div>
                    <div className="text-sm text-gray-600">Avg Rating</div>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Insights Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Travel Performance</h2>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <BarChart3 className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <PieChart className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Simplified chart representation */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Savings Rate</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Experience Quality</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Time Efficiency</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                  <div className="flex items-center">
                    <Plane className="h-5 w-5 text-primary-600 mr-3" />
                    <span className="font-medium text-primary-700">Plan New Trip</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-primary-600" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <Eye className="h-5 w-5 text-gray-600 mr-3" />
                    <span className="font-medium text-gray-700">Browse Deals</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-600" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-600 mr-3" />
                    <span className="font-medium text-gray-700">Invite Friends</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {activity.type === 'achievement' && <Award className="h-4 w-4 text-orange-500" />}
                      {activity.type === 'booking' && <Plane className="h-4 w-4 text-blue-500" />}
                      {activity.type === 'review' && <Star className="h-4 w-4 text-yellow-500" />}
                      {activity.type === 'experience' && <Camera className="h-4 w-4 text-green-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    {activity.value && (
                      <span className="text-xs font-medium text-green-600">{activity.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Achievements</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-900">Explorer</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-900">Speedster</div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Heart className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-xs font-medium text-gray-900">Reviewer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}