'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Search, Filter, MapPin, Clock, DollarSign, Sparkles, Star, Heart, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AISearchQuery, AISearchResponse, AISearchFilters, EnhancedSearchResult } from '@/lib/services/ai-search-engine'

interface AISearchInterfaceProps {
  initialLocation?: string
  layoverDuration?: number
  onResultSelect?: (result: EnhancedSearchResult) => void
}

export function AISearchInterface({ 
  initialLocation = '', 
  layoverDuration = 6,
  onResultSelect 
}: AISearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState(initialLocation)
  const [results, setResults] = useState<AISearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Partial<AISearchFilters>>({
    budget: { min: 0, max: 200 },
    duration: { min: 1, max: 4 },
    activityLevel: 'moderate',
    travelStyle: 'solo',
    mood: 'culture',
    weather: 'flexible',
    transportation: 'public'
  })

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim() || !location.trim()) return

    setLoading(true)
    try {
      const searchRequest: AISearchQuery = {
        query: searchQuery,
        location: { city: location },
        timeConstraints: {
          layoverDuration,
          availableTime: layoverDuration - 2,
          bufferTime: 1
        },
        filters
      }

      const response = await fetch('/api/v1/search/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchRequest)
      })

      if (!response.ok) throw new Error('Search failed')

      const searchResults: AISearchResponse = await response.json()
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, location, layoverDuration, filters])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch()
    }
  }

  const updateFilter = (key: keyof AISearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}min`
    return `${hours}h`
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  const getPriceLevelColor = (level: string) => {
    switch (level) {
      case 'budget': return 'bg-green-100 text-green-800'
      case 'moderate': return 'bg-blue-100 text-blue-800'
      case 'premium': return 'bg-purple-100 text-purple-800'
      case 'luxury': return 'bg-gold-100 text-gold-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderFiltersPanel = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          AI Search Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Range */}
        <div>
          <Label className="text-sm font-medium">Budget Range</Label>
          <div className="mt-2">
            <Slider
              value={[filters.budget?.min || 0, filters.budget?.max || 200]}
              onValueChange={([min, max]) => updateFilter('budget', { min, max })}
              max={500}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>${filters.budget?.min || 0}</span>
              <span>${filters.budget?.max || 200}</span>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div>
          <Label className="text-sm font-medium">Duration (hours)</Label>
          <div className="mt-2">
            <Slider
              value={[filters.duration?.min || 1, filters.duration?.max || 4]}
              onValueChange={([min, max]) => updateFilter('duration', { min, max })}
              max={8}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{formatDuration(filters.duration?.min || 1)}</span>
              <span>{formatDuration(filters.duration?.max || 4)}</span>
            </div>
          </div>
        </div>

        {/* Mood Selection */}
        <div>
          <Label className="text-sm font-medium">Mood</Label>
          <Select
            value={filters.mood}
            onValueChange={(value) => updateFilter('mood', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adventure">🎢 Adventure</SelectItem>
              <SelectItem value="relaxation">🧘 Relaxation</SelectItem>
              <SelectItem value="culture">🏛️ Culture</SelectItem>
              <SelectItem value="food">🍜 Food</SelectItem>
              <SelectItem value="nightlife">🌃 Nightlife</SelectItem>
              <SelectItem value="nature">🌿 Nature</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity Level */}
        <div>
          <Label className="text-sm font-medium">Activity Level</Label>
          <Select
            value={filters.activityLevel}
            onValueChange={(value) => updateFilter('activityLevel', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">🚶 Low - Relaxed pace</SelectItem>
              <SelectItem value="moderate">🚴 Moderate - Balanced</SelectItem>
              <SelectItem value="high">🏃 High - Active</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Travel Style */}
        <div>
          <Label className="text-sm font-medium">Travel Style</Label>
          <Select
            value={filters.travelStyle}
            onValueChange={(value) => updateFilter('travelStyle', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solo">👤 Solo Travel</SelectItem>
              <SelectItem value="couple">💑 Couple</SelectItem>
              <SelectItem value="family">👨‍👩‍👧‍👦 Family</SelectItem>
              <SelectItem value="group">👥 Group</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Accessibility */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="accessibility"
            checked={filters.accessibility}
            onCheckedChange={(checked) => updateFilter('accessibility', checked)}
          />
          <Label htmlFor="accessibility" className="text-sm">
            Accessibility friendly
          </Label>
        </div>
      </CardContent>
    </Card>
  )

  const renderSearchResults = () => {
    if (!results) return null

    return (
      <div className="space-y-6">
        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Search Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {results.aiInsights.searchInterpretation}
            </p>
            
            {results.aiInsights.alternativeQueries.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Try these searches:</h4>
                <div className="flex flex-wrap gap-2">
                  {results.aiInsights.alternativeQueries.map((query, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery(query)}
                      className="text-xs"
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {results.aiInsights.locationInsights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Location Insights:</h4>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  {results.aiInsights.locationInsights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Results */}
        <div className="grid gap-4">
          {results.results.map((result) => (
            <Card key={result.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{result.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{result.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(result.duration.recommended)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {result.location.district || result.location.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatPrice(result.price.amount, result.price.currency)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getPriceLevelColor(result.price.priceLevel)}>
                        {result.price.priceLevel}
                      </Badge>
                      <Badge variant="secondary">{result.category}</Badge>
                      {result.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* AI Insights for this result */}
                    <div className="bg-purple-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-purple-800 mb-2">
                        <strong>Why recommended:</strong> {result.aiInsights.whyRecommended}
                      </p>
                      <p className="text-sm text-purple-700">
                        <strong>Perfect for:</strong> {result.aiInsights.perfectFor.join(', ')}
                      </p>
                    </div>

                    {/* Highlights */}
                    {result.highlights.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium mb-1">Highlights:</h4>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {result.highlights.map((highlight, index) => (
                            <li key={index}>{highlight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-2 ml-4">
                    <div className="text-center">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">
                          {(result.aiScore.relevance * 5).toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">AI Score</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {result.availability.instantBooking ? (
                      <span className="text-green-600">✓ Instant booking</span>
                    ) : (
                      <span>Booking confirmation required</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => onResultSelect?.(result)}
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Stats */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Found {results.totalCount} experiences</span>
              <span>Search completed in {results.searchTime}ms</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Search Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            AI-Powered Experience Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="What would you like to experience? (e.g., 'cultural sites near downtown', 'quick food tour', 'adventure activities')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full"
              />
            </div>
            <div className="w-48">
              <Input
                placeholder="City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={performSearch}
              disabled={loading || !searchQuery.trim() || !location.trim()}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {loading ? 'Searching...' : 'AI Search'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && renderFiltersPanel()}

      {/* Search Results */}
      {renderSearchResults()}
    </div>
  )
}