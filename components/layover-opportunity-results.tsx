"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Clock,
  MapPin,
  Plane,
  Star,
  Sun,
  CloudRain,
  Train,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Users,
  DollarSign,
} from "lucide-react"

interface LayoverOpportunityResultsProps {
  results: {
    opportunities: Array<{
      id: string
      location: {
        airport: string
        city: string
        country: string
        coordinates: { lat: number; lng: number }
      }
      timing: {
        duration: number
        durationHours: number
        arrivalTime: string
        departureTime: string
      }
      scores: {
        overall: number
        feasibility: number
        experience: number
        weather: number
      }
      context: {
        weather: {
          temperature: number
          condition: string
          isGoodForOutdoor: boolean
        }
        transit: {
          canLeaveAirport: boolean
          availableTimeInCity: number
          bestTransitMode: string
        }
        experiencesAvailable: number
      }
      recommendations: string[]
      warnings: string[]
      flight: {
        id: string
        price: number
        airline: string
      }
    }>
    insights: {
      best: {
        id: string
        city: string
        score: number
        duration: number
      } | null
      categories: {
        weatherFriendly: Array<{ id: string; city: string; weatherScore: number }>
        quickExplore: Array<{ id: string; city: string; duration: number }>
        extendedStay: Array<{ id: string; city: string; duration: number }>
      }
    }
    market: {
      averageLayoverDuration: number
      averageLayoverHours: number
      popularCities: string[]
      priceRange: [number, number]
    }
    metadata: {
      totalOpportunities: number
      totalFlights: number
      searchTime: number
    }
  }
  onOpportunitySelect: (opportunity: any) => void
  onBookFlight: (opportunity: any) => void
}

