"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Plane,
  Clock,
  MapPin,
  Star,
  Wifi,
  Coffee,
  Bed,
  ShoppingBag,
  Camera,
  Utensils,
  Car,
  Shield,
  Sun,
  ArrowRight,
  ExternalLink,
  Award,
} from "lucide-react"

interface LayoverDetailsProps {
  flight: any
  onBook: () => void
  onBack: () => void
}

export function LayoverDetails({ flight, onBook, onBack }: LayoverDetailsProps) {
  const layover = flight.layovers?.[0]

  if (!layover) {
    return (
      <Card className="max-w-4xl mx-auto bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="p-8 text-center">
          <p className="body-font text-muted-foreground">No layover information available.</p>
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600"
    if (score >= 6) return "text-blue-600"
    if (score >= 4) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </Button>

        <div className="text-right">
          <p className="heading-font text-2xl text-foreground">
            {formatPrice(flight.price.total, flight.price.currency)}
          </p>
          <p className="body-font text-sm text-muted-foreground">per person</p>
        </div>
      </div>

      {/* Flight Overview */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plane className="h-5 w-5 text-primary" />
            <span>Flight Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="heading-font text-xl">
                {flight.itinerary.outbound[0]?.departure.airport}
              </p>
              <p className="body-font text-sm text-muted-foreground">
                {flight.itinerary.outbound[0]?.departure.city}
              </p>
              <p className="body-font text-sm">
                {new Date(flight.itinerary.outbound[0]?.departure.time).toLocaleString()}
              </p>
            </div>

            <div className="flex-1 text-center">
              <Badge variant="outline" className="mb-2">
                <MapPin className="h-3 w-3 mr-1" />
                Layover in {layover.city}
              </Badge>
              <p className="body-font text-sm text-muted-foreground">{layover.duration}</p>
            </div>

            <div className="text-center">
              <p className="heading-font text-xl">
                {flight.itinerary.outbound[flight.itinerary.outbound.length - 1]?.arrival.airport}
              </p>
              <p className="body-font text-sm text-muted-foreground">
                {flight.itinerary.outbound[flight.itinerary.outbound.length - 1]?.arrival.city}
              </p>
              <p className="body-font text-sm">
                {new Date(
                  flight.itinerary.outbound[flight.itinerary.outbound.length - 1]?.arrival.time,
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layover Analysis */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-primary" />
              <span>Layover Analysis - {layover.city}</span>
            </div>
            {layover.score && (
              <Badge
                className={`${getScoreColor(layover.score.total)} bg-transparent border-0 text-lg`}
              >
                {layover.score.total}/10
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
              <TabsTrigger value="practical">Practical</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {layover.score && (
                <div className="space-y-4">
                  <h3 className="heading-font text-lg">Layover Score Breakdown</h3>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(layover.score.breakdown).map(([key, value]: [string, any]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="body-font text-sm capitalize">
                            {key.replace(/([A-Z])/g, " $1")}
                          </span>
                          <span className="body-font text-sm font-medium">
                            {Math.round(value * 10)}/10
                          </span>
                        </div>
                        <Progress value={value * 10} className="h-2" />
                      </div>
                    ))}
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="body-font font-medium mb-2">Recommendation</h4>
                    <p className="body-font text-sm">{layover.score.recommendation}</p>
                  </div>

                  {layover.score.insights && layover.score.insights.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="body-font font-medium">Key Insights</h4>
                      <ul className="space-y-1">
                        {layover.score.insights.map((insight: string, idx: number) => (
                          <li key={idx} className="body-font text-sm flex items-start space-x-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activities" className="space-y-4">
              <h3 className="heading-font text-lg">Available Activities</h3>

              {layover.activities && layover.activities.length > 0 ? (
                <div className="grid gap-4">
                  {layover.activities.map((activity: any, idx: number) => (
                    <Card key={idx} className="bg-muted/30 border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              {activity.type === "CITY_TOUR" && (
                                <Camera className="h-4 w-4 text-primary" />
                              )}
                              {activity.type === "LOUNGE" && (
                                <Coffee className="h-4 w-4 text-primary" />
                              )}
                              {activity.type === "SPA" && <Star className="h-4 w-4 text-primary" />}
                              {activity.type === "REST" && <Bed className="h-4 w-4 text-primary" />}
                              <h4 className="body-font font-medium">{activity.name}</h4>
                            </div>
                            <p className="body-font text-sm text-muted-foreground">
                              {activity.description}
                            </p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="body-font">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {activity.duration} min
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {activity.cost}
                              </Badge>
                              {activity.rating && (
                                <span className="body-font">
                                  <Star className="h-3 w-3 inline mr-1 fill-yellow-400 text-yellow-400" />
                                  {activity.rating}
                                </span>
                              )}
                            </div>
                          </div>

                          {activity.booking && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border bg-transparent"
                            >
                              Book Now
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="body-font text-muted-foreground">
                  No specific activities available for this layover duration.
                </p>
              )}
            </TabsContent>

            <TabsContent value="amenities" className="space-y-4">
              <h3 className="heading-font text-lg">Airport Amenities</h3>

              {layover.amenities && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {layover.amenities.freeWifi && (
                    <div className="flex items-center space-x-2">
                      <Wifi className="h-4 w-4 text-green-600" />
                      <span className="body-font text-sm">Free WiFi</span>
                    </div>
                  )}

                  {layover.amenities.lounges?.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Coffee className="h-4 w-4 text-green-600" />
                      <span className="body-font text-sm">
                        {layover.amenities.lounges.length} Lounges
                      </span>
                    </div>
                  )}

                  {layover.amenities.showers && (
                    <div className="flex items-center space-x-2">
                      <Bed className="h-4 w-4 text-green-600" />
                      <span className="body-font text-sm">Shower Facilities</span>
                    </div>
                  )}

                  {layover.amenities.sleepingAreas && (
                    <div className="flex items-center space-x-2">
                      <Bed className="h-4 w-4 text-green-600" />
                      <span className="body-font text-sm">Rest Areas</span>
                    </div>
                  )}

                  {layover.amenities.restaurants?.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Utensils className="h-4 w-4 text-green-600" />
                      <span className="body-font text-sm">
                        {layover.amenities.restaurants.length} Restaurants
                      </span>
                    </div>
                  )}

                  {layover.amenities.shopping && (
                    <div className="flex items-center space-x-2">
                      <ShoppingBag className="h-4 w-4 text-green-600" />
                      <span className="body-font text-sm">Shopping</span>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="practical" className="space-y-4">
              <h3 className="heading-font text-lg">Practical Information</h3>

              <div className="grid gap-4">
                <Card className="bg-muted/30 border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="body-font font-medium">Safety & Security</span>
                    </div>
                    {layover.safety && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="body-font text-sm">Safety Rating</span>
                          <span className="body-font text-sm font-medium">
                            {layover.safety.score}/10
                          </span>
                        </div>
                        <Progress value={layover.safety.score * 10} className="h-2" />
                        <p className="body-font text-xs text-muted-foreground">
                          {layover.safety.level} safety level
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-muted/30 border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4 text-yellow-500" />
                      <span className="body-font font-medium">Weather</span>
                    </div>
                    {layover.weather && (
                      <div className="flex items-center justify-between">
                        <span className="body-font text-sm">{layover.weather.condition}</span>
                        <span className="body-font text-sm font-medium">
                          {layover.weather.temperature}°C
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-muted/30 border-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-blue-600" />
                      <span className="body-font font-medium">Transportation</span>
                    </div>
                    <p className="body-font text-sm text-muted-foreground">
                      Airport express train available to city center (30 min)
                    </p>
                  </CardContent>
                </Card>

                {layover.visaRequired && (
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-yellow-600" />
                        <span className="body-font font-medium text-yellow-800">Visa Required</span>
                      </div>
                      <p className="body-font text-sm text-yellow-700 mt-2">
                        Transit visa may be required for leaving the airport. Check requirements
                        before travel.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Book Flight */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="heading-font text-lg">Ready to Book?</h3>
              <p className="body-font text-sm text-muted-foreground">
                Secure this flight and start planning your layover adventure
              </p>
            </div>
            <Button onClick={onBook} size="lg" className="bg-primary hover:bg-primary/90">
              Book Flight
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
