"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Users, ArrowRight, MapPin, Clock } from "lucide-react"
import { format } from "date-fns"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobileFlightSearchProps {
  onSearch: (params: any) => void
  isLoading?: boolean
}

export function MobileFlightSearch({ onSearch, isLoading = false }: MobileFlightSearchProps) {
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    adults: 1,
    children: 0,
    infants: 0,
    isRoundTrip: false,
  })

  const [showCalendar, setShowCalendar] = useState<"departure" | "return" | null>(null)
  const [showPassengers, setShowPassengers] = useState(false)
  const isMobile = useIsMobile()

  if (!isMobile) return null

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onSearch({
      origin: formData.origin,
      destination: formData.destination,
      departureDate: formData.departureDate,
      returnDate: formData.isRoundTrip ? formData.returnDate : undefined,
      adults: formData.adults,
      children: formData.children,
      infants: formData.infants,
      cabinClass: "economy",
      preferLayovers: true,
    })
  }

  const totalPassengers = formData.adults + formData.children + formData.infants

  return (
    <Card className="mx-4 -mt-8 relative z-10 shadow-lg">
      <CardContent className="p-4 space-y-4">
        {/* Trip Type Toggle */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={!formData.isRoundTrip ? "default" : "ghost"}
              size="sm"
              onClick={() => handleInputChange("isRoundTrip", false)}
              className="text-xs"
            >
              One Way
            </Button>
            <Button
              variant={formData.isRoundTrip ? "default" : "ghost"}
              size="sm"
              onClick={() => handleInputChange("isRoundTrip", true)}
              className="text-xs"
            >
              Round Trip
            </Button>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Layover Optimized
          </Badge>
        </div>

        {/* Origin & Destination */}
        <div className="space-y-3">
          <div className="relative">
            <Label className="text-sm font-medium mb-1 block">From</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Origin city or airport"
                value={formData.origin}
                onChange={(e) => handleInputChange("origin", e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>

          <div className="relative">
            <Label className="text-sm font-medium mb-1 block">To</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Destination city or airport"
                value={formData.destination}
                onChange={(e) => handleInputChange("destination", e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className={`grid ${formData.isRoundTrip ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
          <div>
            <Label className="text-sm font-medium mb-1 block">Departure</Label>
            <Sheet
              open={showCalendar === "departure"}
              onOpenChange={(open) => setShowCalendar(open ? "departure" : null)}
            >
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-start text-left bg-transparent"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.departureDate
                    ? format(new Date(formData.departureDate), "MMM dd")
                    : "Select date"}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[400px]">
                <div className="py-4">
                  <h3 className="text-lg font-semibold mb-4">Select Departure Date</h3>
                  <Calendar
                    mode="single"
                    selected={formData.departureDate ? new Date(formData.departureDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleInputChange("departureDate", format(date, "yyyy-MM-dd"))
                        setShowCalendar(null)
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {formData.isRoundTrip && (
            <div>
              <Label className="text-sm font-medium mb-1 block">Return</Label>
              <Sheet
                open={showCalendar === "return"}
                onOpenChange={(open) => setShowCalendar(open ? "return" : null)}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-start text-left bg-transparent"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.returnDate
                      ? format(new Date(formData.returnDate), "MMM dd")
                      : "Select date"}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[400px]">
                  <div className="py-4">
                    <h3 className="text-lg font-semibold mb-4">Select Return Date</h3>
                    <Calendar
                      mode="single"
                      selected={formData.returnDate ? new Date(formData.returnDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          handleInputChange("returnDate", format(date, "yyyy-MM-dd"))
                          setShowCalendar(null)
                        }
                      }}
                      disabled={(date) => {
                        if (date < new Date()) return true
                        if (formData.departureDate && date <= new Date(formData.departureDate))
                          return true
                        return false
                      }}
                      className="rounded-md border"
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>

        {/* Passengers */}
        <div>
          <Label className="text-sm font-medium mb-1 block">Passengers</Label>
          <Sheet open={showPassengers} onOpenChange={setShowPassengers}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full h-12 justify-start bg-transparent">
                <Users className="mr-2 h-4 w-4" />
                {totalPassengers} {totalPassengers === 1 ? "Passenger" : "Passengers"}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[350px]">
              <div className="py-4 space-y-6">
                <h3 className="text-lg font-semibold">Select Passengers</h3>

                {/* Adults */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Adults</p>
                    <p className="text-sm text-muted-foreground">12+ years</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange("adults", Math.max(1, formData.adults - 1))}
                      disabled={formData.adults <= 1}
                      className="h-8 w-8 p-0"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-medium">{formData.adults}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange("adults", Math.min(9, formData.adults + 1))}
                      disabled={formData.adults >= 9}
                      className="h-8 w-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Children</p>
                    <p className="text-sm text-muted-foreground">2-11 years</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleInputChange("children", Math.max(0, formData.children - 1))
                      }
                      disabled={formData.children <= 0}
                      className="h-8 w-8 p-0"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-medium">{formData.children}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleInputChange("children", Math.min(9, formData.children + 1))
                      }
                      disabled={formData.children >= 9}
                      className="h-8 w-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Infants */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Infants</p>
                    <p className="text-sm text-muted-foreground">Under 2 years</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleInputChange("infants", Math.max(0, formData.infants - 1))
                      }
                      disabled={formData.infants <= 0}
                      className="h-8 w-8 p-0"
                    >
                      -
                    </Button>
                    <span className="w-8 text-center font-medium">{formData.infants}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleInputChange(
                          "infants",
                          Math.min(formData.adults, formData.infants + 1),
                        )
                      }
                      disabled={formData.infants >= formData.adults}
                      className="h-8 w-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <Button onClick={() => setShowPassengers(false)} className="w-full">
                  Done
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSubmit}
          disabled={
            isLoading || !formData.origin || !formData.destination || !formData.departureDate
          }
          className="w-full h-12 text-base font-medium"
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
      </CardContent>
    </Card>
  )
}
