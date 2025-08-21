'use client'

import React, { useState, useEffect } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { MobileTravelWidgets } from './mobile-travel-widgets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plane, Clock, MapPin, TrendingUp, Users, Star, 
  Calendar, Wallet, FileText, Shield, Phone, Navigation,
  Grid3X3, List, Maximize2, Minimize2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TravelData {
  layover: {
    duration: number
    timeRemaining: number
    currentLocation: string
    nextFlight: {
      flightNumber: string
      departure: { city: string; time: string; gate?: string }
      arrival: { city: string; time: string; gate?: string }
      status: 'on-time' | 'delayed' | 'boarding' | 'departed'
      delay?: number
    }
  }
  alerts: Array<{
    id: string
    type: 'warning' | 'info' | 'success'
    title: string
    message: string
    urgent: boolean
  }>
  city: string
  user: {
    name: string
    preferences: any
    travelHistory: any[]
  }
}

// Desktop Widget Components
function DesktopFlightWidget({ flight }: { flight: any }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plane className="h-5 w-5 text-blue-500" />
          Flight {flight.flightNumber}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <p className="text-lg font-bold">{flight.departure.city}</p>
            <p className="text-sm text-gray-600">{flight.departure.time}</p>
            {flight.departure.gate && (
              <Badge variant="outline" className="mt-1">Gate {flight.departure.gate}</Badge>
            )}
          </div>
          
          <div className="flex flex-col items-center px-4">
            <Plane className="h-6 w-6 text-gray-400 mb-1" />
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <p className="text-xs text-gray-500 mt-1">3h 45m</p>
          </div>
          
          <div className="text-center">
            <p className="text-lg font-bold">{flight.arrival.city}</p>
            <p className="text-sm text-gray-600">{flight.arrival.time}</p>
            {flight.arrival.gate && (
              <Badge variant="outline" className="mt-1">Gate {flight.arrival.gate}</Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-center">
          <Badge 
            variant={flight.status === 'on-time' ? 'default' : 'destructive'}
            className="capitalize"
          >
            {flight.status.replace('-', ' ')}
            {flight.delay && ` (+${flight.delay}min)`}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function LayoverCountdownWidget({ layover }: { layover: any }) {
  const timeLeft = Math.floor(layover.timeRemaining * 60)
  const progress = ((layover.duration - layover.timeRemaining) / layover.duration) * 100

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5 text-orange-500" />
          Layover Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <p className="text-3xl font-bold font-mono">
            {Math.floor(timeLeft / 60)}h {timeLeft % 60}m
          </p>
          <p className="text-sm text-gray-600">Remaining</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Current: {layover.currentLocation}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickStatsWidget({ stats }: { stats: any }) {
  const statItems = [
    { label: 'Trips This Year', value: '12', icon: Calendar, color: 'text-blue-500' },
    { label: 'Cities Visited', value: '8', icon: MapPin, color: 'text-green-500' },
    { label: 'Experiences', value: '24', icon: Star, color: 'text-yellow-500' },
    { label: 'Savings', value: '$1,240', icon: Wallet, color: 'text-purple-500' }
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Travel Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {statItems.map((item, index) => (
            <div key={index} className="text-center">
              <item.icon className={`h-6 w-6 mx-auto mb-2 ${item.color}`} />
              <p className="text-lg font-bold">{item.value}</p>
              <p className="text-xs text-gray-600">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivityWidget() {
  const activities = [
    { type: 'booking', text: 'Booked City Museum Tour', time: '2h ago', icon: Calendar },
    { type: 'expense', text: 'Coffee at Terminal Cafe', time: '30m ago', icon: Wallet },
    { type: 'navigation', text: 'Arrived at Gate B12', time: '15m ago', icon: Navigation },
    { type: 'alert', text: 'Flight delayed by 20 minutes', time: '5m ago', icon: Plane }
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5 text-blue-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <activity.icon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.text}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionsDesktop() {
  const actions = [
    { label: 'Find Experiences', icon: Star, color: 'bg-blue-500' },
    { label: 'Track Expenses', icon: Wallet, color: 'bg-green-500' },
    { label: 'Documents', icon: FileText, color: 'bg-orange-500' },
    { label: 'Emergency', icon: Shield, color: 'bg-red-500' },
    { label: 'Navigation', icon: Navigation, color: 'bg-purple-500' },
    { label: 'Contact Help', icon: Phone, color: 'bg-gray-500' }
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-12 flex items-center gap-2 justify-start"
            >
              <div className={`w-6 h-6 rounded ${action.color} flex items-center justify-center`}>
                <action.icon className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Main Responsive Dashboard Component
export function ResponsiveTravelDashboard({ travelData }: { travelData: TravelData }) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (isMobile) {
      setViewMode('list')
    }
  }, [isMobile])

  // Mobile version
  if (isMobile) {
    return (
      <MobileTravelWidgets
        layover={travelData.layover}
        flight={travelData.layover.nextFlight}
        alerts={travelData.alerts}
        city={travelData.city}
      />
    )
  }

  // Desktop version
  return (
    <div className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white border-b">
        <div>
          <h1 className="text-2xl font-bold">Travel Dashboard</h1>
          <p className="text-gray-600">Welcome back, {travelData.user.name}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="p-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Primary Widgets - Full Width on Mobile, 2 cols on Desktop */}
            <div className="lg:col-span-2 xl:col-span-2 space-y-6">
              <DesktopFlightWidget flight={travelData.layover.nextFlight} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LayoverCountdownWidget layover={travelData.layover} />
                <QuickStatsWidget stats={{}} />
              </div>
            </div>

            {/* Sidebar Widgets */}
            <div className="space-y-6">
              <QuickActionsDesktop />
              <RecentActivityWidget />
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            <DesktopFlightWidget flight={travelData.layover.nextFlight} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LayoverCountdownWidget layover={travelData.layover} />
              <QuickStatsWidget stats={{}} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuickActionsDesktop />
              <RecentActivityWidget />
            </div>
          </div>
        )}

        {/* Alert Banner */}
        {travelData.alerts.length > 0 && (
          <div className="fixed bottom-4 right-4 max-w-sm">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-orange-800">
                    {travelData.alerts.length} Alert{travelData.alerts.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm text-orange-700">
                  {travelData.alerts[0].message}
                </p>
                {travelData.alerts.length > 1 && (
                  <Button size="sm" variant="outline" className="mt-2 text-xs">
                    View All ({travelData.alerts.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}