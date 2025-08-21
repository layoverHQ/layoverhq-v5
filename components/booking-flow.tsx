"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, Shield, MapPin, Plane } from "lucide-react"

interface FlightOffer {
  id: string
  source: string
  price: {
    total: number
    currency: string
    base: number
    taxes: number
  }
  itinerary: {
    outbound: FlightSegment[]
    inbound?: FlightSegment[]
  }
  layovers: LayoverInfo[]
  airline: {
    code: string
    name: string
  }
  duration: {
    outbound: string
    inbound?: string
  }
}

interface FlightSegment {
  id: string
  departure: {
    airport: string
    city: string
    country: string
    time: string
    timezone: string
  }
  arrival: {
    airport: string
    city: string
    country: string
    time: string
    timezone: string
  }
  airline: {
    code: string
    name: string
  }
  flightNumber: string
  aircraft: string
  duration: string
}

interface LayoverInfo {
  airport: string
  city: string
  country: string
  duration: number
  arrival: string
  departure: string
}

interface Passenger {
  id: string
  type: "adult" | "child" | "infant"
  title: string
  firstName: string
  lastName: string
  dateOfBirth: string
  email?: string
  phone?: string
}

interface BookingFlowProps {
  selectedFlight: FlightOffer
  onBack: () => void
  onComplete: (bookingData: any) => void
}

type BookingStep = "passenger-details" | "extras" | "payment" | "confirmation"

