'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plane, Clock, MapPin, Wifi, Battery, Signal, Weather, 
  Navigation, Phone, Shield, CreditCard, FileText, 
  Heart, Star, ChevronRight, RefreshCw, AlertCircle,
  Compass, Timer, BellRing, Info, Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FlightInfo {
  flightNumber: string
  departure: { city: string; time: string; gate?: string }
  arrival: { city: string; time: string; gate?: string }
  status: 'on-time' | 'delayed' | 'boarding' | 'departed'
  delay?: number
}

interface LayoverInfo {
  duration: number // hours
  timeRemaining: number // hours
  currentLocation: string
  nextFlight: FlightInfo
}

interface TravelAlert {
  id: string
  type: 'warning' | 'info' | 'success'
  title: string
  message: string
  urgent: boolean
}

// Quick Status Widget - Always visible floating widget
export function QuickStatusWidget({ layover, alerts }: { 
  layover: LayoverInfo
  alerts: TravelAlert[]
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const timeLeft = Math.floor(layover.timeRemaining * 60) // convert to minutes
  const progress = ((layover.duration - layover.timeRemaining) / layover.duration) * 100

  return (
    <div className="fixed top-4 right-4 z-50 md:hidden">
      <Card className="w-72 shadow-lg bg-white/95 backdrop-blur border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Layover Active</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Time Remaining</span>
              <span className="font-mono font-bold">
                {Math.floor(timeLeft / 60)}h {timeLeft % 60}m
              </span>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Plane className="h-3 w-3" />
              <span>Next: {layover.nextFlight.flightNumber} at {layover.nextFlight.departure.time}</span>
            </div>

            {alerts.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <AlertCircle className="h-3 w-3" />
                <span>{alerts.length} alert{alerts.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t space-y-2">
              {alerts.slice(0, 2).map((alert) => (
                <Alert key={alert.id} className="py-2">
                  <AlertDescription className="text-xs">
                    {alert.message}
                  </AlertDescription>
                </Alert>
              ))}
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs">
                  View All
                </Button>
                <Button size="sm" className="flex-1 text-xs">
                  Quick Actions
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Connection Status Widget
export function ConnectionStatusWidget() {
  const [wifiStrength, setWifiStrength] = useState(3)
  const [batteryLevel, setBatteryLevel] = useState(85)
  const [cellularSignal, setCellularSignal] = useState(4)

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setWifiStrength(Math.floor(Math.random() * 4) + 1)
      setBatteryLevel(prev => Math.max(20, prev - Math.random() * 2))
      setCellularSignal(Math.floor(Math.random() * 5) + 1)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getSignalColor = (strength: number, max: number) => {
    const ratio = strength / max
    if (ratio > 0.7) return 'text-green-500'
    if (ratio > 0.4) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Device Status</h3>
          <RefreshCw className="h-4 w-4 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div className="text-center">
            <div className={`flex items-center justify-center mb-1 ${getSignalColor(wifiStrength, 4)}`}>
              <Wifi className="h-5 w-5" />
            </div>
            <p className="text-xs text-gray-600">WiFi</p>
            <p className="text-xs font-medium">{wifiStrength}/4</p>
          </div>
          
          <div className="text-center">
            <div className={`flex items-center justify-center mb-1 ${getSignalColor(batteryLevel, 100)}`}>
              <Battery className="h-5 w-5" />
            </div>
            <p className="text-xs text-gray-600">Battery</p>
            <p className="text-xs font-medium">{batteryLevel}%</p>
          </div>
          
          <div className="text-center">
            <div className={`flex items-center justify-center mb-1 ${getSignalColor(cellularSignal, 5)}`}>
              <Signal className="h-5 w-5" />
            </div>
            <p className="text-xs text-gray-600">Signal</p>
            <p className="text-xs font-medium">{cellularSignal}/5</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Weather & Location Widget
export function WeatherLocationWidget({ city }: { city: string }) {
  const [weather, setWeather] = useState({
    temperature: 22,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12
  })

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">{city}</span>
          </div>
          <Weather className="h-4 w-4 text-gray-400" />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{weather.temperature}°C</p>
            <p className="text-sm text-gray-600">{weather.condition}</p>
          </div>
          
          <div className="text-right text-xs text-gray-600">
            <p>Humidity: {weather.humidity}%</p>
            <p>Wind: {weather.windSpeed} km/h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Quick Actions Widget
export function QuickActionsWidget() {
  const actions = [
    { icon: Navigation, label: 'Navigate', color: 'text-blue-500' },
    { icon: Phone, label: 'Emergency', color: 'text-red-500' },
    { icon: Shield, label: 'Safety', color: 'text-green-500' },
    { icon: CreditCard, label: 'Expenses', color: 'text-purple-500' },
    { icon: FileText, label: 'Documents', color: 'text-orange-500' },
    { icon: Heart, label: 'Favorites', color: 'text-pink-500' }
  ]

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-3 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-16 flex flex-col gap-1 p-2"
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Experience Suggestions Widget
export function ExperienceSuggestionsWidget() {
  const suggestions = [
    {
      title: 'City Museum Tour',
      duration: '2h',
      price: '$25',
      rating: 4.8,
      distance: '15 min',
      urgent: false
    },
    {
      title: 'Local Food Market',
      duration: '1.5h',
      price: '$35',
      rating: 4.9,
      distance: '8 min',
      urgent: true
    },
    {
      title: 'Historic Walking Tour',
      duration: '3h',
      price: '$20',
      rating: 4.7,
      distance: '12 min',
      urgent: false
    }
  ]

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          Quick Experiences
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg border bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{suggestion.title}</p>
                  {suggestion.urgent && (
                    <Badge variant="destructive" className="text-xs px-1 py-0">
                      Limited
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {suggestion.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {suggestion.distance}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400" />
                    {suggestion.rating}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-bold text-green-600">{suggestion.price}</p>
                <Button size="sm" variant="outline" className="text-xs h-6 mt-1">
                  Book
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Navigation Helper Widget
export function NavigationHelperWidget() {
  const [currentLocation, setCurrentLocation] = useState('Terminal 2, Gate B12')
  const [nextDestination, setNextDestination] = useState('City Center')
  const [estimatedTime, setEstimatedTime] = useState('25 min')

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Navigation</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Current Location</span>
            <span className="font-medium">{currentLocation}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Next Destination</span>
            <span className="font-medium">{nextDestination}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Estimated Time</span>
            <span className="font-bold text-blue-600">{estimatedTime}</span>
          </div>
          
          <Button size="sm" className="w-full mt-2">
            <Navigation className="h-4 w-4 mr-2" />
            Start Navigation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Flight Updates Widget
export function FlightUpdatesWidget({ flight }: { flight: FlightInfo }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return 'text-green-600'
      case 'delayed': return 'text-red-600'
      case 'boarding': return 'text-blue-600'
      case 'departed': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-time': return <div className="w-2 h-2 bg-green-500 rounded-full" />
      case 'delayed': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'boarding': return <BellRing className="h-4 w-4 text-blue-500" />
      case 'departed': return <Plane className="h-4 w-4 text-gray-500" />
      default: return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Plane className="h-4 w-4 text-blue-500" />
          Flight {flight.flightNumber}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{flight.departure.city}</p>
              <p className="text-xs text-gray-600">{flight.departure.time}</p>
              {flight.departure.gate && (
                <p className="text-xs text-blue-600">Gate {flight.departure.gate}</p>
              )}
            </div>
            
            <div className="flex flex-col items-center">
              <Plane className="h-4 w-4 text-gray-400" />
              <div className="w-8 h-0.5 bg-gray-300 my-1"></div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium">{flight.arrival.city}</p>
              <p className="text-xs text-gray-600">{flight.arrival.time}</p>
              {flight.arrival.gate && (
                <p className="text-xs text-blue-600">Gate {flight.arrival.gate}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
            <div className="flex items-center gap-2">
              {getStatusIcon(flight.status)}
              <span className={`text-sm font-medium capitalize ${getStatusColor(flight.status)}`}>
                {flight.status.replace('-', ' ')}
              </span>
            </div>
            
            {flight.delay && (
              <span className="text-sm text-red-600">
                +{flight.delay}min delay
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Mobile Widget Container
export function MobileTravelWidgets({ 
  layover, 
  flight, 
  alerts = [],
  city = 'Current City'
}: {
  layover: LayoverInfo
  flight: FlightInfo
  alerts?: TravelAlert[]
  city?: string
}) {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <>
      {/* Floating Quick Status - Always Visible */}
      <QuickStatusWidget layover={layover} alerts={alerts} />
      
      {/* Main Widget Container */}
      <div className="md:hidden p-4 space-y-4 pb-20">
        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'travel', label: 'Travel' },
            { id: 'explore', label: 'Explore' }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            <FlightUpdatesWidget flight={flight} />
            <ConnectionStatusWidget />
            <WeatherLocationWidget city={city} />
          </>
        )}

        {activeTab === 'travel' && (
          <>
            <NavigationHelperWidget />
            <QuickActionsWidget />
          </>
        )}

        {activeTab === 'explore' && (
          <>
            <ExperienceSuggestionsWidget />
          </>
        )}
      </div>
    </>
  )
}