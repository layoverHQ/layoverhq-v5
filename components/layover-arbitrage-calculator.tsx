"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Sparkles,
  Trophy,
  Lock,
  Unlock,
  Zap,
  AlertCircle,
  CheckCircle,
  Coffee,
  Utensils,
  ShoppingBag,
  Plane,
  MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ArbitrageData {
  airport: {
    food: number
    shopping: number
    lounge: number
    total: number
    timeValue: number
  }
  city: {
    experience: number
    transport: number
    food: number
    total: number
    timeValue: number
  }
  savings: {
    amount: number
    percentage: number
    experienceGain: number
  }
}

interface LayoverArbitrageProps {
  city: string
  layoverHours: number
  airportCode: string
  experiencePrice: number
  className?: string
}

export function LayoverArbitrageCalculator({
  city,
  layoverHours,
  airportCode,
  experiencePrice,
  className,
}: LayoverArbitrageProps) {
  const [arbitrageData, setArbitrageData] = useState<ArbitrageData | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [animatedSavings, setAnimatedSavings] = useState(0)

  useEffect(() => {
    // Calculate arbitrage opportunity
    const airportCosts = {
      food: layoverHours * 15, // $15/hour average airport food
      shopping: layoverHours * 8, // Duty-free temptation
      lounge: layoverHours > 6 ? 50 : 0, // Lounge access
      total: 0,
      timeValue: -layoverHours * 10, // Negative value for boredom
    }
    airportCosts.total = airportCosts.food + airportCosts.shopping + airportCosts.lounge

    const cityCosts = {
      experience: experiencePrice,
      transport: 30, // Round-trip to city
      food: 20, // Local food
      total: 0,
      timeValue: layoverHours * 25, // Positive value for adventure
    }
    cityCosts.total = cityCosts.experience + cityCosts.transport + cityCosts.food

    const savings = {
      amount: airportCosts.total - cityCosts.total,
      percentage: Math.round(((airportCosts.total - cityCosts.total) / airportCosts.total) * 100),
      experienceGain: cityCosts.timeValue - airportCosts.timeValue,
    }

    setArbitrageData({
      airport: airportCosts,
      city: cityCosts,
      savings,
    })
  }, [layoverHours, experiencePrice])

  useEffect(() => {
    // Animate savings counter
    if (arbitrageData && isRevealed) {
      const target = arbitrageData.savings.amount
      const duration = 1500
      const steps = 30
      const increment = target / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setAnimatedSavings(target)
          clearInterval(timer)
        } else {
          setAnimatedSavings(current)
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [arbitrageData, isRevealed])

  if (!arbitrageData) return null

  const getArbitrageLevel = () => {
    const percentage = arbitrageData.savings.percentage
    if (percentage > 40) return { level: "INSANE", color: "text-purple-600", icon: Zap }
    if (percentage > 25) return { level: "AMAZING", color: "text-green-600", icon: TrendingUp }
    if (percentage > 10) return { level: "GREAT", color: "text-blue-600", icon: CheckCircle }
    return { level: "GOOD", color: "text-gray-600", icon: Coffee }
  }

  const arbitrageLevel = getArbitrageLevel()

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            Layover Arbitrage Calculator™
          </CardTitle>
          <Badge className="bg-green-600 text-white">Skiplagged Mode</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          The travel hack airlines don't want you to know
        </p>
      </CardHeader>

      <CardContent className="pt-6">
        {/* The Reveal */}
        {!isRevealed ? (
          <div className="text-center py-8">
            <Lock className="h-12 w-12 text-amber-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Unlock Your {layoverHours}-Hour {city} Arbitrage
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Discover how much you're overpaying at {airportCode} airport
            </p>
            <Button
              onClick={() => setIsRevealed(true)}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              <Unlock className="h-4 w-4 mr-2" />
              Reveal The Hack
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Arbitrage Level */}
            <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
              <arbitrageLevel.icon className={cn("h-8 w-8 mx-auto mb-2", arbitrageLevel.color)} />
              <div className={cn("text-2xl font-bold", arbitrageLevel.color)}>
                {arbitrageLevel.level} ARBITRAGE OPPORTUNITY
              </div>
              <div className="text-3xl font-bold mt-2">
                Save ${Math.round(animatedSavings)} ({arbitrageData.savings.percentage}%)
              </div>
            </div>

            {/* Airport vs City Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Airport Column */}
              <div className="space-y-3">
                <div className="text-center">
                  <Badge variant="destructive" className="mb-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Airport Trap
                  </Badge>
                  <h4 className="font-semibold">Staying at {airportCode}</h4>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Utensils className="h-3 w-3" />
                      Overpriced Food
                    </span>
                    <span className="font-medium text-red-600">${arbitrageData.airport.food}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3" />
                      Duty-Free Temptation
                    </span>
                    <span className="font-medium text-red-600">
                      ${arbitrageData.airport.shopping}
                    </span>
                  </div>
                  {arbitrageData.airport.lounge > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Coffee className="h-3 w-3" />
                        Lounge Access
                      </span>
                      <span className="font-medium text-red-600">
                        ${arbitrageData.airport.lounge}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Cost</span>
                      <span className="font-bold text-red-600 text-lg">
                        ${arbitrageData.airport.total}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Experience Value: Boredom 😴
                    </div>
                  </div>
                </div>
              </div>

              {/* City Column */}
              <div className="space-y-3">
                <div className="text-center">
                  <Badge className="mb-2 bg-green-600 text-white">
                    <Trophy className="h-3 w-3 mr-1" />
                    City Adventure
                  </Badge>
                  <h4 className="font-semibold">Exploring {city}</h4>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Premium Experience
                    </span>
                    <span className="font-medium text-green-600">
                      ${arbitrageData.city.experience}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Plane className="h-3 w-3" />
                      Transport
                    </span>
                    <span className="font-medium text-green-600">
                      ${arbitrageData.city.transport}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Utensils className="h-3 w-3" />
                      Local Food
                    </span>
                    <span className="font-medium text-green-600">${arbitrageData.city.food}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Cost</span>
                      <span className="font-bold text-green-600 text-lg">
                        ${arbitrageData.city.total}
                      </span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Experience Value: Unforgettable 🎉
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Value Comparison Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Experience Value Gained</span>
                <span className="font-medium text-green-600">
                  +{arbitrageData.savings.experienceGain} points
                </span>
              </div>
              <Progress value={80} className="h-3 bg-gray-200" />
            </div>

            {/* The Hack Message */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-purple-900">The Skiplagged Secret</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    Airlines expect you to spend ${arbitrageData.airport.total} at the airport.
                    Instead, escape to {city} for ${arbitrageData.city.total} and get an actual
                    adventure. You save ${Math.round(arbitrageData.savings.amount)} AND gain a story
                    worth telling.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3">
              <Button className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                <TrendingUp className="h-4 w-4 mr-2" />
                Hack This Layover
              </Button>
              <Button variant="outline">
                <DollarSign className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
