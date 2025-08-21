"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plane,
  Clock,
  MapPin,
  Wifi,
  Coffee,
  Bed,
  ArrowRight,
  Filter,
  SortAsc,
  Heart,
  Share2,
  Info,
  TrendingUp,
  Award,
} from "lucide-react"

interface FlightResultsProps {
  results: any
  onFlightSelect: (flight: any) => void
  onBookFlight: (flight: any) => void
}

export function FlightResults({ results, onFlightSelect, onBookFlight }: FlightResultsProps) {
  const [sortBy, setSortBy] = useState("layoverScore")
  const [filterBy, setFilterBy] = useState("all")

  if (!results || !results.flights || results.flights.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Plane className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="heading-font text-lg">No Flights Found</h3>
            <p className="body-font text-muted-foreground">
              Try adjusting your search criteria or dates to find more options.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sortedFlights = [...results.flights].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return a.price.total - b.price.total
      case "layoverScore":
        return (b.totalLayoverScore || 0) - (a.totalLayoverScore || 0)
      case "duration":
        return a.duration.outbound.localeCompare(b.duration.outbound)
      default:
        return 0
    }
  })

  const formatDuration = (duration: string) => {
    // Convert ISO duration to readable format
    return duration.replace("PT", "").replace("H", "h ").replace("M", "m")
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(price)
  }

  const getLayoverScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50"
    if (score >= 6) return "text-blue-600 bg-blue-50"
    if (score >= 4) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  const getLayoverScoreLabel = (score: number) => {
    if (score >= 8) return "Excellent"
    if (score >= 6) return "Good"
    if (score >= 4) return "Fair"
    return "Basic"
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-font text-2xl text-foreground">
            {results.total} Layover-Optimized Flights
          </h2>
          <p className="body-font text-muted-foreground">
            Found in {results.searchTime}ms across {Object.keys(results.providers).length} providers
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-input border-border">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="layoverScore">Layover Score</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-32 bg-input border-border">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Market Insights */}
      {results.marketInsights && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="body-font text-sm font-medium">Market Insights</p>
                <p className="body-font text-xs text-muted-foreground">
                  Average price: {formatPrice(results.marketInsights.averagePrice, "USD")} • Price
                  confidence: {Math.round(results.marketInsights.priceConfidence * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flight Results */}
      <div className="space-y-4">
        {sortedFlights.map((flight, index) => (
          <Card key={flight.id} className="bg-card border-border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Flight Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Plane className="h-5 w-5 text-primary" />
                      <span className="heading-font font-medium">{flight.airline.name}</span>
                    </div>

                    {flight.totalLayoverScore && (
                      <Badge
                        className={`${getLayoverScoreColor(flight.totalLayoverScore)} border-0`}
                      >
                        <Award className="h-3 w-3 mr-1" />
                        {getLayoverScoreLabel(flight.totalLayoverScore)} Layover
                      </Badge>
                    )}

                    {index === 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Best Match
                      </Badge>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="heading-font text-2xl text-foreground">
                      {formatPrice(flight.price.total, flight.price.currency)}
                    </p>
                    <p className="body-font text-sm text-muted-foreground">per person</p>
                  </div>
                </div>

                {/* Flight Route */}
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="heading-font text-lg">
                      {flight.itinerary.outbound[0]?.departure.airport}
                    </p>
                    <p className="body-font text-sm text-muted-foreground">
                      {new Date(flight.itinerary.outbound[0]?.departure.time).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>

                  <div className="flex-1 relative">
                    <div className="flex items-center">
                      <div className="flex-1 h-px bg-border"></div>
                      {flight.layovers && flight.layovers.length > 0 && (
                        <div className="px-2">
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {flight.layovers[0].airport}
                          </Badge>
                        </div>
                      )}
                      <div className="flex-1 h-px bg-border"></div>
                    </div>
                    <div className="text-center mt-1">
                      <p className="body-font text-xs text-muted-foreground">
                        {formatDuration(flight.duration.outbound)}
                        {flight.layovers && flight.layovers.length > 0 && (
                          <span>
                            {" "}
                            • {flight.layovers.length} stop{flight.layovers.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="heading-font text-lg">
                      {
                        flight.itinerary.outbound[flight.itinerary.outbound.length - 1]?.arrival
                          .airport
                      }
                    </p>
                    <p className="body-font text-sm text-muted-foreground">
                      {new Date(
                        flight.itinerary.outbound[
                          flight.itinerary.outbound.length - 1
                        ]?.arrival.time,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Layover Information */}
                {flight.layovers && flight.layovers.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="body-font font-medium">
                        Layover in {flight.layovers[0].city}
                      </span>
                      {flight.layovers[0].score && (
                        <Badge
                          className={`${getLayoverScoreColor(flight.layovers[0].score.total)} text-xs`}
                        >
                          {flight.layovers[0].score.total}/10
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="body-font">{flight.layovers[0].duration}</span>
                      </div>

                      {flight.layovers[0].amenities?.freeWifi && (
                        <div className="flex items-center space-x-2">
                          <Wifi className="h-4 w-4 text-muted-foreground" />
                          <span className="body-font">Free WiFi</span>
                        </div>
                      )}

                      {flight.layovers[0].amenities?.lounges?.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Coffee className="h-4 w-4 text-muted-foreground" />
                          <span className="body-font">Lounges</span>
                        </div>
                      )}

                      {flight.layovers[0].amenities?.sleepingAreas && (
                        <div className="flex items-center space-x-2">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          <span className="body-font">Rest Areas</span>
                        </div>
                      )}
                    </div>

                    {flight.layovers[0].activities && flight.layovers[0].activities.length > 0 && (
                      <div>
                        <p className="body-font text-sm font-medium mb-2">Available Activities:</p>
                        <div className="flex flex-wrap gap-2">
                          {flight.layovers[0].activities
                            .slice(0, 3)
                            .map((activity: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {activity.name}
                              </Badge>
                            ))}
                          {flight.layovers[0].activities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{flight.layovers[0].activities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Heart className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => onFlightSelect(flight)}
                      className="border-border bg-transparent"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      onClick={() => onBookFlight(flight)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Select Flight
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {results.total > sortedFlights.length && (
        <div className="text-center">
          <Button variant="outline" className="border-border bg-transparent">
            Load More Results
          </Button>
        </div>
      )}
    </div>
  )
}
