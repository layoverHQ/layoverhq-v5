"use client"

import { useState, useEffect } from "react"
import { DynamicDealCard } from "@/components/dynamic-deal-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TrendingUp,
  Sparkles,
  Globe,
  DollarSign,
  Clock,
  RefreshCw,
  Filter,
  MapPin,
} from "lucide-react"
import type { LayoverRecommendation } from "@/lib/recommendations/engine"

interface DynamicRecommendationsSectionProps {
  origin?: string
  className?: string
}

export function DynamicRecommendationsSection({
  origin = "NYC",
  className,
}: DynamicRecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<LayoverRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [budget, setBudget] = useState("economy")
  const [sortBy, setSortBy] = useState("score")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchRecommendations()
  }, [origin, budget])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/recommendations?origin=${origin}&budget=${budget}&limit=6`)

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations")
      }

      const data = await response.json()

      if (data.success) {
        setRecommendations(data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recommendations")
      console.error("Error fetching recommendations:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchRecommendations()
  }

  const handleSort = (value: string) => {
    setSortBy(value)
    const sorted = [...recommendations].sort((a, b) => {
      switch (value) {
        case "price":
          return a.flight.price - b.flight.price
        case "duration":
          return parseInt(a.flight.layoverDuration) - parseInt(b.flight.layoverDuration)
        case "score":
        default:
          return b.score - a.score
      }
    })
    setRecommendations(sorted)
  }

  const handleBook = (recommendation: LayoverRecommendation) => {
    console.log("Booking:", recommendation)
    // Implement booking logic
    window.open(
      `/booking?destination=${recommendation.destination.city}&id=${recommendation.id}`,
      "_blank",
    )
  }

  const handleSave = (recommendation: LayoverRecommendation) => {
    console.log("Saved:", recommendation)
    // Implement save logic
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[500px] rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchRecommendations}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <section className={className}>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-qr-burgundy to-amber-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-qr-burgundy to-amber-600 bg-clip-text text-transparent">
              Smart Layover Deals for You
            </h2>
            <Badge className="bg-green-100 text-green-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              Live Prices
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Personalized recommendations from {origin} • Updated every 30 minutes
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <Select value={budget} onValueChange={setBudget}>
            <SelectTrigger className="w-32">
              <DollarSign className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSort}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Best Match</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className={refreshing ? "animate-spin" : ""}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Avg. Savings</p>
              <p className="text-2xl font-bold text-blue-900">
                $
                {Math.round(
                  recommendations.reduce((acc, r) => acc + r.bundle.savings, 0) /
                    recommendations.length || 0,
                )}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium">Top Destination</p>
              <p className="text-2xl font-bold text-green-900">
                {recommendations[0]?.destination.city || "Loading"}
              </p>
            </div>
            <Globe className="h-8 w-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-medium">Best Deal</p>
              <p className="text-2xl font-bold text-purple-900">
                {recommendations[0]?.bundle.savingsPercentage || 0}% OFF
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-medium">Avg. Layover</p>
              <p className="text-2xl font-bold text-amber-900">8 hours</p>
            </div>
            <Clock className="h-8 w-8 text-amber-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((recommendation) => (
          <DynamicDealCard
            key={recommendation.id}
            recommendation={recommendation}
            onBook={handleBook}
            onSave={handleSave}
          />
        ))}
      </div>

      {/* Load More */}
      {recommendations.length > 0 && (
        <div className="text-center mt-12">
          <Button
            variant="outline"
            size="lg"
            className="border-qr-burgundy text-qr-burgundy hover:bg-qr-burgundy hover:text-white"
          >
            Show More Deals
            <TrendingUp className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </section>
  )
}
