"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Cloud,
  CloudRain,
  Sun,
  Train,
  Bus,
  Car,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  Info,
  Thermometer,
  Wind,
  Droplets,
  Eye,
  Navigation,
  DollarSign,
  Calendar,
  Users,
  Luggage,
  Wifi,
  Coffee,
  Utensils,
  ShoppingBag,
  Bed,
  Sparkles,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LayoverDetailsProps {
  layover: {
    airport: string
    city: string
    country: string
    duration: number
    arrival: string
    departure: string
    weather?: {
      temperature: number
      condition: string
      description: string
      precipitation: number
      isGoodForOutdoor: boolean
      recommendations: string[]
    }
    transitInfo?: {
      canLeaveAirport: boolean
      availableTimeInCity: number
      transitOptions: any[]
      recommendations: string[]
      warnings: string[]
    }
    activities: any[]
    score: {
      total: number
      breakdown: {
        duration: number
        amenities: number
        safety: number
        cost: number
        visa: number
        experience: number
        weather: number
      }
      recommendation: string
      insights: string[]
    }
    amenities: any
  }
}

export function LayoverDetailsCard({ layover }: LayoverDetailsProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase()
    if (lowerCondition.includes("rain")) return <CloudRain className="h-5 w-5" />
    if (lowerCondition.includes("cloud")) return <Cloud className="h-5 w-5" />
    return <Sun className="h-5 w-5" />
  }

  const getTransitIcon = (mode: string) => {
    switch (mode) {
      case "train":
      case "metro":
        return <Train className="h-4 w-4" />
      case "bus":
        return <Bus className="h-4 w-4" />
      case "taxi":
        return <Car className="h-4 w-4" />
      default:
        return <Navigation className="h-4 w-4" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{layover.city} Layover</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {layover.airport} • {formatDuration(layover.duration)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {(layover.score.total * 10).toFixed(0)}/10
            </div>
            <p className="text-xs text-muted-foreground">Layover Score</p>
          </div>
        </div>

        {/* Weather Summary */}
        {layover.weather && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getWeatherIcon(layover.weather.condition)}
                <div>
                  <p className="font-medium">{layover.weather.temperature}°C</p>
                  <p className="text-sm text-muted-foreground">{layover.weather.description}</p>
                </div>
              </div>
              {layover.weather.isGoodForOutdoor ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Good for outdoor
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Info className="h-3 w-3 mr-1" />
                  Indoor recommended
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Transit Summary */}
        {layover.transitInfo && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                {layover.transitInfo.canLeaveAirport ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Can explore city</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(layover.transitInfo.availableTimeInCity)} available
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">Stay in airport</p>
                      <p className="text-sm text-muted-foreground">Insufficient time to leave</p>
                    </div>
                  </div>
                )}
              </div>
              {layover.transitInfo.transitOptions.length > 0 && (
                <div className="flex gap-2">
                  {layover.transitInfo.transitOptions.slice(0, 3).map((option, idx) => (
                    <Badge key={idx} variant="outline">
                      {getTransitIcon(option.mode)}
                      <span className="ml-1">{option.duration}min</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="transit">Transit</TabsTrigger>
            <TabsTrigger value="weather">Weather</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Score Breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Score Breakdown</h4>
              {Object.entries(layover.score.breakdown).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{key}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={value * 100} className="w-24 h-2" />
                    <span className={`text-sm font-medium ${getScoreColor(value)}`}>
                      {(value * 10).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Insights */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Key Insights</h4>
              {layover.score.insights.map((insight, idx) => (
                <Alert key={idx} className="py-2">
                  <AlertDescription className="text-sm">{insight}</AlertDescription>
                </Alert>
              ))}
            </div>

            {/* Amenities */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Airport Amenities</h4>
              <div className="grid grid-cols-2 gap-2">
                {layover.amenities.freeWifi && (
                  <Badge variant="secondary">
                    <Wifi className="h-3 w-3 mr-1" />
                    Free WiFi
                  </Badge>
                )}
                {layover.amenities.lounges?.length > 0 && (
                  <Badge variant="secondary">
                    <Coffee className="h-3 w-3 mr-1" />
                    {layover.amenities.lounges.length} Lounges
                  </Badge>
                )}
                {layover.amenities.restaurants?.length > 0 && (
                  <Badge variant="secondary">
                    <Utensils className="h-3 w-3 mr-1" />
                    {layover.amenities.restaurants.length} Restaurants
                  </Badge>
                )}
                {layover.amenities.shopping && (
                  <Badge variant="secondary">
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    Shopping
                  </Badge>
                )}
                {layover.amenities.spa && (
                  <Badge variant="secondary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Spa
                  </Badge>
                )}
                {layover.amenities.sleepingAreas && (
                  <Badge variant="secondary">
                    <Bed className="h-3 w-3 mr-1" />
                    Sleep Areas
                  </Badge>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-3">
            {layover.activities
              .filter((activity) => {
                // Filter activities based on weather score if available
                if (activity.weatherScore !== undefined && activity.weatherScore < 0.3) {
                  return false
                }
                return true
              })
              .sort((a, b) => {
                // Sort by weather score if available, then by rating
                if (a.weatherScore && b.weatherScore) {
                  return b.weatherScore - a.weatherScore
                }
                return (b.rating || 0) - (a.rating || 0)
              })
              .map((activity, idx) => (
                <Card key={idx} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{activity.name}</h5>
                        {activity.weatherScore && activity.weatherScore > 0.7 && (
                          <Badge variant="default" className="text-xs">
                            Weather Perfect
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.duration}min
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {activity.cost}
                        </span>
                        {activity.requiresTransit && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Requires transit
                          </span>
                        )}
                      </div>
                      {activity.weatherRecommendation && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.weatherRecommendation}
                        </p>
                      )}
                    </div>
                    {activity.booking && (
                      <Badge variant="outline" className="text-xs">
                        {activity.booking}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="transit" className="space-y-4">
            {layover.transitInfo ? (
              <>
                {/* Transit Analysis */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <h4 className="font-medium">Transit Analysis</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Layover</p>
                      <p className="font-medium">{formatDuration(layover.duration)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">City Time Available</p>
                      <p className="font-medium">
                        {layover.transitInfo.canLeaveAirport
                          ? formatDuration(layover.transitInfo.availableTimeInCity)
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transit Options */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Transit Options to City</h4>
                  {layover.transitInfo.transitOptions.map((option, idx) => (
                    <Card key={idx} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTransitIcon(option.mode)}
                          <div>
                            <p className="font-medium capitalize">{option.mode}</p>
                            <p className="text-sm text-muted-foreground">
                              {option.duration} minutes • ${option.cost}
                            </p>
                          </div>
                        </div>
                        {option.frequency > 0 && (
                          <Badge variant="secondary">Every {option.frequency}min</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Recommendations */}
                {layover.transitInfo.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recommendations</h4>
                    {layover.transitInfo.recommendations.map((rec, idx) => (
                      <Alert key={idx} className="py-2">
                        <AlertDescription className="text-sm">{rec}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {layover.transitInfo.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Important Notes</h4>
                    {layover.transitInfo.warnings.map((warning, idx) => (
                      <Alert key={idx} className="py-2" variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">{warning}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">Transit information not available</p>
            )}
          </TabsContent>

          <TabsContent value="weather" className="space-y-4">
            {layover.weather ? (
              <>
                {/* Current Weather */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3">Current Weather</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Temperature</p>
                        <p className="font-medium">{layover.weather.temperature}°C</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Precipitation</p>
                        <p className="font-medium">{layover.weather.precipitation}mm</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weather Recommendations */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Weather Tips</h4>
                  {layover.weather.recommendations.map((rec, idx) => (
                    <Alert key={idx} className="py-2">
                      <AlertDescription className="text-sm">{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>

                {/* Activity Suitability */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Activity Suitability</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Card className="p-3">
                      <p className="text-sm font-medium">Outdoor Activities</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {layover.weather.isGoodForOutdoor ? "Recommended" : "Not recommended"}
                      </p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-sm font-medium">Indoor Activities</p>
                      <p className="text-xs text-muted-foreground mt-1">Always suitable</p>
                    </Card>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Weather information not available</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
