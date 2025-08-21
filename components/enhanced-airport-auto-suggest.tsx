"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plane, MapPin, Search, X, Loader2, Globe, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Airport } from "@/lib/services/airport-service"
import type { Airline } from "@/lib/services/airline-service"

interface EnhancedAirportAutoSuggestProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onAirportSelect?: (airport: Airport) => void
  className?: string
  error?: boolean
  disabled?: boolean
  showPopular?: boolean
  showAirlines?: boolean
  hubOnly?: boolean
  popularOnly?: boolean
}

interface AirportWithAirlines extends Airport {
  airlines?: Airline[]
  airlineCount?: number
}

export function EnhancedAirportAutoSuggest({
  label,
  placeholder = "Search airports...",
  value,
  onChange,
  onAirportSelect,
  className,
  error,
  disabled,
  showPopular = true,
  showAirlines = true,
  hubOnly = false,
  popularOnly = false,
}: EnhancedAirportAutoSuggestProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredAirports, setFilteredAirports] = useState<AirportWithAirlines[]>([])
  const [selectedAirport, setSelectedAirport] = useState<AirportWithAirlines | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [popularAirports, setPopularAirports] = useState<AirportWithAirlines[]>([])
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load popular airports on component mount
  useEffect(() => {
    if (showPopular) {
      loadPopularAirports()
    }
  }, [showPopular])

  // Load popular airports
  const loadPopularAirports = async () => {
    try {
      const response = await fetch("/api/airports/search?q=&limit=20&popular_only=true")
      if (response.ok) {
        const data = await response.json()
        const airportsWithAirlines = await enrichAirportsWithAirlines(data.airports || [])
        setPopularAirports(airportsWithAirlines)
      }
    } catch (error) {
      console.error("Error loading popular airports:", error)
    }
  }

  // Enrich airports with airline information
  const enrichAirportsWithAirlines = async (
    airports: Airport[],
  ): Promise<AirportWithAirlines[]> => {
    if (!showAirlines) {
      return airports.map((airport) => ({ ...airport, airlines: [], airlineCount: 0 }))
    }

    try {
      // Get airlines for each airport (simplified - in production you'd have a proper relationship)
      const enrichedAirports = await Promise.all(
        airports.map(async (airport) => {
          try {
            // Get airlines that operate at this airport
            const airlineResponse = await fetch(
              `/api/airlines/search?q=&limit=10&country=${encodeURIComponent(airport.country)}`,
            )
            if (airlineResponse.ok) {
              const airlineData = await airlineResponse.json()
              return {
                ...airport,
                airlines: airlineData.airlines || [],
                airlineCount: airlineData.total || 0,
              }
            }
          } catch (error) {
            console.error(`Error getting airlines for ${airport.iata_code}:`, error)
          }

          return {
            ...airport,
            airlines: [],
            airlineCount: 0,
          }
        }),
      )

      return enrichedAirports
    } catch (error) {
      console.error("Error enriching airports with airlines:", error)
      return airports.map((airport) => ({ ...airport, airlines: [], airlineCount: 0 }))
    }
  }

  // Search airports with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    if (!searchTerm.trim()) {
      setFilteredAirports([])
      setIsOpen(false)
      return
    }

    const timeout = setTimeout(() => {
      searchAirports(searchTerm)
    }, 300)

    setSearchTimeout(timeout)

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [searchTerm])

  // Search airports from backend
  const searchAirports = async (query: string) => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        q: query,
        limit: "20",
      })

      if (hubOnly) params.append("hub_only", "true")
      if (popularOnly) params.append("popular_only", "true")

      const response = await fetch(`/api/airports/search?${params}`)

      if (response.ok) {
        const data = await response.json()
        const airportsWithAirlines = await enrichAirportsWithAirlines(data.airports || [])
        setFilteredAirports(airportsWithAirlines)
        setIsOpen(true)
      } else {
        console.error("Failed to search airports:", response.statusText)
        setFilteredAirports([])
      }
    } catch (error) {
      console.error("Error searching airports:", error)
      setFilteredAirports([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setHighlightedIndex((prev) => {
            const maxIndex = Math.max(filteredAirports.length - 1, popularAirports.length - 1)
            return prev < maxIndex ? prev + 1 : 0
          })
          break
        case "ArrowUp":
          e.preventDefault()
          setHighlightedIndex((prev) => {
            const maxIndex = Math.max(filteredAirports.length - 1, popularAirports.length - 1)
            return prev > 0 ? prev - 1 : maxIndex
          })
          break
        case "Enter":
          e.preventDefault()
          const currentAirports = filteredAirports.length > 0 ? filteredAirports : popularAirports
          if (highlightedIndex >= 0 && currentAirports[highlightedIndex]) {
            selectAirport(currentAirports[highlightedIndex])
          }
          break
        case "Escape":
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, filteredAirports, popularAirports, highlightedIndex])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectAirport = (airport: AirportWithAirlines) => {
    setSelectedAirport(airport)
    setSearchTerm("")
    setIsOpen(false)
    setHighlightedIndex(-1)
    setFilteredAirports([])

    // Update the parent component
    onChange(airport.iata_code)
    onAirportSelect?.(airport)
  }

  const clearSelection = () => {
    setSelectedAirport(null)
    onChange("")
    onAirportSelect?.(undefined as any)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    onChange(newValue)

    if (newValue.trim()) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
      setFilteredAirports([])
    }
  }

  const handleInputFocus = () => {
    if (searchTerm.trim() || popularAirports.length > 0) {
      setIsOpen(true)
    }
  }

  const renderAirlineLogos = (airlines: Airline[], maxDisplay: number = 3) => {
    if (!showAirlines || !airlines || airlines.length === 0) return null

    const displayAirlines = airlines.slice(0, maxDisplay)
    const remainingCount = airlines.length - maxDisplay

    return (
      <div className="flex items-center space-x-1">
        {displayAirlines.map((airline, index) => (
          <div key={airline.id} className="relative group">
            {airline.logo_url ? (
              <img
                src={airline.logo_url}
                alt={airline.name}
                className="w-6 h-6 rounded object-contain border border-gray-200"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                  target.nextElementSibling?.classList.remove("hidden")
                }}
              />
            ) : null}
            <div
              className={cn(
                "w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border border-gray-200",
                airline.logo_url ? "hidden" : "",
              )}
            >
              {airline.iata_code}
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {airline.name}
              {airline.alliance && (
                <div className="text-gray-300 text-xs mt-1">{airline.alliance}</div>
              )}
            </div>
          </div>
        ))}

        {remainingCount > 0 && (
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            +{remainingCount}
          </div>
        )}
      </div>
    )
  }

  const renderAirportItem = (
    airport: AirportWithAirlines,
    index: number,
    isPopular: boolean = false,
  ) => {
    const isHighlighted = index === highlightedIndex
    const isSelected = selectedAirport?.iata_code === airport.iata_code

    return (
      <div
        key={airport.iata_code}
        className={cn(
          "p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0",
          isHighlighted && "bg-blue-50 border-blue-200",
          isSelected && "bg-blue-100",
        )}
        onClick={() => selectAirport(airport)}
        onMouseEnter={() => setHighlightedIndex(index)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                  airport.hub ? "bg-blue-600" : airport.popular ? "bg-green-600" : "bg-gray-500",
                )}
              >
                {airport.iata_code}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 truncate">{airport.city}</span>
                {airport.hub && (
                  <Badge variant="secondary" className="text-xs">
                    Hub
                  </Badge>
                )}
                {airport.popular && !airport.hub && (
                  <Badge variant="outline" className="text-xs">
                    Popular
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">{airport.name}</p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs text-gray-500">
                  {airport.country} • {airport.timezone}
                </p>
                {showAirlines && airport.airlineCount && airport.airlineCount > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Plane className="h-3 w-3" />
                    <span>{airport.airlineCount} airlines</span>
                  </div>
                )}
              </div>

              {/* Airline logos */}
              {showAirlines && airport.airlines && airport.airlines.length > 0 && (
                <div className="mt-2">{renderAirlineLogos(airport.airlines)}</div>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <Plane className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
    )
  }

  const currentAirports = filteredAirports.length > 0 ? filteredAirports : popularAirports
  const showDropdown = isOpen && (currentAirports.length > 0 || isLoading)

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && <Label className="text-sm font-medium text-gray-700 mb-2 block">{label}</Label>}

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={
              selectedAirport
                ? `${selectedAirport.iata_code} - ${selectedAirport.city}`
                : searchTerm
            }
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className={cn(
              "pl-10 pr-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              disabled && "bg-gray-50 cursor-not-allowed",
            )}
            disabled={disabled}
          />
          {selectedAirport && (
            <button
              onClick={clearSelection}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 mx-auto animate-spin text-blue-500" />
                <p className="text-sm text-gray-500 mt-2">Searching airports...</p>
              </div>
            ) : filteredAirports.length > 0 ? (
              // Search results
              filteredAirports.map((airport, index) => renderAirportItem(airport, index, false))
            ) : popularAirports.length > 0 ? (
              // Popular airports
              <>
                <div className="p-2 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-medium text-gray-600">Popular Airports</p>
                </div>
                {popularAirports.map((airport, index) => renderAirportItem(airport, index, true))}
              </>
            ) : (
              // No results
              <div className="p-4 text-center text-gray-500">
                <Plane className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No airports found</p>
                <p className="text-xs">Try searching by city, country, or airport code</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <p className="mt-1 text-sm text-red-600">Please select a valid airport</p>}
    </div>
  )
}
