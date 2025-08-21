"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  Clock,
  Star,
  Filter,
  Search,
  Camera,
  Coffee,
  Bed,
  Utensils,
  Car,
  Plane,
  ArrowRight,
  Heart,
  Share2,
} from "lucide-react"
import Link from "next/link"

interface Experience {
  id: string
  name: string
  description: string
  duration_hours: number
  price: number
  includes: string[]
  provider: string
  airport: {
    code: string
    name: string
    city: string
    country: string
  }
  category: string
  rating: number
  reviews: number
  images: string[]
  availability: string
}

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    airport: "",
    category: "",
    minDuration: "",
    maxDuration: "",
    maxPrice: "",
  })
  const [searchQuery, setSearchQuery] = useState("")

  const searchParams = useSearchParams()
  const airportParam = searchParams.get("airport")
  const durationParam = searchParams.get("duration")

  useEffect(() => {
    // Set initial filters from URL params
    if (airportParam) {
      setFilters((prev) => ({ ...prev, airport: airportParam }))
    }
    if (durationParam) {
      const duration = Number.parseInt(durationParam)
      setFilters((prev) => ({
        ...prev,
        minDuration: Math.max(2, Math.floor(duration / 60) - 2).toString(),
        maxDuration: Math.min(24, Math.ceil(duration / 60) + 2).toString(),
      }))
    }

    fetchExperiences()
  }, [airportParam, durationParam])

  const fetchExperiences = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.airport) params.append("airport", filters.airport)
      if (filters.minDuration) params.append("minDuration", filters.minDuration)
      if (filters.maxDuration) params.append("maxDuration", filters.maxDuration)
      if (filters.category) params.append("category", filters.category)

      const response = await fetch(`/api/v1/layovers/packages?${params}`)
      const data = await response.json()

      if (data.success) {
        // Transform the data to match our interface
        const transformedExperiences = data.data.map((pkg: any) => ({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          duration_hours: pkg.duration_hours,
          price: pkg.price,
          includes: pkg.includes || [],
          provider: pkg.provider || "LayoverHQ",
          airport: pkg.airport || {
            code: "DOH",
            name: "Hamad International",
            city: "Doha",
            country: "Qatar",
          },
          category: pkg.name.toLowerCase().includes("tour")
            ? "tours"
            : pkg.name.toLowerCase().includes("lounge")
              ? "lounges"
              : pkg.name.toLowerCase().includes("spa")
                ? "wellness"
                : "other",
          rating: 4.2 + Math.random() * 0.6, // Mock rating
          reviews: Math.floor(Math.random() * 500) + 50,
          images: [`/placeholder.svg?height=200&width=300&query=${encodeURIComponent(pkg.name)}`],
          availability: "available",
        }))

        setExperiences(transformedExperiences)
      }
    } catch (error) {
      console.error("Failed to fetch experiences:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExperiences = experiences.filter((exp) => {
    if (
      searchQuery &&
      !exp.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !exp.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }
    if (filters.category && exp.category !== filters.category) return false
    if (filters.maxPrice && exp.price > Number.parseInt(filters.maxPrice)) return false
    return true
  })

  const categories = [
    { id: "tours", name: "City Tours", icon: Camera },
    { id: "lounges", name: "Lounges", icon: Coffee },
    { id: "wellness", name: "Spa & Wellness", icon: Bed },
    { id: "dining", name: "Dining", icon: Utensils },
    { id: "transport", name: "Transportation", icon: Car },
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Plane className="h-6 w-6" />
              <span className="heading-font text-xl">LayoverHQ</span>
            </Link>
            <div className="text-center">
              <h1 className="heading-font text-2xl text-foreground">Layover Experiences</h1>
              <p className="body-font text-muted-foreground">Turn your layover into an adventure</p>
            </div>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <label className="body-font text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Search experiences..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Airport */}
                <div>
                  <label className="body-font text-sm font-medium mb-2 block">Airport</label>
                  <Select
                    value={filters.airport}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, airport: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select airport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Airports</SelectItem>
                      <SelectItem value="DOH">Doha (DOH)</SelectItem>
                      <SelectItem value="DXB">Dubai (DXB)</SelectItem>
                      <SelectItem value="IST">Istanbul (IST)</SelectItem>
                      <SelectItem value="SIN">Singapore (SIN)</SelectItem>
                      <SelectItem value="AMS">Amsterdam (AMS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div>
                  <label className="body-font text-sm font-medium mb-2 block">Category</label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="body-font text-sm font-medium mb-2 block">Min Hours</label>
                    <Select
                      value={filters.minDuration}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, minDuration: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="2">2h</SelectItem>
                        <SelectItem value="4">4h</SelectItem>
                        <SelectItem value="6">6h</SelectItem>
                        <SelectItem value="8">8h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="body-font text-sm font-medium mb-2 block">Max Hours</label>
                    <Select
                      value={filters.maxDuration}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, maxDuration: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Max" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="6">6h</SelectItem>
                        <SelectItem value="12">12h</SelectItem>
                        <SelectItem value="24">24h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="body-font text-sm font-medium mb-2 block">Max Price</label>
                  <Select
                    value={filters.maxPrice}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, maxPrice: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Price</SelectItem>
                      <SelectItem value="50">Under $50</SelectItem>
                      <SelectItem value="100">Under $100</SelectItem>
                      <SelectItem value="200">Under $200</SelectItem>
                      <SelectItem value="500">Under $500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={fetchExperiences}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Apply Filters
                </Button>
              </CardContent>
            </Card>

            {/* Popular Categories */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Popular Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setFilters((prev) => ({ ...prev, category: category.id }))}
                  >
                    <category.icon className="h-4 w-4 mr-2" />
                    {category.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="heading-font text-xl">
                  {filteredExperiences.length} Experience
                  {filteredExperiences.length !== 1 ? "s" : ""} Available
                </h2>
                {filters.airport && (
                  <p className="body-font text-muted-foreground">
                    Showing experiences for {filters.airport}
                  </p>
                )}
              </div>
            </div>

            {/* Category Tabs */}
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="bg-card border-border animate-pulse">
                        <div className="h-48 bg-muted rounded-t-lg"></div>
                        <CardContent className="p-4 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-full"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredExperiences.map((experience) => (
                      <ExperienceCard key={experience.id} experience={experience} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {categories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredExperiences
                      .filter((exp) => exp.category === category.id)
                      .map((experience) => (
                        <ExperienceCard key={experience.id} experience={experience} />
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {filteredExperiences.length === 0 && !loading && (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="heading-font text-lg mb-2">No experiences found</h3>
                  <p className="body-font text-muted-foreground mb-4">
                    Try adjusting your filters or search for a different location.
                  </p>
                  <Button
                    onClick={() =>
                      setFilters({
                        airport: "",
                        category: "",
                        minDuration: "",
                        maxDuration: "",
                        maxPrice: "",
                      })
                    }
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ExperienceCard({ experience }: { experience: Experience }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  return (
    <Card className="bg-card border-border hover:shadow-md transition-shadow group">
      <div className="relative">
        <img
          src={experience.images[0] || "/placeholder.svg"}
          alt={experience.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <div className="absolute top-2 right-2 flex space-x-1">
          <Button size="sm" variant="ghost" className="bg-white/80 hover:bg-white">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="bg-white/80 hover:bg-white">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        <Badge className="absolute bottom-2 left-2 bg-primary text-primary-foreground">
          {formatPrice(experience.price)}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="heading-font font-medium line-clamp-2 group-hover:text-primary transition-colors">
              {experience.name}
            </h3>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>{experience.airport.city}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{experience.duration_hours}h</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{experience.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <p className="body-font text-sm text-muted-foreground line-clamp-2">
          {experience.description}
        </p>

        {experience.includes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {experience.includes.slice(0, 3).map((item, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
            {experience.includes.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{experience.includes.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">by {experience.provider}</div>

          <Link href={`/experiences/${experience.id}`}>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Book Now
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
