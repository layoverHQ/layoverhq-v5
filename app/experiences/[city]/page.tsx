"use client"

import { useParams } from "next/navigation"
import { LayoverExperiences } from "@/components/layover-experiences"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, MapPin } from "lucide-react"
import Link from "next/link"

export default function CityExperiencesPage() {
  const params = useParams()
  const city = params.city as string
  const decodedCity = decodeURIComponent(city)

  // Map city to layover duration
  const cityLayoverInfo: Record<string, { duration: string; hours: number }> = {
    Istanbul: { duration: "3-12 hours", hours: 12 },
    Dubai: { duration: "4+ hours", hours: 8 },
    Doha: { duration: "5+ hours", hours: 8 },
    Singapore: { duration: "6+ hours", hours: 10 },
    Amsterdam: { duration: "4+ hours", hours: 6 },
    Reykjavik: { duration: "7+ hours", hours: 12 },
  }

  const cityInfo = cityLayoverInfo[decodedCity] || { duration: "4+ hours", hours: 8 }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-qr-burgundy to-amber-600 text-white">
        <div className="container mx-auto px-6 py-8">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <MapPin className="h-8 w-8" />
            <h1 className="text-3xl md:text-4xl font-bold">{decodedCity} Layover Experiences</h1>
          </div>

          <div className="flex items-center gap-2 text-amber-100">
            <Clock className="h-5 w-5" />
            <span>Recommended layover time: {cityInfo.duration}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <LayoverExperiences
          city={decodedCity}
          maxDurationHours={cityInfo.hours}
          className="mb-12"
        />

        {/* Additional Information */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-12">
          <h3 className="text-lg font-semibold mb-3 text-amber-900">
            Layover Tips for {decodedCity}
          </h3>
          <ul className="space-y-2 text-sm text-amber-800">
            <li>• Book experiences in advance to save time during your layover</li>
            <li>• Consider airport transfer times when selecting activities</li>
            <li>• Most experiences include skip-the-line access for time efficiency</li>
            <li>• Check visa requirements for your nationality before booking</li>
            <li>• Leave at least 2 hours buffer time before your next flight</li>
          </ul>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <h3 className="text-xl font-semibold mb-4">Need help planning your layover?</h3>
          <p className="text-muted-foreground mb-6">
            Our travel experts can help you create the perfect layover itinerary
          </p>
          <Button className="bg-qr-burgundy hover:bg-qr-burgundy/90">Contact Layover Expert</Button>
        </div>
      </div>
    </div>
  )
}
