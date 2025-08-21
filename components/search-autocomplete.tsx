"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Plane, MapPin, Clock, Loader2, Star, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

interface Airport {
  code: string
  name: string
  city: string
  country: string
  countryCode: string
  type: "airport" | "city"
  priority?: number
}

interface SearchAutocompleteProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
  id?: string
}

export function SearchAutocomplete({
  placeholder,
  value,
  onChange,
  className,
  id,
}: SearchAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [airports, setAirports] = useState<Airport[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<Airport[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string>("database")
  const inputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("layoverhq-recent-searches")
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 3))
      } catch (e) {
        console.error("Failed to parse recent searches:", e)
      }
    }
  }, [])

  const searchAirports = async (query: string) => {
    if (query.length < 2) {
      setAirports([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    console.log("[v0] Searching airports for:", query)

    try {
      const response = await fetch(`/api/v1/airports/search?q=${encodeURIComponent(query)}&limit=8`)
      if (response.ok) {
        const data = await response.json()
        setAirports(data.airports || [])
        setDataSource(data.source || "database")
        console.log(
          "[v0] Search successful, found",
          data.airports?.length || 0,
          "airports from",
          data.source,
        )
      } else {
        console.error("[v0] Airport search failed:", response.statusText)
        setError("Search failed. Please try again.")
        setAirports([])
      }
    } catch (error) {
      console.error("[v0] Airport search error:", error)
      setError("Network error. Please check your connection.")
      setAirports([])
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchQuery.trim()) {
      setAirports(recentSearches)
      setError(null)
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAirports(searchQuery)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, recentSearches])

  const handleSelect = (airport: Airport) => {
    const displayValue = `${airport.city} (${airport.code})`
    onChange(displayValue)
    setOpen(false)
    setSearchQuery("")

    // Save to recent searches
    const updated = [airport, ...recentSearches.filter((r) => r.code !== airport.code)].slice(0, 3)
    setRecentSearches(updated)
    localStorage.setItem("layoverhq-recent-searches", JSON.stringify(updated))
  }

  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    setSearchQuery(newValue)
    if (!open && newValue.length > 0) {
      setOpen(true)
    }
  }

  const groupAirportsByPriority = (airports: Airport[]) => {
    const majorHubs = airports.filter((a) => a.priority === 1)
    const regionalHubs = airports.filter((a) => a.priority === 2)
    const standard = airports.filter((a) => !a.priority || a.priority > 2)

    return { majorHubs, regionalHubs, standard }
  }

  const displayAirports = searchQuery.trim() ? airports : recentSearches
  const { majorHubs, regionalHubs, standard } = groupAirportsByPriority(displayAirports)

  const getPriorityIcon = (priority?: number) => {
    if (priority === 1) return <Star className="h-3 w-3 text-yellow-500" />
    if (priority === 2) return <Globe className="h-3 w-3 text-blue-500" />
    return <MapPin className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            id={id}
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setOpen(true)}
            className={cn("pr-10", className)}
            autoComplete="off"
          />
          {loading ? (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Plane className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandList>
            {!searchQuery && recentSearches.length > 0 && (
              <CommandGroup heading="Recent Searches">
                {recentSearches.map((airport) => (
                  <CommandItem
                    key={airport.code}
                    onSelect={() => handleSelect(airport)}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{airport.code}</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm">{airport.city}</span>
                        {airport.priority && airport.priority <= 2 && (
                          <Badge variant="secondary" className="text-xs">
                            {airport.priority === 1 ? "Major Hub" : "Regional Hub"}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{airport.name}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchQuery && (
              <>
                {dataSource === "fallback" && (
                  <div className="px-2 py-1 text-xs text-muted-foreground bg-muted/50">
                    Using popular airports (database unavailable)
                  </div>
                )}

                {error ? (
                  <CommandEmpty className="text-red-500">{error}</CommandEmpty>
                ) : loading ? (
                  <CommandEmpty>Searching airports...</CommandEmpty>
                ) : displayAirports.length > 0 ? (
                  <>
                    {majorHubs.length > 0 && (
                      <CommandGroup heading="Major International Hubs">
                        {majorHubs.map((airport) => (
                          <CommandItem
                            key={airport.code}
                            onSelect={() => handleSelect(airport)}
                            className="flex items-center space-x-3 cursor-pointer"
                          >
                            {getPriorityIcon(airport.priority)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{airport.code}</span>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm">
                                  {airport.city}, {airport.country}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-yellow-100 text-yellow-800"
                                >
                                  Major Hub
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {airport.name}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {regionalHubs.length > 0 && (
                      <CommandGroup heading="Regional Hubs">
                        {regionalHubs.map((airport) => (
                          <CommandItem
                            key={airport.code}
                            onSelect={() => handleSelect(airport)}
                            className="flex items-center space-x-3 cursor-pointer"
                          >
                            {getPriorityIcon(airport.priority)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{airport.code}</span>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm">
                                  {airport.city}, {airport.country}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  Regional Hub
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {airport.name}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {standard.length > 0 && (
                      <CommandGroup
                        heading={
                          majorHubs.length > 0 || regionalHubs.length > 0
                            ? "Other Airports"
                            : "Airports & Cities"
                        }
                      >
                        {standard.map((airport) => (
                          <CommandItem
                            key={airport.code}
                            onSelect={() => handleSelect(airport)}
                            className="flex items-center space-x-3 cursor-pointer"
                          >
                            {getPriorityIcon(airport.priority)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{airport.code}</span>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm">
                                  {airport.city}, {airport.country}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {airport.name}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </>
                ) : (
                  <CommandEmpty>No airports found for "{searchQuery}"</CommandEmpty>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
