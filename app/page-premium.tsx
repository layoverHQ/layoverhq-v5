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
  Shield,
  Clock,
  Star,
  ChevronRight,
  Plane,
  Camera,
  Play,
  CheckCircle2,
  Menu,
  X,
  Globe,
  Zap,
  Award,
  TrendingUp,
  Heart,
} from "lucide-react"

export default function PremiumLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
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
      highlight: "Hagia Sophia & Grand Bazaar",
    },
    {
      city: "Reykjavik",
      country: "Iceland",
      image: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800&q=80",
      layoverTime: "6-10 hours",
      experiences: 28,
      avgSavings: "$420",
      highlight: "Blue Lagoon & Northern Lights",
    },
    {
      city: "Singapore",
      country: "Singapore",
      image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
      layoverTime: "10-16 hours",
      experiences: 65,
      avgSavings: "$510",
      highlight: "Gardens by the Bay",
    },
    {
      city: "Dubai",
      country: "UAE",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
      layoverTime: "12-20 hours",
      experiences: 78,
      avgSavings: "$650",
      highlight: "Burj Khalifa & Desert Safari",
    },
  ]

  const features = [
    {
      icon: Shield,
      title: "Travel Insurance",
      description: "Comprehensive coverage for peace of mind",
    },
    {
      icon: Clock,
      title: "Perfect Timing",
      description: "AI-optimized layovers that work with your schedule",
    },
    {
      icon: Award,
      title: "Curated Experiences",
      description: "Hand-picked activities by local experts",
    },
    {
      icon: TrendingUp,
      title: "Save More",
      description: "Average savings of $450 per trip",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-700 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-xl shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-ink-900 rounded-xl flex items-center justify-center">
                  <Plane className="h-5 w-5 text-white transform rotate-45" />
                </div>
              </div>
              <span className="font-mono font-semibold text-xl text-ink-900">
                LayoverHQ
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link
                href="/explore"
                className="text-ink-600 hover:text-ink-900 font-medium transition-colors duration-300"
              >
                Explore
              </Link>
              <Link
                href="/how-it-works"
                className="text-ink-600 hover:text-ink-900 font-medium transition-colors duration-300"
              >
                How it Works
              </Link>
              <Link
                href="/experiences"
                className="text-ink-600 hover:text-ink-900 font-medium transition-colors duration-300"
              >
                Experiences
              </Link>
              <Link
                href="/business"
                className="text-ink-600 hover:text-ink-900 font-medium transition-colors duration-300"
              >
                For Business
              </Link>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-4">
              <button className="text-ink-600 hover:text-ink-900 font-medium transition-colors duration-300">
                Sign In
              </button>
              <button className="bg-ink-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-ink-800 transition-all duration-300 shadow-premium hover:shadow-premium-lg">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-ink-900"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-ink-100">
            <div className="px-4 py-6 space-y-4">
              <Link href="/explore" className="block text-ink-900 font-medium py-2">
                Explore
              </Link>
              <Link href="/how-it-works" className="block text-ink-900 font-medium py-2">
                How it Works
              </Link>
              <Link href="/experiences" className="block text-ink-900 font-medium py-2">
                Experiences
              </Link>
              <Link href="/business" className="block text-ink-900 font-medium py-2">
                For Business
              </Link>
              <div className="pt-4 space-y-3">
                <button className="w-full text-ink-700 font-medium py-2">Sign In</button>
                <button className="w-full bg-ink-900 text-white py-3 rounded-xl font-medium">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Minimalist */}
      <section className="relative min-h-screen flex items-center">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-ink-50 via-white to-warm-50 opacity-50" />
        
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-coral/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-ocean/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-4xl">
            {/* Quote-style headline */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-light text-ink-900 mb-8 leading-tight">
              Here's to the{" "}
              <span className="font-semibold italic text-gradient from-accent-coral to-accent-sunset">
                adventurous ones
              </span>
              .
            </h1>
            
            <p className="text-xl sm:text-2xl text-ink-600 mb-4 leading-relaxed font-light">
              The travelers. The explorers. The ones who see layovers differently.
            </p>
            
            <p className="text-lg text-ink-500 mb-12 leading-relaxed max-w-3xl">
              They're not fond of waiting. They have no respect for wasted time. 
              You can praise them, disagree with them, quote or vilify them. 
              About the only thing you can't do is ignore them. Because they change travel.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="group bg-ink-900 text-white px-8 py-4 rounded-2xl font-medium hover:bg-ink-800 transition-all duration-300 shadow-premium hover:shadow-premium-lg flex items-center justify-center">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group bg-white text-ink-900 px-8 py-4 rounded-2xl font-medium border border-ink-200 hover:border-ink-300 transition-all duration-300 shadow-sm hover:shadow-premium flex items-center justify-center">
                <Play className="mr-2 h-5 w-5" />
                Watch Story
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-8 mt-12 text-ink-500">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-accent-sage mr-2" />
                <span className="text-sm">500K+ Adventurers</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 text-accent-gold mr-2" />
                <span className="text-sm">4.9 Rating</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-accent-ocean mr-2" />
                <span className="text-sm">Fully Insured</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section - Clean & Minimal */}
      <section className="py-24 bg-ink-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-light text-ink-900 mb-4">
              Where will your layover take you?
            </h2>
            <p className="text-ink-600">Find flights with strategic layovers that save money and add adventure</p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-premium p-2">
              <div className="flex flex-col lg:flex-row gap-2">
                <div className="flex-1 flex items-center px-6 py-4 border-b lg:border-b-0 lg:border-r border-ink-100">
                  <MapPin className="h-5 w-5 text-ink-400 mr-3" />
                  <input
                    type="text"
                    placeholder="From"
                    className="flex-1 outline-none text-ink-900 placeholder-ink-400 bg-transparent"
                  />
                </div>
                <div className="flex-1 flex items-center px-6 py-4 border-b lg:border-b-0 lg:border-r border-ink-100">
                  <MapPin className="h-5 w-5 text-ink-400 mr-3" />
                  <input
                    type="text"
                    placeholder="To"
                    className="flex-1 outline-none text-ink-900 placeholder-ink-400 bg-transparent"
                  />
                </div>
                <div className="flex-1 flex items-center px-6 py-4 border-b lg:border-b-0 lg:border-r border-ink-100">
                  <Calendar className="h-5 w-5 text-ink-400 mr-3" />
                  <input
                    type="text"
                    placeholder="Dates"
                    className="flex-1 outline-none text-ink-900 placeholder-ink-400 bg-transparent"
                  />
                </div>
                <button className="bg-ink-900 text-white px-8 py-4 rounded-xl font-medium hover:bg-ink-800 transition-all duration-300 flex items-center justify-center">
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations Grid - Editorial Style */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="font-display text-4xl font-light text-ink-900 mb-4">
              Featured Destinations
            </h2>
            <p className="text-ink-600 max-w-2xl">
              Curated cities perfect for layover adventures, each offering unique experiences within hours
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest, index) => (
              <div
                key={index}
                className="group cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative h-80 mb-4 overflow-hidden rounded-2xl">
                  <Image
                    src={dest.image}
                    alt={dest.city}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
                  
                  {/* Overlay Content */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl font-display font-medium text-white mb-1">
                      {dest.city}
                    </h3>
                    <p className="text-white/80 text-sm">{dest.country}</p>
                  </div>

                  {/* Savings Badge */}
                  <div className="absolute top-6 right-6">
                    <div className="bg-white/90 backdrop-blur-md rounded-full px-3 py-1">
                      <span className="text-sm font-semibold text-ink-900">
                        {dest.avgSavings}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <p className="text-ink-900 font-medium mb-2">{dest.highlight}</p>
                  <div className="flex items-center gap-4 text-sm text-ink-500">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {dest.layoverTime}
                    </span>
                    <span className="flex items-center">
                      <Camera className="w-4 h-4 mr-1" />
                      {dest.experiences} experiences
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Card Grid */}
      <section className="py-24 bg-ink-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-light text-ink-900 mb-4">
              Why Choose LayoverHQ
            </h2>
            <p className="text-ink-600 max-w-2xl mx-auto">
              We've reimagined travel to make every journey an adventure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-premium transition-all duration-300"
              >
                <div className="w-12 h-12 bg-ink-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-ink-700" />
                </div>
                <h3 className="text-lg font-semibold text-ink-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-ink-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section - Immersive */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl font-light text-ink-900 mb-6">
                Every layover has a story
              </h2>
              <p className="text-ink-600 mb-8 text-lg leading-relaxed">
                Watch how travelers are transforming dead time into lifetime memories. 
                From sunrise in Santorini to sunset in Singapore, every moment counts.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-1 h-12 bg-gradient-to-b from-accent-coral to-accent-sunset mr-4" />
                  <div>
                    <h3 className="font-semibold text-ink-900 mb-1">Save intelligently</h3>
                    <p className="text-ink-500">Average savings of $450 per trip through strategic routing</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-1 h-12 bg-gradient-to-b from-accent-ocean to-accent-sage mr-4" />
                  <div>
                    <h3 className="font-semibold text-ink-900 mb-1">Explore confidently</h3>
                    <p className="text-ink-500">Every experience timed perfectly with guaranteed connections</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-premium-lg">
              <Image
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80"
                alt="Travel Video"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <button className="bg-white rounded-full p-6 shadow-premium hover:scale-105 transition-transform group">
                  <Play className="h-8 w-8 text-ink-900 ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial - Single Feature */}
      <section className="py-24 bg-ink-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-accent-gold fill-current" />
              ))}
            </div>
            <p className="font-display text-2xl lg:text-3xl font-light leading-relaxed mb-8">
              "LayoverHQ didn't just save me $400 on my flight to Dubai. 
              It gave me 12 unforgettable hours in Istanbul – a city I never planned to visit 
              but now can't wait to return to."
            </p>
            <div className="flex items-center justify-center">
              <Image
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"
                alt="Sarah Chen"
                width={56}
                height={56}
                className="rounded-full mr-4"
              />
              <div className="text-left">
                <div className="font-semibold">Sarah Chen</div>
                <div className="text-white/70 text-sm">Digital Nomad • NYC → Dubai</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Minimal */}
      <section className="py-24 bg-gradient-to-br from-ink-50 to-warm-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl lg:text-5xl font-light text-ink-900 mb-6">
            Ready to change how you travel?
          </h2>
          <p className="text-xl text-ink-600 mb-10">
            Join 500,000+ adventurers who've discovered the joy of intentional layovers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-ink-900 text-white px-8 py-4 rounded-2xl font-medium hover:bg-ink-800 transition-all duration-300 shadow-premium hover:shadow-premium-lg">
              Start Free Trial
            </button>
            <button className="bg-white text-ink-900 px-8 py-4 rounded-2xl font-medium border border-ink-200 hover:border-ink-300 transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer - Clean */}
      <footer className="bg-white border-t border-ink-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-ink-900 rounded-xl flex items-center justify-center">
                  <Plane className="h-5 w-5 text-white transform rotate-45" />
                </div>
                <span className="font-mono font-semibold text-xl text-ink-900">
                  LayoverHQ
                </span>
              </div>
              <p className="text-ink-500 text-sm">
                Transforming layovers into adventures since 2024.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-ink-900 mb-4">Product</h3>
              <ul className="space-y-2 text-ink-500 text-sm">
                <li><Link href="#" className="hover:text-ink-900 transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-ink-900 transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-ink-900 transition-colors">Business</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-ink-900 mb-4">Company</h3>
              <ul className="space-y-2 text-ink-500 text-sm">
                <li><Link href="#" className="hover:text-ink-900 transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-ink-900 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-ink-900 transition-colors">Careers</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-ink-900 mb-4">Support</h3>
              <ul className="space-y-2 text-ink-500 text-sm">
                <li><Link href="#" className="hover:text-ink-900 transition-colors">Help</Link></li>
                <li><Link href="#" className="hover:text-ink-900 transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-ink-900 transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-ink-100 mt-12 pt-8 text-center">
            <p className="text-ink-400 text-sm">
              © 2024 LayoverHQ. All rights reserved. Here's to the crazy ones.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}