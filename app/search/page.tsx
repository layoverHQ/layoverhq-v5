"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { FlightSearchForm } from "@/components/flight-search-form"
import { LayoverOpportunityResults } from "@/components/layover-opportunity-results"
import { FlightResults } from "@/components/flight-results"
import { LayoverDetails } from "@/components/layover-details"
import { cn } from "@/lib/utils"
import { 
  Search,
  MapPin, 
  Calendar, 
  Users, 
  Plane,
  Clock,
  Camera,
  Star,
  TrendingUp,
  Filter,
  ArrowRight,
  Sparkles,
  Globe,
  DollarSign
} from "lucide-react"

interface SearchParams {
  origin?: string
  destination?: string
  departureDate?: string
  returnDate?: string
  adults?: string
  children?: string
  infants?: string
  cabinClass?: string
}

export default function SearchPage() {
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any>(null)
  const [error, setError] = useState("")
  const [selectedFlight, setSelectedFlight] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("search")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parse URL parameters
  const urlParams: SearchParams = {
    origin: searchParams.get("origin") || undefined,
    destination: searchParams.get("destination") || undefined,
    departureDate: searchParams.get("departureDate") || undefined,
    returnDate: searchParams.get("returnDate") || undefined,
    adults: searchParams.get("adults") || "1",
    children: searchParams.get("children") || "0",
    infants: searchParams.get("infants") || "0",
    cabinClass: searchParams.get("cabinClass") || "economy",
  }

  // Auto-search if URL has parameters
  useEffect(() => {
    if (urlParams.origin && urlParams.destination && urlParams.departureDate) {
      handleSearch(urlParams)
      setActiveTab("results")
    }
  }, [])

  const handleSearch = async (params: SearchParams) => {
    setIsSearching(true)
    setError("")
    setSearchResults(null)

    try {
      // Use the new Core Layover Discovery Engine
      const discoveryPayload = {
        origin: params.origin || "",
        destination: params.destination || "",
        departureDate: params.departureDate || "",
        ...(params.returnDate && { returnDate: params.returnDate }),
        passengers: {
          adults: parseInt(params.adults || "1"),
          children: parseInt(params.children || "0"),
          infants: parseInt(params.infants || "0"),
        },
        preferences: {
          minLayoverDuration: 120, // 2 hours minimum
          maxLayoverDuration: 1440, // 24 hours maximum
          preferredActivities: ["sightseeing", "food", "culture"],
          physicalDemand: "moderate" as const,
        },
      }

      console.log("[LayoverHQ] Discovering layover opportunities:", discoveryPayload)

      const response = await fetch("/api/v1/layovers/discover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(discoveryPayload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || "Discovery failed")
      }

      console.log("[LayoverHQ] Discovery results:", data)
      setSearchResults(data.data)
      setActiveTab("results")

      // Update URL with search parameters
      const searchQuery = new URLSearchParams({
        origin: params.origin || "",
        destination: params.destination || "",
        departureDate: params.departureDate || "",
        ...(params.returnDate && { returnDate: params.returnDate }),
        adults: params.adults || "1",
        children: params.children || "0",
        infants: params.infants || "0",
        cabinClass: params.cabinClass || "economy",
      })
      const newUrl = `/search?${searchQuery}`
      router.push(newUrl, { scroll: false })
    } catch (err: any) {
      console.error("[LayoverHQ] Discovery error:", err)
      setError(err.message || "Failed to discover layover opportunities. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleFlightSelect = (flight: any) => {
    setSelectedFlight(flight)
    setActiveTab("details")
  }

  const handleBookFlight = (flight: any) => {
    // Navigate to booking flow
    router.push(`/booking?flightId=${flight.id}&source=${flight.source}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Plane className="h-6 w-6" />
              <span className="heading-font text-xl">LayoverHQ</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Layover Optimized
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="search" className="body-font">
              Search
            </TabsTrigger>
            <TabsTrigger value="results" className="body-font" disabled={!searchResults}>
              Results {searchResults && `(${searchResults.total})`}
            </TabsTrigger>
            <TabsTrigger value="details" className="body-font" disabled={!selectedFlight}>
              Details
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <div className="text-center space-y-4 mb-8">
              <h1 className="heading-font text-3xl text-foreground">
                Find Flights with Amazing Layovers
              </h1>
              <p className="body-font text-muted-foreground max-w-2xl mx-auto">
                Discover flights with optimal layover times and turn your travel connections into
                city adventures. Our intelligent search finds the best layover opportunities
                worldwide.
              </p>
            </div>

            <Card className="max-w-4xl mx-auto bg-card/50 backdrop-blur-sm border-border">
              <CardContent className="p-6">
                <FlightSearchForm
                  onSearch={handleSearch}
                  isLoading={isSearching}
                  initialValues={urlParams}
                />
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive" className="max-w-4xl mx-auto">
                <AlertDescription className="body-font">{error}</AlertDescription>
              </Alert>
            )}

            {/* Popular Layover Destinations */}
            <div className="max-w-4xl mx-auto space-y-4">
              <h2 className="heading-font text-xl text-foreground">Popular Layover Destinations</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { city: "Doha", airport: "DOH", country: "Qatar", image: "🏛️" },
                  { city: "Dubai", airport: "DXB", country: "UAE", image: "🏙️" },
                  { city: "Istanbul", airport: "IST", country: "Turkey", image: "🕌" },
                  { city: "Singapore", airport: "SIN", country: "Singapore", image: "🌆" },
                ].map((dest) => (
                  <Card
                    key={dest.airport}
                    className="cursor-pointer hover:shadow-md transition-shadow bg-card border-border"
                    onClick={() => {
                      // Pre-fill search with this destination as a layover preference
                      const newParams = { ...urlParams, preferredLayover: dest.airport }
                      handleSearch(newParams)
                    }}
                  >
                    <CardContent className="p-4 text-center space-y-2">
                      <div className="text-2xl">{dest.image}</div>
                      <div>
                        <h3 className="heading-font text-sm font-medium">{dest.city}</h3>
                        <p className="body-font text-xs text-muted-foreground">
                          {dest.airport} • {dest.country}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {isSearching && (
              <Card className="max-w-4xl mx-auto bg-card/50 backdrop-blur-sm border-border">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Plane className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="heading-font text-lg">Searching for Optimal Layovers</h3>
                    <p className="body-font text-muted-foreground">
                      Analyzing flights across multiple providers and scoring layover
                      opportunities...
                    </p>
                  </div>
                  <Progress value={66} className="w-full max-w-xs mx-auto" />
                </CardContent>
              </Card>
            )}

            {searchResults && !isSearching && (
              <>
                {/* Check if we have layover opportunities or traditional flight results */}
                {searchResults.opportunities ? (
                  <LayoverOpportunityResults
                    results={searchResults}
                    onOpportunitySelect={handleFlightSelect}
                    onBookFlight={handleBookFlight}
                  />
                ) : (
                  <FlightResults
                    results={searchResults}
                    onFlightSelect={handleFlightSelect}
                    onBookFlight={handleBookFlight}
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {selectedFlight && (
              <LayoverDetails
                flight={selectedFlight}
                onBook={() => handleBookFlight(selectedFlight)}
                onBack={() => setActiveTab("results")}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
