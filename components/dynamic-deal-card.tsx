"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PerformanceOptimizedImage } from "@/components/performance-optimized-image"
import {
  Clock,
  Star,
  TrendingUp,
  Zap,
  Sun,
  Shield,
  ArrowRight,
  Plane,
  Activity,
  DollarSign,
  Calendar,
  Users,
  Heart,
} from "lucide-react"
import type { LayoverRecommendation } from "@/lib/recommendations/engine"
import { cn } from "@/lib/utils"

interface DynamicDealCardProps {
  recommendation: LayoverRecommendation
  className?: string
  onBook?: (recommendation: LayoverRecommendation) => void
  onSave?: (recommendation: LayoverRecommendation) => void
}

export function DynamicDealCard({
  recommendation,
  className,
  onBook,
  onSave,
}: DynamicDealCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [viewCount, setViewCount] = useState(Math.floor(Math.random() * 30) + 10)

  // Simulate real-time updates
  useEffect(() => {
    // Update view count periodically
    const viewInterval = setInterval(() => {
      setViewCount((prev) => prev + Math.floor(Math.random() * 3))
    }, 30000) // Every 30 seconds

    // Calculate time left for deal
    const dealExpiry = new Date()
    dealExpiry.setHours(dealExpiry.getHours() + 24) // 24 hours from now

    const timerInterval = setInterval(() => {
      const now = new Date()
      const diff = dealExpiry.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("Expired")
        clearInterval(timerInterval)
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`${hours}h ${minutes}m`)
      }
    }, 60000) // Update every minute

    return () => {
      clearInterval(viewInterval)
      clearInterval(timerInterval)
    }
  }, [])

  const urgencyColor = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-green-500",
  }

  const urgencyText = {
    high: "Limited Availability",
    medium: "Good Deal",
    low: "Available",
  }

  return (
    <Card
      className={cn(
        "group overflow-hidden hover:shadow-2xl transition-all duration-300",
        className,
      )}
    >
      {/* Image Section with Overlay Info */}
      <div className="relative h-64 overflow-hidden">
        <PerformanceOptimizedImage
          src={recommendation.destination.image}
          alt={recommendation.destination.city}
          fill
          className="group-hover:scale-110 transition-transform duration-500"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className={cn("text-white", urgencyColor[recommendation.urgency])}>
            <Zap className="h-3 w-3 mr-1" />
            {urgencyText[recommendation.urgency]}
          </Badge>
          {recommendation.score > 85 && (
            <Badge className="bg-purple-600 text-white">
              <TrendingUp className="h-3 w-3 mr-1" />
              Top Pick
            </Badge>
          )}
          {!recommendation.visaRequired && (
            <Badge className="bg-green-600 text-white">
              <Shield className="h-3 w-3 mr-1" />
              No Visa
            </Badge>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={() => {
            setIsLiked(!isLiked)
            onSave?.(recommendation)
          }}
          className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
        >
          <Heart className={cn("h-5 w-5", isLiked ? "fill-red-500 text-red-500" : "text-white")} />
        </button>

        {/* Destination Info */}
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-2xl font-bold mb-1">
            {recommendation.destination.city}, {recommendation.destination.country}
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Plane className="h-4 w-4" />
              {recommendation.destination.airportCode}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {recommendation.flight.layoverDuration}
            </span>
            <span className="flex items-center gap-1">
              <Sun className="h-4 w-4" />
              {recommendation.weatherScore}°
            </span>
          </div>
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs text-gray-600">From</div>
          <div className="text-2xl font-bold text-gray-900">${recommendation.flight.price}</div>
          <div className="text-xs text-green-600 font-medium">
            Save ${recommendation.bundle.savings.toFixed(0)}
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Reasons */}
        <div className="mb-4">
          {recommendation.reasons.slice(0, 2).map((reason, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{reason}</span>
            </div>
          ))}
        </div>

        {/* Top Experiences */}
        <div className="mb-4">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Top Layover Experiences
          </h4>
          <div className="space-y-2">
            {recommendation.experiences.slice(0, 2).map((exp, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <div className="font-medium truncate">{exp.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {exp.duration}
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {exp.rating}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${exp.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bundle Pricing */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Flight + Experiences Bundle</span>
            <Badge className="bg-green-600 text-white">
              {recommendation.bundle.savingsPercentage}% OFF
            </Badge>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-muted-foreground line-through">
                ${(recommendation.bundle.totalPrice + recommendation.bundle.savings).toFixed(0)}
              </div>
              <div className="text-2xl font-bold text-orange-600">
                ${recommendation.bundle.totalPrice.toFixed(0)}
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {viewCount} viewing
              </div>
              {timeLeft && (
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {timeLeft} left
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-gradient-to-r from-qr-burgundy to-amber-600 hover:from-qr-burgundy/90 hover:to-amber-600/90 text-white"
            onClick={() => onBook?.(recommendation)}
          >
            Book Bundle
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            className="border-qr-burgundy text-qr-burgundy hover:bg-qr-burgundy hover:text-white"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Free cancellation
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Price match guarantee
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
