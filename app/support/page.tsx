"use client"

import { CustomerSupport } from "@/components/customer-support"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CreditCard, Plane, MapPin, Clock } from "lucide-react"

export default function SupportPage() {
  const faqCategories = [
    {
      icon: BookOpen,
      title: "Booking & Reservations",
      questions: [
        "How do I book a layover experience?",
        "Can I modify my booking after confirmation?",
        "What happens if my flight is delayed?",
        "How do I cancel my reservation?",
      ],
    },
    {
      icon: CreditCard,
      title: "Payment & Billing",
      questions: [
        "What payment methods do you accept?",
        "When will I be charged?",
        "How do refunds work?",
        "Can I get a receipt for my booking?",
      ],
    },
    {
      icon: Plane,
      title: "Flight Connections",
      questions: [
        "What is the minimum layover time needed?",
        "Do I need a visa for my layover city?",
        "What if I miss my connecting flight?",
        "Can I leave the airport during my layover?",
      ],
    },
    {
      icon: MapPin,
      title: "Layover Experiences",
      questions: [
        "What's included in layover tours?",
        "How do I get to the city from the airport?",
        "What if the weather is bad?",
        "Are meals included in experiences?",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">How can we help you?</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get instant support for your LayoverHQ bookings and travel questions
          </p>
        </div>

        {/* Customer Support Component */}
        <div className="mb-12">
          <CustomerSupport />
        </div>

        {/* FAQ Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Find quick answers to common questions about LayoverHQ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <category.icon className="h-5 w-5 text-primary" />
                    <span>{category.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {category.questions.map((question, qIndex) => (
                      <li key={qIndex}>
                        <button className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors">
                          {question}
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <Card className="mt-12 bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Emergency Travel Support</h3>
            </div>
            <p className="text-red-800 mb-4">
              If you're experiencing a travel emergency or urgent issue with your layover, contact
              our 24/7 emergency line immediately.
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <Badge variant="destructive" className="w-fit">
                Emergency: +1 (555) 911-HELP
              </Badge>
              <Badge variant="outline" className="w-fit border-red-300 text-red-700">
                Available 24/7 worldwide
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
