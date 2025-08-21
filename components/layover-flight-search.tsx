"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plane,
  Clock,
  Camera,
  Hotel,
  FileText,
  Star,
  Eye,
  Heart,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface LayoverFlightSearchProps {
  onSearch?: (params: LayoverSearchParams) => void
  loading?: boolean
}

interface LayoverSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: {
    adults: number
    children: number
    infants: number
  }
  cabinClass: string
  minLayoverTime: number
  maxLayoverTime: number
  preferredLayoverCities: string[]
  includeHotels: boolean
  includeVisaInfo: boolean
  searchMode: "roundtrip" | "oneway" | "multicity"
}

interface LayoverFlightResult {
  id: string
  source: string
  price: {
    total: number
    currency: string
    base: number
    taxes: number
  }
  itinerary: {
    outbound: FlightSegment[]
    inbound?: FlightSegment[]
  }
  layoverInfo: {
    cities: LayoverCity[]
    totalDuration: number
    longestLayover: number
    optimalForExploration: boolean
  }
  hotelOptions?: LayoverHotel[]
  visaRequirements?: VisaInfo[]
  layoverScore: number
}

interface FlightSegment {
  id: string
  departure: {
    airport: string
    city: string
    country: string
    terminal?: string
    time: string
    timezone?: string
  }
  arrival: {
    airport: string
    city: string
    country: string
    terminal?: string
    time: string
    timezone?: string
  }
  airline: {
    code: string
    name: string
  }
  flightNumber: string
  aircraft: {
    code: string
    name: string
  }
  duration: number
  layoverDuration?: number
}

interface LayoverCity {
  code: string
  name: string
  country: string
  duration: number
  minExploreTime: number
  experiences: CityExperience[]
  transport: TransportInfo
  image: string
  rating: number
  visaFree: boolean
  safetyRating: number
}

interface CityExperience {
  id: string
  title: string
  description: string
  duration: number
  price: number
  category: "culture" | "food" | "shopping" | "nature" | "adventure"
  rating: number
  image: string
  bookingUrl?: string
}

interface LayoverHotel {
  id: string
  name: string
  rating: number
  price: number
  distanceFromAirport: number
  amenities: string[]
  image: string
  bookingUrl: string
  shuttleService: boolean
}

interface VisaInfo {
  country: string
  required: boolean
  transitVisa: boolean
  maxStayHours: number
  requirements: string[]
  processingTime: string
  fee: number
}

interface TransportInfo {
  toCity: string
  duration: number
  cost: number
  frequency: string
  options: string[]
}

