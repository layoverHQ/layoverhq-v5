"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plane,
  Clock,
  MapPin,
  ArrowRight,
  X,
  TrendingUp,
  Award,
  Wifi,
  Coffee,
  Bed,
} from "lucide-react"

interface FlightComparisonProps {
  flights: any[]
  onRemoveFlight: (flightId: string) => void
  onBookFlight: (flight: any) => void
}

export function FlightComparison({ flights, onRemoveFlight, onBookFlight }: FlightComparisonProps) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  if (flights.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="p-8 text-center">
          <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="heading-font text-lg mb-2">No Flights to Compare</h3>
          <p className="body-font text-muted-foreground">
            Select flights from the search results to compare them here.
          </p>
        </CardContent>
      </Card>
    )
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

  const comparisonFeatures = [
    { id: "price", label: "Price", icon: TrendingUp },
    { id: "layoverScore", label: "Layover Score", icon: Award },
    { id: "duration", label: "Flight Duration", icon: Clock },
    { id: "amenities", label: "Airport Amenities", icon: Wifi },
    { id: "activities", label: "Available Activities", icon: MapPin },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="heading-font text-2xl text-foreground">
          Compare Flights ({flights.length})
        </h2>
        <div className="flex items-center space-x-2">
          <span className="body-font text-sm text-muted-foreground">Show:</span>
          {comparisonFeatures.map((feature) => (
            <Checkbox
              key={feature.id}
              id={feature.id}
              checked={selectedFeatures.includes(feature.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedFeatures([...selectedFeatures, feature.id])
                } else {
                  setSelectedFeatures(selectedFeatures.filter((f) => f !== feature.id))
                }
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: `repeat(${Math.min(flights.length, 3)}, 1fr)` }}
      >
        {flights.slice(0, 3).map((flight) => (
          <Card key={flight.id} className="bg-card border-border relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveFlight(flight.id)}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Plane className="h-4 w-4 text-primary" />
                  <span className="text-sm">{flight.airline.name}</span>
                </div>
                {flight.totalLayoverScore && (
                  <Badge className={`${getLayoverScoreColor(flight.totalLayoverScore)} text-xs`}>
                    {flight.totalLayoverScore}/10
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Price Comparison */}
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <p className="heading-font text-2xl text-foreground">
                  {formatPrice(flight.price.total, flight.price.currency)}
                </p>
                <p className="body-font text-xs text-muted-foreground">per person</p>
              </div>

              {/* Route */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="heading-font">
                    {flight.itinerary.outbound[0]?.departure.airport}
                  </span>
                  <span className="heading-font">
                    {
                      flight.itinerary.outbound[flight.itinerary.outbound.length - 1]?.arrival
                        .airport
                    }
                  </span>
                </div>
                {flight.layovers && flight.layovers.length > 0 && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {flight.layovers[0].city}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Layover Details */}
              {flight.layovers && flight.layovers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="body-font text-sm font-medium">
                      {flight.layovers[0].duration} layover
                    </span>
                  </div>

                  {/* Amenities */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {flight.layovers[0].amenities?.freeWifi && (
                      <div className="flex items-center space-x-1">
                        <Wifi className="h-3 w-3 text-green-600" />
                        <span className="body-font">WiFi</span>
                      </div>
                    )}
                    {flight.layovers[0].amenities?.lounges?.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Coffee className="h-3 w-3 text-green-600" />
                        <span className="body-font">Lounge</span>
                      </div>
                    )}
                    {flight.layovers[0].amenities?.sleepingAreas && (
                      <div className="flex items-center space-x-1">
                        <Bed className="h-3 w-3 text-green-600" />
                        <span className="body-font">Rest</span>
                      </div>
                    )}
                  </div>

                  {/* Activities */}
                  {flight.layovers[0].activities && flight.layovers[0].activities.length > 0 && (
                    <div>
                      <p className="body-font text-xs font-medium mb-1">Activities:</p>
                      <div className="space-y-1">
                        {flight.layovers[0].activities
                          .slice(0, 2)
                          .map((activity: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="body-font">{activity.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {activity.cost}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Book Button */}
              <Button
                onClick={() => onBookFlight(flight)}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Select Flight
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {flights.length > 3 && (
        <div className="text-center">
          <p className="body-font text-sm text-muted-foreground">
            Showing first 3 flights. Remove some to compare others.
          </p>
        </div>
      )}
    </div>
  )
}
