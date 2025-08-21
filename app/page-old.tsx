"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { EnterpriseButton } from "@/design-system/components/enterprise-button"
import { EnterpriseCard } from "@/design-system/components/enterprise-card"
import { EnterpriseInput } from "@/design-system/components/enterprise-input"
import {
  MapPin,
  Clock,
  Coffee,
  Camera,
  Hotel,
  Zap,
  Plane,
  Calendar,
  Users,
  Star,
  TrendingUp,
  Shield,
  ChevronRight,
  Globe,
  Sparkles,
  Award,
  Heart,
  ArrowRight,
  Compass,
  DollarSign,
} from "lucide-react"
import { MobileNavigation } from "@/components/mobile-navigation"
import { TouchGestures } from "@/components/touch-gestures"
import { useUserLocation } from "@/hooks/use-user-location"

export default function LandingPage() {
  const { location } = useUserLocation()
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [departureDate, setDepartureDate] = useState("")
  const [travelers, setTravelers] = useState("1 Adult")
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleFlightSearch = () => {
    const searchParams = new URLSearchParams({
      origin,
      destination,
      departureDate,
      travelers,
      preferLayovers: "true",
    })
    window.location.href = `/search?${searchParams}`
  }

  const handlePullToRefresh = () => {
    window.location.reload()
  }

  return (
    <TouchGestures onPullToRefresh={handlePullToRefresh}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
        <MobileNavigation />

        {/* Enhanced Navigation with Morphic Effects */}
        <nav
          className={`fixed top-0 w-full z-50 transition-all duration-500 hidden md:block ${
            isScrolled ? "bg-white/95 backdrop-blur-lg shadow-lg" : "bg-transparent"
          }`}
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg blur animate-pulse" />
                  <div className="relative bg-white rounded-lg p-2">
                    <Plane className="h-6 w-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-600" />
                  </div>
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-orange-600">
                  LayoverHQ
                </span>
              </div>
              <div className="flex items-center space-x-6">
                <Link
                  href="/hacker-mode"
                  className="flex items-center gap-1 text-gray-700 hover:text-orange-600 transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  Hacker Mode
                </Link>
                <Link
                  href="#experiences"
                  className="text-gray-700 hover:text-orange-600 transition-colors"
                >
                  Experiences
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-gray-700 hover:text-orange-600 transition-colors"
                >
                  How It Works
                </Link>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-orange-600 transition-colors"
                >
                  My Trips
                </Link>
                <EnterpriseButton variant="outline" size="sm">
                  Sign In
                </EnterpriseButton>
                <EnterpriseButton variant="primary" size="sm">
                  Get Started
                </EnterpriseButton>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section with Morphic Animations */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 md:pt-0">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
            <div className="absolute top-40 right-10 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-12">
              {/* Trust Badge */}
              <div className="inline-flex items-center bg-gradient-to-r from-blue-600/10 to-orange-600/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
                <Award className="h-4 w-4 text-orange-600 mr-2" />
                <span className="text-sm font-semibold text-gray-700">
                  #1 Layover Platform • 500K+ Adventures Booked
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 animate-text-shimmer">
                  Turn Layovers Into
                </span>
                <br />
                <span className="relative">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600">
                    Adventures
                  </span>
                  <Sparkles className="absolute -top-6 -right-6 h-8 w-8 text-yellow-500 animate-spin-slow" />
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Save up to 40% on flights while exploring new cities. AI-powered layover
                optimization finds you the best routes with built-in city experiences.
              </p>

              {/* Stats Row */}
              <div className="flex justify-center gap-8 mb-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">$459</div>
                  <div className="text-sm text-gray-600">Avg. Savings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">6-24h</div>
                  <div className="text-sm text-gray-600">Perfect Layovers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">150+</div>
                  <div className="text-sm text-gray-600">Cities</div>
                </div>
              </div>
            </div>

            {/* Enhanced Search Widget */}
            <div className="max-w-5xl mx-auto">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <EnterpriseInput
                    variant="location"
                    placeholder="From: City or Airport"
                    leftIcon={<Plane className="rotate-45 h-4 w-4" />}
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                  <EnterpriseInput
                    variant="location"
                    placeholder="To: City or Airport"
                    leftIcon={<Plane className="-rotate-45 h-4 w-4" />}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                  <EnterpriseInput
                    variant="date"
                    type="date"
                    leftIcon={<Calendar className="h-4 w-4" />}
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                  />
                  <EnterpriseInput
                    variant="default"
                    placeholder="Travelers"
                    leftIcon={<Users className="h-4 w-4" />}
                    value={travelers}
                    onChange={(e) => setTravelers(e.target.value)}
                  />
                  <EnterpriseButton
                    variant="airline"
                    size="lg"
                    className="h-full"
                    onClick={handleFlightSearch}
                  >
                    <Zap className="mr-2" /> Find Layovers
                  </EnterpriseButton>
                </div>

                {/* Quick Options */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-full text-sm font-medium cursor-pointer hover:shadow-md transition-all">
                    <Globe className="inline h-3 w-3 mr-1" /> Visa-free layovers
                  </span>
                  <span className="px-4 py-2 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 rounded-full text-sm font-medium cursor-pointer hover:shadow-md transition-all">
                    <Clock className="inline h-3 w-3 mr-1" /> 8-12 hour sweet spot
                  </span>
                  <span className="px-4 py-2 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-full text-sm font-medium cursor-pointer hover:shadow-md transition-all">
                    <DollarSign className="inline h-3 w-3 mr-1" /> Budget-friendly
                  </span>
                  <span className="px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-full text-sm font-medium cursor-pointer hover:shadow-md transition-all">
                    <Heart className="inline h-3 w-3 mr-1" /> Romantic getaways
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Layover Deals */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-orange-600">
                  Trending Layover Adventures
                </span>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Real-time deals on flights with perfect layovers. Prices include the complete
                journey.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <EnterpriseCard variant="flight" className="group">
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full">
                    SAVE $320
                  </span>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">NYC → Dubai</h3>
                    <p className="text-gray-600">via Istanbul (12h layover)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-orange-600">$689</span>
                    <p className="text-sm text-gray-500 line-through">$1,009</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" /> Mar 15-22
                  </span>
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" /> 2 Adults
                  </span>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                  <p className="font-semibold text-blue-900 mb-2">Istanbul Experience Included:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-center">
                      <ChevronRight className="w-3 h-3 mr-1" /> Hagia Sophia & Blue Mosque tour
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="w-3 h-3 mr-1" /> Grand Bazaar shopping
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="w-3 h-3 mr-1" /> Traditional Turkish dinner
                    </li>
                  </ul>
                </div>
                <EnterpriseButton variant="primary" size="md" className="w-full mt-4">
                  View Details <ArrowRight className="ml-2 h-4 w-4" />
                </EnterpriseButton>
              </EnterpriseCard>

              <EnterpriseCard variant="layover" className="group border-2 border-orange-500">
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                    HOT DEAL
                  </span>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">LAX → Paris</h3>
                    <p className="text-gray-600">via Reykjavik (8h layover)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-orange-600">$459</span>
                    <p className="text-sm text-gray-500 line-through">$890</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" /> Apr 10-18
                  </span>
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" /> 4.9 rating
                  </span>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                  <p className="font-semibold text-blue-900 mb-2">Reykjavik Express Tour:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-center">
                      <ChevronRight className="w-3 h-3 mr-1" /> Blue Lagoon spa entry
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="w-3 h-3 mr-1" /> Reykjavik city highlights
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="w-3 h-3 mr-1" /> Airport transfers included
                    </li>
                  </ul>
                </div>
                <EnterpriseButton variant="airline" size="md" className="w-full mt-4">
                  Book Now <Zap className="ml-2 h-4 w-4" />
                </EnterpriseButton>
              </EnterpriseCard>

              <EnterpriseCard variant="experience" className="group">
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs font-bold rounded-full">
                    ADVENTURE
                  </span>
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">SF → Bangkok</h3>
                    <p className="text-gray-600">via Tokyo (16h layover)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-orange-600">$799</span>
                    <p className="text-sm text-gray-500 line-through">$1,250</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" /> May 5-15
                  </span>
                  <span className="flex items-center">
                    <Compass className="w-4 h-4 mr-1" /> Overnight
                  </span>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl">
                  <p className="font-semibold text-blue-900 mb-2">Tokyo Overnight Package:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li className="flex items-center">
                      <ChevronRight className="w-3 h-3 mr-1" /> Capsule hotel experience
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="w-3 h-3 mr-1" /> Shibuya & Shinjuku tour
                    </li>
                    <li className="flex items-center">
                      <ChevronRight className="w-3 h-3 mr-1" /> Ramen & sushi dinner
                    </li>
                  </ul>
                </div>
                <EnterpriseButton variant="experience" size="md" className="w-full mt-4">
                  Explore <MapPin className="ml-2 h-4 w-4" />
                </EnterpriseButton>
              </EnterpriseCard>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-20 bg-gradient-to-br from-blue-50 via-white to-orange-50"
        >
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-orange-600">
                  How LayoverHQ Works
                </span>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Three simple steps to transform your travel experience and save money
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-white rounded-2xl p-8 shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-4">
                    1
                  </div>
                  <h3 className="text-xl font-bold mb-3">Search Smart Routes</h3>
                  <p className="text-gray-600">
                    Our AI finds flights with strategic layovers that save you money while adding
                    adventure
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-white rounded-2xl p-8 shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-4">
                    2
                  </div>
                  <h3 className="text-xl font-bold mb-3">Pick Your Adventure</h3>
                  <p className="text-gray-600">
                    Choose from curated experiences perfectly timed for your layover duration
                  </p>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative bg-white rounded-2xl p-8 shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-4">
                    3
                  </div>
                  <h3 className="text-xl font-bold mb-3">Book & Explore</h3>
                  <p className="text-gray-600">
                    Everything organized - transfers, activities, and timing optimized for your
                    schedule
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">500K+</div>
                <p className="text-gray-600">Happy Travelers</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">150+</div>
                <p className="text-gray-600">Cities Covered</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">4.9/5</div>
                <p className="text-gray-600">Average Rating</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
                <p className="text-gray-600">Support Available</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-orange-600 text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Travel?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join 500,000+ travelers saving money and creating memories
            </p>
            <div className="flex gap-4 justify-center">
              <EnterpriseButton variant="secondary" size="lg">
                Start Your Journey
              </EnterpriseButton>
              <EnterpriseButton
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-orange-600"
              >
                View Demo
              </EnterpriseButton>
            </div>
          </div>
        </section>

        <div className="md:hidden h-16" />
      </div>
    </TouchGestures>
  )
}
