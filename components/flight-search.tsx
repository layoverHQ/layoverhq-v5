"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  MapPin,
  Users,
  Plane,
  Clock,
  Star,
  DollarSign,
  Filter,
  Wifi,
  Zap,
  Award,
  Eye,
  Heart,
  ExternalLink,
  Camera,
  Utensils,
  Navigation,
  ArrowLeftRight,
  Globe,
  Shuffle,
} from "lucide-react"
import { BookingFlow } from "./booking-flow"

interface FlightSearchProps {
  onSearch?: (params: FlightSearchParams) => void
  loading?: boolean
}

interface FlightSearchParams {
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
  preferLayovers: boolean
  maxPrice?: number
  maxConnections?: number
  searchMode?: "roundtrip" | "oneway" | "multicity" | "flexible"
}

interface FlightResult {
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
  layoverInfo?: {
    cities: string[]
    totalDuration: number
    longestLayover: number
  }
  layovers: LayoverInfo[]
  airline: {
    code: string
    name: string
  }
  duration: {
    outbound: string
    inbound?: string
  }
  canMixMatch?: boolean
  outboundOnly?: boolean
  inboundOnly?: boolean
}

interface LayoverInfo {
  airport: string
  city: string
  country: string
  duration: number
  arrival: string
  departure: string
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

export function FlightSearch({ onSearch, loading = false }: FlightSearchProps) {
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
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
    preferLayovers: true,
    maxConnections: 2,
    searchMode: "roundtrip",
  })

  const [tripType, setTripType] = useState<"oneway" | "roundtrip" | "multicity" | "flexible">(
    "roundtrip",
  )
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [flightResults, setFlightResults] = useState<FlightResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [showAllFlights, setShowAllFlights] = useState(false)
  const [sortBy, setSortBy] = useState<"price" | "duration" | "score">("score")
  const [selectedFlightForBooking, setSelectedFlightForBooking] = useState<FlightResult | null>(
    null,
  )
  const [showBookingFlow, setShowBookingFlow] = useState(false)

  const [selectedOutbound, setSelectedOutbound] = useState<FlightResult | null>(null)
  const [selectedInbound, setSelectedInbound] = useState<FlightResult | null>(null)
  const [mixMatchMode, setMixMatchMode] = useState(false)
  const [showOutboundOnly, setShowOutboundOnly] = useState(false)
  const [showInboundOnly, setShowInboundOnly] = useState(false)

  const getAirlineName = (airlineCode: string) => {
    if (!airlineCode || airlineCode === "undefined" || airlineCode === "null") {
      return "Unknown Airline"
    }

    const airlineNames: Record<string, string> = {
      QR: "Qatar Airways",
      EK: "Emirates",
      TK: "Turkish Airlines",
      LH: "Lufthansa",
      AF: "Air France",
      BA: "British Airways",
      DL: "Delta Air Lines",
      AA: "American Airlines",
      UA: "United Airlines",
      KL: "KLM Royal Dutch Airlines",
      SV: "Saudi Arabian Airlines",
      ET: "Ethiopian Airlines",
      MS: "EgyptAir",
      AT: "Royal Air Maroc",
      UL: "SriLankan Airlines",
      PK: "Pakistan International Airlines",
      AI: "Air India",
      "9W": "Jet Airways",
      "6E": "IndiGo",
      SG: "SpiceJet",
      WN: "Southwest Airlines",
      B6: "JetBlue Airways",
      AS: "Alaska Airlines",
      F9: "Frontier Airlines",
      NK: "Spirit Airlines",
      AC: "Air Canada",
      WS: "WestJet",
      AM: "Aeroméxico",
      CM: "Copa Airlines",
      AV: "Avianca",
      LA: "LATAM Airlines",
      AR: "Aerolíneas Argentinas",
      JJ: "TAM Airlines",
      G3: "Gol Transportes Aéreos",
      AD: "Azul Brazilian Airlines",
      TP: "TAP Air Portugal",
      IB: "Iberia",
      VY: "Vueling",
      FR: "Ryanair",
      U2: "easyJet",
      LX: "Swiss International Air Lines",
      OS: "Austrian Airlines",
      SN: "Brussels Airlines",
      SK: "Scandinavian Airlines",
      AY: "Finnair",
      DY: "Norwegian Air",
      WF: "Widerøe",
      CZ: "China Southern Airlines",
      CA: "Air China",
      MU: "China Eastern Airlines",
      HU: "Hainan Airlines",
      NH: "All Nippon Airways",
      JL: "Japan Airlines",
      OZ: "Asiana Airlines",
      KE: "Korean Air",
      CI: "China Airlines",
      BR: "EVA Air",
      TG: "Thai Airways",
      SQ: "Singapore Airlines",
      MH: "Malaysia Airlines",
      GA: "Garuda Indonesia",
      PR: "Philippine Airlines",
      VN: "Vietnam Airlines",
      BL: "Jetstar Pacific Airlines",
      QF: "Qantas",
      JQ: "Jetstar Airways",
      VA: "Virgin Australia",
      NZ: "Air New Zealand",
      FJ: "Fiji Airways",
      PX: "Air Niugini",
      IE: "Solomon Airlines",
      SB: "Air Caledonie",
      TX: "Air Caraibes",
      TO: "Transavia France",
      HV: "Transavia",
      PC: "Pegasus Airlines",
      XQ: "SunExpress",
      TU: "Tunisair",
      AH: "Air Algérie",
      BJ: "Nouvelair",
      FB: "Bulgaria Air",
      RO: "Tarom",
      JU: "Air Serbia",
      OU: "Croatia Airlines",
      JP: "Adria Airways",
      YM: "Montenegro Airlines",
    }
    return airlineNames[airlineCode] || `${airlineCode} Airlines`
  }

  const getAircraftName = (aircraftCode: string) => {
    if (
      !aircraftCode ||
      aircraftCode === "undefined" ||
      aircraftCode === "null" ||
      aircraftCode === "NaNh NaNm"
    ) {
      return "Commercial Aircraft"
    }

    const aircraftNames: Record<string, string> = {
      "32A": "Airbus A320",
      "32B": "Airbus A321",
      "32S": "Airbus A318",
      "319": "Airbus A319",
      "320": "Airbus A320",
      "321": "Airbus A321",
      "332": "Airbus A330-200",
      "333": "Airbus A330-300",
      "338": "Airbus A330-800neo",
      "339": "Airbus A330-900neo",
      "342": "Airbus A340-200",
      "343": "Airbus A340-300",
      "345": "Airbus A340-500",
      "346": "Airbus A340-600",
      "350": "Airbus A350-900",
      "351": "Airbus A350-1000",
      "359": "Airbus A350-900",
      "380": "Airbus A380-800",
      "388": "Airbus A380-800",
      "737": "Boeing 737",
      "738": "Boeing 737-800",
      "739": "Boeing 737-900",
      "73G": "Boeing 737-700",
      "73H": "Boeing 737-800",
      "73J": "Boeing 737-900",
      "744": "Boeing 747-400",
      "748": "Boeing 747-8",
      "74F": "Boeing 747-8F",
      "752": "Boeing 757-200",
      "753": "Boeing 757-300",
      "762": "Boeing 767-200",
      "763": "Boeing 767-300",
      "764": "Boeing 767-400",
      "772": "Boeing 777-200",
      "773": "Boeing 777-300",
      "77L": "Boeing 777-200LR",
      "77W": "Boeing 777-300ER",
      "787": "Boeing 787 Dreamliner",
      "788": "Boeing 787-8",
      "789": "Boeing 787-9",
      "78J": "Boeing 787-10",
      E70: "Embraer E-Jet E170",
      E75: "Embraer E-Jet E175",
      E90: "Embraer E-Jet E190",
      ER3: "Embraer ERJ 135",
      ER4: "Embraer ERJ 145",
      ERD: "Embraer ERJ 140",
      CRJ: "Bombardier CRJ",
      CR2: "Bombardier CRJ-200",
      CR7: "Bombardier CRJ-700",
      CR9: "Bombardier CRJ-900",
      DH4: "De Havilland Dash 8-400",
    }
    return aircraftNames[aircraftCode] || aircraftCode || "Commercial Aircraft"
  }

  const getCityExplorationInfo = (cityCode: string, layoverDuration: number) => {
    const cityData: Record<string, any> = {
      DOH: {
        name: "Doha",
        country: "Qatar",
        image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=400&h=200&fit=crop",
        minExploreTime: 180,
        highlights: ["Museum of Islamic Art", "Souq Waqif", "The Pearl-Qatar"],
        transport: "Free shuttle to city (45 min)",
        tips: "Qatar offers free transit visas for layovers over 5 hours",
      },
      DXB: {
        name: "Dubai",
        country: "UAE",
        image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=200&fit=crop",
        minExploreTime: 240,
        highlights: ["Burj Khalifa", "Dubai Mall", "Gold Souk"],
        transport: "Metro to city center (1 hour)",
        tips: "Free 96-hour transit visa available",
      },
      IST: {
        name: "Istanbul",
        country: "Turkey",
        image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&h=200&fit=crop",
        minExploreTime: 360,
        highlights: ["Hagia Sophia", "Blue Mosque", "Grand Bazaar"],
        transport: "Airport shuttle + tram (1.5 hours)",
        tips: "Free TourIstanbul service for layovers over 6 hours",
      },
      FRA: {
        name: "Frankfurt",
        country: "Germany",
        image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=200&fit=crop",
        minExploreTime: 300,
        highlights: ["Römerberg Square", "Main River", "Städel Museum"],
        transport: "S-Bahn to city (15 min)",
        tips: "Compact city center perfect for short layovers",
      },
      AMS: {
        name: "Amsterdam",
        country: "Netherlands",
        image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=200&fit=crop",
        minExploreTime: 240,
        highlights: ["Canal District", "Van Gogh Museum", "Vondelpark"],
        transport: "Train to Central Station (20 min)",
        tips: "Bike rentals available at the airport",
      },
      CDG: {
        name: "Paris",
        country: "France",
        image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=200&fit=crop",
        minExploreTime: 360,
        highlights: ["Eiffel Tower", "Louvre Museum", "Champs-Élysées"],
        transport: "RER B to city center (45 min)",
        tips: "Consider Seine river cruise for quick sightseeing",
      },
    }

    const defaultCity = {
      name: cityCode,
      country: "Unknown",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop",
      minExploreTime: 180,
      highlights: ["City Center", "Local Markets", "Cultural Sites"],
      transport: "Public transport available",
      tips: "Check visa requirements for your nationality",
    }

    return cityData[cityCode] || defaultCity
  }

  const handleViewDetails = (flightId: string) => {
    console.log("[v0] View details clicked for flight:", flightId)
    // TODO: Implement flight details modal or navigation
    alert(`Viewing details for flight ${flightId}`)
  }

  const handleSelectFlight = (flightId: string) => {
    console.log("[v0] Select flight clicked for flight:", flightId)
    const flight = flightResults.find((f) => f.id === flightId)
    if (flight) {
      setSelectedFlightForBooking(flight)
      setShowBookingFlow(true)
    }
  }

  const handleBookingComplete = (bookingData: any) => {
    console.log("[v0] Booking completed:", bookingData)
    setShowBookingFlow(false)
    setSelectedFlightForBooking(null)
    // Here you would typically redirect to a confirmation page or show success message
    alert(`Booking confirmed! Reference: ${bookingData.bookingReference}`)
  }

  const handleBackToResults = () => {
    setShowBookingFlow(false)
    setSelectedFlightForBooking(null)
  }

  const handleCityGuide = (cityCode: string) => {
    console.log("[v0] City guide clicked for:", cityCode)
    // TODO: Implement city guide modal or external link
    window.open(`https://www.google.com/search?q=${cityCode}+city+guide+layover`, "_blank")
  }

  const handleSaveItinerary = (flightId: string, cityCode: string) => {
    console.log("[v0] Save itinerary clicked for flight:", flightId, "city:", cityCode)
    // TODO: Implement save to user favorites
    alert(`Saved ${cityCode} layover itinerary for flight ${flightId}`)
  }

  const calculateFlightScore = (flight: FlightResult) => {
    try {
      // Ensure we have valid price data
      const price = flight?.price?.total || 0
      if (!price || isNaN(price)) return 5 // Default score for invalid price

      // Price factor (lower price = higher score)
      const priceScore = Math.max(0, Math.min(10, 10 - price / 200))

      // Duration factor (shorter total duration = higher score)
      const outboundDuration =
        flight?.itinerary?.outbound?.reduce((sum, seg) => sum + (seg?.duration || 0), 0) || 0
      const inboundDuration =
        flight?.itinerary?.inbound?.reduce((sum, seg) => sum + (seg?.duration || 0), 0) || 0
      const totalDuration = outboundDuration + inboundDuration
      const durationScore = Math.max(0, Math.min(10, 10 - totalDuration / 120))

      // Layover factor (prefer reasonable layovers for LayoverHQ)
      let layoverScore = 5
      if (flight?.layoverInfo?.longestLayover) {
        const longestLayover = flight.layoverInfo.longestLayover
        if (longestLayover >= 120 && longestLayover <= 480) {
          layoverScore = 8 // Sweet spot for layover exploration
        } else if (longestLayover > 480) {
          layoverScore = 6 // Too long
        } else if (longestLayover < 60) {
          layoverScore = 4 // Too short
        }
      }

      const finalScore = Math.round(priceScore * 0.4 + durationScore * 0.3 + layoverScore * 0.3)
      return Math.max(1, Math.min(10, finalScore)) // Ensure score is between 1-10
    } catch (error) {
      console.error("[v0] Error calculating flight score:", error)
      return 5 // Default score on error
    }
  }

  const getAirlineLogo = (airlineCode: string) => {
    // Use a reliable airline logo service instead of placeholder.svg
    return `https://images.kiwi.com/airlines/64x64/${airlineCode.toLowerCase()}.png`
  }

  const getAirportFlag = (countryCode: string) => {
    // Use a reliable flag service
    return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`
  }

  const getFlightAmenities = (segment: FlightSegment) => {
    const amenities = []

    try {
      // Premium airlines typically have WiFi
      const airlineCode = segment?.airline?.code
      if (airlineCode && ["EK", "QR", "TK", "LH", "AF", "BA", "DL", "AA"].includes(airlineCode)) {
        amenities.push({ icon: Wifi, label: "WiFi" })
      }

      // Long-haul flights typically have entertainment
      const duration = segment?.duration || 0
      if (duration > 360) {
        amenities.push({ icon: Award, label: "Entertainment" })
      }

      // Modern aircraft have charging
      const aircraftName = segment?.aircraft?.name || segment?.aircraft?.code || ""
      if (
        aircraftName &&
        (aircraftName.includes("787") ||
          aircraftName.includes("A350") ||
          aircraftName.includes("A380") ||
          aircraftName.includes("777"))
      ) {
        amenities.push({ icon: Zap, label: "Power" })
      }
    } catch (error) {
      console.error("[v0] Error getting flight amenities:", error)
    }

    return amenities
  }

  const formatTimeWithTimezone = (timeString: string, timezone?: string) => {
    try {
      const date = new Date(timeString)
      const time = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      const dayOffset = Math.floor((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      const dayIndicator = dayOffset > 0 ? ` +${dayOffset}` : dayOffset < 0 ? ` ${dayOffset}` : ""
      return `${time}${dayIndicator}`
    } catch {
      return timeString
    }
  }

  const calculateLayoverDuration = (segments: FlightSegment[]) => {
    const layovers = []
    for (let i = 0; i < segments.length - 1; i++) {
      const arrivalTime = new Date(segments[i].arrival.time)
      const departureTime = new Date(segments[i + 1].departure.time)
      const layoverMinutes = Math.floor(
        (departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60),
      )
      layovers.push({
        city: segments[i].arrival.city,
        airport: segments[i].arrival.airport,
        duration: layoverMinutes,
      })
    }
    return layovers
  }

  const sortedFlights = [...flightResults].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return a.price.total - b.price.total
      case "duration":
        const aDuration = a.itinerary.outbound.reduce((sum, seg) => sum + seg.duration, 0)
        const bDuration = b.itinerary.outbound.reduce((sum, seg) => sum + seg.duration, 0)
        return aDuration - bDuration
      case "score":
      default:
        return calculateFlightScore(b) - calculateFlightScore(a)
    }
  })

  const displayedFlights = showAllFlights ? sortedFlights : sortedFlights.slice(0, 10)

  const handleSearch = async () => {
    if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
      return
    }

    const params = {
      ...searchParams,
      returnDate: tripType === "roundtrip" ? searchParams.returnDate : undefined,
    }

    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)
    setFlightResults([]) // Clear previous results immediately for better UX
    console.log("[v0] Flight search initiated:", params)

    try {
      const response = await fetch("/api/v1/flights/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      let result
      try {
        const text = await response.text()
        result = JSON.parse(text)
        console.log("[v0] Flight search results:", result)
      } catch (parseError) {
        console.error("[v0] Failed to parse response as JSON:", parseError)
        throw new Error("Server returned invalid JSON response")
      }

      if (result.success && result.data?.flights) {
        setFlightResults(result.data.flights)
        console.log(`[v0] Found ${result.data.flights.length} flights!`)
      } else {
        setSearchError(result.error || "Failed to search flights")
        setFlightResults([])
      }
    } catch (error) {
      console.error("[v0] Flight search error:", error)
      setSearchError(
        error instanceof Error ? error.message : "Network error occurred while searching flights",
      )
      setFlightResults([])
    } finally {
      setIsSearching(false)
    }

    onSearch?.(params)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatPrice = (price: FlightResult["price"]) => {
    return `${price.currency} ${price.total.toFixed(2)}`
  }

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    } catch {
      return timeString
    }
  }

  const updatePassengers = (type: keyof typeof searchParams.passengers, value: number) => {
    setSearchParams((prev) => ({
      ...prev,
      passengers: {
        ...prev.passengers,
        [type]: Math.max(0, value),
      },
    }))
  }

  const totalPassengers =
    searchParams.passengers.adults +
    searchParams.passengers.children +
    searchParams.passengers.infants

  const getLayoverCityInfo = (cityName: string, duration: number) => {
    const cityGuides = {
      Doha: {
        highlights: ["Museum of Islamic Art", "Souq Waqif", "The Pearl-Qatar"],
        cuisine: "Middle Eastern & International",
        transport: "Free shuttle to city (45min)",
        minTime: 180,
        rating: 4.8,
        image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&h=200&fit=crop",
        tips: "Free city tour available for 5+ hour layovers",
      },
      Frankfurt: {
        highlights: ["Römerberg Square", "Main Tower", "Städel Museum"],
        cuisine: "German Traditional & European",
        transport: "S-Bahn to city center (15min)",
        minTime: 240,
        rating: 4.6,
        image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=200&fit=crop",
        tips: "Airport has sleeping pods and shower facilities",
      },
      Dubai: {
        highlights: ["Burj Khalifa", "Dubai Mall", "Gold Souk"],
        cuisine: "International & Middle Eastern",
        transport: "Metro to city center (30min)",
        minTime: 300,
        rating: 4.9,
        image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=200&fit=crop",
        tips: "Free WiFi, sleeping areas, and transit hotel available",
      },
      Istanbul: {
        highlights: ["Hagia Sophia", "Grand Bazaar", "Bosphorus"],
        cuisine: "Turkish & Mediterranean",
        transport: "Metro to Sultanahmet (45min)",
        minTime: 360,
        rating: 4.7,
        image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&h=200&fit=crop",
        tips: "Free city tour for 6+ hour layovers",
      },
      Amsterdam: {
        highlights: ["Anne Frank House", "Van Gogh Museum", "Canals"],
        cuisine: "Dutch & International",
        transport: "Train to Central Station (20min)",
        minTime: 240,
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=200&fit=crop",
        tips: "Luggage storage available at Central Station",
      },
    }

    return (
      cityGuides[cityName as keyof typeof cityGuides] || {
        highlights: ["City Center", "Local Markets", "Cultural Sites"],
        cuisine: "Local Specialties",
        transport: "Public transport available",
        minTime: 180,
        rating: 4.0,
        image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=200&fit=crop",
        tips: "Check visa requirements for city exploration",
      }
    )
  }

  const handleSelectOutbound = (flight: FlightResult) => {
    setSelectedOutbound(flight)
    console.log("[v0] Selected outbound flight:", flight.id)
    if (tripType === "oneway") {
      setSelectedFlightForBooking(flight)
      setShowBookingFlow(true)
    }
  }

  const handleSelectInbound = (flight: FlightResult) => {
    setSelectedInbound(flight)
    console.log("[v0] Selected inbound flight:", flight.id)
  }

  const handleCombineFlights = () => {
    if (selectedOutbound && selectedInbound) {
      const combinedFlight: FlightResult = {
        id: `combined_${selectedOutbound.id}_${selectedInbound.id}`,
        source: "combined",
        price: {
          total: selectedOutbound.price.total + selectedInbound.price.total,
          currency: selectedOutbound.price.currency,
          base: selectedOutbound.price.base + selectedInbound.price.base,
          taxes: selectedOutbound.price.taxes + selectedInbound.price.taxes,
        },
        itinerary: {
          outbound: selectedOutbound.itinerary.outbound,
          inbound: selectedInbound.itinerary.outbound, // Use outbound from inbound flight
        },
        layovers: [...(selectedOutbound.layovers || []), ...(selectedInbound.layovers || [])],
        airline: selectedOutbound.airline,
        duration: {
          outbound: selectedOutbound.duration.outbound,
          inbound: selectedInbound.duration.outbound || selectedInbound.duration.inbound,
        },
      }
      setSelectedFlightForBooking(combinedFlight)
      setShowBookingFlow(true)
    }
  }

  const handleToggleMixMatch = () => {
    setMixMatchMode(!mixMatchMode)
    setSelectedOutbound(null)
    setSelectedInbound(null)
    setShowOutboundOnly(false)
    setShowInboundOnly(false)
  }

  if (showBookingFlow && selectedFlightForBooking) {
    return (
      <BookingFlow
        selectedFlight={selectedFlightForBooking as any}
        onBack={handleBackToResults}
        onComplete={handleBookingComplete}
      />
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="bg-card border-border shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl font-serif text-card-foreground flex items-center gap-2">
                <Plane className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                Find Your Perfect Layover Flight
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm sm:text-base">
                Discover amazing layover experiences while traveling to your destination
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className="bg-accent text-accent-foreground self-start sm:self-center"
            >
              <Star className="h-3 w-3 mr-1" />
              Layover Optimized
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={tripType === "oneway" ? "default" : "outline"}
              onClick={() => setTripType("oneway")}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              One Way
            </Button>
            <Button
              variant={tripType === "roundtrip" ? "default" : "outline"}
              onClick={() => setTripType("roundtrip")}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Round Trip
            </Button>
            <Button
              variant={tripType === "multicity" ? "default" : "outline"}
              onClick={() => setTripType("multicity")}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Globe className="h-4 w-4 mr-1" />
              Multi-City
            </Button>
            <Button
              variant={tripType === "flexible" ? "default" : "outline"}
              onClick={() => setTripType("flexible")}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Flexible Dates
            </Button>
          </div>

          {tripType === "roundtrip" && (
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg border border-accent/20">
              <div className="flex items-center gap-3">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                <div>
                  <Label className="text-sm font-medium text-foreground">Mix & Match Flights</Label>
                  <p className="text-xs text-muted-foreground">
                    Select different airlines for outbound and return
                  </p>
                </div>
              </div>
              <Switch checked={mixMatchMode} onCheckedChange={handleToggleMixMatch} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Origin */}
            <div className="space-y-2">
              <Label htmlFor="origin" className="text-sm font-medium text-foreground">
                From
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="origin"
                  placeholder="Origin city or airport"
                  value={searchParams.origin}
                  onChange={(e) => setSearchParams((prev) => ({ ...prev, origin: e.target.value }))}
                  className="pl-10 bg-input border-border"
                />
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label htmlFor="destination" className="text-sm font-medium text-foreground">
                To
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="destination"
                  placeholder="Destination city or airport"
                  value={searchParams.destination}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, destination: e.target.value }))
                  }
                  className="pl-10 bg-input border-border"
                />
              </div>
            </div>

            {/* Departure Date */}
            <div className="space-y-2">
              <Label htmlFor="departure" className="text-sm font-medium text-foreground">
                Departure
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="departure"
                  type="date"
                  value={searchParams.departureDate}
                  onChange={(e) =>
                    setSearchParams((prev) => ({ ...prev, departureDate: e.target.value }))
                  }
                  className="pl-10 bg-input border-border"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {/* Return Date */}
            {tripType === "roundtrip" && (
              <div className="space-y-2">
                <Label htmlFor="return" className="text-sm font-medium text-foreground">
                  Return
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="return"
                    type="date"
                    value={searchParams.returnDate}
                    onChange={(e) =>
                      setSearchParams((prev) => ({ ...prev, returnDate: e.target.value }))
                    }
                    className="pl-10 bg-input border-border"
                    min={searchParams.departureDate || new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Passengers</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 border border-border rounded-md bg-input">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">Adults</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updatePassengers("adults", searchParams.passengers.adults - 1)
                        }
                        disabled={searchParams.passengers.adults <= 1}
                        className="h-6 w-6 p-0"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {searchParams.passengers.adults}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updatePassengers("adults", searchParams.passengers.adults + 1)
                        }
                        className="h-6 w-6 p-0"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">Children</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updatePassengers("children", searchParams.passengers.children - 1)
                        }
                        disabled={searchParams.passengers.children <= 0}
                        className="h-6 w-6 p-0"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {searchParams.passengers.children}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updatePassengers("children", searchParams.passengers.children + 1)
                        }
                        className="h-6 w-6 p-0"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">Infants</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updatePassengers("infants", searchParams.passengers.infants - 1)
                        }
                        disabled={searchParams.passengers.infants <= 0}
                        className="h-6 w-6 p-0"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center text-sm">
                        {searchParams.passengers.infants}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updatePassengers("infants", searchParams.passengers.infants + 1)
                        }
                        className="h-6 w-6 p-0"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Cabin Class */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Cabin Class</Label>
              <Select
                value={searchParams.cabinClass}
                onValueChange={(value) =>
                  setSearchParams((prev) => ({ ...prev, cabinClass: value }))
                }
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="premium_economy">Premium Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Layover Preference */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <Label className="text-sm font-medium text-foreground">
                  Prefer flights with layovers
                </Label>
                <p className="text-xs text-muted-foreground">
                  Find flights with interesting layover destinations
                </p>
              </div>
            </div>
            <Switch
              checked={searchParams.preferLayovers}
              onCheckedChange={(checked) =>
                setSearchParams((prev) => ({ ...prev, preferLayovers: checked }))
              }
            />
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-primary hover:text-primary/80"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvanced ? "Hide" : "Show"} Advanced Options
            </Button>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg border border-border">
                <div className="space-y-2">
                  <Label htmlFor="maxPrice" className="text-sm font-medium text-foreground">
                    Max Price (USD)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="maxPrice"
                      type="number"
                      placeholder="No limit"
                      value={searchParams.maxPrice || ""}
                      onChange={(e) =>
                        setSearchParams((prev) => ({
                          ...prev,
                          maxPrice: e.target.value ? Number.parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="pl-10 bg-input border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Max Connections</Label>
                  <Select
                    value={searchParams.maxConnections?.toString() || "2"}
                    onValueChange={(value) =>
                      setSearchParams((prev) => ({
                        ...prev,
                        maxConnections: Number.parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Direct flights only</SelectItem>
                      <SelectItem value="1">Up to 1 stop</SelectItem>
                      <SelectItem value="2">Up to 2 stops</SelectItem>
                      <SelectItem value="3">Up to 3 stops</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-border" />

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={
              isSearching ||
              !searchParams.origin ||
              !searchParams.destination ||
              !searchParams.departureDate
            }
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-base sm:text-lg font-medium"
          >
            {isSearching ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                Searching flights...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Search {totalPassengers} passenger{totalPassengers !== 1 ? "s" : ""} •{" "}
                {tripType === "roundtrip" ? "Round trip" : "One way"}
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {hasSearched && (
        <Card className="bg-gradient-to-br from-card/95 to-background/90 backdrop-blur-sm border-border/60 shadow-2xl">
          <CardHeader className="pb-6 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-serif text-card-foreground flex items-center gap-2">
                  <Plane className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  Flight Results
                </CardTitle>
                {flightResults.length > 0 && (
                  <CardDescription className="text-muted-foreground">
                    Found {flightResults.length} flights from {searchParams.origin} to{" "}
                    {searchParams.destination}
                  </CardDescription>
                )}
              </div>

              {flightResults.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Sort by:</Label>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-32 bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="score">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Best Score
                          </div>
                        </SelectItem>
                        <SelectItem value="price">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Price
                          </div>
                        </SelectItem>
                        <SelectItem value="duration">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Duration
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    {flightResults.length} Options
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {isSearching && (
              <div className="text-center py-16">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-6"></div>
                  <Plane className="h-6 w-6 text-primary absolute top-5 left-1/2 transform -translate-x-1/2" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">
                  Searching for the best flights...
                </h3>
                <p className="text-muted-foreground mb-4">
                  We're comparing prices across multiple airlines
                </p>
                <div className="flex justify-center items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-pulse">🔍 Checking availability</div>
                  <div className="animate-pulse delay-300">💰 Comparing prices</div>
                  <div className="animate-pulse delay-700">✈️ Finding layovers</div>
                </div>
              </div>
            )}

            {searchError && (
              <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-destructive"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Search Error</h4>
                    <p className="text-sm mt-1">{searchError}</p>
                  </div>
                </div>
              </div>
            )}

            {flightResults.length === 0 && !searchError && !isSearching && hasSearched && (
              <div className="text-center py-16">
                <div className="p-4 bg-muted/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Plane className="h-10 w-10 text-muted-foreground/60" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">
                  No flights found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search parameters or dates
                </p>
                <Button variant="outline" onClick={() => setHasSearched(false)} className="mt-2">
                  Modify Search
                </Button>
              </div>
            )}

            {flightResults.length > 0 && (
              <div className="space-y-6 sm:space-y-8">
                {mixMatchMode && tripType === "roundtrip" && (
                  <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Shuffle className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="font-semibold text-foreground">Mix & Match Mode</h3>
                            <p className="text-sm text-muted-foreground">
                              {selectedOutbound ? "✓ Outbound selected" : "Select outbound flight"}{" "}
                              •{selectedInbound ? " ✓ Return selected" : " Select return flight"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowOutboundOnly(!showOutboundOnly)}
                            className={showOutboundOnly ? "bg-primary/10" : ""}
                          >
                            Outbound Only
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowInboundOnly(!showInboundOnly)}
                            className={showInboundOnly ? "bg-primary/10" : ""}
                          >
                            Return Only
                          </Button>
                          {selectedOutbound && selectedInbound && (
                            <Button
                              onClick={handleCombineFlights}
                              className="bg-gradient-to-r from-primary to-accent text-white"
                            >
                              Book Combined ($
                              {(
                                selectedOutbound.price.total + selectedInbound.price.total
                              ).toLocaleString()}
                              )
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {displayedFlights.map((flight, index) => {
                  const flightScore = calculateFlightScore(flight)
                  const outboundLayovers = calculateLayoverDuration(flight.itinerary.outbound)
                  const inboundLayovers = flight.itinerary.inbound
                    ? calculateLayoverDuration(flight.itinerary.inbound)
                    : []

                  if (mixMatchMode && showOutboundOnly && flight.itinerary.inbound) return null
                  if (mixMatchMode && showInboundOnly && !flight.itinerary.inbound) return null

                  return (
                    <Card
                      key={flight.id}
                      className={`border-2 transition-all duration-500 bg-gradient-to-br from-card/95 to-background/80 backdrop-blur-sm overflow-hidden group relative ${
                        mixMatchMode
                          ? selectedOutbound?.id === flight.id || selectedInbound?.id === flight.id
                            ? "border-primary/80 shadow-2xl ring-2 ring-primary/20"
                            : "border-border/40 hover:border-primary/60 hover:shadow-xl"
                          : "border-border/40 hover:border-primary/60 hover:shadow-2xl"
                      }`}
                    >
                      {index < 3 && !mixMatchMode && (
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-primary to-accent text-white px-3 sm:px-4 py-1 text-xs font-semibold rounded-bl-lg">
                          {index === 0
                            ? "🏆 BEST CHOICE"
                            : index === 1
                              ? "💰 GREAT VALUE"
                              : "⚡ FAST OPTION"}
                        </div>
                      )}

                      <CardContent className="p-4 sm:p-6 lg:p-8">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 mb-6 lg:mb-8">
                          <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto">
                            <div className="relative flex-shrink-0">
                              <img
                                src={getAirlineLogo(
                                  flight.itinerary.outbound[0]?.airline?.code || "XX",
                                )}
                                alt={getAirlineName(
                                  flight.itinerary.outbound[0]?.airline?.code || "XX",
                                )}
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-contain bg-white p-2 shadow-lg border border-border/20"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = `data:image/svg+xml,${encodeURIComponent(`
                                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                                  </svg>
                                `)}`
                                  target.className =
                                    "w-12 h-12 sm:w-16 sm:h-16 rounded-xl p-3 bg-muted text-muted-foreground"
                                }}
                              />
                              <Badge className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-gradient-to-r from-primary to-accent text-white text-xs sm:text-sm px-2 sm:px-3 py-1 shadow-lg">
                                {flightScore}/10
                              </Badge>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold text-lg sm:text-xl lg:text-2xl text-card-foreground mb-1 truncate">
                                {getAirlineName(
                                  flight.itinerary.outbound[0]?.airline?.code || "XX",
                                )}
                              </h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <p className="text-muted-foreground text-sm">
                                  {flight.itinerary.outbound[0]?.airline?.code || "XX"} •{" "}
                                  {flight.source}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getFlightAmenities(flight.itinerary.outbound[0]).map(
                                    (amenity, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="text-xs border-primary/30 text-primary"
                                      >
                                        <amenity.icon className="h-3 w-3 mr-1" />
                                        {amenity.label}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-left lg:text-right w-full lg:w-auto">
                            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                              ${flight.price.total.toLocaleString()}
                            </div>
                            <p className="text-muted-foreground mb-3 text-sm sm:text-base">
                              {flight.price.currency} • per person
                            </p>
                            <div className="flex gap-2">
                              {mixMatchMode ? (
                                <div className="flex gap-2">
                                  {!flight.itinerary.inbound ? (
                                    <Button
                                      size="sm"
                                      onClick={() => handleSelectOutbound(flight)}
                                      className={`${
                                        selectedOutbound?.id === flight.id
                                          ? "bg-primary text-white"
                                          : "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                                      } shadow-lg`}
                                    >
                                      {selectedOutbound?.id === flight.id
                                        ? "✓ Selected"
                                        : "Select Outbound"}
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => handleSelectOutbound(flight)}
                                        className={`${
                                          selectedOutbound?.id === flight.id
                                            ? "bg-primary text-white"
                                            : "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                                        } shadow-lg`}
                                      >
                                        {selectedOutbound?.id === flight.id
                                          ? "✓ Outbound"
                                          : "Select Outbound"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleSelectInbound(flight)}
                                        className={`${
                                          selectedInbound?.id === flight.id
                                            ? "bg-secondary text-white"
                                            : "bg-gradient-to-r from-secondary to-accent hover:from-secondary/90 hover:to-accent/90 text-white"
                                        } shadow-lg`}
                                      >
                                        {selectedInbound?.id === flight.id
                                          ? "✓ Return"
                                          : "Select Return"}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(flight.id)}
                                    className="border-primary/30 text-primary hover:bg-primary/10 bg-transparent"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Details
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSelectFlight(flight.id)}
                                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg"
                                  >
                                    Select Flight
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary"></div>
                            <span className="text-sm font-semibold text-foreground">
                              Outbound Journey
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {formatDuration(
                                flight.itinerary.outbound.reduce(
                                  (sum, seg) => sum + seg.duration,
                                  0,
                                ),
                              )}
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {flight.itinerary.outbound.map((segment, segIndex) => (
                              <div key={segment.id} className="space-y-2">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 sm:p-4 bg-muted/20 rounded-xl border border-border/30">
                                  <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="text-center min-w-0 flex-1 sm:flex-initial">
                                      <div className="font-bold text-lg sm:text-xl text-card-foreground">
                                        {segment.departure.airport}
                                      </div>
                                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                                        {segment.departure.city}
                                      </div>
                                      <div className="text-xs sm:text-sm font-medium text-foreground">
                                        {formatTimeWithTimezone(
                                          segment.departure.time,
                                          segment.departure.timezone,
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex-1 flex items-center justify-center min-w-0">
                                      <div className="flex items-center gap-3 text-muted-foreground w-full">
                                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1"></div>
                                        <div className="text-center px-2 sm:px-3 py-2 bg-background/50 rounded-lg border border-border/30 flex-shrink-0">
                                          <Plane className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-primary" />
                                          <div className="text-xs font-medium">
                                            {formatDuration(segment.duration)}
                                          </div>
                                          <div className="text-xs text-muted-foreground truncate">
                                            {getAircraftName(
                                              segment.aircraft?.code ||
                                                segment.aircraft?.name ||
                                                "",
                                            )}
                                          </div>
                                        </div>
                                        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1"></div>
                                      </div>
                                    </div>

                                    <div className="text-center min-w-0 flex-1 sm:flex-initial">
                                      <div className="font-bold text-lg sm:text-xl text-card-foreground">
                                        {segment.arrival.airport}
                                      </div>
                                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                                        {segment.arrival.city}
                                      </div>
                                      <div className="text-xs sm:text-sm font-medium text-foreground">
                                        {formatTimeWithTimezone(
                                          segment.arrival.time,
                                          segment.arrival.timezone,
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Layover Information */}
                                {segIndex < flight.itinerary.outbound.length - 1 && (
                                  <div className="ml-4 sm:ml-8">
                                    {(() => {
                                      const layover = outboundLayovers[segIndex]
                                      if (!layover) return null

                                      const cityInfo = getCityExplorationInfo(
                                        layover.airport,
                                        layover.duration,
                                      )
                                      const canExplore = layover.duration >= cityInfo.minExploreTime

                                      return (
                                        <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl p-4 sm:p-6 border border-accent/20">
                                          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                                            <div className="flex-shrink-0">
                                              <img
                                                src={cityInfo.image || "/placeholder.svg"}
                                                alt={cityInfo.name}
                                                className="w-full lg:w-32 h-24 lg:h-20 object-cover rounded-lg"
                                              />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                <div>
                                                  <h4 className="font-semibold text-card-foreground text-base sm:text-lg">
                                                    {formatDuration(layover.duration)} layover in{" "}
                                                    {cityInfo.name}
                                                  </h4>
                                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                                    {cityInfo.country} • {layover.airport}
                                                  </p>
                                                </div>
                                                {canExplore ? (
                                                  <Badge className="bg-green-100 text-green-800 border-green-200 self-start sm:self-center">
                                                    <Camera className="h-3 w-3 mr-1" />
                                                    Perfect for exploring
                                                  </Badge>
                                                ) : (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-muted-foreground self-start sm:self-center"
                                                  >
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Quick connection
                                                  </Badge>
                                                )}
                                              </div>

                                              {canExplore && (
                                                <div className="space-y-3">
                                                  <div className="flex flex-wrap gap-2">
                                                    {cityInfo.highlights.map(
                                                      (highlight: string, idx: number) => (
                                                        <Badge
                                                          key={idx}
                                                          variant="secondary"
                                                          className="text-xs"
                                                        >
                                                          <Utensils className="h-3 w-3 mr-1" />
                                                          {highlight}
                                                        </Badge>
                                                      ),
                                                    )}
                                                  </div>

                                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Navigation className="h-4 w-4" />
                                                    {cityInfo.transport}
                                                  </div>

                                                  <div className="flex flex-col sm:flex-row gap-2">
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() =>
                                                        handleCityGuide(layover.airport)
                                                      }
                                                      className="text-xs bg-transparent"
                                                    >
                                                      <ExternalLink className="h-3 w-3 mr-1" />
                                                      City Guide
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      onClick={() =>
                                                        handleSaveItinerary(
                                                          flight.id,
                                                          layover.airport,
                                                        )
                                                      }
                                                      className="text-xs bg-primary hover:bg-primary/90"
                                                    >
                                                      <Heart className="h-3 w-3 mr-1" />
                                                      Save Itinerary
                                                    </Button>
                                                  </div>
                                                </div>
                                              )}

                                              {cityInfo.tips && (
                                                <div className="mt-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
                                                  <div className="flex items-start gap-2">
                                                    <div className="h-4 w-4 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                      <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                      {cityInfo.tips}
                                                    </p>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Return Journey */}
                        {flight.itinerary.inbound && (
                          <div className="space-y-4 mt-6 pt-6 border-t border-border/30">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-secondary"></div>
                              <span className="text-sm font-semibold text-foreground">
                                Return Journey
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {formatDuration(
                                  flight.itinerary.inbound.reduce(
                                    (sum, seg) => sum + seg.duration,
                                    0,
                                  ),
                                )}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              {flight.itinerary.inbound.map((segment, segIndex) => (
                                <div key={segment.id} className="space-y-2">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 sm:p-4 bg-muted/20 rounded-xl border border-border/30">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                      <div className="text-center min-w-0 flex-1 sm:flex-initial">
                                        <div className="font-bold text-lg sm:text-xl text-card-foreground">
                                          {segment.departure.airport}
                                        </div>
                                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                                          {segment.departure.city}
                                        </div>
                                        <div className="text-xs sm:text-sm font-medium text-foreground">
                                          {formatTimeWithTimezone(
                                            segment.departure.time,
                                            segment.departure.timezone,
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex-1 flex items-center justify-center min-w-0">
                                        <div className="flex items-center gap-3 text-muted-foreground w-full">
                                          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1"></div>
                                          <div className="text-center px-2 sm:px-3 py-2 bg-background/50 rounded-lg border border-border/30 flex-shrink-0">
                                            <Plane className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-primary" />
                                            <div className="text-xs font-medium">
                                              {formatDuration(segment.duration)}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                              {getAircraftName(
                                                segment.aircraft?.code ||
                                                  segment.aircraft?.name ||
                                                  "Aircraft",
                                              )}
                                            </div>
                                          </div>
                                          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1"></div>
                                        </div>
                                      </div>

                                      <div className="text-center min-w-0 flex-1 sm:flex-initial">
                                        <div className="font-bold text-lg sm:text-xl text-card-foreground">
                                          {segment.arrival.airport}
                                        </div>
                                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                                          {segment.arrival.city}
                                        </div>
                                        <div className="text-xs sm:text-sm font-medium text-foreground">
                                          {formatTimeWithTimezone(
                                            segment.arrival.time,
                                            segment.arrival.timezone,
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {segIndex < inboundLayovers.length && (
                                    <div className="ml-4 sm:ml-8">
                                      {(() => {
                                        const layover = inboundLayovers[segIndex]
                                        if (!layover) return null

                                        const cityInfo = getCityExplorationInfo(
                                          layover.airport,
                                          layover.duration,
                                        )
                                        const canExplore =
                                          layover.duration >= cityInfo.minExploreTime

                                        return (
                                          <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl p-4 sm:p-6 border border-accent/20">
                                            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                                              <div className="flex-shrink-0">
                                                <img
                                                  src={cityInfo.image || "/placeholder.svg"}
                                                  alt={cityInfo.name}
                                                  className="w-full lg:w-32 h-24 lg:h-20 object-cover rounded-lg"
                                                />
                                              </div>

                                              <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                  <div>
                                                    <h4 className="font-semibold text-card-foreground text-base sm:text-lg">
                                                      {formatDuration(layover.duration)} layover in{" "}
                                                      {cityInfo.name}
                                                    </h4>
                                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                                      {cityInfo.country} • {layover.airport}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}

                {flightResults.length > 10 && !showAllFlights && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowAllFlights(true)}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    Show All Flights ({flightResults.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
