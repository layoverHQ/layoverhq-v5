"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import {
  Search,
  Calendar,
  Users,
  MapPin,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  Star,
  ChevronRight,
  Globe2,
  Plane,
  Hotel,
  Coffee,
  Camera,
  Zap,
  Play,
  CheckCircle2,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react"

export default function ModernLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const destinations = [
    {
      city: "Istanbul",
      country: "Turkey",
      image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80",
      layoverTime: "8-12 hours",
      experiences: 42,
      avgSavings: "$380",
      gradient: "from-blue-600 to-purple-600",
    },
    {
      city: "Reykjavik",
      country: "Iceland",
      image: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800&q=80",
      layoverTime: "6-10 hours",
      experiences: 28,
      avgSavings: "$420",
      gradient: "from-cyan-600 to-blue-600",
    },
    {
      city: "Singapore",
      country: "Singapore",
      image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
      layoverTime: "10-16 hours",
      experiences: 65,
      avgSavings: "$510",
      gradient: "from-emerald-600 to-teal-600",
    },
    {
      city: "Dubai",
      country: "UAE",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
      layoverTime: "12-20 hours",
      experiences: 78,
      avgSavings: "$650",
      gradient: "from-orange-600 to-red-600",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Digital Nomad",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
      content: "LayoverHQ turned my boring 14-hour layover in Istanbul into the highlight of my trip. Saved $400 and got to see the Blue Mosque!",
      rating: 5,
      route: "NYC → Dubai",
    },
    {
      name: "Marcus Rodriguez",
      role: "Business Traveler",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
      content: "As someone who flies 100+ times a year, this is a game-changer. I've explored 12 new cities this year alone, all during layovers.",
      rating: 5,
      route: "LAX → Singapore",
    },
    {
      name: "Emma Watson",
      role: "Adventure Seeker",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
      content: "The curated experiences are perfect. Everything was timed perfectly, and I never worried about missing my connection.",
      rating: 5,
      route: "London → Bangkok",
    },
  ]

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur-lg opacity-60 animate-pulse-glow" />
                  <div className="relative bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-2">
                    <Plane className="h-6 w-6 text-white transform rotate-45" />
                  </div>
                </div>
                <span className="font-display font-bold text-xl text-gray-900">
                  LayoverHQ
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link
                href="/explore"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Explore
              </Link>
              <Link
                href="/how-it-works"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                How it Works
              </Link>
              <Link
                href="/experiences"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Experiences
              </Link>
              <Link
                href="/business"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                For Business
              </Link>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              <button className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Sign In
              </button>
              <button className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:-translate-y-0.5">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-900" />
              ) : (
                <Menu className="h-6 w-6 text-gray-900" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-6 space-y-4">
              <Link href="/explore" className="block text-gray-900 font-medium py-2">
                Explore
              </Link>
              <Link href="/how-it-works" className="block text-gray-900 font-medium py-2">
                How it Works
              </Link>
              <Link href="/experiences" className="block text-gray-900 font-medium py-2">
                Experiences
              </Link>
              <Link href="/business" className="block text-gray-900 font-medium py-2">
                For Business
              </Link>
              <div className="pt-4 space-y-3">
                <button className="w-full text-gray-700 font-medium py-2">Sign In</button>
                <button className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-full font-semibold">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80"
            alt="Travel Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/40 to-white/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32">
          {/* Badge */}
          <div className="inline-flex items-center bg-white/90 backdrop-blur-md rounded-full px-4 py-2 mb-8 shadow-lg">
            <Sparkles className="h-4 w-4 text-orange-500 mr-2" />
            <span className="text-sm font-semibold text-gray-800">
              500,000+ Travelers • $230M Saved
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold mb-6">
            <span className="block text-gray-900">Turn Layovers Into</span>
            <span className="block mt-2">
              <span className="text-gradient from-red-500 to-orange-500">Adventures</span>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto">
            Save up to 50% on flights while exploring new cities. Our AI finds the perfect
            layovers that give you time to experience the world.
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-2 max-w-4xl mx-auto mb-8">
            <div className="flex flex-col lg:flex-row gap-2">
              <div className="flex-1 flex items-center px-4 py-3 border-b lg:border-b-0 lg:border-r border-gray-200">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="From where?"
                  className="flex-1 outline-none text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="flex-1 flex items-center px-4 py-3 border-b lg:border-b-0 lg:border-r border-gray-200">
                <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="To where?"
                  className="flex-1 outline-none text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="flex-1 flex items-center px-4 py-3 border-b lg:border-b-0 lg:border-r border-gray-200">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="When?"
                  className="flex-1 outline-none text-gray-900 placeholder-gray-500"
                />
              </div>
              <div className="flex-1 flex items-center px-4 py-3">
                <Users className="h-5 w-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Travelers"
                  className="flex-1 outline-none text-gray-900 placeholder-gray-500"
                />
              </div>
              <button className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-300 flex items-center justify-center">
                <Search className="h-5 w-5 mr-2" />
                Search Flights
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-gray-700">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
              <span className="font-medium">Free Cancellation</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-500 mr-2" />
              <span className="font-medium">Travel Insurance</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-purple-500 mr-2" />
              <span className="font-medium">24/7 Support</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="bg-white/90 backdrop-blur-md rounded-full p-3 shadow-lg">
            <ChevronRight className="h-6 w-6 text-gray-700 rotate-90" />
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-4">
              Popular Layover Cities
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover cities perfect for exploration during your journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={dest.image}
                    alt={dest.city}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Overlay Content */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold text-white mb-1">{dest.city}</h3>
                    <p className="text-white/90 text-sm">{dest.country}</p>
                  </div>

                  {/* Average Savings Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/90 backdrop-blur-md rounded-full px-3 py-1">
                      <span className="text-sm font-bold text-green-600">
                        Save {dest.avgSavings}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">{dest.layoverTime}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Camera className="h-4 w-4 mr-1" />
                      <span className="text-sm">{dest.experiences} experiences</span>
                    </div>
                  </div>

                  <button
                    className={`w-full bg-gradient-to-r ${dest.gradient} text-white py-3 rounded-xl font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0`}
                  >
                    Explore {dest.city}
                    <ArrowRight className="inline-block ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-4">
              How LayoverHQ Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to transform your travel experience
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="relative">
              {/* Connection Line */}
              <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />
              
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Search className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                  1. Search Smart Routes
                </h3>
                <p className="text-gray-600 text-center">
                  Our AI analyzes millions of flight combinations to find routes with perfect
                  layovers that save you money
                </p>
              </div>
            </div>

            <div className="relative">
              {/* Connection Line */}
              <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-orange-500 to-yellow-500" />
              
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <MapPin className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                  2. Pick Your Adventure
                </h3>
                <p className="text-gray-600 text-center">
                  Choose from curated experiences perfectly timed for your layover duration
                  and interests
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-green-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Zap className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                  3. Book & Explore
                </h3>
                <p className="text-gray-600 text-center">
                  Everything organized - transfers, activities, and timing optimized for your
                  schedule
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-24 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-6">
                See LayoverHQ in Action
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Watch how travelers are saving thousands while exploring the world, one layover
                at a time.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Average savings of $450 per international trip
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Explore 2-3 new cities on a single journey
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    All experiences vetted and guaranteed on-time
                  </span>
                </li>
              </ul>
              <button className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-300 flex items-center">
                Start Your Adventure
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80"
                  alt="Video Thumbnail"
                  width={800}
                  height={450}
                  className="w-full"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <button className="bg-white/90 backdrop-blur-md rounded-full p-6 hover:bg-white transition-colors group">
                    <Play className="h-8 w-8 text-red-500 ml-1 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur-2xl opacity-30" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full blur-2xl opacity-30" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-4">
              Loved by Adventurers Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of travelers who've discovered the joy of layover adventures
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="flex items-center">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-xs text-gray-500 mt-1">{testimonial.route}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-red-500 to-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-white mb-6">
            Ready to Transform Your Travel?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join 500,000+ smart travelers saving money and creating memories
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-red-500 px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all duration-300 flex items-center justify-center">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button className="bg-white/20 backdrop-blur-md text-white border-2 border-white/30 px-8 py-4 rounded-full font-semibold hover:bg-white/30 transition-all duration-300">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-2">
                  <Plane className="h-6 w-6 text-white transform rotate-45" />
                </div>
                <span className="font-display font-bold text-xl">LayoverHQ</span>
              </div>
              <p className="text-gray-400">
                Turn every journey into an adventure. Save money, explore more.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Business</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Enterprise</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Press</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LayoverHQ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}