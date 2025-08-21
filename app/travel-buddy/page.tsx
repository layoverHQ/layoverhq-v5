'use client'

import React, { useState, useEffect } from 'react'
import { UnifiedTravelBuddyDashboard } from '@/components/unified-travel-buddy-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, Clock, Plane, Zap, ArrowRight, Play, 
  CheckCircle2, Star, Users, Shield, Globe
} from 'lucide-react'

export default function TravelBuddyPage() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [currentLocation, setCurrentLocation] = useState({
    city: 'Paris',
    airport: 'CDG',
    coordinates: { lat: 48.8566, lng: 2.3522 }
  })
  const [layover, setLayover] = useState({
    duration: 8,
    timeRemaining: 6.5,
    flightInfo: {
      flightNumber: 'AF1234',
      departure: { city: 'Paris', time: '14:30', gate: 'A12' },
      arrival: { city: 'New York', time: '18:45', gate: 'B8' },
      status: 'on-time' as const,
      delay: 0
    }
  })

  // Mock user ID for demo
  const userId = 'demo-user-123'

  const handleStartDemo = () => {
    setIsDemoMode(true)
  }

  const demoScenarios = [
    {
      title: 'Paris Layover Adventure',
      description: '8-hour layover at Charles de Gaulle',
      location: { city: 'Paris', airport: 'CDG', coordinates: { lat: 48.8566, lng: 2.3522 } },
      layover: { duration: 8, timeRemaining: 6.5 }
    },
    {
      title: 'Tokyo Quick Stop',
      description: '4-hour layover at Narita',
      location: { city: 'Tokyo', airport: 'NRT', coordinates: { lat: 35.6762, lng: 139.6503 } },
      layover: { duration: 4, timeRemaining: 3.2 }
    },
    {
      title: 'London Extended Layover',
      description: '12-hour layover at Heathrow',
      location: { city: 'London', airport: 'LHR', coordinates: { lat: 51.4700, lng: -0.4543 } },
      layover: { duration: 12, timeRemaining: 10.8 }
    }
  ]

  const selectScenario = (scenario: any) => {
    setCurrentLocation(scenario.location)
    setLayover({
      duration: scenario.layover.duration,
      timeRemaining: scenario.layover.timeRemaining,
      flightInfo: {
        flightNumber: 'AF1234',
        departure: { city: scenario.location.city, time: '14:30', gate: 'A12' },
        arrival: { city: 'New York', time: '18:45', gate: 'B8' },
        status: 'on-time' as const,
        delay: 0
      }
    })
    setIsDemoMode(true)
  }

  if (isDemoMode) {
    return (
      <UnifiedTravelBuddyDashboard
        userId={userId}
        currentLocation={currentLocation}
        layover={layover}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Travel Buddy</h1>
                <p className="text-sm text-gray-600">AI-Powered Travel Companion</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Demo Mode
              </Badge>
              <Button variant="outline" onClick={() => setIsDemoMode(false)}>
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4 mr-2" />
              Experience the Future of Travel
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-6 leading-tight">
              Meet Your
              <span className="block font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI Travel Buddy
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              Transform every layover into an adventure with intelligent recommendations, 
              real-time tracking, and personalized travel insights powered by AI.
            </p>
          </div>

          {/* Demo CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              onClick={handleStartDemo}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Interactive Demo
            </Button>
            
            <p className="text-sm text-gray-500">
              No sign-up required • Experience all features instantly
            </p>
          </div>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plane className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Real-Time Intelligence</h3>
              <p className="text-gray-600 text-sm">Live flight tracking and predictive insights</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Social Discovery</h3>
              <p className="text-gray-600 text-sm">Connect with travelers and share experiences</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Safety</h3>
              <p className="text-gray-600 text-sm">Emergency contacts and safety monitoring</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Scenarios */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Choose Your Demo Scenario
            </h2>
            <p className="text-gray-600">
              Experience different layover situations and see how Travel Buddy adapts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {demoScenarios.map((scenario, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-blue-200"
                onClick={() => selectScenario(scenario)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <p className="text-gray-600 text-sm">{scenario.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{scenario.location.city} ({scenario.location.airport})</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{scenario.layover.duration}h layover • {scenario.layover.timeRemaining}h remaining</span>
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-gray-500">Recommended for:</span>
                      <div className="flex gap-1">
                        {scenario.layover.duration >= 8 && (
                          <Badge variant="outline" className="text-xs">City Tour</Badge>
                        )}
                        {scenario.layover.duration >= 4 && (
                          <Badge variant="outline" className="text-xs">Dining</Badge>
                        )}
                        <Badge variant="outline" className="text-xs">Shopping</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              onClick={handleStartDemo}
              className="px-6 py-3"
            >
              Start with Default Scenario
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              Everything You Need for Smart Travel
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform integrates all aspects of your travel experience into one unified companion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Plane,
                title: 'Live Flight Tracking',
                description: 'Real-time updates, delay predictions, and smart rebooking suggestions',
                color: 'blue'
              },
              {
                icon: Globe,
                title: 'AI-Powered Search',
                description: 'Natural language search with personalized recommendations',
                color: 'purple'
              },
              {
                icon: Users,
                title: 'Social Travel Network',
                description: 'Connect with travelers, share experiences, and discover hidden gems',
                color: 'green'
              },
              {
                icon: Shield,
                title: 'Document Management',
                description: 'Secure storage with OCR scanning and expiry alerts',
                color: 'orange'
              },
              {
                icon: MapPin,
                title: 'Mobile Companion',
                description: 'Responsive widgets that adapt to your travel context',
                color: 'indigo'
              },
              {
                icon: CheckCircle2,
                title: 'Safety & Emergency',
                description: 'Emergency contacts, local assistance, and safety monitoring',
                color: 'red'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 bg-${feature.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-5 w-5 text-${feature.color}-600`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-light text-white mb-6">
            Ready to Transform Your Travel?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of travelers who've discovered the power of AI-assisted layovers
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleStartDemo}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-medium"
            >
              <Play className="h-5 w-5 mr-2" />
              Try Interactive Demo
            </Button>
            <Button 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg text-lg font-medium"
            >
              Learn More
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}