export function BookingFlow({ selectedFlight, onBack, onComplete }: BookingFlowProps) {
  const [currentStep, setCurrentStep] = useState<BookingStep>("passenger-details")
  const [passengers, setPassengers] = useState<Passenger[]>([])
  const [contactDetails, setContactDetails] = useState({
    email: "",
    phone: "",
    emergencyContact: "",
  })
  const [selectedExtras, setSelectedExtras] = useState<string[]>([])
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    billingAddress: {
      street: "",
      city: "",
      country: "",
      postalCode: "",
    },
  })

  const initializePassengers = () => {
    const newPassengers: Passenger[] = []
    // This would normally come from the search parameters
    for (let i = 0; i < 1; i++) {
      // Default to 1 adult for now
      newPassengers.push({
        id: `passenger-${i}`,
        type: "adult",
        title: "",
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        email: i === 0 ? contactDetails.email : undefined,
        phone: i === 0 ? contactDetails.phone : undefined,
      })
    }
    setPassengers(newPassengers)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+)H(\d+)M/)
    if (match) {
      return `${match[1]}h ${match[2]}m`
    }
    return duration
  }

  const calculateTotalPrice = () => {
    let total = selectedFlight.price.total

    // Add extras pricing
    selectedExtras.forEach((extra) => {
      switch (extra) {
        case "baggage":
          total += 50
          break
        case "seat-selection":
          total += 25
          break
        case "meal":
          total += 35
          break
        case "insurance":
          total += 45
          break
      }
    })

    return total
  }

  const handleStepComplete = () => {
    switch (currentStep) {
      case "passenger-details":
        setCurrentStep("extras")
        break
      case "extras":
        setCurrentStep("payment")
        break
      case "payment":
        setCurrentStep("confirmation")
        handleBookingComplete()
        break
    }
  }

  const handleBookingComplete = () => {
    const bookingData = {
      flight: selectedFlight,
      passengers,
      contactDetails,
      extras: selectedExtras,
      payment: paymentDetails,
      totalPrice: calculateTotalPrice(),
      bookingReference: `LHQ${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      bookingDate: new Date().toISOString(),
    }

    console.log("[v0] Booking completed:", bookingData)
    onComplete(bookingData)
  }

  const renderFlightSummary = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plane className="h-5 w-5" />
          Flight Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Outbound Flight */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline">Outbound</Badge>
              <span className="text-sm text-muted-foreground">
                {formatDate(selectedFlight.itinerary.outbound[0].departure.time)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="font-semibold">
                  {selectedFlight.itinerary.outbound[0].departure.airport}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedFlight.itinerary.outbound[0].departure.city}
                </div>
                <div className="font-medium">
                  {formatTime(selectedFlight.itinerary.outbound[0].departure.time)}
                </div>
              </div>

              <div className="flex-1 mx-4">
                <div className="text-center text-sm text-muted-foreground mb-1">
                  {formatDuration(selectedFlight.duration.outbound)}
                </div>
                <div className="border-t border-dashed"></div>
                <div className="text-center text-xs text-muted-foreground mt-1">
                  {selectedFlight.layovers.length > 0
                    ? `${selectedFlight.layovers.length} stop(s)`
                    : "Direct"}
                </div>
              </div>

              <div className="text-center">
                <div className="font-semibold">
                  {
                    selectedFlight.itinerary.outbound[selectedFlight.itinerary.outbound.length - 1]
                      .arrival.airport
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  {
                    selectedFlight.itinerary.outbound[selectedFlight.itinerary.outbound.length - 1]
                      .arrival.city
                  }
                </div>
                <div className="font-medium">
                  {formatTime(
                    selectedFlight.itinerary.outbound[selectedFlight.itinerary.outbound.length - 1]
                      .arrival.time,
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Layovers */}
          {selectedFlight.layovers.map((layover, index) => (
            <div key={index} className="bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">
                  {Math.floor(layover.duration / 60)}h {layover.duration % 60}m layover in{" "}
                  {layover.city}
                </span>
                <Badge variant="secondary" className="ml-auto">
                  Explore time
                </Badge>
              </div>
            </div>
          ))}

          {/* Return Flight */}
          {selectedFlight.itinerary.inbound && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">Return</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDate(selectedFlight.itinerary.inbound[0].departure.time)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="font-semibold">
                    {selectedFlight.itinerary.inbound[0].departure.airport}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedFlight.itinerary.inbound[0].departure.city}
                  </div>
                  <div className="font-medium">
                    {formatTime(selectedFlight.itinerary.inbound[0].departure.time)}
                  </div>
                </div>

                <div className="flex-1 mx-4">
                  <div className="text-center text-sm text-muted-foreground mb-1">
                    {selectedFlight.duration.inbound
                      ? formatDuration(selectedFlight.duration.inbound)
                      : ""}
                  </div>
                  <div className="border-t border-dashed"></div>
                  <div className="text-center text-xs text-muted-foreground mt-1">Direct</div>
                </div>

                <div className="text-center">
                  <div className="font-semibold">
                    {
                      selectedFlight.itinerary.inbound[selectedFlight.itinerary.inbound.length - 1]
                        .arrival.airport
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {
                      selectedFlight.itinerary.inbound[selectedFlight.itinerary.inbound.length - 1]
                        .arrival.city
                    }
                  </div>
                  <div className="font-medium">
                    {formatTime(
                      selectedFlight.itinerary.inbound[selectedFlight.itinerary.inbound.length - 1]
                        .arrival.time,
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderPassengerDetails = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Passenger Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {passengers.map((passenger, index) => (
            <div key={passenger.id} className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">
                Passenger {index + 1} ({passenger.type})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor={`title-${index}`}>Title</Label>
                  <Select
                    value={passenger.title}
                    onValueChange={(value) => {
                      const updated = [...passengers]
                      updated[index].title = value
                      setPassengers(updated)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Ms">Ms</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`firstName-${index}`}>First Name</Label>
                  <Input
                    id={`firstName-${index}`}
                    value={passenger.firstName}
                    onChange={(e) => {
                      const updated = [...passengers]
                      updated[index].firstName = e.target.value
                      setPassengers(updated)
                    }}
                    placeholder="First name"
                  />
                </div>

                <div>
                  <Label htmlFor={`lastName-${index}`}>Last Name</Label>
                  <Input
                    id={`lastName-${index}`}
                    value={passenger.lastName}
                    onChange={(e) => {
                      const updated = [...passengers]
                      updated[index].lastName = e.target.value
                      setPassengers(updated)
                    }}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor={`dob-${index}`}>Date of Birth</Label>
                <Input
                  id={`dob-${index}`}
                  type="date"
                  value={passenger.dateOfBirth}
                  onChange={(e) => {
                    const updated = [...passengers]
                    updated[index].dateOfBirth = e.target.value
                    setPassengers(updated)
                  }}
                />
              </div>
            </div>
          ))}

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Contact Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactDetails.email}
                  onChange={(e) => setContactDetails({ ...contactDetails, email: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={contactDetails.phone}
                  onChange={(e) => setContactDetails({ ...contactDetails, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderExtras = () => (
    <Card>
      <CardHeader>
        <CardTitle>Add Extras</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          {
            id: "baggage",
            name: "Extra Baggage",
            description: "Additional 23kg checked bag",
            price: 50,
          },
          {
            id: "seat-selection",
            name: "Seat Selection",
            description: "Choose your preferred seat",
            price: 25,
          },
          {
            id: "meal",
            name: "Special Meal",
            description: "Pre-order your in-flight meal",
            price: 35,
          },
          {
            id: "insurance",
            name: "Travel Insurance",
            description: "Comprehensive travel protection",
            price: 45,
          },
        ].map((extra) => (
          <div key={extra.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={extra.id}
                checked={selectedExtras.includes(extra.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedExtras([...selectedExtras, extra.id])
                  } else {
                    setSelectedExtras(selectedExtras.filter((id) => id !== extra.id))
                  }
                }}
                className="rounded"
              />
              <div>
                <label htmlFor={extra.id} className="font-medium cursor-pointer">
                  {extra.name}
                </label>
                <p className="text-sm text-muted-foreground">{extra.description}</p>
              </div>
            </div>
            <div className="font-medium">+${extra.price}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )

  const renderPayment = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={paymentDetails.cardNumber}
              onChange={(e) => setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value })}
              placeholder="1234 5678 9012 3456"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                value={paymentDetails.expiryDate}
                onChange={(e) =>
                  setPaymentDetails({ ...paymentDetails, expiryDate: e.target.value })
                }
                placeholder="MM/YY"
              />
            </div>

            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                value={paymentDetails.cvv}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, cvv: e.target.value })}
                placeholder="123"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              value={paymentDetails.cardholderName}
              onChange={(e) =>
                setPaymentDetails({ ...paymentDetails, cardholderName: e.target.value })
              }
              placeholder="John Doe"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Billing Address</h4>

          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={paymentDetails.billingAddress.street}
              onChange={(e) =>
                setPaymentDetails({
                  ...paymentDetails,
                  billingAddress: { ...paymentDetails.billingAddress, street: e.target.value },
                })
              }
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={paymentDetails.billingAddress.city}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    billingAddress: { ...paymentDetails.billingAddress, city: e.target.value },
                  })
                }
                placeholder="New York"
              />
            </div>

            <div>
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={paymentDetails.billingAddress.postalCode}
                onChange={(e) =>
                  setPaymentDetails({
                    ...paymentDetails,
                    billingAddress: {
                      ...paymentDetails.billingAddress,
                      postalCode: e.target.value,
                    },
                  })
                }
                placeholder="10001"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Select
              value={paymentDetails.billingAddress.country}
              onValueChange={(value) =>
                setPaymentDetails({
                  ...paymentDetails,
                  billingAddress: { ...paymentDetails.billingAddress, country: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="UK">United Kingdom</SelectItem>
                <SelectItem value="NG">Nigeria</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
          <Shield className="h-5 w-5 text-green-600" />
          <span className="text-sm">Your payment is secured with 256-bit SSL encryption</span>
        </div>
      </CardContent>
    </Card>
  )

  const renderConfirmation = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-green-600">Booking Confirmed!</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="text-6xl">✈️</div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Your flight is booked</h3>
          <p className="text-muted-foreground">
            Booking reference:{" "}
            <span className="font-mono font-medium">
              LHQ{Math.random().toString(36).substr(2, 8).toUpperCase()}
            </span>
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm">Confirmation details have been sent to {contactDetails.email}</p>
        </div>

        <Button onClick={() => onComplete({})} className="w-full">
          View Booking Details
        </Button>
      </CardContent>
    </Card>
  )

  // Initialize passengers on first render
  if (passengers.length === 0) {
    initializePassengers()
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </Button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            {["passenger-details", "extras", "payment", "confirmation"].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step
                      ? "bg-primary text-primary-foreground"
                      : ["passenger-details", "extras", "payment", "confirmation"].indexOf(
                            currentStep,
                          ) > index
                        ? "bg-green-600 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                {index < 3 && <div className="w-8 h-px bg-muted mx-2" />}
              </div>
            ))}
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold">${calculateTotalPrice().toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Price</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {currentStep === "passenger-details" && renderPassengerDetails()}
          {currentStep === "extras" && renderExtras()}
          {currentStep === "payment" && renderPayment()}
          {currentStep === "confirmation" && renderConfirmation()}

          {currentStep !== "confirmation" && (
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  const steps: BookingStep[] = [
                    "passenger-details",
                    "extras",
                    "payment",
                    "confirmation",
                  ]
                  const currentIndex = steps.indexOf(currentStep)
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1])
                  }
                }}
                disabled={currentStep === "passenger-details"}
              >
                Previous
              </Button>

              <Button onClick={handleStepComplete}>
                {currentStep === "payment" ? "Complete Booking" : "Continue"}
              </Button>
            </div>
          )}
        </div>

        {/* Flight Summary Sidebar */}
        <div className="lg:col-span-1">
          {renderFlightSummary()}

          {/* Price Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Base Fare</span>
                <span>${selectedFlight.price.base.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Fees</span>
                <span>${selectedFlight.price.taxes.toLocaleString()}</span>
              </div>

              {selectedExtras.map((extra) => (
                <div key={extra} className="flex justify-between text-sm">
                  <span className="capitalize">{extra.replace("-", " ")}</span>
                  <span>
                    +$
                    {extra === "baggage"
                      ? 50
                      : extra === "seat-selection"
                        ? 25
                        : extra === "meal"
                          ? 35
                          : extra === "insurance"
                            ? 45
                            : 0}
                  </span>
                </div>
              ))}

              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${calculateTotalPrice().toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
