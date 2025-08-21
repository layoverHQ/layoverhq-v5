"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedAirportAutoSuggest } from "@/components/enhanced-airport-auto-suggest"
import { AirportAutoSuggest } from "@/components/airport-auto-suggest"
import { Plane, MapPin, Globe, Star, Building2 } from "lucide-react"
import type { Airport } from "@/lib/services/airport-service"
import type { Airline } from "@/lib/services/airline-service"

export default function AirportDemoPage() {
  const [originAirport, setOriginAirport] = useState<Airport | null>(null)
  const [destinationAirport, setDestinationAirport] = useState<Airport | null>(null)
  const [selectedAirline, setSelectedAirline] = useState<Airline | null>(null)
  const [demoMode, setDemoMode] = useState<"basic" | "enhanced">("enhanced")

  const handleSeedDatabase = async () => {
    try {
      const response = await fetch("/api/airports/seed", { method: "POST" })
      const data = await response.json()
      alert(`Database seeding: ${data.message}`)
    } catch (error) {
      alert("Error seeding database")
    }
  }

  const handleCheckDatabaseStatus = async () => {
    try {
      const response = await fetch("/api/airports/seed")
      const data = await response.json()
      alert(`Database status: ${data.status} (${data.count} airports)`)
    } catch (error) {
      alert("Error checking database status")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Airport Auto-Suggest Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience our enhanced airport search with airline integration, featuring data from{" "}
            <a
              href="https://github.com/lxndrblz/Airports.git"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              comprehensive airport database
            </a>{" "}
            and{" "}
            <a
              href="https://github.com/dotmarn/Airlines.git"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              airline information with logos
            </a>
          </p>
        </div>

        {/* Database Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Database Management
            </CardTitle>
            <CardDescription>Manage the airport and airline database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={handleCheckDatabaseStatus} variant="outline">
                Check Database Status
              </Button>
              <Button onClick={handleSeedDatabase} variant="default">
                Seed Database
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Demo Mode Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Demo Mode</CardTitle>
            <CardDescription>Choose between basic and enhanced airport search</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={demoMode}
              onValueChange={(value) => setDemoMode(value as "basic" | "enhanced")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Search</TabsTrigger>
                <TabsTrigger value="enhanced">Enhanced Search</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="mt-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Origin Airport</h3>
                      <AirportAutoSuggest
                        label="From"
                        placeholder="Search origin airport..."
                        value={originAirport?.iata_code || ""}
                        onChange={(code) => {
                          if (code) {
                            // In a real app, you'd fetch the airport details
                            setOriginAirport({
                              id: "temp",
                              iata_code: code,
                              icao_code: "",
                              name: "Selected Airport",
                              city: "Selected City",
                              country: "Selected Country",
                              timezone: "UTC",
                              latitude: 0,
                              longitude: 0,
                              elevation: 0,
                              hub: false,
                              popular: false,
                              search_rank: 0,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            })
                          } else {
                            setOriginAirport(null)
                          }
                        }}
                        onAirportSelect={setOriginAirport}
                        showPopular={true}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Destination Airport</h3>
                      <AirportAutoSuggest
                        label="To"
                        placeholder="Search destination airport..."
                        value={destinationAirport?.iata_code || ""}
                        onChange={(code) => {
                          if (code) {
                            setDestinationAirport({
                              id: "temp",
                              iata_code: code,
                              icao_code: "",
                              name: "Selected Airport",
                              city: "Selected City",
                              country: "Selected Country",
                              timezone: "UTC",
                              latitude: 0,
                              longitude: 0,
                              elevation: 0,
                              hub: false,
                              popular: false,
                              search_rank: 0,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            })
                          } else {
                            setDestinationAirport(null)
                          }
                        }}
                        onAirportSelect={setDestinationAirport}
                        showPopular={true}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="enhanced" className="mt-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Origin Airport (Enhanced)</h3>
                      <EnhancedAirportAutoSuggest
                        label="From"
                        placeholder="Search origin airport with airline info..."
                        value={originAirport?.iata_code || ""}
                        onChange={(code) => {
                          if (code) {
                            setOriginAirport({
                              id: "temp",
                              iata_code: code,
                              icao_code: "",
                              name: "Selected Airport",
                              city: "Selected City",
                              country: "Selected Country",
                              timezone: "UTC",
                              latitude: 0,
                              longitude: 0,
                              elevation: 0,
                              hub: false,
                              popular: false,
                              search_rank: 0,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            })
                          } else {
                            setOriginAirport(null)
                          }
                        }}
                        onAirportSelect={setOriginAirport}
                        showPopular={true}
                        showAirlines={true}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Destination Airport (Enhanced)</h3>
                      <EnhancedAirportAutoSuggest
                        label="To"
                        placeholder="Search destination airport with airline info..."
                        value={destinationAirport?.iata_code || ""}
                        onChange={(code) => {
                          if (code) {
                            setDestinationAirport({
                              id: "temp",
                              iata_code: code,
                              icao_code: "",
                              name: "Selected Airport",
                              city: "Selected City",
                              country: "Selected Country",
                              timezone: "UTC",
                              latitude: 0,
                              longitude: 0,
                              elevation: 0,
                              hub: false,
                              popular: false,
                              search_rank: 0,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            })
                          } else {
                            setDestinationAirport(null)
                          }
                        }}
                        onAirportSelect={setDestinationAirport}
                        showPopular={true}
                        showAirlines={true}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Selected Information Display */}
        {(originAirport || destinationAirport) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Selected Flight Route</CardTitle>
              <CardDescription>Your selected airports and route information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {originAirport && (
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      <Plane className="inline h-4 w-4 mr-2" />
                      Origin
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{originAirport.iata_code}</Badge>
                        <span className="font-medium">{originAirport.city}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {originAirport.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {originAirport.country} • {originAirport.timezone}
                      </p>
                    </div>
                  </div>
                )}

                {destinationAirport && (
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      <MapPin className="inline h-4 w-4 mr-2" />
                      Destination
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{destinationAirport.iata_code}</Badge>
                        <span className="font-medium">{destinationAirport.city}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {destinationAirport.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {destinationAirport.country} • {destinationAirport.timezone}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {originAirport && destinationAirport && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Route Summary
                  </h4>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <Badge variant="outline">{originAirport.iata_code}</Badge>
                      <p className="text-xs text-gray-500 mt-1">{originAirport.city}</p>
                    </div>
                    <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600 relative">
                      <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-center">
                      <Badge variant="outline">{destinationAirport.iata_code}</Badge>
                      <p className="text-xs text-gray-500 mt-1">{destinationAirport.city}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Features Overview</CardTitle>
            <CardDescription>What makes our airport auto-suggest system special</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <Globe className="h-12 w-12 mx-auto text-blue-500 mb-3" />
                <h3 className="font-semibold mb-2">Global Coverage</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access to thousands of airports worldwide with comprehensive data
                </p>
              </div>

              <div className="text-center p-4">
                <Plane className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <h3 className="font-semibold mb-2">Airline Integration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  See which airlines operate at each airport with logos and alliance info
                </p>
              </div>

              <div className="text-center p-4">
                <Star className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
                <h3 className="font-semibold mb-2">Smart Ranking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Intelligent search with hub airports and popular destinations prioritized
                </p>
              </div>

              <div className="text-center p-4">
                <MapPin className="h-12 w-12 mx-auto text-red-500 mb-3" />
                <h3 className="font-semibold mb-2">Location Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Precise coordinates, timezone info, and elevation data for each airport
                </p>
              </div>

              <div className="text-center p-4">
                <Building2 className="h-12 w-12 mx-auto text-purple-500 mb-3" />
                <h3 className="font-semibold mb-2">Real-time Search</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Debounced search with keyboard navigation and mobile-friendly interface
                </p>
              </div>

              <div className="text-center p-4">
                <div className="h-12 w-12 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold mb-3">
                  API
                </div>
                <h3 className="font-semibold mb-2">RESTful API</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Full backend integration with Supabase and fallback to GitHub data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
