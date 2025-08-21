"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Star,
  Menu,
  X,
  Plane,
  TrendingUp,
  Users,
  ArrowRight,
  Shield,
  Hotel,
  Car,
  ChevronRight,
  Play,
  Globe,
  Award,
  CheckCircle2,
} from "lucide-react";

export default function TravelOTALandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("flights");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const destinations = [
    {
      city: "New York",
      country: "United States",
      image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80",
      price: "from $879",
      layover: "8h 45m",
      rating: 4.8,
      reviews: 1240,
    },
    {
      city: "Chicago", 
      country: "United States",
      image: "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=600&q=80",
      price: "from $649",
      layover: "12h 15m", 
      rating: 4.9,
      reviews: 890,
    },
    {
      city: "Dallas",
      country: "United States", 
      image: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=600&q=80",
      price: "from $599",
      layover: "9h 30m",
      rating: 4.7,
      reviews: 650,
    },
    {
      city: "Los Angeles",
      country: "United States",
      image: "https://images.unsplash.com/photo-1515756500008-6b1a8fb77c8e?w=600&q=80", 
      price: "from $729",
      layover: "6h 20m",
      rating: 4.6,
      reviews: 1100,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Travel OTA Style */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md" : "bg-white/95 backdrop-blur-sm"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/brand/layoverhq-logo-correct.svg"
                alt="LayoverHQ Logo"
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <span className="font-bold text-2xl text-gray-900">LayoverHQ</span>
            </Link>

            <div className="hidden lg:flex items-center space-x-8">
              <Link href="/flights" className="text-gray-700 hover:text-blue-600 font-medium flex items-center">
                <Plane className="h-4 w-4 mr-1" />
                Flights
              </Link>
              <Link href="/experiences" className="text-gray-700 hover:text-blue-600 font-medium flex items-center">
                <Star className="h-4 w-4 mr-1" />
                Experiences
              </Link>
              <Link href="/deals" className="text-gray-700 hover:text-blue-600 font-medium">
                Deals
              </Link>
              <Link href="/business" className="text-gray-700 hover:text-blue-600 font-medium">
                For Business
              </Link>
            </div>

            <div className="hidden lg:flex items-center space-x-4">
              <button className="text-gray-700 hover:text-blue-600 font-medium">
                Sign In
              </button>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Register
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Travel OTA Style */}
      <section 
        className="relative min-h-screen flex items-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
          <div className="text-center mb-12">
            <div className="inline-flex items-center bg-orange-500 text-white px-4 py-2 rounded-full mb-6 font-semibold text-sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Save up to 70% on flights with layover experiences
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Turn Layovers Into
              <br />
              <span className="text-orange-400">Amazing Adventures</span>
            </h1>
            
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Book flights with strategic layovers and explore incredible cities. Save money while creating unforgettable memories.
            </p>
          </div>

          {/* Travel Search Box - OTA Style */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab("flights")}
                    className={`flex items-center px-6 py-4 font-medium text-sm ${
                      activeTab === "flights"
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Plane className="h-4 w-4 mr-2" />
                    Layover Flights
                  </button>
                  <button
                    onClick={() => setActiveTab("experiences")}
                    className={`flex items-center px-6 py-4 font-medium text-sm ${
                      activeTab === "experiences"
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    City Experiences
                  </button>
                  <button
                    onClick={() => setActiveTab("packages")}
                    className={`flex items-center px-6 py-4 font-medium text-sm ${
                      activeTab === "packages"
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Flight + Experience
                  </button>
                </div>
              </div>

              {/* Search Form */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">From</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Departure city"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">To</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Destination city"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Departure</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Select date"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-end">
                    <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center">
                      <Search className="h-5 w-5 mr-2" />
                      Search
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
                  <label className="flex items-center text-sm text-gray-600">
                    <input type="checkbox" className="mr-2 rounded" />
                    Long layovers (8+ hours)
                  </label>
                  <label className="flex items-center text-sm text-gray-600">
                    <input type="checkbox" className="mr-2 rounded" />
                    Include nearby airports
                  </label>
                  <label className="flex items-center text-sm text-gray-600">
                    <input type="checkbox" className="mr-2 rounded" />
                    Premium experiences only
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto mt-12 text-center">
            <div className="text-white">
              <div className="text-2xl font-bold">$420</div>
              <div className="text-gray-300 text-sm">Average Savings</div>
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold">500K+</div>
              <div className="text-gray-300 text-sm">Happy Travelers</div>
            </div>
            <div className="text-white">
              <div className="text-2xl font-bold">4.8★</div>
              <div className="text-gray-300 text-sm">Customer Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations - Travel OTA Style */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Layover Destinations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover amazing cities during your layover and save on your journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((destination, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100 hover:border-blue-200">
                <div className="relative h-56">
                  <Image
                    src={destination.image}
                    alt={destination.city}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full shadow-lg">
                    <span className="text-sm font-bold">{destination.price}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-bold text-xl text-white mb-1">{destination.city}</h3>
                    <p className="text-white/90 text-sm">{destination.country}</p>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-semibold text-gray-700 ml-1">{destination.rating}</span>
                      <span className="text-xs text-gray-500 ml-1">({destination.reviews})</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{destination.layover}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span>Layover experiences</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center">
                      Explore
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Today's Deals - Travel OTA Style */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Today's Best Deals</h2>
              <p className="text-gray-600">Limited-time offers on layover experiences</p>
            </div>
            <Link href="/deals" className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
              View all deals
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Featured Deal - Enhanced */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0">
                <Image
                  src="https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80"
                  alt="NYC Skyline"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/90" />
              </div>
              <div className="relative p-8 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-500 px-4 py-2 rounded-full text-sm font-bold">
                    🔥 FEATURED DEAL
                  </div>
                  <div className="bg-red-500 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    LIMITED TIME
                  </div>
                </div>
                <h3 className="text-3xl font-bold mb-3">New York City Explorer</h3>
                <p className="text-blue-100 mb-4 text-lg leading-relaxed">8-hour layover package including helicopter tour, Central Park walk, Times Square visit, and premium airport transfers</p>
                <div className="flex items-center space-x-6 mb-6">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="ml-2 font-semibold">4.8 (1,240 reviews)</span>
                  </div>
                  <div className="flex items-center font-semibold">
                    <Clock className="h-5 w-5 mr-2" />
                    Expires in 6h 23m
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-blue-200 line-through text-xl">$1,249</span>
                    <span className="text-4xl font-bold ml-3">$879</span>
                    <div className="text-green-400 font-semibold mt-1">Save $370 (30% off)</div>
                  </div>
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl">
                    Book Now
                  </button>
                </div>
              </div>
            </div>

            {/* Side Deals - Enhanced */}
            <div className="space-y-6">
              <div className="relative overflow-hidden bg-white border border-gray-200 rounded-xl hover:shadow-xl transition-all duration-300 group">
                <div className="absolute inset-0">
                  <Image
                    src="https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=400&q=80"
                    alt="Chicago"
                    fill
                    className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                  />
                </div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900 text-lg">Chicago Deep Dish Tour</h4>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">Save 33%</span>
                  </div>
                  <p className="text-gray-600 mb-4">12-hour layover • Architecture cruise • Millennium Park</p>
                  <div className="flex items-center mb-4">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold text-gray-700 ml-1">4.9 (890)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-400 line-through text-lg">$967</span>
                      <span className="text-2xl font-bold text-gray-900 ml-2">$649</span>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                      Book Deal
                    </button>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden bg-white border border-gray-200 rounded-xl hover:shadow-xl transition-all duration-300 group">
                <div className="absolute inset-0">
                  <Image
                    src="https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&q=80"
                    alt="Dallas"
                    fill
                    className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                  />
                </div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900 text-lg">Dallas BBQ Experience</h4>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">Save 28%</span>
                  </div>
                  <p className="text-gray-600 mb-4">9-hour layover • Stockyards tour • Authentic BBQ</p>
                  <div className="flex items-center mb-4">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold text-gray-700 ml-1">4.7 (650)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-400 line-through text-lg">$834</span>
                      <span className="text-2xl font-bold text-gray-900 ml-2">$599</span>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                      Book Deal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials - Travel OTA Style */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Travelers Say</h2>
            <p className="text-lg text-gray-600">Real stories from real adventures</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "LayoverHQ turned my 9-hour Chicago layover into the best part of my trip! The deep dish tour was incredible and I made it back with time to spare."
              </p>
              <div className="flex items-center">
                <Image
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"
                  alt="Sarah Chen"
                  width={48}
                  height={48}
                  className="rounded-full mr-3"
                />
                <div>
                  <div className="font-semibold text-gray-900">Sarah Chen</div>
                  <div className="text-sm text-gray-500">Business Traveler</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Saved $400 on my flight to London AND got to see the Statue of Liberty during my NYC layover. This is genius!"
              </p>
              <div className="flex items-center">
                <Image
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
                  alt="Mike Rodriguez"
                  width={48}
                  height={48}
                  className="rounded-full mr-3"
                />
                <div>
                  <div className="font-semibold text-gray-900">Mike Rodriguez</div>
                  <div className="text-sm text-gray-500">Digital Nomad</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Perfect timing, amazing experiences, and incredible value. LayoverHQ makes travel so much more exciting!"
              </p>
              <div className="flex items-center">
                <Image
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80"
                  alt="Emma Thompson"
                  width={48}
                  height={48}
                  className="rounded-full mr-3"
                />
                <div>
                  <div className="font-semibold text-gray-900">Emma Thompson</div>
                  <div className="text-sm text-gray-500">Frequent Flyer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges & Partners */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 text-sm uppercase tracking-wide font-semibold">Trusted by major airlines</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-gray-600">American Airlines</div>
            <div className="text-2xl font-bold text-gray-600">Delta</div>
            <div className="text-2xl font-bold text-gray-600">United</div>
            <div className="text-2xl font-bold text-gray-600">Southwest</div>
            <div className="text-2xl font-bold text-gray-600">JetBlue</div>
          </div>
          <div className="flex justify-center items-center gap-8 mt-8">
            <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">SSL Secured</span>
            </div>
            <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">IATA Certified</span>
            </div>
            <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm">
              <Award className="h-5 w-5 text-orange-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Travel Award 2024</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Enhanced */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Book with LayoverHQ?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Join 500,000+ travelers who've discovered the smart way to fly</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center group hover:bg-blue-50 p-6 rounded-xl transition-all duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">100% Protected</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Comprehensive travel insurance, 24/7 support, and guaranteed connection protection</p>
            </div>

            <div className="text-center group hover:bg-green-50 p-6 rounded-xl transition-all duration-300">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Perfect Timing</h3>
              <p className="text-gray-600 text-sm leading-relaxed">AI-optimized schedules ensure you never miss your connection while maximizing adventure time</p>
            </div>

            <div className="text-center group hover:bg-orange-50 p-6 rounded-xl transition-all duration-300">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <Award className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Expert Curated</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Hand-picked experiences by local travel experts and verified by thousands of reviews</p>
            </div>

            <div className="text-center group hover:bg-purple-50 p-6 rounded-xl transition-all duration-300">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Best Value</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Save up to 70% vs booking separately, with price match guarantee and exclusive deals</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Travel OTA Style */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/brand/layoverhq-logo-correct.svg"
                  alt="LayoverHQ Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="font-bold text-xl">LayoverHQ</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Turn your layovers into amazing adventures. Book flights with strategic stops and explore the world.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center text-sm">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span>4.8/5 rating</span>
                </div>
                <div className="text-sm text-gray-400">500K+ travelers</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Book</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Layover Flights</Link></li>
                <li><Link href="#" className="hover:text-white">City Experiences</Link></li>
                <li><Link href="#" className="hover:text-white">Travel Packages</Link></li>
                <li><Link href="#" className="hover:text-white">Group Bookings</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white">Travel Insurance</Link></li>
                <li><Link href="#" className="hover:text-white">Cancellation Policy</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white">About Us</Link></li>
                <li><Link href="#" className="hover:text-white">Careers</Link></li>
                <li><Link href="#" className="hover:text-white">Press</Link></li>
                <li><Link href="#" className="hover:text-white">Partners</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 LayoverHQ. All rights reserved. | Privacy Policy | Terms of Service
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}