"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, DollarSign, Star, MapPin, ExternalLink, Activity } from "lucide-react"
import { PerformanceOptimizedImage } from "@/components/performance-optimized-image"

interface Experience {
  productCode: string
  title: string
  description: string
  duration?: string
  price: {
    amount: number
    currency: string
  }
  images: Array<{
    url: string
    caption?: string
  }>
  rating?: number
  reviewCount?: number
  location: {
    city: string
    country: string
  }
  highlights?: string[]
}

interface LayoverExperiencesProps {
  city: string
  maxDurationHours?: number
  className?: string
}

export function LayoverExperiences({
  city,
  maxDurationHours = 6,
  className,
}: LayoverExperiencesProps) {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchExperiences()
  }, [city, maxDurationHours])

  const fetchExperiences = async () => {
    try {
      setLoading(true)
      setError(null)

      // Always use mock data for now since Viator API is having issues
      const response = await fetch(
        `/api/experiences/search?city=${encodeURIComponent(city)}&maxDurationHours=${maxDurationHours}&mock=true`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch experiences")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to load experiences")
      }

      setExperiences(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load experiences")
      console.error("Error fetching experiences:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Unable to load experiences: {error}</p>
            <Button onClick={fetchExperiences} variant="outline" className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (experiences.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="pt-6 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No experiences available for {city} at this time.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recommended Layover Experiences in {city}
        </h3>
        <p className="text-muted-foreground text-sm mt-1">
          Perfect activities for your {maxDurationHours}-hour layover
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {experiences.slice(0, 6).map((experience) => (
          <Card
            key={experience.productCode}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            {experience.images?.[0] && (
              <div className="relative h-48 overflow-hidden">
                <PerformanceOptimizedImage
                  src={experience.images[0].url}
                  alt={experience.title}
                  fill
                  className="object-cover"
                />
                {experience.duration && (
                  <Badge className="absolute top-2 right-2 bg-background/90">
                    <Clock className="h-3 w-3 mr-1" />
                    {experience.duration}
                  </Badge>
                )}
              </div>
            )}

            <CardHeader className="pb-3">
              <CardTitle className="text-lg line-clamp-2">{experience.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {experience.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span>{experience.rating.toFixed(1)}</span>
                    {experience.reviewCount && (
                      <span className="text-xs">({experience.reviewCount})</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{experience.location.city}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <CardDescription className="line-clamp-3 mb-4">
                {experience.description}
              </CardDescription>

              {experience.highlights && experience.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {experience.highlights.slice(0, 3).map((highlight, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {experience.price.currency} {experience.price.amount.toFixed(2)}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => {
                    // In production, this would link to Viator booking
                    window.open(`https://www.viator.com/tours/${experience.productCode}`, "_blank")
                  }}
                >
                  View Details
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {experiences.length > 6 && (
        <div className="mt-6 text-center">
          <Button variant="outline">
            View All {experiences.length} Experiences in {city}
          </Button>
        </div>
      )}
    </div>
  )
}