export function LayoverOpportunityResults({
  results,
  onOpportunitySelect,
  onBookFlight,
}: LayoverOpportunityResultsProps) {
  const [sortBy, setSortBy] = useState<"overall" | "duration" | "price">("overall")

  if (!results || results.opportunities.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Plane className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No Layover Opportunities Found</h3>
              <p className="text-muted-foreground">
                No suitable layover opportunities were found for your search criteria. Try adjusting
                your dates or destination.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sortedOpportunities = [...results.opportunities].sort((a, b) => {
    switch (sortBy) {
      case "duration":
        return b.timing.duration - a.timing.duration
      case "price":
        return a.flight.price - b.flight.price
      default:
        return b.scores.overall - a.scores.overall
    }
  })

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Search Summary */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {results.metadata.totalOpportunities} Layover Opportunities Found
            </CardTitle>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {results.metadata.searchTime}ms
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {results.market.averageLayoverHours}h
              </div>
              <div className="text-sm text-muted-foreground">Avg Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                ${results.market.priceRange[0]} - ${results.market.priceRange[1]}
              </div>
              <div className="text-sm text-muted-foreground">Price Range</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {results.market.popularCities.length}
              </div>
              <div className="text-sm text-muted-foreground">Cities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{results.metadata.totalFlights}</div>
              <div className="text-sm text-muted-foreground">Flights</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Opportunity Highlight */}
      {results.insights.best && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Best Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{results.insights.best.city}</h3>
                <p className="text-muted-foreground">
                  {Math.round((results.insights.best.duration / 60) * 10) / 10} hours layover
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {results.insights.best.score}%
                </div>
                <div className="text-sm text-muted-foreground">Overall Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Insights */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Opportunities</TabsTrigger>
            <TabsTrigger value="weather">Weather Friendly</TabsTrigger>
            <TabsTrigger value="quick">Quick Explore</TabsTrigger>
            <TabsTrigger value="extended">Extended Stay</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="overall">Overall Score</option>
              <option value="duration">Duration</option>
              <option value="price">Price</option>
            </select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4 mt-6">
          {sortedOpportunities.map((opportunity) => (
            <LayoverOpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onSelect={() => onOpportunitySelect(opportunity)}
              onBook={() => onBookFlight(opportunity)}
            />
          ))}
        </TabsContent>

        <TabsContent value="weather" className="space-y-4 mt-6">
          {sortedOpportunities
            .filter((opp) => opp.context.weather.isGoodForOutdoor)
            .map((opportunity) => (
              <LayoverOpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onSelect={() => onOpportunitySelect(opportunity)}
                onBook={() => onBookFlight(opportunity)}
              />
            ))}
        </TabsContent>

        <TabsContent value="quick" className="space-y-4 mt-6">
          {sortedOpportunities
            .filter((opp) => opp.timing.duration >= 120 && opp.timing.duration <= 300)
            .map((opportunity) => (
              <LayoverOpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onSelect={() => onOpportunitySelect(opportunity)}
                onBook={() => onBookFlight(opportunity)}
              />
            ))}
        </TabsContent>

        <TabsContent value="extended" className="space-y-4 mt-6">
          {sortedOpportunities
            .filter((opp) => opp.timing.duration > 300)
            .map((opportunity) => (
              <LayoverOpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onSelect={() => onOpportunitySelect(opportunity)}
                onBook={() => onBookFlight(opportunity)}
              />
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LayoverOpportunityCard({
  opportunity,
  onSelect,
  onBook,
}: {
  opportunity: any
  onSelect: () => void
  onBook: () => void
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={onSelect}>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Location and Timing */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {opportunity.location.city}, {opportunity.location.country}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {opportunity.location.airport} • {opportunity.flight.airline}
                </p>
              </div>
              <Badge
                variant={
                  opportunity.scores.overall >= 80
                    ? "default"
                    : opportunity.scores.overall >= 60
                      ? "secondary"
                      : "destructive"
                }
                className="text-sm"
              >
                {opportunity.scores.overall}% Score
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{opportunity.timing.durationHours}h layover</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatTime(opportunity.timing.arrivalTime)} -{" "}
                  {formatTime(opportunity.timing.departureTime)}
                </span>
              </div>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div
                  className={`text-lg font-bold ${getScoreColor(opportunity.scores.feasibility)}`}
                >
                  {opportunity.scores.feasibility}%
                </div>
                <div className="text-xs text-muted-foreground">Feasibility</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-lg font-bold ${getScoreColor(opportunity.scores.experience)}`}
                >
                  {opportunity.scores.experience}%
                </div>
                <div className="text-xs text-muted-foreground">Experience</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${getScoreColor(opportunity.scores.weather)}`}>
                  {opportunity.scores.weather}%
                </div>
                <div className="text-xs text-muted-foreground">Weather</div>
              </div>
            </div>
          </div>

          {/* Context Information */}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {opportunity.context.weather.isGoodForOutdoor ? (
                  <Sun className="w-4 h-4 text-yellow-500" />
                ) : (
                  <CloudRain className="w-4 h-4 text-blue-500" />
                )}
                <span>
                  {opportunity.context.weather.temperature}°C,{" "}
                  {opportunity.context.weather.condition}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Train className="w-4 h-4" />
                <span>
                  {opportunity.context.transit.canLeaveAirport
                    ? `${Math.round(opportunity.context.transit.availableTimeInCity / 60)}h in city`
                    : "Stay at airport"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4" />
                <span>{opportunity.context.experiencesAvailable} experiences available</span>
              </div>
            </div>
          </div>

          {/* Actions and Price */}
          <div className="space-y-3">
            <div className="text-right">
              <div className="text-2xl font-bold">${opportunity.flight.price}</div>
              <div className="text-sm text-muted-foreground">Total flight price</div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  onBook()
                }}
                className="w-full"
              >
                Book Flight
              </Button>
              <Button variant="outline" className="w-full" onClick={onSelect}>
                View Details
              </Button>
            </div>
          </div>
        </div>

        {/* Recommendations and Warnings */}
        <Separator className="my-4" />
        <div className="space-y-2">
          {opportunity.recommendations.slice(0, 2).map((rec: string, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="w-3 h-3" />
              <span>{rec}</span>
            </div>
          ))}
          {opportunity.warnings.slice(0, 1).map((warning: string, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm text-amber-700">
              <AlertTriangle className="w-3 h-3" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
