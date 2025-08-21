"use client"

import type React from "react"
import { SearchAutocomplete } from "@/components/search-autocomplete"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plane, CalendarIcon, Users, ArrowRight, Settings } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface SearchFormData {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  children: number
  infants: number
  cabinClass: string
  isRoundTrip: boolean
  preferLayovers: boolean
}

interface FlightSearchFormProps {
  onSearch: (params: any) => void
  isLoading: boolean
  initialValues?: any
}

export function FlightSearchForm({
  onSearch,
  isLoading,
  initialValues = {},
}: FlightSearchFormProps) {
  const [formData, setFormData] = useState<SearchFormData>({
    origin: initialValues.origin || "",
    destination: initialValues.destination || "",
    departureDate: initialValues.departureDate || "",
    returnDate: initialValues.returnDate || "",
    adults: Number.parseInt(initialValues.adults) || 1,
    children: Number.parseInt(initialValues.children) || 0,
    infants: Number.parseInt(initialValues.infants) || 0,
    cabinClass: initialValues.cabinClass || "economy",
    isRoundTrip: !!initialValues.returnDate,
    preferLayovers: true, // Always prefer layovers for LayoverHQ
  })

  const [departureCalendarOpen, setDepartureCalendarOpen] = useState(false)
  const [returnCalendarOpen, setReturnCalendarOpen] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleInputChange = (field: keyof SearchFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const searchParams = {
      origin: formData.origin,
      destination: formData.destination,
      departureDate: formData.departureDate,
      ...(formData.isRoundTrip && formData.returnDate && { returnDate: formData.returnDate }),
      adults: formData.adults.toString(),
      children: formData.children.toString(),
      infants: formData.infants.toString(),
      cabinClass: formData.cabinClass,
    }

    onSearch(searchParams)
  }

  const totalPassengers = formData.adults + formData.children + formData.infants

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Trip Type Toggle */}
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="round-trip"
            checked={formData.isRoundTrip}
            onCheckedChange={(checked) => handleInputChange("isRoundTrip", checked)}
          />
          <Label htmlFor="round-trip" className="body-font">
            Round Trip
          </Label>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          <Plane className="h-3 w-3 mr-1" />
          Layover Optimized
        </Badge>
      </div>

      {/* Main Search Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Origin */}
        <div className="space-y-2">
          <Label htmlFor="origin" className="body-font">
            From
          </Label>
          <SearchAutocomplete
            id="origin"
            placeholder="Origin city or airport"
            value={formData.origin}
            onChange={(value) => handleInputChange("origin", value)}
            className="bg-input border-border"
          />
        </div>

        {/* Destination */}
        <div className="space-y-2">
          <Label htmlFor="destination" className="body-font">
            To
          </Label>
          <SearchAutocomplete
            id="destination"
            placeholder="Destination city or airport"
            value={formData.destination}
            onChange={(value) => handleInputChange("destination", value)}
            className="bg-input border-border"
          />
        </div>

        {/* Departure Date */}
        <div className="space-y-2">
          <Label className="body-font">Departure</Label>
          <Popover open={departureCalendarOpen} onOpenChange={setDepartureCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-input border-border",
                  !formData.departureDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.departureDate
                  ? format(new Date(formData.departureDate), "MMM dd, yyyy")
                  : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.departureDate ? new Date(formData.departureDate) : undefined}
                onSelect={(date) => {
                  if (date) {
                    handleInputChange("departureDate", format(date, "yyyy-MM-dd"))
                    setDepartureCalendarOpen(false)
                  }
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Return Date */}
        {formData.isRoundTrip && (
          <div className="space-y-2">
            <Label className="body-font">Return</Label>
            <Popover open={returnCalendarOpen} onOpenChange={setReturnCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-input border-border",
                    !formData.returnDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.returnDate
                    ? format(new Date(formData.returnDate), "MMM dd, yyyy")
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.returnDate ? new Date(formData.returnDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      handleInputChange("returnDate", format(date, "yyyy-MM-dd"))
                      setReturnCalendarOpen(false)
                    }
                  }}
                  disabled={(date) => {
                    if (date < new Date()) return true
                    if (formData.departureDate && date <= new Date(formData.departureDate))
                      return true
                    return false
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Passengers and Class */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="body-font">Passengers</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start bg-input border-border">
                <Users className="mr-2 h-4 w-4" />
                {totalPassengers} {totalPassengers === 1 ? "Passenger" : "Passengers"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-font font-medium">Adults</p>
                    <p className="body-font text-sm text-muted-foreground">12+ years</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange("adults", Math.max(1, formData.adults - 1))}
                      disabled={formData.adults <= 1}
                    >
                      -
                    </Button>
                    <span className="body-font w-8 text-center">{formData.adults}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange("adults", Math.min(9, formData.adults + 1))}
                      disabled={formData.adults >= 9}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-font font-medium">Children</p>
                    <p className="body-font text-sm text-muted-foreground">2-11 years</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleInputChange("children", Math.max(0, formData.children - 1))
                      }
                      disabled={formData.children <= 0}
                    >
                      -
                    </Button>
                    <span className="body-font w-8 text-center">{formData.children}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleInputChange("children", Math.min(9, formData.children + 1))
                      }
                      disabled={formData.children >= 9}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="body-font font-medium">Infants</p>
                    <p className="body-font text-sm text-muted-foreground">Under 2 years</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleInputChange("infants", Math.max(0, formData.infants - 1))
                      }
                      disabled={formData.infants <= 0}
                    >
                      -
                    </Button>
                    <span className="body-font w-8 text-center">{formData.infants}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleInputChange(
                          "infants",
                          Math.min(formData.adults, formData.infants + 1),
                        )
                      }
                      disabled={formData.infants >= formData.adults}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="body-font">Cabin Class</Label>
          <Select
            value={formData.cabinClass}
            onValueChange={(value) => handleInputChange("cabinClass", value)}
          >
            <SelectTrigger className="bg-input border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="premium_economy">Premium Economy</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="first">First Class</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <div className="flex items-center justify-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4 mr-2" />
          {showAdvanced ? "Hide" : "Show"} Advanced Options
        </Button>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
          <h3 className="heading-font text-sm font-medium">Layover Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="body-font text-sm">Minimum Layover Duration</Label>
              <Select defaultValue="120">
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="body-font text-sm">Maximum Layover Duration</Label>
              <Select defaultValue="720">
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="480">8 hours</SelectItem>
                  <SelectItem value="720">12 hours</SelectItem>
                  <SelectItem value="1440">24 hours</SelectItem>
                  <SelectItem value="2880">48 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Search Button */}
      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
        disabled={isLoading || !formData.origin || !formData.destination || !formData.departureDate}
      >
        {isLoading ? (
          "Searching..."
        ) : (
          <>
            Search Layover Flights
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </form>
  )
}