export function LayoverFlightSearch({ onSearch, loading = false }: LayoverFlightSearchProps) {
  const [searchParams, setSearchParams] = useState<LayoverSearchParams>({
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    passengers: {
      adults: 1,
      children: 0,
      infants: 0,
    },
    cabinClass: "economy",
    minLayoverTime: 240, // 4 hours default
    maxLayoverTime: 720, // 12 hours default
    preferredLayoverCities: [],
    includeHotels: false,
    includeVisaInfo: false,
    searchMode: "roundtrip",
  })

  const [searchResults, setSearchResults] = useState<LayoverFlightResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedTab, setSelectedTab] = useState("flights")
  const [expandedFlights, setExpandedFlights] = useState<Set<string>>(new Set())
  const [selectedLayoverType, setSelectedLayoverType] = useState<string>("city-explorer")
  const [showAdvanced, setShowAdvanced] = useState(false)

  const popularLayoverCities = [
    {
      code: "DOH",
      name: "Doha",
      country: "Qatar",
      image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=400&h=200&fit=crop",
      minExploreTime: 180,
      rating: 4.8,
      visaFree: true,
      safetyRating: 9.2,
      experiences: [
        {
          id: "doh-1",
          title: "Museum of Islamic Art Tour",
          description: "World-class collection spanning 1,400 years",
          duration: 120,
          price: 45,
          category: "culture" as const,
          rating: 4.9,
          image:
            "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop",
        },
        {
          id: "doh-2",
          title: "Souq Waqif Walking Tour",
          description: "Traditional market with spices, textiles, and local crafts",
          duration: 90,
          price: 25,
          category: "shopping" as const,
          rating: 4.7,
          image:
            "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop",
        },
      ],
      transport: {
        toCity: "Metro + Bus",
        duration: 45,
        cost: 8,
        frequency: "Every 15 minutes",
        options: ["Metro", "Taxi", "Hotel Shuttle"],
      },
    },
    {
      code: "DXB",
      name: "Dubai",
      country: "UAE",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=200&fit=crop",
      minExploreTime: 240,
      rating: 4.9,
      visaFree: true,
      safetyRating: 8.8,
      experiences: [
        {
          id: "dxb-1",
          title: "Burj Khalifa Observation Deck",
          description: "World's tallest building with stunning city views",
          duration: 180,
          price: 85,
          category: "adventure" as const,
          rating: 4.8,
          image:
            "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&h=200&fit=crop",
        },
      ],
      transport: {
        toCity: "Metro",
        duration: 60,
        cost: 12,
        frequency: "Every 10 minutes",
        options: ["Metro", "Taxi", "Bus"],
      },
    },
    {
      code: "IST",
      name: "Istanbul",
      country: "Turkey",
      image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&h=200&fit=crop",
      minExploreTime: 360,
      rating: 4.7,
      visaFree: true,
      safetyRating: 7.5,
      experiences: [
        {
          id: "ist-1",
          title: "Hagia Sophia & Blue Mosque Tour",
          description: "Byzantine and Ottoman architectural masterpieces",
          duration: 240,
          price: 35,
          category: "culture" as const,
          rating: 4.9,
          image:
            "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=300&h=200&fit=crop",
        },
      ],
      transport: {
        toCity: "Metro + Tram",
        duration: 90,
        cost: 5,
        frequency: "Every 5 minutes",
        options: ["Metro", "Bus", "Taxi"],
      },
    },
  ]

  const layoverPreferences = [
    {
      id: "airport-comfort",
      title: "Airport Comfort",
      subtitle: "2-4 hours",
      minTime: 120,
      maxTime: 240,
    },
    {
      id: "quick-escape",
      title: "Quick Escape",
      subtitle: "4-8 hours",
      minTime: 240,
      maxTime: 480,
    },
    {
      id: "city-explorer",
      title: "City Explorer",
      subtitle: "8-24 hours",
      minTime: 480,
      maxTime: 1440,
    },
    {
      id: "mini-vacation",
      title: "Mini Vacation",
      subtitle: "24+ hours",
      minTime: 1440,
      maxTime: 4320,
    },
  ]

  const handleSearch = async () => {
    setIsSearching(true)
    try {
      console.log("[v0] Starting layover flight search...")
      const response = await fetch("/api/v1/flights/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...searchParams,
          layoverOptimized: true,
          includeLayoverData: true,
          includeHotelOptions: searchParams.includeHotels,
          includeVisaInfo: searchParams.includeVisaInfo,
        }),
      })

      if (!response.ok) {
        throw new Error("Search failed")
      }

      const data = await response.json()
      console.log("[v0] API response received:", data)

      const flights = data.flights || data.results || []
      console.log("[v0] Processing flights:", flights.length)

      if (!Array.isArray(flights)) {
        console.log("[v0] Flights data is not an array, using mock data")
        setSearchResults(generateMockLayoverFlights())
        return
      }

      const enhancedResults = flights.map((flight: any) => ({
        ...flight,
        layoverScore: calculateLayoverScore(flight),
        hotelOptions: searchParams.includeHotels ? generateHotelOptions(flight) : [],
        visaRequirements: searchParams.includeVisaInfo ? generateVisaInfo(flight) : [],
      }))

      console.log("[v0] Enhanced results:", enhancedResults.length)
      setSearchResults(enhancedResults)
      onSearch?.(searchParams)
    } catch (error) {
      console.error("[v0] Layover flight search error:", error)
      setSearchResults(generateMockLayoverFlights())
    } finally {
      setIsSearching(false)
    }
  }

  const calculateLayoverScore = (flight: any) => {
    let score = 5

    if (flight.layoverInfo?.longestLayover) {
      const duration = flight.layoverInfo.longestLayover
      if (duration >= 180 && duration <= 480)
        score += 3 // Sweet spot
      else if (duration > 480 && duration <= 720)
        score += 2 // Good for exploration
      else if (duration < 120)
        score -= 2 // Too short
      else if (duration > 720) score -= 1 // Too long
    }

    // Bonus for popular layover cities
    const layoverCities = flight.layoverInfo?.cities || []
    const popularCodes = popularLayoverCities.map((city) => city.code)
    if (layoverCities.some((city: any) => popularCodes.includes(city.code))) {
      score += 2
    }

    return Math.max(1, Math.min(10, score))
  }

  const generateHotelOptions = (flight: any): LayoverHotel[] => {
    const layoverCities = flight.layoverInfo?.cities || []
    return layoverCities.flatMap((city: any) => {
      if (city.duration < 360) return [] // Only for 6+ hour layovers

      return [
        {
          id: `hotel-${city.code}-1`,
          name: `${city.name} Airport Hotel`,
          rating: 4.2,
          price: 89,
          distanceFromAirport: 0,
          amenities: ["Free WiFi", "24h Reception", "Shuttle Service"],
          image:
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop",
          bookingUrl: "#",
          shuttleService: true,
        },
      ]
    })
  }

  const generateVisaInfo = (flight: any): VisaInfo[] => {
    const layoverCities = flight.layoverInfo?.cities || []
    return layoverCities.map((city: any) => ({
      country: city.country,
      required: !popularLayoverCities.find((p) => p.code === city.code)?.visaFree,
      transitVisa: true,
      maxStayHours: 96,
      requirements: ["Valid passport", "Onward ticket"],
      processingTime: "On arrival",
      fee: 0,
    }))
  }

  const generateMockLayoverFlights = (): LayoverFlightResult[] => {
    return [
      {
        id: "layover-flight-1",
        source: "LayoverHQ",
        price: { total: 1285, currency: "USD", base: 1100, taxes: 185 },
        itinerary: {
          outbound: [
            {
              id: "seg-1",
              departure: {
                airport: "LOS",
                city: "Lagos",
                country: "Nigeria",
                time: "2025-08-21T08:15:00Z",
              },
              arrival: {
                airport: "DOH",
                city: "Doha",
                country: "Qatar",
                time: "2025-08-21T18:30:00Z",
              },
              airline: { code: "QR", name: "Qatar Airways" },
              flightNumber: "QR1418",
              aircraft: { code: "B787", name: "Boeing 787-8" },
              duration: 375,
              layoverDuration: 300,
            },
            {
              id: "seg-2",
              departure: {
                airport: "DOH",
                city: "Doha",
                country: "Qatar",
                time: "2025-08-21T23:30:00Z",
              },
              arrival: {
                airport: "ATL",
                city: "Atlanta",
                country: "USA",
                time: "2025-08-22T06:45:00Z",
              },
              airline: { code: "QR", name: "Qatar Airways" },
              flightNumber: "QR754",
              aircraft: { code: "A350", name: "Airbus A350-900" },
              duration: 435,
            },
          ],
        },
        layoverInfo: {
          cities: [popularLayoverCities[0] as any],
          totalDuration: 300,
          longestLayover: 300,
          optimalForExploration: true,
        },
        hotelOptions: [
          {
            id: "hotel-doh-1",
            name: "Doha Airport Hotel",
            rating: 4.5,
            price: 120,
            distanceFromAirport: 0,
            amenities: ["Free WiFi", "Spa", "Pool", "24h Room Service"],
            image:
              "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop",
            bookingUrl: "#",
            shuttleService: true,
          },
        ],
        visaRequirements: [
          {
            country: "Qatar",
            required: false,
            transitVisa: false,
            maxStayHours: 96,
            requirements: ["Valid passport"],
            processingTime: "Not required",
            fee: 0,
          },
        ],
        layoverScore: 9,
      },
    ]
  }

  const toggleFlightExpansion = (flightId: string) => {
    const newExpanded = new Set(expandedFlights)
    if (newExpanded.has(flightId)) {
      newExpanded.delete(flightId)
    } else {
      newExpanded.add(flightId)
    }
    setExpandedFlights(newExpanded)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-gray-900 mb-2">Smart Layover Flight Search</h2>
            <p className="text-gray-600">
              Find flights with optimal layover times for city exploration
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">From</Label>
                <Input
                  placeholder="Origin city or airport"
                  value={searchParams.origin}
                  onChange={(e) => setSearchParams((prev) => ({ ...prev, origin: e.target.value }))}
                  className="border-gray-300 focus:border-[#662046] focus:ring-[#662046]/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">To</Label>
                <Input
                  placeholder="Destination city or airport"
                  value={searchParams.destination}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, destination: e.target.value }))
                  }
                  className="border-gray-300 focus:border-[#662046] focus:ring-[#662046]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Departure</Label>
                <Input
                  type="date"
                  value={searchParams.departureDate}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, departureDate: e.target.value }))
                  }
                  className="border-gray-300 focus:border-[#662046] focus:ring-[#662046]/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Return</Label>
                <Input
                  type="date"
                  value={searchParams.returnDate}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, returnDate: e.target.value }))
                  }
                  className="border-gray-300 focus:border-[#662046] focus:ring-[#662046]/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Passengers</Label>
                <select
                  value={searchParams.passengers.adults}
                  onChange={(e) =>
                    setSearchParams((prev) => ({
                      ...prev,
                      passengers: { ...prev.passengers, adults: Number.parseInt(e.target.value) },
                    }))
                  }
                  className="w-full p-2 border border-gray-300 rounded-md focus:border-[#662046] focus:ring-[#662046]/20"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num} Adult{num > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">Layover Preference</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {layoverPreferences.map((preference) => (
                  <button
                    key={preference.id}
                    className={`p-4 text-left border rounded-lg transition-all ${
                      selectedLayoverType === preference.id
                        ? "border-[#662046] bg-[#662046]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      setSelectedLayoverType(preference.id)
                      setSearchParams((prev) => ({
                        ...prev,
                        minLayoverTime: preference.minTime,
                        maxLayoverTime: preference.maxTime,
                      }))
                    }}
                  >
                    <div className="font-medium text-gray-900 text-sm">{preference.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{preference.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-[#662046] hover:text-[#662046]/80 flex items-center gap-2"
              >
                Advanced options
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                />
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={searchParams.includeHotels}
                        onChange={(e) =>
                          setSearchParams((prev) => ({ ...prev, includeHotels: e.target.checked }))
                        }
                        className="rounded border-gray-300 text-[#662046] focus:ring-[#662046]/20"
                      />
                      Include layover hotels
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={searchParams.includeVisaInfo}
                        onChange={(e) =>
                          setSearchParams((prev) => ({
                            ...prev,
                            includeVisaInfo: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300 text-[#662046] focus:ring-[#662046]/20"
                      />
                      Include visa information
                    </label>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchParams.origin || !searchParams.destination}
              className="w-full bg-[#662046] hover:bg-[#662046]/90 text-white py-3 text-base font-medium"
            >
              {isSearching ? (
                <>
                  <Search className="h-4 w-4 mr-2 animate-spin" />
                  Searching flights...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search layover flights
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-[#662046]/10">
            <TabsTrigger
              value="flights"
              className="data-[state=active]:bg-[#662046] data-[state=active]:text-white"
            >
              <Plane className="h-4 w-4 mr-2" />
              Flights
            </TabsTrigger>
            <TabsTrigger
              value="experiences"
              className="data-[state=active]:bg-[#662046] data-[state=active]:text-white"
            >
              <Camera className="h-4 w-4 mr-2" />
              City Experiences
            </TabsTrigger>
            <TabsTrigger
              value="hotels"
              className="data-[state=active]:bg-[#662046] data-[state=active]:text-white"
            >
              <Hotel className="h-4 w-4 mr-2" />
              Layover Hotels
            </TabsTrigger>
            <TabsTrigger
              value="visas"
              className="data-[state=active]:bg-[#662046] data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Transit Visas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flights" className="space-y-4">
            {searchResults.map((flight) => (
              <Card
                key={flight.id}
                className="border-2 border-[#662046]/20 hover:border-[#662046]/40 transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Badge className="bg-gradient-to-r from-[#662046] to-[#8B4513] text-white px-3 py-1">
                        Layover Score: {flight.layoverScore}/10
                      </Badge>
                      {flight.layoverInfo.optimalForExploration && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <Camera className="h-3 w-3 mr-1" />
                          Perfect for exploring
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-[#662046]">
                        ${flight.price.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {flight.price.currency} per person
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {flight.itinerary.outbound.map((segment, index) => (
                      <div key={segment.id}>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="font-bold text-lg">{segment.departure.airport}</div>
                              <div className="text-sm text-gray-600">{segment.departure.city}</div>
                              <div className="text-sm font-medium">
                                {new Date(segment.departure.time).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                              <div className="flex items-center gap-2 text-gray-600">
                                <div className="h-px bg-gray-300 flex-1"></div>
                                <Plane className="h-5 w-5" />
                                <div className="text-sm">{formatDuration(segment.duration)}</div>
                                <div className="h-px bg-gray-300 flex-1"></div>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-lg">{segment.arrival.airport}</div>
                              <div className="text-sm text-gray-600">{segment.arrival.city}</div>
                              <div className="text-sm font-medium">
                                {new Date(segment.arrival.time).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {index < flight.itinerary.outbound.length - 1 &&
                          segment.layoverDuration && (
                            <div className="ml-8 mt-2">
                              <div className="bg-gradient-to-r from-[#662046]/10 to-[#8B4513]/10 rounded-lg p-4 border border-[#662046]/20">
                                <div className="flex items-center gap-3 mb-3">
                                  <Clock className="h-5 w-5 text-[#662046]" />
                                  <span className="font-semibold text-[#662046]">
                                    {formatDuration(segment.layoverDuration)} layover in{" "}
                                    {segment.arrival.city}
                                  </span>
                                </div>

                                {flight.layoverInfo.cities.map((city) => (
                                  <div key={city.code} className="flex items-center gap-4">
                                    <img
                                      src={city.image || "/placeholder.svg"}
                                      alt={city.name}
                                      className="w-16 h-16 rounded-lg object-cover"
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {city.name}, {city.country}
                                      </div>
                                      <div className="text-sm text-gray-600 mb-2">
                                        {city.experiences.length} experiences available
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-[#662046] text-[#662046] bg-transparent"
                                        >
                                          <Eye className="h-4 w-4 mr-1" />
                                          View Experiences
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-[#662046] text-[#662046] bg-transparent"
                                        >
                                          <Heart className="h-4 w-4 mr-1" />
                                          Save Itinerary
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => toggleFlightExpansion(flight.id)}
                      className="border-[#662046] text-[#662046]"
                    >
                      {expandedFlights.has(flight.id) ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show Details
                        </>
                      )}
                    </Button>
                    <Button className="bg-gradient-to-r from-[#662046] to-[#8B4513] hover:from-[#662046]/90 hover:to-[#8B4513]/90 text-white">
                      Select Flight
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="experiences" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularLayoverCities.flatMap((city) =>
                city.experiences.map((experience) => (
                  <Card key={experience.id} className="border-[#662046]/20">
                    <CardContent className="p-4">
                      <img
                        src={experience.image || "/placeholder.svg"}
                        alt={experience.title}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                      <h3 className="font-semibold text-[#662046] mb-2">{experience.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{experience.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {formatDuration(experience.duration)} • ${experience.price}
                        </div>
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Star className="h-4 w-4 fill-current" />
                          {experience.rating}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )),
              )}
            </div>
          </TabsContent>

          <TabsContent value="hotels" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults
                .flatMap((flight) => flight.hotelOptions || [])
                .map((hotel) => (
                  <Card key={hotel.id} className="border-[#662046]/20">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img
                          src={hotel.image || "/placeholder.svg"}
                          alt={hotel.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#662046] mb-1">{hotel.name}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Star className="h-4 w-4 fill-current" />
                              {hotel.rating}
                            </div>
                            <span className="text-sm text-gray-600">• ${hotel.price}/night</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {hotel.amenities.map((amenity, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            className="bg-[#662046] hover:bg-[#662046]/90 text-white"
                          >
                            Book Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="visas" className="space-y-4">
            {searchResults
              .flatMap((flight) => flight.visaRequirements || [])
              .map((visa, index) => (
                <Card key={index} className="border-[#662046]/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-[#662046] text-lg">{visa.country}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {visa.required ? (
                            <Badge variant="destructive">Visa Required</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Visa Free
                            </Badge>
                          )}
                          {visa.transitVisa && (
                            <Badge variant="outline">Transit Visa Available</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Max Stay</div>
                        <div className="font-medium">{visa.maxStayHours}h</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {visa.requirements.map((req, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-[#662046] rounded-full"></div>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t">
                        <div>
                          <div className="text-sm text-gray-600">Processing Time</div>
                          <div className="font-medium">{visa.processingTime}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Fee</div>
                          <div className="font-medium">${visa.fee}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
