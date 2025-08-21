"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Plane,
  ArrowLeft,
  Clock,
  MapPin,
  User,
  CreditCard,
  Shield,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

export default function BookingPage() {
  const [bookingStep, setBookingStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [flightData, setFlightData] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const flightId = searchParams.get("flightId")
  const source = searchParams.get("source")

  useEffect(() => {
    // In a real implementation, fetch flight details by ID
    // For now, show a placeholder
    if (flightId) {
      setFlightData({
        id: flightId,
        source: source,
        airline: { name: "Sample Airline" },
        price: { total: 850, currency: "USD" },
        route: "NYC → DOH → SIN",
        layover: { city: "Doha", duration: "6h 30m" },
      })
    }
  }, [flightId, source])

  const handleBooking = async () => {
    setIsLoading(true)

    // Simulate booking process
    setTimeout(() => {
      setIsLoading(false)
      setBookingStep(4) // Success step
    }, 3000)
  }

  if (!flightId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md bg-card/50 backdrop-blur-sm border-border">
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
            <div>
              <h2 className="heading-font text-xl mb-2">No Flight Selected</h2>
              <p className="body-font text-muted-foreground">
                Please select a flight from the search results to continue with booking.
              </p>
            </div>
            <Link href="/search">
              <Button className="bg-primary hover:bg-primary/90">Search Flights</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const steps = [
    { id: 1, title: "Review Flight", icon: Plane },
    { id: 2, title: "Passenger Details", icon: User },
    { id: 3, title: "Payment", icon: CreditCard },
    { id: 4, title: "Confirmation", icon: CheckCircle },
  ]

  const currentStep = steps.find((step) => step.id === bookingStep)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/search"
              className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="body-font">Back to Search</span>
            </Link>

            <div className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-primary" />
              <span className="heading-font text-lg">LayoverHQ Booking</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Progress Steps */}
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        bookingStep >= step.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-16 h-1 mx-2 ${bookingStep > step.id ? "bg-primary" : "bg-muted"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <h2 className="heading-font text-xl">{currentStep?.title}</h2>
                <Progress
                  value={(bookingStep / steps.length) * 100}
                  className="w-full max-w-md mx-auto mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Booking Content */}
          {bookingStep === 1 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Review Your Flight</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {flightData && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div>
                        <h3 className="heading-font text-lg">{flightData.airline.name}</h3>
                        <p className="body-font text-muted-foreground">{flightData.route}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="outline">
                            <MapPin className="h-3 w-3 mr-1" />
                            Layover: {flightData.layover.city}
                          </Badge>
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {flightData.layover.duration}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="heading-font text-2xl">${flightData.price.total}</p>
                        <p className="body-font text-sm text-muted-foreground">per person</p>
                      </div>
                    </div>

                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription className="body-font">
                        This booking includes layover optimization and city experience
                        recommendations.
                      </AlertDescription>
                    </Alert>

                    <Button
                      onClick={() => setBookingStep(2)}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Continue to Passenger Details
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {bookingStep === 2 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Passenger Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="body-font text-muted-foreground mb-4">
                    Passenger details form would be implemented here
                  </p>
                  <Button
                    onClick={() => setBookingStep(3)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Continue to Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {bookingStep === 3 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="body-font text-muted-foreground mb-4">
                    Payment processing would be implemented here
                  </p>
                  <Button
                    onClick={handleBooking}
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? "Processing..." : "Complete Booking"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {bookingStep === 4 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-8 text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                <div>
                  <h2 className="heading-font text-2xl text-green-800 mb-2">Booking Confirmed!</h2>
                  <p className="body-font text-green-700">
                    Your layover-optimized flight has been successfully booked.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button className="bg-primary hover:bg-primary/90">View Booking Details</Button>
                  <br />
                  <Link href="/dashboard">
                    <Button variant="outline" className="border-border bg-transparent">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
